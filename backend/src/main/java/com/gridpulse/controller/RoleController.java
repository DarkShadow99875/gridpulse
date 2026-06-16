package com.gridpulse.controller;

import com.gridpulse.dto.RoleResponse;
import com.gridpulse.repository.RoleRepository;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/roles")
public class RoleController {

    private final RoleRepository roleRepository;

    public RoleController(RoleRepository roleRepository) {
        this.roleRepository = roleRepository;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('USER_READ')")
    public List<RoleResponse> getAllRoles() {
        return roleRepository.findAll().stream()
                .map(RoleResponse::from)
                .toList();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('USER_READ')")
    public RoleResponse getRole(@PathVariable Long id) {
        return roleRepository.findById(id)
                .map(RoleResponse::from)
                .orElseThrow(() -> new IllegalArgumentException("Ruolo non trovato"));
    }
}