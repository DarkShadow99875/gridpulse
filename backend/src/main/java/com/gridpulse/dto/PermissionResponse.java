package com.gridpulse.dto;

import com.gridpulse.model.Permission;

public class PermissionResponse {

    private Long id;
    private String name;
    private String description;

    public static PermissionResponse from(Permission permission) {
        PermissionResponse dto = new PermissionResponse();
        dto.id = permission.getId();
        dto.name = permission.getName();
        dto.description = permission.getDescription();
        return dto;
    }

    public Long getId() { return id; }
    public String getName() { return name; }
    public String getDescription() { return description; }
}