package com.gridpulse.service;

import com.gridpulse.model.Role;
import com.gridpulse.model.User;
import com.gridpulse.repository.RoleRepository;
import com.gridpulse.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository,
                       RoleRepository roleRepository,
                       PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public User createUserByInvitation(String email, String fullName, Set<String> roleNames) {
        if (roleNames == null || roleNames.isEmpty()) {
            throw new IllegalArgumentException("Seleziona almeno un ruolo");
        }

        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new IllegalArgumentException("Un utente con questa email esiste già");
        }

        User user = new User();
        user.setEmail(email.trim());
        user.setFullName(fullName != null ? fullName.trim() : null);
        user.setPassword(passwordEncoder.encode("TEMPORARY-" + System.currentTimeMillis()));
        user.setEnabled(false);
        assignRoles(user, roleNames);
        user.generateInvitationToken(72);

        return userRepository.save(user);
    }

    public List<User> findAllFiltered(String search, String role, String status) {
        return userRepository.findAll().stream()
                .filter(user -> matchesSearch(user, search))
                .filter(user -> matchesRole(user, role))
                .filter(user -> matchesStatus(user, status))
                .toList();
    }

    private boolean matchesSearch(User user, String search) {
        if (search == null || search.isBlank()) return true;
        String q = search.toLowerCase().trim();
        return user.getEmail().toLowerCase().contains(q)
                || (user.getFullName() != null && user.getFullName().toLowerCase().contains(q));
    }

    private boolean matchesRole(User user, String role) {
        if (role == null || role.isBlank()) return true;
        return user.getRoles().stream().anyMatch(r -> r.getName().equals(role));
    }

    private boolean matchesStatus(User user, String status) {
        if (status == null || status.isBlank()) return true;
        boolean pending = user.getInvitationToken() != null && user.isInvitationValid();
        return switch (status.toLowerCase()) {
            case "pending" -> pending;
            case "active" -> user.isEnabled() && !pending;
            case "disabled" -> !user.isEnabled() && !pending;
            default -> true;
        };
    }

    public User findByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Utente non trovato"));
    }

    public User findById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Utente non trovato con id: " + id));
    }

    @Transactional
    public User updateUser(Long id, String email, String fullName, Set<String> roleNames) {
        User user = findById(id);

        if (fullName != null && !fullName.isBlank()) {
            user.setFullName(fullName.trim());
        }

        if (email != null && !email.isBlank() && !email.equalsIgnoreCase(user.getEmail())) {
            if (userRepository.existsByEmailIgnoreCase(email.trim())) {
                throw new IllegalArgumentException("Un utente con questa email esiste già");
            }
            user.setEmail(email.trim());
        }

        if (roleNames != null && !roleNames.isEmpty()) {
            user.getRoles().clear();
            assignRoles(user, roleNames);
        }

        return userRepository.save(user);
    }

    @Transactional
    public User resendInvitation(Long userId) {
        User user = findById(userId);
        if (user.isEnabled() && (user.getInvitationToken() == null || !user.isInvitationValid())) {
            throw new IllegalArgumentException("L'utente ha già completato la registrazione");
        }
        user.setEnabled(false);
        user.generateInvitationToken(72);
        return userRepository.save(user);
    }

    @Transactional
    public void revokeInvitation(Long userId) {
        User user = findById(userId);
        if (user.getInvitationToken() == null || !user.isInvitationValid()) {
            throw new IllegalArgumentException("Nessun invito pendente per questo utente");
        }
        userRepository.delete(user);
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
        if (user.getInvitationToken() != null && user.isInvitationValid()) {
            throw new IllegalArgumentException("L'utente deve prima completare la registrazione");
        }
        user.setEnabled(true);
        userRepository.save(user);
    }

    @Transactional
    public void deleteUser(Long userId) {
        User user = findById(userId);
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

    private void assignRoles(User user, Set<String> roleNames) {
        for (String roleName : roleNames) {
            Role role = roleRepository.findByName(roleName)
                    .orElseThrow(() -> new IllegalArgumentException("Ruolo non trovato: " + roleName));
            user.addRole(role);
        }
    }

    public void assertNotSelf(Long targetUserId, String currentUserEmail) {
        User current = findByEmail(currentUserEmail);
        if (current.getId().equals(targetUserId)) {
            throw new IllegalArgumentException("Non puoi eseguire questa azione sul tuo account");
        }
    }
}