package com.gridpulse.config;

import com.gridpulse.model.Role;
import com.gridpulse.model.User;
import com.gridpulse.repository.RoleRepository;
import com.gridpulse.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Set;

/**
 * Creates a default SUPER_ADMIN user on first startup if no users exist.
 * This is the only way to bootstrap the system since registration is invitation-only.
 */
@Configuration
public class SuperAdminBootstrap {

    @Value("${gridpulse.bootstrap.superadmin.email:superadmin@gridpulse.local}")
    private String superAdminEmail;

    @Value("${gridpulse.bootstrap.superadmin.password:GridPulse2026!}")
    private String superAdminPassword;

    @Bean
    @Order(2)
    public CommandLineRunner createSuperAdminIfNeeded(
            UserRepository userRepository,
            RoleRepository roleRepository,
            PasswordEncoder passwordEncoder) {

        return args -> {
            try {
                if (userRepository.count() > 0) {
                    System.out.println("ℹ️  Utenti già presenti nel database - nessun bootstrap eseguito.");
                    return;
                }

                Role superAdminRole = roleRepository.findByName("SUPER_ADMIN")
                        .orElseThrow(() -> new IllegalStateException("SUPER_ADMIN role not found. Run RolePermissionSeeder first."));

                User admin = new User();
                admin.setEmail(superAdminEmail);
                admin.setPassword(passwordEncoder.encode(superAdminPassword));
                admin.setFullName("Super Administrator");
                admin.setEnabled(true);
                admin.addRole(superAdminRole);

                userRepository.save(admin);

                System.out.println("════════════════════════════════════════════════════════════");
                System.out.println("  BOOTSTRAP: Super Admin creato con successo");
                System.out.println("  Email:    " + superAdminEmail);
                System.out.println("  Password: " + superAdminPassword);
                System.out.println("  → Cambia la password al primo accesso!");
                System.out.println("════════════════════════════════════════════════════════════");
            } catch (Exception e) {
                System.err.println("⚠️  SuperAdminBootstrap saltato (probabilmente database non disponibile in questo momento): " + e.getMessage());
                // Non blocchiamo l'avvio dell'applicazione per demo / H2
            }
        };
    }
}
