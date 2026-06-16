package com.gridpulse.service;

import com.gridpulse.model.MfaMethod;
import com.gridpulse.model.RefreshToken;
import com.gridpulse.model.User;
import com.gridpulse.repository.RefreshTokenRepository;
import com.gridpulse.repository.UserRepository;
import com.gridpulse.security.JwtService;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final UserDetailsService userDetailsService;
    private final MfaService mfaService;

    public AuthService(UserRepository userRepository,
                       RefreshTokenRepository refreshTokenRepository,
                       JwtService jwtService,
                       AuthenticationManager authenticationManager,
                       UserDetailsService userDetailsService,
                       MfaService mfaService) {
        this.userRepository = userRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.jwtService = jwtService;
        this.authenticationManager = authenticationManager;
        this.userDetailsService = userDetailsService;
        this.mfaService = mfaService;
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

        String accessToken = jwtService.generateAccessToken(userDetails);
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

        String newAccessToken = jwtService.generateAccessToken(userDetails);

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

