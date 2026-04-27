package com.foro.ejercicio3.blog.infrastructure;

import com.foro.ejercicio3.blog.domain.BlogPost;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BlogPostRepository extends JpaRepository<BlogPost, Long> {
    List<BlogPost> findAllByOrderByCreatedAtDesc(); // Para mostrar los más nuevos primero
}