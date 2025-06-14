package kr.bigdata.web.controller;

import jakarta.transaction.Transactional;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional  // 테스트 후 자동 롤백
public class PatientControllerTest {

    @Autowired
    private MockMvc mockMvc;

    // 1. 환자 상세 정보 정상 조회 테스트
    @Test
    void testGetPatientDetail_shouldReturnPatientInfo() throws Exception {
        String validPatientId = "10001401"; // ✅ 실제 존재하는 환자 ID

        mockMvc.perform(get("/api/patients/" + validPatientId))
                .andDo(result -> {
                    System.out.println("응답 상태: " + result.getResponse().getStatus());
                    System.out.println("응답 본문: " + result.getResponse().getContentAsString());
                })
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.patientId").value(validPatientId));
    }


    // 2. 환자의 방문이력 정상 조회 테스트
    @Test
    void testGetPatientVisitHistory_shouldReturnVisitList() throws Exception {
        String validPatientId = "10001401"; // ✅ 실제 존재하는 환자 ID

        mockMvc.perform(get("/api/patients/" + validPatientId + "/visits"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }
    
}
