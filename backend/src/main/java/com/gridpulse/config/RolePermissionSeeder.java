package com.gridpulse.config;

import com.gridpulse.model.Permission;
import com.gridpulse.model.Role;
import com.gridpulse.repository.PermissionRepository;
import com.gridpulse.repository.RoleRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;

import java.util.*;

@Configuration
public class RolePermissionSeeder {

    @Bean
    @Order(1)
    public CommandLineRunner seedRolesAndPermissions(
            RoleRepository roleRepository,
            PermissionRepository permissionRepository) {

        return args -> {

            // Define all permissions (grants)
            Map<String, String> permissions = new LinkedHashMap<>();
            permissions.put("PLANT_READ", "Visualizzare gli impianti");
            permissions.put("PLANT_CREATE", "Creare nuovi impianti");
            permissions.put("PLANT_UPDATE", "Modificare impianti e stato");
            permissions.put("PLANT_DELETE", "Eliminare impianti");
            permissions.put("METRIC_WRITE", "Inserire o correggere metriche manualmente");
            permissions.put("REPORT_GENERATE", "Generare report ESG");
            permissions.put("REPORT_DOWNLOAD", "Scaricare report");
            permissions.put("USER_READ", "Visualizzare utenti");
            permissions.put("USER_CREATE", "Creare utenti (su invito)");
            permissions.put("USER_UPDATE", "Modificare utenti");
            permissions.put("USER_DELETE", "Eliminare utenti");
            permissions.put("USER_ASSIGN_ROLE", "Assegnare ruoli agli utenti");

            // Create permissions if not exist
            Set<Permission> createdPermissions = new HashSet<>();
            for (Map.Entry<String, String> entry : permissions.entrySet()) {
                try {
                    Permission perm = permissionRepository.findByName(entry.getKey())
                            .orElseGet(() -> {
                                Permission p = new Permission(entry.getKey());
                                p.setDescription(entry.getValue());
                                return permissionRepository.save(p);
                            });
                    createdPermissions.add(perm);
                } catch (Exception e) {
                    System.out.println("⚠️  Impossibile creare permission " + entry.getKey() + ": " + e.getMessage());
                }
            }

            // Define roles with their permissions
            Map<String, List<String>> rolePermissions = new LinkedHashMap<>();
            rolePermissions.put("VIEWER", List.of("PLANT_READ", "REPORT_GENERATE", "REPORT_DOWNLOAD"));
            rolePermissions.put("OPERATOR", List.of("PLANT_READ", "PLANT_UPDATE", "METRIC_WRITE", "REPORT_GENERATE", "REPORT_DOWNLOAD"));
            rolePermissions.put("ADMIN", List.of(
                    "PLANT_READ", "PLANT_CREATE", "PLANT_UPDATE", "PLANT_DELETE",
                    "METRIC_WRITE", "REPORT_GENERATE", "REPORT_DOWNLOAD",
                    "USER_READ", "USER_CREATE", "USER_UPDATE"
            ));
            rolePermissions.put("SUPER_ADMIN", new ArrayList<>(permissions.keySet())); // all permissions

            // Create roles and assign permissions (idempotent for SUPER_ADMIN)
            for (Map.Entry<String, List<String>> entry : rolePermissions.entrySet()) {
                String roleName = entry.getKey();
                try {
                    Role role = roleRepository.findByName(roleName).orElseGet(() -> {
                        Role r = new Role(roleName);
                        r.setDescription("Ruolo " + roleName);
                        return roleRepository.save(r);
                    });

                    // For SUPER_ADMIN we want to ensure it has everything
                    if ("SUPER_ADMIN".equals(roleName)) {
                        // Clear existing permissions and re-assign all
                        role.getPermissions().clear();
                        for (String permName : entry.getValue()) {
                            permissionRepository.findByName(permName).ifPresent(role::addPermission);
                        }
                    } else {
                        // Normal roles: just add missing ones
                        for (String permName : entry.getValue()) {
                            permissionRepository.findByName(permName).ifPresent(role::addPermission);
                        }
                    }
                    roleRepository.save(role);
                } catch (Exception e) {
                    System.out.println("⚠️  Impossibile creare ruolo " + roleName + ": " + e.getMessage());
                }
            }

            System.out.println("✓ Ruoli e permessi inizializzati correttamente (o già presenti).");
        };
    }
}
