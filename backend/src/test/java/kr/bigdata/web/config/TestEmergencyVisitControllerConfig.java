package kr.bigdata.web.config;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;

import kr.bigdata.web.service.EmergencyVisitService;

import static org.mockito.Mockito.*;

@TestConfiguration
public class TestEmergencyVisitControllerConfig {

    @Bean
    public EmergencyVisitService emergencyVisitService() {
        return mock(EmergencyVisitService.class); // Mockito를 직접 활용
    }
}
