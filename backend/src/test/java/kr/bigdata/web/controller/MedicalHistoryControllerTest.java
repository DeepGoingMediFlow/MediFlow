package kr.bigdata.web.controller;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

import jakarta.transaction.Transactional;

import org.springframework.http.MediaType;


import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
public class MedicalHistoryControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void testAddHistory_shouldSucceed() throws Exception {
        String validVisitId = "38405263"; // 실제 존재하는 visitId로 바꿔줘
        String json = """
            {
                "content": "환자 상태가 안정적이며 추가 처치 필요 없음"
            }
            """;

        mockMvc.perform(post("/api/visits/" + validVisitId + "/history")
                .contentType(MediaType.APPLICATION_JSON)
                .content(json))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content").value("환자 상태가 안정적이며 추가 처치 필요 없음"));
    }

    @Test
    void testUpdateHistory_shouldSucceed() throws Exception {
        Long historyId = 6L; // 실제 존재하는 ID로 바꿔야 함
        String json = """
            {
                "content": "수정된 내용입니다"
            }
            """;

        mockMvc.perform(put("/api/history/" + historyId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content").value("수정된 내용입니다"));
    }


    @Test
    void testDeleteHistory_shouldSucceed() throws Exception {
        Long historyId = 6L; // 삭제 가능한 실제 ID

        mockMvc.perform(delete("/api/history/" + historyId))
            .andExpect(status().isOk());
    }

}
