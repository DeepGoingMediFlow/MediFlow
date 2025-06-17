package kr.bigdata.web.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import kr.bigdata.web.config.TestAdminControllerConfig;
import kr.bigdata.web.service.AdminService;
import kr.bigdata.web.dto.UserDto;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Import(TestAdminControllerConfig.class)  // ✅ mock 구성 등록
public class AdminControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private AdminService adminService;  // ✅ 위에서 mock() 등록한 인스턴스 주입됨

    @Test
    void testGetUsers_ShouldReturnOk() throws Exception {
        when(adminService.getAllUsers()).thenReturn(List.of());

        mockMvc.perform(get("/api/admin/users"))
               .andExpect(status().isOk());
    }
}
