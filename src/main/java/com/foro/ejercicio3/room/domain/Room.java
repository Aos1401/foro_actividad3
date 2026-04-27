package com.foro.ejercicio3.room.domain;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.foro.ejercicio3.user.domain.User;
import jakarta.persistence.*;
import lombok.*;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "rooms")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Room {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String description;

    @Column(name = "is_moderated", nullable = false)
    private boolean moderated;

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
            name = "room_moderators",
            joinColumns = @JoinColumn(name = "room_id"),
            inverseJoinColumns = @JoinColumn(name = "user_id")
    )
    // ESTA LÍNEA ES LA MAGIA QUE ROMPE EL BUCLE 🪄
    @JsonIgnoreProperties({"favoriteRooms", "password"})
    private Set<User> moderators = new HashSet<>();
}