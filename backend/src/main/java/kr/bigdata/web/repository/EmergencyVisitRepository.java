package kr.bigdata.web.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import kr.bigdata.web.dto.VisitSummaryDto;
import kr.bigdata.web.entity.EmergencyVisit;

public interface EmergencyVisitRepository extends JpaRepository<EmergencyVisit, String> {

    // 환자별 마지막 방문 1건 (최신 입실 기준)
    Optional<EmergencyVisit> findTopByPatient_PatientIdOrderByAdmissionTimeDesc(String patientId);

    // 환자별 모든 방문, 최신순
    List<EmergencyVisit> findByPatient_PatientIdOrderByAdmissionTimeDesc(String patientId);

    // 환자별 방문 리스트 요약 (VisitSummaryDto로 반환)
    @Query("SELECT new kr.bigdata.web.dto.VisitSummaryDto(" +
           "e.visitId, e.admissionTime, e.bedNumber, e.acuity, e.pain, e.chiefComplaint, e.arrivalTransport, e.status) " +
           "FROM EmergencyVisit e " +
           "WHERE e.patient.patientId = :patientId " +
           "ORDER BY e.admissionTime DESC")
    List<VisitSummaryDto> findVisitSummariesByPatientId(@Param("patientId") String patientId);
}
