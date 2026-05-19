package com.minifacebook.module.post.infrastructure.persistence.repository;

import com.minifacebook.module.post.domain.entity.Post;
import com.minifacebook.module.post.domain.repository.PostRepository;
import com.minifacebook.module.post.infrastructure.mapper.PostMapper;
import com.minifacebook.module.post.infrastructure.persistence.document.PostDocument;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
@RequiredArgsConstructor
public class PostRepositoryImpl implements PostRepository {

    private final MongoPostRepository mongoPostRepository;
    private final PostMapper postMapper;

    @Override
    public Post save(Post post) {
        PostDocument document = postMapper.toDocument(post);
        PostDocument savedDocument = mongoPostRepository.save(document);
        return postMapper.toDomain(savedDocument);
    }

    @Override
    public Optional<Post> findById(String id) {
        return mongoPostRepository.findById(id).map(postMapper::toDomain);
    }

    @Override
    public Page<Post> findAllOrderByCreatedAtDesc(Pageable pageable) {
        return mongoPostRepository.findAllByOrderByCreatedAtDesc(pageable)
                .map(postMapper::toDomain);
    }

    @Override
    public void deleteById(String id) {
        mongoPostRepository.deleteById(id);
    }
}
