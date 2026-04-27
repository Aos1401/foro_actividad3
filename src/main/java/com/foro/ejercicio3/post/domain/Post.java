package com.foro.ejercicio3.post.domain;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.foro.ejercicio3.room.domain.Room;
import com.foro.ejercicio3.user.domain.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "posts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Post {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private boolean isApproved;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id", nullable = false)
    @JsonIgnoreProperties({"moderators", "hibernateLazyInitializer"})
    private Room room;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_id", nullable = false)
    @JsonIgnoreProperties({"favoriteRooms", "hibernateLazyInitializer"})
    private User author;

    // ==========================================
    // NUEVO: SISTEMA DE HILOS (PREGUNTAS Y RESPUESTAS)
    // ==========================================
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "parent_id")
    @JsonIgnoreProperties({"room", "author", "parentPost"})
    private Post parentPost;
}