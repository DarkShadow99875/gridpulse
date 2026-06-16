package com.gridpulse.dto;

import com.gridpulse.model.User;

import java.time.LocalDateTime;
import java.util.Set;
import java.util.stream.Collectors;

public class UserResponse {

    private Long id;
    private String email;
    private String fullName;
    private boolean enabled;
    private boolean mfaEnabled;
    private String preferredMfaMethod;
    private Set<String> roles;
    private LocalDateTime createdAt;
    private boolean hasPendingInvitation;
    private String invitationToken;

    public static UserResponse from(User user) {
        return from(user, false);
    }

    public static UserResponse from(User user, boolean includeInvitationToken) {
        UserResponse dto = new UserResponse();
        dto.id = user.getId();
        dto.email = user.getEmail();
        dto.fullName = user.getFullName();
        dto.enabled = user.isEnabled();
        dto.mfaEnabled = user.isMfaEnabled();
        dto.preferredMfaMethod = user.getPreferredMfaMethod() != null ? user.getPreferredMfaMethod().name() : "NONE";
        dto.roles = user.getRoles().stream().map(r -> r.getName()).collect(Collectors.toSet());
        dto.createdAt = user.getCreatedAt();
        dto.hasPendingInvitation = user.getInvitationToken() != null && user.isInvitationValid();
        if (includeInvitationToken && dto.hasPendingInvitation) {
            dto.invitationToken = user.getInvitationToken();
        }
        return dto;
    }

    public Long getId() { return id; }
    public String getEmail() { return email; }
    public String getFullName() { return fullName; }
    public boolean isEnabled() { return enabled; }
    public boolean isMfaEnabled() { return mfaEnabled; }
    public String getPreferredMfaMethod() { return preferredMfaMethod; }
    public Set<String> getRoles() { return roles; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public boolean isHasPendingInvitation() { return hasPendingInvitation; }
    public String getInvitationToken() { return invitationToken; }
}