package kr.bigdata.web.config;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.util.List;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import kr.bigdata.web.service.CustomUserDetailsService.CustomUserPrincipal;

@TestConfiguration
public class MockServiceConfig {

	@Bean
	AuthenticationManager authenticationManager() {
	    AuthenticationManager mock = mock(AuthenticationManager.class);

	    CustomUserPrincipal principal = new CustomUserPrincipal(
	        "admin",
	        "1234",
	        "관리자",
	        "ADMIN",
	        List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))
	    );

	    Authentication auth = new UsernamePasswordAuthenticationToken(
	        principal,
	        principal.getPassword(),
	        principal.getAuthorities()
	    );

	    when(mock.authenticate(any())).thenAnswer(invocation -> {
	        UsernamePasswordAuthenticationToken token = invocation.getArgument(0);
	        
	        System.out.println("받은 인증 요청: " + token.getName() + " / " + token.getCredentials());
	        
	        if ("admin".equals(token.getName())) {
	            return auth;
	        } else {
	            throw new RuntimeException("인증 실패");
	        }
	    });

	    return mock;
	}

}
