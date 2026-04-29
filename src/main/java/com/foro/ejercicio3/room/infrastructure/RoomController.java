package com.foro.ejercicio3.room.infrastructure;

import com.foro.ejercicio3.room.application.RoomService;
import com.foro.ejercicio3.room.domain.Ban;
import com.foro.ejercicio3.room.domain.Room;
import com.foro.ejercicio3.room.domain.RoomRequest;
import com.foro.ejercicio3.user.domain.User;
import com.foro.ejercicio3.user.infrastructure.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/rooms")
@RequiredArgsConstructor
public class RoomController {

    private final RoomRepository roomRepository;
    private final UserRepository userRepository;
    private final BanRepository banRepository;

    // AÑADIDO: Inyectamos el servicio que arreglamos anteriormente
    private final RoomService roomService;

    @GetMapping
    public ResponseEntity<List<Room>> getAllRooms() {
        return ResponseEntity.ok(roomRepository.findAll());
    }

    // CORREGIDO: Ahora recibe RoomRequest (nuestro escudo) y usa RoomService
    @PostMapping
    public ResponseEntity<String> createRoom(@RequestBody RoomRequest request) {
        return ResponseEntity.ok(roomService.createRoom(request));
    }

    @PostMapping("/{roomId}/assign-moderator/{userId}")
    public ResponseEntity<String> assignModerator(@PathVariable Long roomId, @PathVariable Long userId) {
        User moderator = userRepository.findById(userId).orElseThrow();
        Room room = roomRepository.findById(roomId).orElseThrow();

        if (moderator.getRole() != com.foro.ejercicio3.user.domain.Role.ROLE_MODERATOR) {
            return ResponseEntity.badRequest().body("El usuario debe ser Moderador.");
        }

        // REQUISITO: Máximo 2 salas por moderador
        long assignedRooms = roomRepository.findAll().stream()
                .filter(r -> r.getModerators().stream().anyMatch(m -> m.getId().equals(userId)))
                .count();

        if (assignedRooms >= 2) {
            return ResponseEntity.badRequest().body("Límite alcanzado: Este moderador ya tiene 2 salas.");
        }

        room.getModerators().add(moderator);
        roomRepository.save(room);
        return ResponseEntity.ok("Asignado correctamente.");
    }

    @PostMapping("/{roomId}/ban/{userId}")
    public ResponseEntity<String> banUser(@PathVariable Long roomId, @PathVariable Long userId, @RequestParam boolean permanent) {
        User user = userRepository.findById(userId).orElseThrow();
        Room room = roomRepository.findById(roomId).orElseThrow();
        banRepository.findByUserIdAndRoomId(userId, roomId).ifPresent(banRepository::delete);
        Ban ban = Ban.builder().user(user).room(room).permanent(permanent).expiryDate(permanent ? null : LocalDateTime.now().plusDays(30)).build();
        banRepository.save(ban);
        return ResponseEntity.ok("Usuario expulsado");
    }

    @GetMapping("/{roomId}/check-access")
    public ResponseEntity<Boolean> checkAccess(@PathVariable Long roomId) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email).orElseThrow();
        Optional<Ban> banOpt = banRepository.findByUserIdAndRoomId(user.getId(), roomId);
        if (banOpt.isPresent()) {
            Ban ban = banOpt.get();
            if (ban.isPermanent()) return ResponseEntity.ok(false);
            if (ban.getExpiryDate() != null && ban.getExpiryDate().isAfter(LocalDateTime.now())) return ResponseEntity.ok(false);
            banRepository.delete(ban);
        }
        return ResponseEntity.ok(true);
    }

    @GetMapping("/my-bans")
    public ResponseEntity<List<Ban>> getMyBans() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email).orElseThrow();
        return ResponseEntity.ok(banRepository.findActiveBansByUser(user.getId(), LocalDateTime.now()));
    }
}