package com.minifacebook;

import static com.tngtech.archunit.library.Architectures.layeredArchitecture;

import com.tngtech.archunit.core.importer.ImportOption;
import com.tngtech.archunit.junit.AnalyzeClasses;
import com.tngtech.archunit.junit.ArchTest;
import com.tngtech.archunit.lang.ArchRule;

@AnalyzeClasses(packages = "com.minifacebook", importOptions = ImportOption.DoNotIncludeTests.class)
public class ArchitectureTest {

  @ArchTest
  static final ArchRule layered_architecture_is_respected =
      layeredArchitecture()
          .consideringOnlyDependenciesInAnyPackage("com.minifacebook..")
          .layer("Shared")
          .definedBy("com.minifacebook.shared..")
          .layer("Domain")
          .definedBy("com.minifacebook.module..domain..")
          .layer("Application")
          .definedBy("com.minifacebook.module..application..")
          .layer("Infrastructure")
          .definedBy("com.minifacebook.module..infrastructure..")
          .layer("Presentation")
          .definedBy("com.minifacebook.module..presentation..")
          .whereLayer("Domain")
          .mayOnlyBeAccessedByLayers("Application", "Infrastructure", "Presentation")
          .whereLayer("Application")
          .mayOnlyBeAccessedByLayers("Infrastructure", "Presentation")
          .whereLayer("Infrastructure")
          .mayOnlyBeAccessedByLayers("Presentation")
          .whereLayer("Presentation")
          .mayNotBeAccessedByAnyLayer()
          .withOptionalLayers(true);

  @ArchTest
  static final ArchRule shared_should_not_depend_on_modules =
      layeredArchitecture()
          .consideringOnlyDependenciesInAnyPackage("com.minifacebook..")
          .layer("Shared")
          .definedBy("com.minifacebook.shared..")
          .layer("Modules")
          .definedBy("com.minifacebook.module..")
          .layer("GlobalInfrastructure")
          .definedBy("com.minifacebook.infrastructure..")
          .whereLayer("Shared")
          .mayOnlyBeAccessedByLayers("Modules", "GlobalInfrastructure")
          .whereLayer("Modules")
          .mayOnlyBeAccessedByLayers("Modules", "GlobalInfrastructure")
          .whereLayer("GlobalInfrastructure")
          .mayNotBeAccessedByAnyLayer()
          .withOptionalLayers(true);
}
