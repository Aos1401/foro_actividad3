package com.foro.ejercicio3.blog.infrastructure;

import com.foro.ejercicio3.blog.domain.BlogPost;
import com.foro.ejercicio3.blog.domain.BlogPostRequest;
import com.foro.ejercicio3.user.domain.User;
import com.foro.ejercicio3.user.infrastructure.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/blog")
@RequiredArgsConstructor
public class BlogController {

    private final BlogPostRepository blogPostRepository;
    private final UserRepository userRepository;

    // PÚBLICO: Todo el mundo puede leer
    @GetMapping
    public ResponseEntity<List<BlogPost>> getAllPosts() {
        return ResponseEntity.ok(blogPostRepository.findAllByOrderByCreatedAtDesc());
    }

    // PRIVADO: Solo el Superadmin puede publicar
    @PostMapping
    public ResponseEntity<String> createPost(@RequestBody BlogPostRequest request) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User admin = userRepository.findByEmail(email).orElseThrow();

        BlogPost post = BlogPost.builder()
                .title(request.getTitle())
                .content(request.getContent())
                .createdAt(LocalDateTime.now())
                .author(admin)
                .build();

        blogPostRepository.save(post);
        return ResponseEntity.ok("Post publicado en el blog con éxito.");
    }

    // NUEVO - PRIVADO: Solo el Superadmin puede borrar
    @DeleteMapping("/{id}")
    public ResponseEntity<String> deletePost(@PathVariable Long id) {
        blogPostRepository.deleteById(id);
        return ResponseEntity.ok("Artículo eliminado con éxito.");
    }
}