package com.gridpulse.controller;

import com.gridpulse.dto.PermissionResponse;
import com.gridpulse.repository.PermissionRepository;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/permissions")
public class PermissionController {

    private final PermissionRepository permissionRepository;

    public PermissionController(PermissionRepository permissionRepository) {
        this.permissionRepository = permissionRepository;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('USER_READ')")
    public List<PermissionResponse> getAllPermissions() {
        return permissionRepository.findAll().stream()
                .map(PermissionResponse::from)
                .toList();
    }
}