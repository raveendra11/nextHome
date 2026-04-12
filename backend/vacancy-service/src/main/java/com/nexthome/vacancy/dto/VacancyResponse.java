package com.nexthome.vacancy.dto;

import java.math.BigDecimal;
import java.time.Instant;

public record VacancyResponse(
        Long id,
        String title,
        String description,
        String roomType,
        BigDecimal rent,
        String address,
        Double latitude,
        Double longitude,
        String createdBy,
        Instant createdAt,
        Double distanceKm
) {
}
