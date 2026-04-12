package com.nexthome.vacancy.service;

import com.nexthome.vacancy.dto.VacancyRequest;
import com.nexthome.vacancy.dto.VacancyResponse;
import com.nexthome.vacancy.entity.Vacancy;
import com.nexthome.vacancy.repository.VacancyRepository;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;

@Service
public class VacancyService {

    private final VacancyRepository vacancyRepository;

    public VacancyService(VacancyRepository vacancyRepository) {
        this.vacancyRepository = vacancyRepository;
    }

    public VacancyResponse create(VacancyRequest request) {
        Vacancy vacancy = new Vacancy();
        vacancy.setTitle(request.title());
        vacancy.setDescription(request.description());
        vacancy.setRoomType(request.roomType());
        vacancy.setRent(request.rent());
        vacancy.setAddress(request.address());
        vacancy.setLatitude(request.latitude());
        vacancy.setLongitude(request.longitude());
        vacancy.setCreatedBy(request.createdBy());

        Vacancy saved = vacancyRepository.save(vacancy);
        return toResponse(saved, null);
    }

    public List<VacancyResponse> list(Double latitude, Double longitude, Double radiusKm) {
        List<Vacancy> all = vacancyRepository.findAll();
        boolean canFilterNearby = latitude != null && longitude != null && radiusKm != null;

        return all.stream()
                .map(v -> {
                    Double distance = null;
                    if (latitude != null && longitude != null) {
                        distance = DistanceCalculator.distanceInKm(latitude, longitude, v.getLatitude(), v.getLongitude());
                    }
                    return toResponse(v, distance);
                })
                .filter(v -> !canFilterNearby || (v.distanceKm() != null && v.distanceKm() <= radiusKm))
                .sorted(Comparator.comparing(VacancyResponse::createdAt).reversed())
                .toList();
    }

    private VacancyResponse toResponse(Vacancy vacancy, Double distanceKm) {
        return new VacancyResponse(
                vacancy.getId(),
                vacancy.getTitle(),
                vacancy.getDescription(),
                vacancy.getRoomType(),
                vacancy.getRent(),
                vacancy.getAddress(),
                vacancy.getLatitude(),
                vacancy.getLongitude(),
                vacancy.getCreatedBy(),
                vacancy.getCreatedAt(),
                distanceKm
        );
    }
}
