package com.nexthome.vacancy.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.nexthome.vacancy.dto.VacancyRequest;
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

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
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
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.title").value("Shared room near metro"));
    }

    @Test
    void listsVacancies() throws Exception {
        setupVacancy();

        mockMvc.perform(get("/api/vacancies"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").isNumber());
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
                "MG Road, Bengaluru",
                12.975,
                77.604,
                "ravi"
        );
    }
}
