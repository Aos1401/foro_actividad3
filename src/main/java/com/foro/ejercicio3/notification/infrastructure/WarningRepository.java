package com.foro.ejercicio3.notification.infrastructure;

import com.foro.ejercicio3.notification.domain.Warning;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface WarningRepository extends JpaRepository<Warning, Long> {
    List<Warning> findByRecipientIdOrderByCreatedAtDesc(Long userId);
    List<Warning> findByModeratorIdOrderByCreatedAtDesc(Long moderatorId);
    // Para el Superadmin, usaremos findAll()
}