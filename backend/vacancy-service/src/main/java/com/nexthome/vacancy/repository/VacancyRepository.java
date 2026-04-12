package com.nexthome.vacancy.repository;

import com.nexthome.vacancy.entity.Vacancy;
import org.springframework.data.jpa.repository.JpaRepository;

public interface VacancyRepository extends JpaRepository<Vacancy, Long> {
}
