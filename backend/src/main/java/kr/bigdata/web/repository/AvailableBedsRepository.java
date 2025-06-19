package kr.bigdata.web.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import kr.bigdata.web.entity.AvailableBeds;

@Repository
public interface AvailableBedsRepository extends JpaRepository<AvailableBeds, Long> {
    
	// 특정 병동 타입의 최신 데이터 1건
    AvailableBeds findTopByWardTypeOrderByUpdatedTimeDesc(String wardType);

    // 모든 병동의 최신 데이터
    @Query("SELECT a FROM AvailableBeds a WHERE a.recordId IN " +
            "(SELECT MAX(b.recordId) FROM AvailableBeds b GROUP BY b.wardType)")
     List<AvailableBeds> findLatestBeds();
}

