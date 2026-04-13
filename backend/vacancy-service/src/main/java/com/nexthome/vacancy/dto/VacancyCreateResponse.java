package com.nexthome.vacancy.dto;

public record VacancyCreateResponse(
        VacancyResponse vacancy,
        String managementToken
) {
}
