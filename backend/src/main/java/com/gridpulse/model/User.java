package com.gridpulse.model;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String password;

    private String fullName;

    private boolean enabled = true;

    // --- MFA / 2FA ---
    private boolean mfaEnabled = false;

    @Column(length = 64)
    private String mfaSecret; // TOTP secret (encrypted or stored securely in real prod)

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private MfaMethod preferredMfaMethod = MfaMethod.NONE;

    // --- Invitation flow (only on invitation) ---
    @Column(length = 64)
    private String invitationToken;

    private LocalDateTime invitationTokenExpiry;

    // --- Roles ---
    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
        name = "user_roles",
        joinColumns = @JoinColumn(name = "user_id"),
        inverseJoinColumns = @JoinColumn(name = "role_id")
    )
    private Set<Role> roles = new HashSet<>();

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    // --- Constructors ---
    public User() {}

    public User(String email, String password) {
        this.email = email;
        this.password = password;
    }

    // --- Getters & Setters ---
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public boolean isEnabled() { return enabled; }
    public void setEnabled(boolean enabled) { this.enabled = enabled; }

    public boolean isMfaEnabled() { return mfaEnabled; }
    public void setMfaEnabled(boolean mfaEnabled) { this.mfaEnabled = mfaEnabled; }

    public String getMfaSecret() { return mfaSecret; }
    public void setMfaSecret(String mfaSecret) { this.mfaSecret = mfaSecret; }

    public MfaMethod getPreferredMfaMethod() { return preferredMfaMethod; }
    public void setPreferredMfaMethod(MfaMethod preferredMfaMethod) { this.preferredMfaMethod = preferredMfaMethod; }

    public String getInvitationToken() { return invitationToken; }
    public void setInvitationToken(String invitationToken) { this.invitationToken = invitationToken; }

    public LocalDateTime getInvitationTokenExpiry() { return invitationTokenExpiry; }
    public void setInvitationTokenExpiry(LocalDateTime invitationTokenExpiry) { this.invitationTokenExpiry = invitationTokenExpiry; }

    public Set<Role> getRoles() { return roles; }
    public void setRoles(Set<Role> roles) { this.roles = roles; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    // Utility
    public void addRole(Role role) {
        this.roles.add(role);
    }

    public void generateInvitationToken(int validityHours) {
        this.invitationToken = UUID.randomUUID().toString();
        this.invitationTokenExpiry = LocalDateTime.now().plusHours(validityHours);
    }

    public boolean isInvitationValid() {
        return invitationToken != null &&
               invitationTokenExpiry != null &&
               invitationTokenExpiry.isAfter(LocalDateTime.now());
    }
}
