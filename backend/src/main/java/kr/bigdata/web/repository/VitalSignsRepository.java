package kr.bigdata.web.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import kr.bigdata.web.entity.VitalSigns;

public interface VitalSignsRepository extends JpaRepository<VitalSigns, Long> {
    List<VitalSigns> findByVisitIdOrderByRecordTimeDesc(String visitId); // 기록시각 내림차순
}