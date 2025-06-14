package kr.bigdata.web.controller;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
public class LabResultsControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void testGetAbnormalLabs_shouldSucceed() throws Exception {
        // 이 visitId는 DB에 실제로 있는 값이어야 해!
        String realVisitId = "30475246"; // 

        mockMvc.perform(get("/api/visits/" + realVisitId + "/labs/abnormal"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$").isArray());
    }
}
