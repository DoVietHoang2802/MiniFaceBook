package com.minifacebook.module.auth.presentation;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;

import org.junit.jupiter.api.Test;
import org.springframework.context.annotation.Profile;

class DevSeedControllerProfileTest {

  @Test
  void excludesDevControllerFromProductionProfile() {
    Profile profile = DevSeedController.class.getAnnotation(Profile.class);

    assertArrayEquals(new String[] {"!prod"}, profile.value());
  }
}
