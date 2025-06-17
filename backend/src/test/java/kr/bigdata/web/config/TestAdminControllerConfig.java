package kr.bigdata.web.config;

import kr.bigdata.web.service.AdminService;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;

import static org.mockito.Mockito.*;

@TestConfiguration
public class TestAdminControllerConfig {

    @Bean
    public AdminService adminService() {
        return mock(AdminService.class);  // 테스트용 mock 서비스
    }
}
