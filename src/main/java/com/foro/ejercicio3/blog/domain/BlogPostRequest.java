package com.foro.ejercicio3.blog.domain;

import lombok.Data;

@Data
public class BlogPostRequest {
    private String title;
    private String content;
}