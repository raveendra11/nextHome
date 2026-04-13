package com.nexthome.vacancy.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.nexthome.vacancy.dto.VacancyRequest;
import com.nexthome.vacancy.entity.Vacancy;
import com.nexthome.vacancy.repository.VacancyRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;

import static org.hamcrest.Matchers.nullValue;
import static org.hamcrest.Matchers.notNullValue;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class VacancyControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private VacancyRepository vacancyRepository;

    @AfterEach
    void cleanup() {
        vacancyRepository.deleteAll();
    }

    @Test
    void createsVacancy() throws Exception {
        VacancyRequest request = buildValidRequest();

        mockMvc.perform(post("/api/vacancies")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.vacancy.id").isNumber())
                .andExpect(jsonPath("$.vacancy.title").value("Shared room near metro"))
                .andExpect(jsonPath("$.vacancy.city").value("Bengaluru"))
                .andExpect(jsonPath("$.vacancy.latitude").value(nullValue()))
                .andExpect(jsonPath("$.vacancy.longitude").value(nullValue()))
                .andExpect(jsonPath("$.managementToken", notNullValue()));
    }

    @Test
    void listsVacancies() throws Exception {
        setupVacancy();

        mockMvc.perform(get("/api/vacancies"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").isNumber());
    }

    @Test
    void getsVacancyById() throws Exception {
        setupVacancy();
        Vacancy vacancy = vacancyRepository.findAll().get(0);

        mockMvc.perform(get("/api/vacancies/{id}", vacancy.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(vacancy.getId()))
                .andExpect(jsonPath("$.title").value("Shared room near metro"));
    }

    @Test
    void listsVacanciesByCity() throws Exception {
        setupVacancy();
        VacancyRequest hyderabadRequest = new VacancyRequest(
                "Single room in Banjara Hills",
                "Furnished room available",
                "PRIVATE",
                new BigDecimal("11000"),
                "Hyderabad",
                "Banjara Hills",
                null,
                null,
                "anita"
        );
        mockMvc.perform(post("/api/vacancies")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(hyderabadRequest)))
                .andExpect(status().isCreated());

        mockMvc.perform(get("/api/vacancies").param("city", "bengaluru"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].city").value("Bengaluru"));
    }

    @Test
    void updatesVacancyWithValidToken() throws Exception {
        setupVacancy();
        Vacancy vacancy = vacancyRepository.findAll().get(0);

        VacancyRequest updated = new VacancyRequest(
                "Updated title",
                "Updated description",
                "PRIVATE",
                new BigDecimal("9000"),
                "Bengaluru",
                "Indiranagar",
                null,
                null,
                "ravi"
        );

        mockMvc.perform(put("/api/vacancies/{id}", vacancy.getId())
                        .param("token", vacancy.getManagementToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updated)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Updated title"));
    }

    @Test
    void updatesVacancyWithValidTokenHeader() throws Exception {
        setupVacancy();
        Vacancy vacancy = vacancyRepository.findAll().get(0);

        VacancyRequest updated = new VacancyRequest(
                "Updated from header",
                "Updated description",
                "PRIVATE",
                new BigDecimal("9000"),
                "Bengaluru",
                "Indiranagar",
                null,
                null,
                "ravi"
        );

        mockMvc.perform(put("/api/vacancies/{id}", vacancy.getId())
                        .header("X-Management-Token", vacancy.getManagementToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updated)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Updated from header"));
    }

    @Test
    void rejectsUpdateWithInvalidToken() throws Exception {
        setupVacancy();
        Vacancy vacancy = vacancyRepository.findAll().get(0);

        mockMvc.perform(put("/api/vacancies/{id}", vacancy.getId())
                        .param("token", "wrong-token")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(buildValidRequest())))
                .andExpect(status().isForbidden());
    }

    @Test
    void deletesVacancyWithValidToken() throws Exception {
        setupVacancy();
        Vacancy vacancy = vacancyRepository.findAll().get(0);

        mockMvc.perform(delete("/api/vacancies/{id}", vacancy.getId())
                        .param("token", vacancy.getManagementToken()))
                .andExpect(status().isNoContent());

        assertFalse(vacancyRepository.findById(vacancy.getId()).isPresent());
    }

    @Test
    void deletesVacancyWithValidTokenHeader() throws Exception {
        setupVacancy();
        Vacancy vacancy = vacancyRepository.findAll().get(0);

        mockMvc.perform(delete("/api/vacancies/{id}", vacancy.getId())
                        .header("X-Management-Token", vacancy.getManagementToken()))
                .andExpect(status().isNoContent());

        assertFalse(vacancyRepository.findById(vacancy.getId()).isPresent());
    }

    @Test
    void rejectsNegativeRadius() throws Exception {
        mockMvc.perform(get("/api/vacancies").param("radiusKm", "-1"))
                .andExpect(status().isBadRequest());
    }

    private void setupVacancy() throws Exception {
        mockMvc.perform(post("/api/vacancies")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(buildValidRequest())))
                .andExpect(status().isCreated());
    }

    private VacancyRequest buildValidRequest() {
        return new VacancyRequest(
                "Shared room near metro",
                "One bed available in 2BHK apartment",
                "SHARED",
                new BigDecimal("7000"),
                "Bengaluru",
                "MG Road, Bengaluru",
                null,
                null,
                "ravi"
        );
    }
}
