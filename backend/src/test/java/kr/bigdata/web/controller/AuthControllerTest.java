package kr.bigdata.web.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import kr.bigdata.web.dto.LoginRequest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
public class AuthControllerTest {
// tdd ㄹㅇ마지막테스트할라고 주석넣음
    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    @DisplayName("✅ doctor01 로그인 성공 테스트")
    void testLoginSuccess() throws Exception {
        // 🔐 평문 그대로 전달
        LoginRequest request = new LoginRequest();
        request.setUserId("doctor01");
        request.setPassword("1234");

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.username").value("doctor01"))
            .andExpect(jsonPath("$.userName", containsString("김민주")))
            .andExpect(jsonPath("$.userRole").value("의사"));
    }
}
