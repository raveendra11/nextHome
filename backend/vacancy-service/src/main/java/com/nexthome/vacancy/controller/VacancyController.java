package com.nexthome.vacancy.controller;

import com.nexthome.vacancy.dto.VacancyCreateResponse;
import com.nexthome.vacancy.dto.VacancyRequest;
import com.nexthome.vacancy.dto.VacancyResponse;
import com.nexthome.vacancy.service.VacancyService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import org.springframework.http.HttpStatus;
import org.springframework.util.StringUtils;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@Validated
@RequestMapping("/api/vacancies")
public class VacancyController {

    private final VacancyService vacancyService;

    public VacancyController(VacancyService vacancyService) {
        this.vacancyService = vacancyService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public VacancyCreateResponse create(@Valid @RequestBody VacancyRequest request) {
        return vacancyService.create(request);
    }

    @GetMapping
    public List<VacancyResponse> list(
            @RequestParam(name = "city", required = false)
            @Size(max = 100, message = "City can have at most 100 characters")
            String city,
            @RequestParam(name = "latitude", required = false)
            @DecimalMin(value = "-90.0", message = "Latitude must be >= -90")
            @DecimalMax(value = "90.0", message = "Latitude must be <= 90")
            Double latitude,
            @RequestParam(name = "longitude", required = false)
            @DecimalMin(value = "-180.0", message = "Longitude must be >= -180")
            @DecimalMax(value = "180.0", message = "Longitude must be <= 180")
            Double longitude,
            @RequestParam(name = "radiusKm", required = false)
            @Positive(message = "radiusKm must be positive")
            Double radiusKm
    ) {
        return vacancyService.list(city, latitude, longitude, radiusKm);
    }

    @GetMapping("/{id}")
    public VacancyResponse getById(@PathVariable("id") Long id) {
        return vacancyService.getById(id);
    }

    @PutMapping("/{id}")
    public VacancyResponse update(
            @PathVariable("id") Long id,
            @RequestParam(name = "token", required = false) String token,
            @RequestHeader(name = "X-Management-Token", required = false) String tokenHeader,
            @Valid @RequestBody VacancyRequest request
    ) {
        return vacancyService.update(id, resolveToken(token, tokenHeader), request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(
            @PathVariable("id") Long id,
            @RequestParam(name = "token", required = false) String token,
            @RequestHeader(name = "X-Management-Token", required = false) String tokenHeader
    ) {
        vacancyService.delete(id, resolveToken(token, tokenHeader));
    }

    private String resolveToken(String tokenParam, String tokenHeader) {
        String token = StringUtils.hasText(tokenHeader) ? tokenHeader : tokenParam;
        if (!StringUtils.hasText(token)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "token is required");
        }
        return token.trim();
    }
}
