package kr.bigdata.web.controller;

import kr.bigdata.web.config.TestSecurityConfig;
import kr.bigdata.web.service.AdminService;
import kr.bigdata.web.dto.UserDto;

import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.http.MediaType;

import java.util.List;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Import(TestSecurityConfig.class) 
public class AdminControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private AdminService adminService;

    @Test
    void testGetUsers_ShouldReturnOk() throws Exception {
        Mockito.when(adminService.getAllUsers()).thenReturn(List.of());

        mockMvc.perform(get("/api/admin/users")) 
        	.andExpect(status().isOk());
    }
}
