package kr.bigdata.web.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import kr.bigdata.web.config.TestAiPredictionConfig;
import kr.bigdata.web.dto.AiPredictionResponseDto;
import kr.bigdata.web.entity.AiPrediction;
import kr.bigdata.web.service.AiPredictionService;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Import(TestAiPredictionConfig.class) // ⬅️ 이게 핵심
public class AiPredictionControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private AiPredictionService aiPredictionService;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    @DisplayName("입실 예측 API - 성공 케이스")
    void testPredictAdmission_ReturnsDto() throws Exception {
        // given
        String visitId = "12345678";

        AiPrediction dummyPrediction = new AiPrediction();  // (비어있어도 무방)
        AiPredictionResponseDto mockResponse = new AiPredictionResponseDto();
        mockResponse.setPreScore(85);
        mockResponse.setPreDisposition(1);
        mockResponse.setReason("Mock된 응답입니다");
        mockResponse.setVisitId(visitId);

        // when
        when(aiPredictionService.predictAdmission(visitId)).thenReturn(dummyPrediction);
        when(aiPredictionService.toDtoWithBeds(dummyPrediction)).thenReturn(mockResponse);

        // then
        mockMvc.perform(post("/api/visits/" + visitId + "/predict/admission")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.preScore").value(85))
                .andExpect(jsonPath("$.preDisposition").value(1))
                .andExpect(jsonPath("$.reason").value("Mock된 응답입니다"));
    }
}
