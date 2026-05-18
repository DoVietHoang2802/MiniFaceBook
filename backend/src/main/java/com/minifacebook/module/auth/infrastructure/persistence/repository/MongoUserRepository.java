package com.minifacebook.module.auth.infrastructure.persistence.repository;

import com.minifacebook.module.auth.infrastructure.persistence.document.UserDocument;
import java.util.Optional;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

/** Spring Data MongoDB Repository cho UserDocument. */
@Repository
public interface MongoUserRepository extends MongoRepository<UserDocument, String> {

  Optional<UserDocument> findByEmail(String email);

  boolean existsByEmail(String email);

  Optional<UserDocument> findByVerificationToken(String verificationToken);
}
