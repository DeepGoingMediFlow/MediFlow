package kr.bigdata.web.dto;

import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonFormat;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class PatientSummaryDto {
    private String pid;
    private String name;
    private Integer age;
    private Integer gender;
    private String bed;
    private Integer acuity;
    private String chiefComplaint;
    private String visitId;
    private Integer label;
    private String labelSource;
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime admissionTime;

    // 기존 생성자 (하위 호환성 유지)
    public PatientSummaryDto(String pid, String name, Integer age, Integer gender, String bed, Integer acuity,
                           String chiefComplaint, Integer finalDisposition, String visitId) {
        this.pid = pid;
        this.name = name;
        this.age = age;
        this.gender = gender;
        this.bed = bed;
        this.acuity = acuity;
        this.chiefComplaint = chiefComplaint;
        this.visitId = visitId;
        this.label = finalDisposition;
        this.labelSource = "FINAL";
        this.admissionTime = null; // 기본값
    }

    // 안전한 형변환을 포함한 생성자
    public PatientSummaryDto(String pid, String name, Object age, Object gender, String bed, Object acuity,
                           String chiefComplaint, String visitId, Object label, String labelSource, Object admissionTime) {
        this.pid = pid;
        this.name = name;
        this.age = convertToInteger(age);
        this.gender = convertToInteger(gender);
        this.bed = bed;
        this.acuity = convertToInteger(acuity);
        this.chiefComplaint = chiefComplaint;
        this.visitId = visitId;
        this.label = convertToInteger(label);
        this.labelSource = labelSource;
        this.admissionTime = convertToLocalDateTime(admissionTime);
    }

    // 안전한 형변환 헬퍼 메서드
    private Integer convertToInteger(Object value) {
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

    // LocalDateTime 변환 헬퍼 메서드
    private LocalDateTime convertToLocalDateTime(Object value) {
        if (value == null) return null;
        if (value instanceof LocalDateTime) return (LocalDateTime) value;
        if (value instanceof java.sql.Timestamp) {
            return ((java.sql.Timestamp) value).toLocalDateTime();
        }
        // 필요에 따라 다른 타입 변환 추가 가능
        return null;
    }
}
