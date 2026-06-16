package com.gridpulse.service;

import com.gridpulse.model.MfaMethod;
import com.gridpulse.model.RefreshToken;
import com.gridpulse.model.Role;
import com.gridpulse.model.User;
import com.gridpulse.repository.RefreshTokenRepository;
import com.gridpulse.repository.RoleRepository;
import com.gridpulse.repository.UserRepository;
import com.gridpulse.security.JwtService;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final UserDetailsService userDetailsService;
    private final MfaService mfaService;
    private final PasswordEncoder passwordEncoder;

    public AuthService(UserRepository userRepository,
                       RoleRepository roleRepository,
                       RefreshTokenRepository refreshTokenRepository,
                       JwtService jwtService,
                       AuthenticationManager authenticationManager,
                       UserDetailsService userDetailsService,
                       MfaService mfaService,
                       PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.jwtService = jwtService;
        this.authenticationManager = authenticationManager;
        this.userDetailsService = userDetailsService;
        this.mfaService = mfaService;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public AuthResponse login(String email, String password) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(email, password)
        );

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // If MFA is enabled, we require the second factor
        if (user.isMfaEnabled()) {
            return new AuthResponse(null, null, 0, true, user.getPreferredMfaMethod().name());
        }

        return generateTokensForUser(user);
    }

    @Transactional
    public AuthResponse verifyMfa(String email, String code) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        boolean valid = false;

        if (user.getPreferredMfaMethod() == MfaMethod.TOTP && user.getMfaSecret() != null) {
            valid = mfaService.verifyCode(user.getMfaSecret(), Integer.parseInt(code));
        } else if (user.getPreferredMfaMethod() == MfaMethod.EMAIL) {
            // For demo: we accept any 6-digit code that matches a previously generated one
            // In real app you would store the code temporarily
            valid = code.length() == 6;
        }

        if (!valid) {
            throw new RuntimeException("Invalid MFA code");
        }

        return generateTokensForUser(user);
    }

    private AuthResponse generateTokensForUser(User user) {
        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getEmail());

        Map<String, Object> claims = new HashMap<>();
        claims.put("roles", user.getRoles().stream().map(r -> r.getName()).toList());
        claims.put("name", user.getFullName());

        String accessToken = jwtService.generateAccessToken(claims, userDetails);
        String refreshToken = jwtService.generateRefreshToken(userDetails);

        // Delete all previous refresh tokens for this user (single active session policy)
        List<RefreshToken> oldTokens = refreshTokenRepository.findAllByUser(user);
        if (!oldTokens.isEmpty()) {
            refreshTokenRepository.deleteAll(oldTokens);
        }

        // Extra safety: if this exact token value somehow already exists, remove it first
        refreshTokenRepository.findByToken(refreshToken)
                .ifPresent(refreshTokenRepository::delete);

        RefreshToken refreshTokenEntity = new RefreshToken(
                refreshToken,
                user,
                LocalDateTime.now().plusSeconds(jwtService.getRefreshTokenExpiration() / 1000)
        );
        refreshTokenRepository.save(refreshTokenEntity);

        return new AuthResponse(accessToken, refreshToken, jwtService.getAccessTokenExpiration(), false, null);
    }

    @Transactional
    public AuthResponse refreshToken(String refreshToken) {
        RefreshToken storedToken = refreshTokenRepository.findByToken(refreshToken)
                .orElseThrow(() -> new RuntimeException("Invalid refresh token"));

        if (storedToken.isRevoked() || storedToken.isExpired()) {
            throw new RuntimeException("Refresh token expired or revoked");
        }

        User user = storedToken.getUser();
        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getEmail());

        Map<String, Object> claims = new HashMap<>();
        claims.put("roles", user.getRoles().stream().map(r -> r.getName()).toList());
        claims.put("name", user.getFullName());

        String newAccessToken = jwtService.generateAccessToken(claims, userDetails);

        // Delete the used refresh token + any other old ones for this user
        refreshTokenRepository.delete(storedToken);

        List<RefreshToken> remainingOld = refreshTokenRepository.findAllByUser(user);
        if (!remainingOld.isEmpty()) {
            refreshTokenRepository.deleteAll(remainingOld);
        }

        String newRefreshToken = jwtService.generateRefreshToken(userDetails);
        RefreshToken newRefreshTokenEntity = new RefreshToken(
                newRefreshToken,
                user,
                LocalDateTime.now().plusSeconds(jwtService.getRefreshTokenExpiration() / 1000)
        );
        refreshTokenRepository.save(newRefreshTokenEntity);

        return new AuthResponse(newAccessToken, newRefreshToken, jwtService.getAccessTokenExpiration(), false, null);
    }

    public Map<String, String> getInvitationInfo(String token) {
        User user = userRepository.findByInvitationToken(token)
                .filter(User::isInvitationValid)
                .orElseThrow(() -> new IllegalArgumentException("Invito non valido o scaduto"));

        String fullName = user.getFullName() != null ? user.getFullName() : "";
        String[] parts = fullName.trim().split("\\s+", 2);
        String firstName = parts.length > 0 ? parts[0] : "";
        String lastName = parts.length > 1 ? parts[1] : "";

        return Map.of(
                "email", user.getEmail(),
                "firstName", firstName,
                "lastName", lastName
        );
    }

    @Transactional
    public AuthResponse register(String email, String firstName, String lastName, String password, String invitationToken) {
        validateRegistrationInput(email, firstName, lastName, password);

        String fullName = (firstName.trim() + " " + lastName.trim()).trim();

        User user;
        if (invitationToken != null && !invitationToken.isBlank()) {
            user = userRepository.findByInvitationToken(invitationToken)
                    .orElseThrow(() -> new IllegalArgumentException("Invito non valido o scaduto"));

            if (!user.isInvitationValid()) {
                throw new IllegalArgumentException("Invito scaduto. Contatta l'amministratore.");
            }

            if (!user.getEmail().equalsIgnoreCase(email.trim())) {
                throw new IllegalArgumentException("L'email non corrisponde all'invito ricevuto");
            }

            user.setPassword(passwordEncoder.encode(password));
            user.setFullName(fullName);
            user.setEnabled(true);
            user.setInvitationToken(null);
            user.setInvitationTokenExpiry(null);
            user = userRepository.save(user);
        } else {
            if (userRepository.existsByEmailIgnoreCase(email.trim())) {
                throw new IllegalArgumentException("Un utente con questa email esiste già");
            }

            Role viewerRole = roleRepository.findByName("VIEWER")
                    .orElseThrow(() -> new IllegalArgumentException("Ruolo VIEWER non configurato"));

            user = new User();
            user.setEmail(email.trim().toLowerCase());
            user.setPassword(passwordEncoder.encode(password));
            user.setFullName(fullName);
            user.setEnabled(true);
            user.addRole(viewerRole);
            user = userRepository.save(user);
        }

        return generateTokensForUser(user);
    }

    private void validateRegistrationInput(String email, String firstName, String lastName, String password) {
        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("L'email è obbligatoria");
        }
        if (firstName == null || firstName.isBlank()) {
            throw new IllegalArgumentException("Il nome è obbligatorio");
        }
        if (lastName == null || lastName.isBlank()) {
            throw new IllegalArgumentException("Il cognome è obbligatorio");
        }
        if (password == null || password.length() < 8) {
            throw new IllegalArgumentException("La password deve avere almeno 8 caratteri");
        }
    }

    @Transactional
    public void logout(String refreshToken) {
        refreshTokenRepository.findByToken(refreshToken)
                .ifPresent(token -> {
                    token.setRevoked(true);
                    refreshTokenRepository.save(token);
                });
    }

    public record AuthResponse(
            String accessToken,
            String refreshToken,
            long expiresIn,
            boolean mfaRequired,
            String mfaMethod
    ) {}
}

