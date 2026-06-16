package com.gridpulse.dto;

import java.util.Set;

public class UpdateUserRequest {

    private String email;
    private String fullName;
    private Set<String> roles;

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public Set<String> getRoles() { return roles; }
    public void setRoles(Set<String> roles) { this.roles = roles; }
}