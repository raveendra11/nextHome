package com.nexthome.vacancy.dto;

import jakarta.validation.constraints.*;

import java.math.BigDecimal;

public record VacancyRequest(
        @NotBlank @Size(max = 120) String title,
        @NotBlank @Size(max = 1000) String description,
        @NotBlank @Size(max = 40) String roomType,
        @NotNull @DecimalMin(value = "0.0", inclusive = false) BigDecimal rent,
        @NotBlank @Size(max = 255) String address,
        @NotNull @DecimalMin("-90.0") @DecimalMax("90.0") Double latitude,
        @NotNull @DecimalMin("-180.0") @DecimalMax("180.0") Double longitude,
        @NotBlank @Size(max = 100) String createdBy
) {
}
