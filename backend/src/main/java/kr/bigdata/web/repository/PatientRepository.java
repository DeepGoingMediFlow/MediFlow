package kr.bigdata.web.repository;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import kr.bigdata.web.dto.PatientSummaryDto;
import kr.bigdata.web.entity.Patient;

@Repository
public interface PatientRepository extends JpaRepository<Patient, String> {

	// 환자 목록 조회
	@Query(value = """
	    SELECT
	        p.PATIENT_ID as pid,
	        p.PATIENT_NAME as name,
	        CAST(p.AGE as SIGNED) as age,
	        CAST(p.GENDER as SIGNED) as gender,
	        ev.BED_NUMBER as bed,
	        CAST(ev.ACUITY as SIGNED) as acuity,
	        ev.CHIEF_COMPLAINT as chiefComplaint,
	        ev.VISIT_ID as visitId,
	        CAST(CASE
	            WHEN ev.FINAL_DISPOSITION IS NOT NULL THEN ev.FINAL_DISPOSITION
	            WHEN discharge_pred.PRE_DISPOSITION IS NOT NULL THEN discharge_pred.PRE_DISPOSITION
	            WHEN admission_pred.PRE_DISPOSITION IS NOT NULL THEN admission_pred.PRE_DISPOSITION
	        END as SIGNED) as label,
	        CASE
	            WHEN ev.FINAL_DISPOSITION IS NOT NULL THEN 'FINAL'
	            WHEN discharge_pred.PRE_DISPOSITION IS NOT NULL THEN 'DISCHARGE'
	            WHEN admission_pred.PRE_DISPOSITION IS NOT NULL THEN 'ADMISSION'
	            ELSE 'NONE'
	        END as labelSource,
	        ev.ADMISSION_TIME as admissionTime
	    FROM patient p
	    INNER JOIN emergency_visit ev ON p.PATIENT_ID = ev.PATIENT_ID
	    LEFT JOIN (
	        SELECT VISIT_ID, PRE_DISPOSITION
	        FROM ai_prediction
	        WHERE PRE_TYPE = 'ADMISSION'
	    ) admission_pred ON ev.VISIT_ID = admission_pred.VISIT_ID
	    LEFT JOIN (
	        SELECT VISIT_ID, PRE_DISPOSITION
	        FROM ai_prediction
	        WHERE PRE_TYPE = 'DISCHARGE'
	    ) discharge_pred ON ev.VISIT_ID = discharge_pred.VISIT_ID
	    WHERE ev.STATUS = 'ADMITTED'
	    ORDER BY
	        ev.ADMISSION_TIME ASC
	    """, nativeQuery = true)
	List<Object[]> findCurrentlyAdmittedPatientsWithPredictions();

	// Object[] 결과를 DTO로 변환하는 default 메서드
	default List<PatientSummaryDto> findCurrentlyAdmittedPatients() {
	    List<Object[]> results = findCurrentlyAdmittedPatientsWithPredictions();
	    return results.stream().map(row -> {
	        Integer age = convertToInteger(row[2]);
	        Integer gender = convertToInteger(row[3]);
	        Integer acuity = convertToInteger(row[5]);
	        Integer label = convertToInteger(row[8]);

	        return new PatientSummaryDto(
	            (String) row[0],  // pid
	            (String) row[1],  // name
	            age,              // age
	            gender,           // gender
	            (String) row[4],  // bed
	            acuity,           // acuity
	            (String) row[6],  // chiefComplaint
	            (String) row[7],  // visitId
	            label,            // label
	            (String) row[9],  // labelSource
	            row[10]           // admissionTime
	        );
	    }).collect(Collectors.toList());
	}

	// 안전한 형변환 헬퍼 메서드
	default Integer convertToInteger(Object value) {
	    if (value == null) return null;
	    if (value instanceof Integer) return (Integer) value;
	    if (value instanceof Boolean) return ((Boolean) value) ? 1 : 0;
	    if (value instanceof Number) return ((Number) value).intValue();
	    if (value instanceof String) {
	        try {
	            return Integer.parseInt((String) value);
	        } catch (NumberFormatException e) {
	            return null;
	        }
	    }
	    return null;
	}
	
    // 환자 검색 (이름, PID)
    @Query("""
        SELECT new kr.bigdata.web.dto.PatientSummaryDto(
            p.patientId, p.patientName, p.age, p.gender,
            e.bedNumber, e.acuity, e.chiefComplaint, e.finalDisposition, e.visitId
        )
        FROM EmergencyVisit e
        JOIN e.patient p
        WHERE e.status = 'ADMITTED'
        AND (LOWER(p.patientName) LIKE %:keyword% OR LOWER(p.patientId) LIKE %:keyword%)
        """)
    List<PatientSummaryDto> searchByPatientIdOrName(@Param("keyword") String keyword);
}