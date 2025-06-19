package kr.bigdata.web.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import kr.bigdata.web.entity.VitalSigns;

public interface VitalSignsRepository extends JpaRepository<VitalSigns, Long> {

    // 기록시각 내림차순
	List<VitalSigns> findByVisitIdOrderByRecordTimeDesc(String visitId);

}