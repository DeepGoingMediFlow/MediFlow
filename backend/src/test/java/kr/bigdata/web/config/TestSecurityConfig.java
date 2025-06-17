package kr.bigdata.web.config;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;

@TestConfiguration
public class TestSecurityConfig {

    @Bean
    @Primary
    public SecurityFilterChain testSecurityFilterChain(HttpSecurity http) throws Exception {
        // 🎯 특정 URL만 테스트용 필터로 매칭되도록 제한
        http.securityMatcher("/**")  // 모든 경로에 대해 테스트용 필터를 먼저 적용
            .csrf().disable()
            .authorizeHttpRequests()
            .anyRequest().permitAll();

        return http.build();
    }
}
