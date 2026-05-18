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
    date = "2026-05-18T15:35:09+0700",
    comments = "version: 1.5.5.Final, compiler: Eclipse JDT (IDE) 3.46.0.v20260407-0427, environment: Java 21.0.10 (Eclipse Adoptium)"
)
@Component
public class UserDocumentMapperImpl implements UserDocumentMapper {

    @Override
    public UserDocument toDocument(User user) {
        if ( user == null ) {
            return null;
        }

        UserDocument userDocument = new UserDocument();

        userDocument.setCreatedAt( map( user.getCreatedAt() ) );
        userDocument.setId( user.getId() );
        userDocument.setUpdatedAt( map( user.getUpdatedAt() ) );
        userDocument.setAvatar( user.getAvatar() );
        userDocument.setBio( user.getBio() );
        userDocument.setEmail( user.getEmail() );
        userDocument.setPassword( user.getPassword() );
        Set<Role> set = user.getRoles();
        if ( set != null ) {
            userDocument.setRoles( new LinkedHashSet<Role>( set ) );
        }
        userDocument.setVerificationToken( user.getVerificationToken() );
        userDocument.setVerified( user.isVerified() );

        return userDocument;
    }

    @Override
    public User toDomain(UserDocument document) {
        if ( document == null ) {
            return null;
        }

        User.UserBuilder user = User.builder();

        user.avatar( document.getAvatar() );
        user.bio( document.getBio() );
        user.createdAt( map( document.getCreatedAt() ) );
        user.email( document.getEmail() );
        user.id( document.getId() );
        user.password( document.getPassword() );
        Set<Role> set = document.getRoles();
        if ( set != null ) {
            user.roles( new LinkedHashSet<Role>( set ) );
        }
        user.updatedAt( map( document.getUpdatedAt() ) );
        user.verificationToken( document.getVerificationToken() );
        user.verified( document.isVerified() );

        return user.build();
    }
}
