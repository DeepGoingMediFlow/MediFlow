package kr.bigdata.web.repository;

import java.time.LocalDateTime;
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
	@Query("SELECT new kr.bigdata.web.dto.VisitSummaryDto("
			+ "e.visitId, e.admissionTime, e.bedNumber, e.acuity, e.pain, e.chiefComplaint, e.arrivalTransport, e.status) "
			+ "FROM EmergencyVisit e " 
			+ "WHERE e.patient.patientId = :patientId " 
			+ "ORDER BY e.admissionTime DESC")
	List<VisitSummaryDto> findVisitSummariesByPatientId(@Param("patientId") String patientId);

	// 일별 Final Disposition 통계 조회
	@Query(value = "SELECT " + "DATE(ev.DISCHARGE_TIME) as discharge_date, " + "ev.FINAL_DISPOSITION, "
			+ "COUNT(*) as patient_count " + "FROM emergency_visit ev "
			+ "WHERE ev.DISCHARGE_TIME BETWEEN :startDate AND :endDate " + "AND ev.FINAL_DISPOSITION IS NOT NULL "
			+ "GROUP BY DATE(ev.DISCHARGE_TIME), ev.FINAL_DISPOSITION "
			+ "ORDER BY discharge_date, ev.FINAL_DISPOSITION", nativeQuery = true)
	List<Object[]> findDailyDispositionStats(@Param("startDate") LocalDateTime startDate,
			@Param("endDate") LocalDateTime endDate);

	// 현재 주 요일별 Final Disposition 통계 조회 (실시간 데이터용)
	@Query(value = "SELECT " + "DAYOFWEEK(ev.DISCHARGE_TIME) as day_of_week, " + "ev.FINAL_DISPOSITION, "
			+ "COUNT(*) as patient_count " + "FROM emergency_visit ev "
			+ "WHERE YEARWEEK(ev.DISCHARGE_TIME, 1) = YEARWEEK(CURDATE(), 1) " + "AND ev.FINAL_DISPOSITION IS NOT NULL "
			+ "GROUP BY DAYOFWEEK(ev.DISCHARGE_TIME), ev.FINAL_DISPOSITION "
			+ "ORDER BY day_of_week, ev.FINAL_DISPOSITION", nativeQuery = true)
	List<Object[]> findCurrentWeekDispositionStats();
}
