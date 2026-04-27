package com.foro.ejercicio3.notification.application;

import com.foro.ejercicio3.notification.domain.Warning;
import com.foro.ejercicio3.notification.infrastructure.WarningRepository;
import com.foro.ejercicio3.user.domain.User;
import com.foro.ejercicio3.user.infrastructure.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class WarningService {
    private final WarningRepository warningRepository;
    private final UserRepository userRepository;

    public void sendWarning(Long userId, String reason, String message, String originalContent) {
        String modEmail = SecurityContextHolder.getContext().getAuthentication().getName();
        User moderator = userRepository.findByEmail(modEmail).orElseThrow();
        User recipient = userRepository.findById(userId).orElseThrow();

        Warning warning = Warning.builder()
                .moderator(moderator)
                .recipient(recipient)
                .reason(reason)
                .message(message)
                .originalContent(originalContent) // Guardamos el comentario polémico
                .createdAt(LocalDateTime.now())
                .build();

        warningRepository.save(warning);
    }
}