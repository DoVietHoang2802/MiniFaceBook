package com.minifacebook.module.auth.infrastructure.mapper;

import com.minifacebook.module.auth.domain.model.RefreshToken;
import com.minifacebook.module.auth.infrastructure.persistence.document.RefreshTokenDocument;
import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-05-18T15:35:09+0700",
    comments = "version: 1.5.5.Final, compiler: Eclipse JDT (IDE) 3.46.0.v20260407-0427, environment: Java 21.0.10 (Eclipse Adoptium)"
)
@Component
public class RefreshTokenMapperImpl implements RefreshTokenMapper {

    @Override
    public RefreshTokenDocument toDocument(RefreshToken token) {
        if ( token == null ) {
            return null;
        }

        RefreshTokenDocument refreshTokenDocument = new RefreshTokenDocument();

        refreshTokenDocument.setId( token.getId() );
        refreshTokenDocument.setEmail( token.getEmail() );
        refreshTokenDocument.setExpiryDate( map( token.getExpiryDate() ) );
        refreshTokenDocument.setRevoked( token.isRevoked() );
        refreshTokenDocument.setToken( token.getToken() );

        return refreshTokenDocument;
    }

    @Override
    public RefreshToken toDomain(RefreshTokenDocument document) {
        if ( document == null ) {
            return null;
        }

        RefreshToken.RefreshTokenBuilder refreshToken = RefreshToken.builder();

        refreshToken.email( document.getEmail() );
        refreshToken.expiryDate( map( document.getExpiryDate() ) );
        refreshToken.id( document.getId() );
        refreshToken.revoked( document.isRevoked() );
        refreshToken.token( document.getToken() );

        return refreshToken.build();
    }
}
