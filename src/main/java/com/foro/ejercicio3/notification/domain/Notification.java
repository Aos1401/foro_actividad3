package com.foro.ejercicio3.notification.domain;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.foro.ejercicio3.user.domain.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "notifications")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // A quién va dirigida la notificación
    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User recipient;

    private String message;
    private Long relatedRoomId; // Guardamos la sala para poner un botón de "Ir a la sala"
    private LocalDateTime createdAt;
}