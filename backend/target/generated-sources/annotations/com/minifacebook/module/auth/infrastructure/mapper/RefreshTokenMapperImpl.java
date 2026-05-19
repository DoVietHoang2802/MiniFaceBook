package com.minifacebook.module.auth.infrastructure.mapper;

import com.minifacebook.module.auth.domain.model.RefreshToken;
import com.minifacebook.module.auth.infrastructure.persistence.document.RefreshTokenDocument;
import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-05-19T09:58:52+0700",
    comments = "version: 1.5.5.Final, compiler: javac, environment: Java 21.0.11 (Eclipse Adoptium)"
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
        refreshTokenDocument.setToken( token.getToken() );
        refreshTokenDocument.setEmail( token.getEmail() );
        refreshTokenDocument.setExpiryDate( map( token.getExpiryDate() ) );
        refreshTokenDocument.setRevoked( token.isRevoked() );

        return refreshTokenDocument;
    }

    @Override
    public RefreshToken toDomain(RefreshTokenDocument document) {
        if ( document == null ) {
            return null;
        }

        RefreshToken.RefreshTokenBuilder refreshToken = RefreshToken.builder();

        refreshToken.id( document.getId() );
        refreshToken.token( document.getToken() );
        refreshToken.email( document.getEmail() );
        refreshToken.expiryDate( map( document.getExpiryDate() ) );
        refreshToken.revoked( document.isRevoked() );

        return refreshToken.build();
    }
}
