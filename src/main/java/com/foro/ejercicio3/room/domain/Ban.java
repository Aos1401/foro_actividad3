package com.foro.ejercicio3.room.domain;

import com.foro.ejercicio3.user.domain.User;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "room_bans")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Ban {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne
    @JoinColumn(name = "room_id")
    private Room room;

    private boolean permanent;
    private LocalDateTime expiryDate; // null si es permanente
}