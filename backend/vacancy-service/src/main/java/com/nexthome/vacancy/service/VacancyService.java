package com.nexthome.vacancy.service;

import com.nexthome.vacancy.dto.VacancyCreateResponse;
import com.nexthome.vacancy.dto.VacancyRequest;
import com.nexthome.vacancy.dto.VacancyResponse;
import com.nexthome.vacancy.entity.Vacancy;
import com.nexthome.vacancy.repository.VacancyRepository;
import org.springframework.http.HttpStatus;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Objects;
import java.util.UUID;

@Service
public class VacancyService {

    private static final double KM_PER_DEGREE = 111.0;
    private static final double MIN_SAFE_COSINE = 1e-6;
    private static final double MAX_LONGITUDE_RANGE = 180.0;

    private final VacancyRepository vacancyRepository;

    public VacancyService(VacancyRepository vacancyRepository) {
        this.vacancyRepository = vacancyRepository;
    }

    public VacancyCreateResponse create(VacancyRequest request) {
        Vacancy vacancy = new Vacancy();
        vacancy.setTitle(request.title());
        vacancy.setDescription(request.description());
        vacancy.setRoomType(request.roomType());
        vacancy.setRent(request.rent());
        vacancy.setCity(request.city());
        vacancy.setAddress(request.address());
        vacancy.setLatitude(request.latitude());
        vacancy.setLongitude(request.longitude());
        vacancy.setCreatedBy(request.createdBy());
        vacancy.setManagementToken(generateManagementToken());

        Vacancy saved = vacancyRepository.save(vacancy);
        return new VacancyCreateResponse(toResponse(saved, null), saved.getManagementToken());
    }

    public List<VacancyResponse> list(String city, Double latitude, Double longitude, Double radiusKm) {
        List<Vacancy> all;
        boolean canFilterNearby = latitude != null && longitude != null && radiusKm != null;
        boolean canFilterByCity = city != null && !city.isBlank();
        if (canFilterNearby) {
            double latitudeDelta = radiusKm / KM_PER_DEGREE;
            double cosine = Math.cos(Math.toRadians(latitude));
            double longitudeDelta = Math.abs(cosine) < MIN_SAFE_COSINE
                    ? MAX_LONGITUDE_RANGE
                    : radiusKm / (KM_PER_DEGREE * Math.abs(cosine));
            all = vacancyRepository.findByLatitudeBetweenAndLongitudeBetweenOrderByCreatedAtDesc(
                    latitude - latitudeDelta,
                    latitude + latitudeDelta,
                    longitude - longitudeDelta,
                    longitude + longitudeDelta
            );
        } else if (canFilterByCity) {
            all = vacancyRepository.findByCityIgnoreCaseOrderByCreatedAtDesc(city.trim());
        } else {
            all = vacancyRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt"));
        }

        return all.stream()
                .map(v -> {
                    Double distance = null;
                    if (latitude != null && longitude != null && v.getLatitude() != null && v.getLongitude() != null) {
                        distance = DistanceCalculator.distanceInKm(latitude, longitude, v.getLatitude(), v.getLongitude());
                    }
                    return toResponse(v, distance);
                })
                .filter(v -> !canFilterNearby || (v.distanceKm() != null && v.distanceKm() <= radiusKm))
                .toList();
    }

    public VacancyResponse update(Long id, String token, VacancyRequest request) {
        Vacancy vacancy = getManagedVacancy(id, token);
        vacancy.setTitle(request.title());
        vacancy.setDescription(request.description());
        vacancy.setRoomType(request.roomType());
        vacancy.setRent(request.rent());
        vacancy.setCity(request.city());
        vacancy.setAddress(request.address());
        vacancy.setLatitude(request.latitude());
        vacancy.setLongitude(request.longitude());
        vacancy.setCreatedBy(request.createdBy());

        return toResponse(vacancyRepository.save(vacancy), null);
    }

    public void delete(Long id, String token) {
        Vacancy vacancy = getManagedVacancy(id, token);
        vacancyRepository.delete(vacancy);
    }

    private Vacancy getManagedVacancy(Long id, String token) {
        Vacancy vacancy = vacancyRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Vacancy not found"));
        if (!Objects.equals(vacancy.getManagementToken(), token)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Invalid management token");
        }
        return vacancy;
    }

    private String generateManagementToken() {
        return UUID.randomUUID().toString().replace("-", "");
    }

    private VacancyResponse toResponse(Vacancy vacancy, Double distanceKm) {
        return new VacancyResponse(
                vacancy.getId(),
                vacancy.getTitle(),
                vacancy.getDescription(),
                vacancy.getRoomType(),
                vacancy.getRent(),
                vacancy.getCity(),
                vacancy.getAddress(),
                vacancy.getLatitude(),
                vacancy.getLongitude(),
                vacancy.getCreatedBy(),
                vacancy.getCreatedAt(),
                distanceKm
        );
    }
}
