package kr.bigdata.web.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import kr.bigdata.web.config.TestEmergencyVisitControllerConfig;
import kr.bigdata.web.dto.FinalizeDispositionRequest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.Rollback;
import org.springframework.test.web.servlet.MockMvc;


import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;


import org.springframework.transaction.annotation.Transactional;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@AutoConfigureMockMvc
@SpringBootTest
@Import(TestEmergencyVisitControllerConfig.class)
@Rollback
@Transactional
public class EmergencyVisitControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    @DisplayName("최종 배치 확정 API - 통합 Green 테스트")
    void testFinalizeDisposition_Green() throws Exception {
        // ✅ 테스트용 ADM ID (실제 DB에 존재하는 visitId로 교체할 것)
        String visitId = "16428261";

        FinalizeDispositionRequest request = new FinalizeDispositionRequest();
        request.setDisposition(1); // 1: 일반병동
        request.setReason("자동화 테스트 목적");

        mockMvc.perform(post("/api/visits/" + visitId + "/disposition")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());
    }
    
    @Test
    @DisplayName("최종 배치 수정 API - Green 통합 테스트")
    void testUpdateDisposition_Green() throws Exception {
        String visitId = "16428261";  // ✅ 실제 DB에 존재하는 ADM ID

        FinalizeDispositionRequest request = new FinalizeDispositionRequest();
        request.setDisposition(2); // 2: ICU
        request.setReason("AI 예측 기반 수정 요청");

        mockMvc.perform(put("/api/visits/" + visitId + "/disposition")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());
    }
    @Test
    @DisplayName("최종 배치 삭제 API - Green 통합 테스트")
    void testDeleteDisposition_Green() throws Exception {
        String visitId = "16428261";  // ✅ 실제 ADM ID

        mockMvc.perform(delete("/api/visits/" + visitId + "/disposition"))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("방문 요약 리스트 조회 API - Green 통합 테스트")
    void testGetVisitSummaries_Green() throws Exception {
        String patientId = "16428261"; // 🔁 실제 FK 맞게 수정 필요

        mockMvc.perform(get("/api/visits/" + patientId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

}
