package com.gridpulse.dto;

import com.gridpulse.model.Role;

import java.util.Set;
import java.util.stream.Collectors;

public class RoleResponse {

    private Long id;
    private String name;
    private String description;
    private Set<String> permissions;

    public static RoleResponse from(Role role) {
        RoleResponse dto = new RoleResponse();
        dto.id = role.getId();
        dto.name = role.getName();
        dto.description = role.getDescription();
        dto.permissions = role.getPermissions().stream()
                .map(p -> p.getName())
                .collect(Collectors.toSet());
        return dto;
    }

    public Long getId() { return id; }
    public String getName() { return name; }
    public String getDescription() { return description; }
    public Set<String> getPermissions() { return permissions; }
}