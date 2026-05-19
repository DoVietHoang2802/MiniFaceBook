package com.minifacebook.module.auth.infrastructure.mapper;

import com.minifacebook.module.auth.domain.model.Role;
import com.minifacebook.module.auth.domain.model.User;
import com.minifacebook.module.auth.infrastructure.persistence.document.UserDocument;
import java.util.LinkedHashSet;
import java.util.Set;
import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-05-19T09:02:31+0700",
    comments = "version: 1.5.5.Final, compiler: javac, environment: Java 21.0.11 (Eclipse Adoptium)"
)
@Component
public class UserDocumentMapperImpl implements UserDocumentMapper {

    @Override
    public UserDocument toDocument(User user) {
        if ( user == null ) {
            return null;
        }

        UserDocument userDocument = new UserDocument();

        userDocument.setId( user.getId() );
        userDocument.setCreatedAt( map( user.getCreatedAt() ) );
        userDocument.setUpdatedAt( map( user.getUpdatedAt() ) );
        userDocument.setEmail( user.getEmail() );
        userDocument.setPassword( user.getPassword() );
        userDocument.setAvatar( user.getAvatar() );
        userDocument.setBio( user.getBio() );
        Set<Role> set = user.getRoles();
        if ( set != null ) {
            userDocument.setRoles( new LinkedHashSet<Role>( set ) );
        }
        userDocument.setVerified( user.isVerified() );
        userDocument.setVerificationToken( user.getVerificationToken() );

        return userDocument;
    }

    @Override
    public User toDomain(UserDocument document) {
        if ( document == null ) {
            return null;
        }

        User.UserBuilder user = User.builder();

        user.id( document.getId() );
        user.email( document.getEmail() );
        user.password( document.getPassword() );
        user.avatar( document.getAvatar() );
        user.bio( document.getBio() );
        Set<Role> set = document.getRoles();
        if ( set != null ) {
            user.roles( new LinkedHashSet<Role>( set ) );
        }
        user.verified( document.isVerified() );
        user.verificationToken( document.getVerificationToken() );
        user.createdAt( map( document.getCreatedAt() ) );
        user.updatedAt( map( document.getUpdatedAt() ) );

        return user.build();
    }
}
