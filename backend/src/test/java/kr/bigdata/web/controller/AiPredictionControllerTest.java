package kr.bigdata.web.controller;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.print;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.HashMap;
import java.util.Map;

import com.fasterxml.jackson.databind.ObjectMapper;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.MockMvc;

import kr.bigdata.web.config.TestSecurityConfig;
import kr.bigdata.web.entity.AiPrediction;
import kr.bigdata.web.service.AiPredictionService;

@SpringBootTest
@AutoConfigureMockMvc
@Import(TestSecurityConfig.class)
public class AiPredictionControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private AiPredictionService aiPredictionService;

    @Test
    void testAdmissionPrediction() throws Exception {
        // JSON 구조 mock 응답 생성
        Map<String, Object> map = new HashMap<>();
        map.put("reason", "입실 예측이 완료되었습니다");
        map.put("preDisposition", 1);
        map.put("preScore", 1);

        String json = objectMapper.writeValueAsString(map);

        // AiPrediction mock → JSON을 AiPrediction.class로 매핑해서 반환
        when(aiPredictionService.predictAdmission(anyString()))
            .thenAnswer(invocation -> objectMapper.readValue(json, AiPrediction.class));

        when(aiPredictionService.toDtoWithBeds(org.mockito.ArgumentMatchers.any()))
            .thenReturn(objectMapper.readValue(json, kr.bigdata.web.dto.AiPredictionResponseDto.class));

        mockMvc.perform(post("/api/visits/TEST_VISIT_001/predict/admission"))
        	.andDo(print())
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.reason").value("입실 예측이 완료되었습니다"))
            .andExpect(jsonPath("$.preDisposition").value(1)) // "'일반병동 입원'을 1로 integer해서 테스트
            .andExpect(jsonPath("$.preScore").value(1));
    }
}
