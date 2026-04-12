package com.nexthome.vacancy.controller;

import com.nexthome.vacancy.dto.VacancyRequest;
import com.nexthome.vacancy.dto.VacancyResponse;
import com.nexthome.vacancy.service.VacancyService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/vacancies")
public class VacancyController {

    private final VacancyService vacancyService;

    public VacancyController(VacancyService vacancyService) {
        this.vacancyService = vacancyService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public VacancyResponse create(@Valid @RequestBody VacancyRequest request) {
        return vacancyService.create(request);
    }

    @GetMapping
    public List<VacancyResponse> list(
            @RequestParam(name = "latitude", required = false) Double latitude,
            @RequestParam(name = "longitude", required = false) Double longitude,
            @RequestParam(name = "radiusKm", required = false) Double radiusKm
    ) {
        return vacancyService.list(latitude, longitude, radiusKm);
    }
}
