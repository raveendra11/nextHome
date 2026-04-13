package com.nexthome.vacancy.service;

import com.nexthome.vacancy.dto.VacancyRequest;
import com.nexthome.vacancy.dto.VacancyResponse;
import com.nexthome.vacancy.entity.Vacancy;
import com.nexthome.vacancy.repository.VacancyRepository;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

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
        List<Vacancy> all;
        boolean canFilterNearby = latitude != null && longitude != null && radiusKm != null;
        if (canFilterNearby) {
            double latitudeDelta = radiusKm / 111.0;
            double safeCos = Math.max(Math.cos(Math.toRadians(latitude)), 0.01);
            double longitudeDelta = radiusKm / (111.0 * safeCos);
            all = vacancyRepository.findByLatitudeBetweenAndLongitudeBetweenOrderByCreatedAtDesc(
                    latitude - latitudeDelta,
                    latitude + latitudeDelta,
                    longitude - longitudeDelta,
                    longitude + longitudeDelta
            );
        } else {
            all = vacancyRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt"));
        }

        return all.stream()
                .map(v -> {
                    Double distance = null;
                    if (latitude != null && longitude != null) {
                        distance = DistanceCalculator.distanceInKm(latitude, longitude, v.getLatitude(), v.getLongitude());
                    }
                    return toResponse(v, distance);
                })
                .filter(v -> !canFilterNearby || (v.distanceKm() != null && v.distanceKm() <= radiusKm))
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
