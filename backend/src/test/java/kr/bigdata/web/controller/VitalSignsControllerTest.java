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
public class VitalSignsControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void testGetVitalsByVisitId_shouldReturnVitalList() throws Exception {
        String validVisitId = "10001401"; // ✅ 실제 존재하는 visitId로 바꿔줘야 함!

        mockMvc.perform(get("/api/visits/" + validVisitId + "/vitals"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray()) // 결과가 배열인지 확인
        		.andExpect(jsonPath("$.length()").value(0)) // 결과 배열길이 확인
		        .andDo(result -> {
		            System.out.println("응답 본문: " + result.getResponse().getContentAsString());
		        });
    }
}
