package com.foro.ejercicio3.user.infrastructure;

import com.foro.ejercicio3.notification.domain.Notification;
import com.foro.ejercicio3.notification.infrastructure.NotificationRepository;
import com.foro.ejercicio3.room.domain.Room;
import com.foro.ejercicio3.room.infrastructure.RoomRepository;
import com.foro.ejercicio3.user.domain.Role;
import com.foro.ejercicio3.user.domain.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;
    private final RoomRepository roomRepository;
    private final NotificationRepository notificationRepository;

    @GetMapping
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(userRepository.findAll());
    }

    @PatchMapping("/{id}/role")
    public ResponseEntity<String> updateRole(@PathVariable Long id, @RequestParam Role role) {
        User user = userRepository.findById(id).orElseThrow();
        user.setRole(role);
        userRepository.save(user);
        return ResponseEntity.ok("Rol actualizado");
    }

    @GetMapping("/profile")
    public ResponseEntity<User> getMyProfile() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email).orElseThrow();
        return ResponseEntity.ok(user);
    }

    @PostMapping("/favorites/{roomId}")
    public ResponseEntity<String> toggleFavorite(@PathVariable Long roomId) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email).orElseThrow();
        Room room = roomRepository.findById(roomId).orElseThrow();

        if (user.getFavoriteRooms().contains(room)) {
            user.getFavoriteRooms().remove(room);
        } else {
            user.getFavoriteRooms().add(room);
        }
        userRepository.save(user);
        return ResponseEntity.ok("Favoritos actualizados");
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteUser(@PathVariable Long id) {
        User user = userRepository.findById(id).orElseThrow();

        // "Soft Delete": Inutilizamos la cuenta
        user.setUsername("Usuario_Eliminado_" + id);
        user.setEmail("eliminado_" + id + "@foro.local");
        user.setPassword("{noop}CUENTA_BLOQUEADA_DEFINITIVAMENTE_" + System.currentTimeMillis());
        user.setRole(Role.ROLE_PARTICIPANT);

        userRepository.save(user);
        return ResponseEntity.ok("Usuario dado de baja con éxito.");
    }

    @PostMapping("/{id}/report")
    public ResponseEntity<String> reportUser(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        String reporterEmail = SecurityContextHolder.getContext().getAuthentication().getName();
        User reporter = userRepository.findByEmail(reporterEmail).orElseThrow();
        User reported = userRepository.findById(id).orElseThrow();
        String reason = payload.getOrDefault("reason", "Sin motivo especificado");

        userRepository.findAll().stream()
                .filter(u -> u.getRole() == Role.ROLE_SUPERADMIN)
                .forEach(admin -> {
                    Notification notif = Notification.builder()
                            .recipient(admin)
                            .message("🚨 <b>PETICIÓN DE BAJA:</b> El moderador <b>" + reporter.getUsername() +
                                    "</b> solicita expulsar a <b>" + reported.getUsername() + "</b>.<br>" +
                                    "Motivo: <i>" + reason + "</i>")
                            .createdAt(LocalDateTime.now())
                            .build();
                    notificationRepository.save(notif);
                });

        return ResponseEntity.ok("Reporte enviado al Superadmin.");
    }
}