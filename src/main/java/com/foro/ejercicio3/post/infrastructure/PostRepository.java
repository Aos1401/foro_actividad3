package com.foro.ejercicio3.post.infrastructure;

import com.foro.ejercicio3.post.domain.Post;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface PostRepository extends JpaRepository<Post, Long> {

    List<Post> findByRoomIdOrderByCreatedAtAsc(Long roomId);

    List<Post> findByRoomIdAndIsApprovedFalseOrderByCreatedAtAsc(Long roomId);

    List<Post> findByAuthorIdOrderByCreatedAtDesc(Long authorId);

    // NUEVO: Cuenta los posts de un usuario desde una fecha concreta
    long countByAuthorIdAndCreatedAtAfter(Long authorId, LocalDateTime after);
}