package com.foro.ejercicio3.notification.infrastructure;

import com.foro.ejercicio3.notification.domain.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    // Buscar las notificaciones de un usuario, ordenadas de más nuevas a más viejas
    List<Notification> findByRecipientIdOrderByCreatedAtDesc(Long recipientId);
}