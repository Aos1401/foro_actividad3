package com.foro.ejercicio3.notification.domain;

import com.foro.ejercicio3.user.domain.User;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "warnings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Warning {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "moderator_id")
    private User moderator;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User recipient;

    private String reason;
    private String message;

    @Column(columnDefinition = "TEXT")
    private String originalContent; // NUEVO: Para saber qué mensaje causó el aviso

    private LocalDateTime createdAt;
}