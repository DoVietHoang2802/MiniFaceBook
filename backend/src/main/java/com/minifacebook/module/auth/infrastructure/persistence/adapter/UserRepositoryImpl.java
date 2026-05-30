package com.minifacebook.module.auth.infrastructure.persistence.adapter;

import com.minifacebook.module.auth.domain.model.User;
import com.minifacebook.module.auth.domain.repository.UserRepository;
import com.minifacebook.module.auth.infrastructure.mapper.UserDocumentMapper;
import com.minifacebook.module.auth.infrastructure.persistence.document.UserDocument;
import com.minifacebook.module.auth.infrastructure.persistence.repository.MongoUserRepository;
import java.util.List;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

/** Adapter triển khai UserRepository sử dụng Spring Data MongoDB. */
@Repository
@RequiredArgsConstructor
public class UserRepositoryImpl implements UserRepository {

  private final MongoUserRepository mongoUserRepository;
  private final UserDocumentMapper userDocumentMapper;

  @Override
  public Optional<User> findByEmail(String email) {
    return mongoUserRepository.findByEmail(email).map(userDocumentMapper::toDomain);
  }

  @Override
  public boolean existsByEmail(String email) {
    return mongoUserRepository.existsByEmail(email);
  }

  @Override
  public User save(User user) {
    UserDocument document = userDocumentMapper.toDocument(user);
    UserDocument savedDocument = mongoUserRepository.save(document);
    return userDocumentMapper.toDomain(savedDocument);
  }

  @Override
  public Optional<User> findById(String id) {
    return mongoUserRepository.findById(id).map(userDocumentMapper::toDomain);
  }

  @Override
  public Optional<User> findByVerificationToken(String token) {
    return mongoUserRepository.findByVerificationToken(token).map(userDocumentMapper::toDomain);
  }

  @Override
  public List<User> findAllByIds(List<String> ids) {
    return mongoUserRepository.findAllById(ids).stream()
        .map(userDocumentMapper::toDomain)
        .toList();
  }

  @Override
  public Page<User> searchByName(String keyword, Pageable pageable) {
    return mongoUserRepository.searchByName(keyword, pageable).map(userDocumentMapper::toDomain);
  }
}
