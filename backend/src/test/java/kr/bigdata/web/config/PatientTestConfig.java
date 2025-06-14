package kr.bigdata.web.config;

import kr.bigdata.web.controller.PatientController;
import kr.bigdata.web.repository.EmergencyVisitRepository;
import kr.bigdata.web.repository.PatientRepository;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;

@TestConfiguration
public class PatientTestConfig {

    @Bean
    public PatientController patientController(PatientRepository patientRepository,
                                               EmergencyVisitRepository emergencyVisitRepository) {
        return new PatientController(patientRepository, emergencyVisitRepository);
    }
}
