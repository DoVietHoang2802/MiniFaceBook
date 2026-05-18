package com.minifacebook.module.auth.infrastructure.persistence.adapter;

import com.minifacebook.module.auth.domain.model.RefreshToken;
import com.minifacebook.module.auth.domain.repository.RefreshTokenRepository;
import com.minifacebook.module.auth.infrastructure.mapper.RefreshTokenMapper;
import com.minifacebook.module.auth.infrastructure.persistence.document.RefreshTokenDocument;
import com.minifacebook.module.auth.infrastructure.persistence.repository.MongoRefreshTokenRepository;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

/**
 * Adapter triển khai giao diện RefreshTokenRepository của Domain.
 * Chuyển giao dữ liệu giữa Domain Entity và MongoDB Document thông qua MapStruct.
 */
@Repository
@RequiredArgsConstructor
public class RefreshTokenRepositoryImpl implements RefreshTokenRepository {

  private final MongoRefreshTokenRepository mongoRepository;
  private final RefreshTokenMapper mapper;

  @Override
  public RefreshToken save(RefreshToken refreshToken) {
    RefreshTokenDocument document = mapper.toDocument(refreshToken);
    RefreshTokenDocument saved = mongoRepository.save(document);
    return mapper.toDomain(saved);
  }

  @Override
  public Optional<RefreshToken> findByToken(String token) {
    return mongoRepository.findByToken(token).map(mapper::toDomain);
  }

  @Override
  public void deleteByEmail(String email) {
    mongoRepository.deleteByEmail(email);
  }
}
