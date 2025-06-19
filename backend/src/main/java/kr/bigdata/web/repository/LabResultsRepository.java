package kr.bigdata.web.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import kr.bigdata.web.entity.LabResults;

public interface LabResultsRepository extends JpaRepository<LabResults, Long> {

	List<LabResults> findAllByVisitId(String visitId); // 전체 불러오기
    List<LabResults> findByVisitIdOrderByLabTimeDesc(String visitId); // 검사시각 내림차순

}