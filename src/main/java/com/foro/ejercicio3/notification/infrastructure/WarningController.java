package com.foro.ejercicio3.notification.infrastructure;

import com.foro.ejercicio3.notification.application.WarningService;
import com.foro.ejercicio3.notification.domain.Warning;
import com.foro.ejercicio3.user.domain.User;
import com.foro.ejercicio3.user.infrastructure.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/warnings")
@RequiredArgsConstructor
public class WarningController {

    private final WarningRepository warningRepository;
    private final UserRepository userRepository;
    private final WarningService warningService;

    @PostMapping("/send")
    public ResponseEntity<String> sendWarning(@RequestBody Map<String, Object> payload) {
        Long userId = Long.valueOf(payload.get("userId").toString());
        String reason = payload.get("reason").toString();
        String message = payload.get("message").toString();
        String originalContent = payload.get("originalContent") != null ? payload.get("originalContent").toString() : "N/A";

        warningService.sendWarning(userId, reason, message, originalContent);
        return ResponseEntity.ok("Aviso enviado");
    }

    @GetMapping("/my-received")
    public ResponseEntity<List<Warning>> getMyReceivedWarnings() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email).orElseThrow();
        return ResponseEntity.ok(warningRepository.findByRecipientIdOrderByCreatedAtDesc(user.getId()));
    }

    @GetMapping("/my-sent")
    public ResponseEntity<List<Warning>> getMySentWarnings() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email).orElseThrow();
        return ResponseEntity.ok(warningRepository.findByModeratorIdOrderByCreatedAtDesc(user.getId()));
    }

    @GetMapping("/all")
    public ResponseEntity<List<Warning>> getAllWarnings() {
        return ResponseEntity.ok(warningRepository.findAll());
    }
}