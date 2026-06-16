package com.gridpulse.controller;

import com.gridpulse.model.MfaMethod;
import com.gridpulse.model.User;
import com.gridpulse.repository.UserRepository;
import com.gridpulse.service.MfaService;
import com.warrenstrange.googleauth.GoogleAuthenticatorKey;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/mfa")
public class MfaController {

    private final UserRepository userRepository;
    private final MfaService mfaService;

    public MfaController(UserRepository userRepository, MfaService mfaService) {
        this.userRepository = userRepository;
        this.mfaService = mfaService;
    }

    @PostMapping("/setup/totp")
    public ResponseEntity<?> setupTotp(@AuthenticationPrincipal UserDetails userDetails) throws Exception {
        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow();

        GoogleAuthenticatorKey credentials = mfaService.generateTotpCredentials();
        String secret = credentials.getKey();

        user.setMfaSecret(secret);
        userRepository.save(user);

        String qrCodeBase64 = mfaService.generateQrCode(user.getEmail(), credentials, "GridPulse");

        return ResponseEntity.ok(Map.of(
                "secret", secret,
                "qrCode", "data:image/png;base64," + qrCodeBase64
        ));
    }

    @PostMapping("/enable")
    public ResponseEntity<?> enableMfa(@AuthenticationPrincipal UserDetails userDetails,
                                       @RequestBody Map<String, String> body) {
        User user = userRepository.findByEmail(userDetails.getUsername()).orElseThrow();

        String method = body.getOrDefault("method", "TOTP");
        String code = body.get("code");

        boolean verified = false;

        if ("TOTP".equals(method) && user.getMfaSecret() != null) {
            verified = mfaService.verifyCode(user.getMfaSecret(), Integer.parseInt(code));
        } else if ("EMAIL".equals(method)) {
            // For demo purposes
            verified = code != null && code.length() == 6;
        }

        if (!verified) {
            return ResponseEntity.badRequest().body(Map.of("error", "Codice non valido"));
        }

        user.setMfaEnabled(true);
        user.setPreferredMfaMethod(MfaMethod.valueOf(method));
        userRepository.save(user);

        return ResponseEntity.ok(Map.of("message", "2FA attivato con successo"));
    }

    @PostMapping("/disable")
    public ResponseEntity<?> disableMfa(@AuthenticationPrincipal UserDetails userDetails) {
        User user = userRepository.findByEmail(userDetails.getUsername()).orElseThrow();

        user.setMfaEnabled(false);
        user.setMfaSecret(null);
        user.setPreferredMfaMethod(com.gridpulse.model.MfaMethod.NONE);
        userRepository.save(user);

        return ResponseEntity.ok(Map.of("message", "2FA disattivato"));
    }
}
