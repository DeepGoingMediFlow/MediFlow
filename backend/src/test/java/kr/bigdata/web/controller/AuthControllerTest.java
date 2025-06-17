package kr.bigdata.web.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.web.servlet.MockMvc;

import com.fasterxml.jackson.databind.ObjectMapper;

import kr.bigdata.web.dto.UserDto;
import kr.bigdata.web.service.CustomUserDetailsService.CustomUserPrincipal;

@SpringBootTest
@AutoConfigureMockMvc
public class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;
    
    @MockBean
    private AuthenticationManager authenticationManager;

    @Test
    @DisplayName("로그인 성공 테스트")
    void loginSuccess() throws Exception {
        when(authenticationManager.authenticate(any()))
            .thenReturn(new UsernamePasswordAuthenticationToken(
                new CustomUserPrincipal("admin", "1234", "관리자", "ADMIN",
                    List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))),
                "1234",
                List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))
            ));

        LoginRequest loginDto = new LoginRequest("admin", "1234");
        String loginJson = objectMapper.writeValueAsString(loginDto);

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(loginJson))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.username").value("admin"))
            .andExpect(jsonPath("$.userRole").value("ADMIN"));
    }


    @Test
    @DisplayName("로그인 실패 테스트")
    void loginFail() throws Exception {
    	LoginRequest loginDto = new LoginRequest("admin", "wrong");
        loginDto.setUserId("admin");
        loginDto.setPassword("wrong");

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginDto)))
            .andExpect(status().isUnauthorized());
    }
}
