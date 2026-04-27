package com.foro.ejercicio3.user.domain;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.foro.ejercicio3.room.domain.Room;
import jakarta.persistence.*;
import lombok.*;

import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String username;

    @Column(unique = true, nullable = false)
    private String email;

    @JsonIgnore
    @Column(nullable = false)
    private String password;

    @Enumerated(EnumType.STRING)
    private Role role;

    // NUEVO: Límite semanal de preguntas (por defecto 5)
    @Builder.Default
    @Column(nullable = false)
    private int weeklyQuestionLimit = 5;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "user_favorites",
            joinColumns = @JoinColumn(name = "user_id"),
            inverseJoinColumns = @JoinColumn(name = "room_id")
    )
    @JsonIgnoreProperties({"moderators"})
    @Builder.Default
    private Set<Room> favoriteRooms = new HashSet<>();
}