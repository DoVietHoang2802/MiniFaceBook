package com.minifacebook.shared.mapper;

import org.mapstruct.MapperConfig;
import org.mapstruct.ReportingPolicy;

@MapperConfig(
    componentModel = "spring",
    unmappedTargetPolicy =
        ReportingPolicy.IGNORE // Bỏ qua các field không khớp để tránh warning rác
    )
public interface GlobalMapperConfig {}
