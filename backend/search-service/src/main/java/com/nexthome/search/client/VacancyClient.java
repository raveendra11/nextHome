package com.nexthome.search.client;

import com.nexthome.search.dto.VacancyResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpMethod;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.Collections;
import java.util.List;

@Component
public class VacancyClient {

    private final RestTemplate restTemplate;
    private final String vacancyServiceUrl;

    public VacancyClient(RestTemplate restTemplate,
                         @Value("${services.vacancy.url:http://localhost:8081}") String vacancyServiceUrl) {
        this.restTemplate = restTemplate;
        this.vacancyServiceUrl = vacancyServiceUrl;
    }

    public List<VacancyResponse> findNearby(double latitude, double longitude, double radiusKm) {
        String url = String.format("%s/api/vacancies?latitude=%s&longitude=%s&radiusKm=%s",
                vacancyServiceUrl, latitude, longitude, radiusKm);

        var response = restTemplate.exchange(url, HttpMethod.GET, null,
                new ParameterizedTypeReference<List<VacancyResponse>>() {
                });

        return response.getBody() == null ? Collections.emptyList() : response.getBody();
    }
}
