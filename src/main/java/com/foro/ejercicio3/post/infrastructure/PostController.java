package com.foro.ejercicio3.post.infrastructure;

import com.foro.ejercicio3.post.application.PostService;
import com.foro.ejercicio3.post.domain.Post;
import com.foro.ejercicio3.post.domain.PostRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/posts")
@RequiredArgsConstructor
public class PostController {

    private final PostService postService;

    @PostMapping
    public ResponseEntity<String> createPost(@RequestBody PostRequest request) {
        return ResponseEntity.ok(postService.createPost(request));
    }

    @GetMapping("/room/{roomId}")
    public ResponseEntity<List<Post>> getPostsByRoom(@PathVariable Long roomId) {
        return ResponseEntity.ok(postService.getApprovedPostsByRoom(roomId));
    }

    @GetMapping("/room/{roomId}/pending")
    public ResponseEntity<List<Post>> getPendingPosts(@PathVariable Long roomId) {
        return ResponseEntity.ok(postService.getPendingPostsByRoom(roomId));
    }

    @PatchMapping("/{postId}/moderate")
    public ResponseEntity<String> moderatePost(@PathVariable Long postId, @RequestParam boolean approve) {
        return ResponseEntity.ok(postService.moderatePost(postId, approve));
    }

    @DeleteMapping("/{postId}")
    public ResponseEntity<String> deletePost(@PathVariable Long postId) {
        return ResponseEntity.ok(postService.deletePost(postId));
    }

    // NUEVO: Endpoint para el historial del perfil
    @GetMapping("/my-history")
    public ResponseEntity<List<Post>> getMyHistory() {
        return ResponseEntity.ok(postService.getMyHistory());
    }
}