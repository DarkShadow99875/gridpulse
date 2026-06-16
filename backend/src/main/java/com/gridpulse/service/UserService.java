package com.gridpulse.service;

import com.gridpulse.model.Permission;
import com.gridpulse.model.Role;
import com.gridpulse.model.User;
import com.gridpulse.repository.PermissionRepository;
import com.gridpulse.repository.RoleRepository;
import com.gridpulse.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PermissionRepository permissionRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository,
                       RoleRepository roleRepository,
                       PermissionRepository permissionRepository,
                       PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.permissionRepository = permissionRepository;
        this.passwordEncoder = passwordEncoder;
    }

    /**
     * Creates a new user via invitation (only admins can call this).
     * The user will need to complete registration using the invitation token.
     */
    @Transactional
    public User createUserByInvitation(String email, String fullName, Set<String> roleNames) {

        if (userRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("Un utente con questa email esiste già");
        }

        User user = new User();
        user.setEmail(email);
        user.setFullName(fullName);
        user.setPassword(passwordEncoder.encode("TEMPORARY-" + System.currentTimeMillis())); // forza cambio password
        user.setEnabled(false); // non può ancora accedere finché non completa l'invito

        // Assign roles
        for (String roleName : roleNames) {
            Role role = roleRepository.findByName(roleName)
                    .orElseThrow(() -> new IllegalArgumentException("Ruolo non trovato: " + roleName));
            user.addRole(role);
        }

        // Generate invitation token (valid 72 hours)
        user.generateInvitationToken(72);

        return userRepository.save(user);
    }

    public User findByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Utente non trovato"));
    }

    public List<User> findAll() {
        return userRepository.findAll();
    }

    public User findById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Utente non trovato con id: " + id));
    }

    @Transactional
    public void disableUser(Long userId) {
        User user = findById(userId);
        user.setEnabled(false);
        userRepository.save(user);
    }

    @Transactional
    public void enableUser(Long userId) {
        User user = findById(userId);
        user.setEnabled(true);
        userRepository.save(user);
    }

    @Transactional
    public void deleteUser(Long userId) {
        User user = findById(userId);
        // Safety: non permettere di cancellare se stessi (verrà gestito meglio nel controller)
        userRepository.delete(user);
    }

    @Transactional
    public void resetMfaForUser(Long userId) {
        User user = findById(userId);
        user.setMfaEnabled(false);
        user.setMfaSecret(null);
        user.setPreferredMfaMethod(com.gridpulse.model.MfaMethod.NONE);
        userRepository.save(user);
    }
}
