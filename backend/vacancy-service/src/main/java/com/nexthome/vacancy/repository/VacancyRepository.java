package com.nexthome.vacancy.repository;

import com.nexthome.vacancy.entity.Vacancy;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface VacancyRepository extends JpaRepository<Vacancy, Long> {
    List<Vacancy> findByLatitudeBetweenAndLongitudeBetweenOrderByCreatedAtDesc(
            Double minLatitude,
            Double maxLatitude,
            Double minLongitude,
            Double maxLongitude
    );
}
