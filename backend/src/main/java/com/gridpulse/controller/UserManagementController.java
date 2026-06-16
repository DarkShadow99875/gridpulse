package com.gridpulse.controller;

import com.gridpulse.dto.CreateUserRequest;
import com.gridpulse.dto.UpdateUserRequest;
import com.gridpulse.dto.UserResponse;
import com.gridpulse.model.User;
import com.gridpulse.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/users")
public class UserManagementController {

    private final UserService userService;

    public UserManagementController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('USER_READ')")
    public List<UserResponse> getAllUsers(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String status) {
        return userService.findAllFiltered(search, role, status).stream()
                .map(user -> UserResponse.from(user, user.getInvitationToken() != null && user.isInvitationValid()))
                .collect(Collectors.toList());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('USER_READ')")
    public UserResponse getUser(@PathVariable Long id) {
        return UserResponse.from(userService.findById(id));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('USER_CREATE')")
    public ResponseEntity<UserResponse> createUser(@RequestBody CreateUserRequest request) {
        User user = userService.createUserByInvitation(
                request.getEmail(),
                request.getFullName(),
                request.getRoles()
        );
        return ResponseEntity.ok(UserResponse.from(user, true));
    }

    @PatchMapping("/{id}")
    @PreAuthorize("hasAuthority('USER_UPDATE')")
    public ResponseEntity<UserResponse> updateUser(@PathVariable Long id, @RequestBody UpdateUserRequest request) {
        User user = userService.updateUser(id, request.getEmail(), request.getFullName(), request.getRoles());
        return ResponseEntity.ok(UserResponse.from(user));
    }

    @PatchMapping("/{id}/disable")
    @PreAuthorize("hasAuthority('USER_UPDATE')")
    public ResponseEntity<Void> disableUser(@PathVariable Long id, Authentication auth) {
        userService.assertNotSelf(id, auth.getName());
        userService.disableUser(id);
        return ResponseEntity.ok().build();
    }

    @PatchMapping("/{id}/enable")
    @PreAuthorize("hasAuthority('USER_UPDATE')")
    public ResponseEntity<Void> enableUser(@PathVariable Long id) {
        userService.enableUser(id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/resend-invitation")
    @PreAuthorize("hasAuthority('USER_CREATE')")
    public ResponseEntity<UserResponse> resendInvitation(@PathVariable Long id) {
        User user = userService.resendInvitation(id);
        return ResponseEntity.ok(UserResponse.from(user, true));
    }

    @DeleteMapping("/{id}/invitation")
    @PreAuthorize("hasAuthority('USER_DELETE')")
    public ResponseEntity<Void> revokeInvitation(@PathVariable Long id) {
        userService.revokeInvitation(id);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('USER_DELETE')")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id, Authentication auth) {
        userService.assertNotSelf(id, auth.getName());
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