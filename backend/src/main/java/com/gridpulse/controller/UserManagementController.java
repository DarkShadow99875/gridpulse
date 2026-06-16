package com.gridpulse.controller;

import com.gridpulse.dto.CreateUserRequest;
import com.gridpulse.dto.UserResponse;
import com.gridpulse.model.User;
import com.gridpulse.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Controller for user management (invitation only).
 * Protected with fine-grained permissions.
 */
@RestController
@RequestMapping("/api/users")
public class UserManagementController {

    private final UserService userService;

    public UserManagementController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('USER_READ')")
    public List<UserResponse> getAllUsers() {
        return userService.findAll().stream()
                .map(UserResponse::from)
                .collect(Collectors.toList());
    }

    @PostMapping
    @PreAuthorize("hasAuthority('USER_CREATE')")
    public ResponseEntity<UserResponse> createUser(@RequestBody CreateUserRequest request) {
        User user = userService.createUserByInvitation(
                request.getEmail(),
                request.getFullName(),
                request.getRoles()
        );
        return ResponseEntity.ok(UserResponse.from(user));
    }

    @PatchMapping("/{id}/disable")
    @PreAuthorize("hasAuthority('USER_UPDATE')")
    public ResponseEntity<Void> disableUser(@PathVariable Long id) {
        userService.disableUser(id);
        return ResponseEntity.ok().build();
    }

    @PatchMapping("/{id}/enable")
    @PreAuthorize("hasAuthority('USER_UPDATE')")
    public ResponseEntity<Void> enableUser(@PathVariable Long id) {
        userService.enableUser(id);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('USER_DELETE')")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/reset-mfa")
    @PreAuthorize("hasAuthority('USER_UPDATE')")
    public ResponseEntity<Void> resetMfa(@PathVariable Long id) {
        userService.resetMfaForUser(id);
        return ResponseEntity.ok().build();
    }
}
