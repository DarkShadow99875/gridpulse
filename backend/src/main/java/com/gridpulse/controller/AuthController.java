package com.gridpulse.controller;

import com.gridpulse.dto.RegisterRequest;
import com.gridpulse.service.AuthService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public ResponseEntity<AuthService.AuthResponse> login(@RequestBody LoginRequest request) {
        AuthService.AuthResponse response = authService.login(request.email(), request.password());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/mfa/verify")
    public ResponseEntity<AuthService.AuthResponse> verifyMfa(@RequestBody MfaVerifyRequest request) {
        AuthService.AuthResponse response = authService.verifyMfa(request.email(), request.code());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthService.AuthResponse> refresh(@RequestBody RefreshRequest request) {
        AuthService.AuthResponse response = authService.refreshToken(request.refreshToken());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@RequestBody RefreshRequest request) {
        authService.logout(request.refreshToken());
        return ResponseEntity.ok().build();
    }

    @GetMapping("/invitation/{token}")
    public ResponseEntity<Map<String, String>> getInvitationInfo(@PathVariable String token) {
        return ResponseEntity.ok(authService.getInvitationInfo(token));
    }

    @PostMapping("/register")
    public ResponseEntity<AuthService.AuthResponse> register(@RequestBody RegisterRequest request) {
        AuthService.AuthResponse response = authService.register(
                request.getEmail(),
                request.getFirstName(),
                request.getLastName(),
                request.getPassword(),
                request.getInvitationToken()
        );
        return ResponseEntity.ok(response);
    }

    public record LoginRequest(String email, String password) {}
    public record MfaVerifyRequest(String email, String code) {}
    public record RefreshRequest(String refreshToken) {}
}
