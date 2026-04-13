package com.nexthome.search.service;

import com.nexthome.search.client.VacancyClient;
import com.nexthome.search.dto.VacancyResponse;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class SearchService {

    private final VacancyClient vacancyClient;

    public SearchService(VacancyClient vacancyClient) {
        this.vacancyClient = vacancyClient;
    }

    public List<VacancyResponse> nearby(double latitude, double longitude, double radiusKm) {
        return vacancyClient.findNearby(latitude, longitude, radiusKm);
    }
}
