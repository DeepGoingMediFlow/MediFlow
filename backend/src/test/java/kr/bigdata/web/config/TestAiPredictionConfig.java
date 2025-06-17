package kr.bigdata.web.config;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;

import static org.mockito.Mockito.*;

import kr.bigdata.web.service.AiPredictionService;

@TestConfiguration
public class TestAiPredictionConfig {

    @Bean
    public AiPredictionService aiPredictionService() {
        return mock(AiPredictionService.class);  // 외부 FastAPI 등 호출 막기
    }
}
