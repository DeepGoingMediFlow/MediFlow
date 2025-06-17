package kr.bigdata.web.service;

import java.time.LocalDateTime;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import jakarta.transaction.Transactional;
import kr.bigdata.web.dto.BedStatusDto;
import kr.bigdata.web.entity.AiPrediction;
import kr.bigdata.web.entity.AvailableBeds;
import kr.bigdata.web.entity.BedInfo;
import kr.bigdata.web.entity.EmergencyVisit;
import kr.bigdata.web.entity.MedicalHistory;
import kr.bigdata.web.repository.AiPredictionRepository;
import kr.bigdata.web.repository.AvailableBedsRepository;
import kr.bigdata.web.repository.BedInfoRepository;
import kr.bigdata.web.repository.EmergencyVisitRepository;
import kr.bigdata.web.repository.MedicalHistoryRepository;

@Service
public class EmergencyVisitService {

	@Autowired
	private EmergencyVisitRepository emergencyVisitRepository;

	@Autowired
	private MedicalHistoryRepository medicalHistoryRepository;

	// 전체 병동 병상
	@Autowired
	private AiPredictionRepository aiPredictionRepository;

	// 전체 병동 병상
	@Autowired
	private AvailableBedsRepository availableBedsRepository;

	// 응급실 병상
	@Autowired
	private BedInfoRepository bedInfoRepository;

	// 응급실 침대 occupied
	private void occupyERBed(String bedNumber) {
        if (bedNumber != null && !bedNumber.isEmpty()) {
            bedInfoRepository.findByBedNumber(bedNumber).ifPresent(bed -> {
                bed.setStatus("OCCUPIED");
                bedInfoRepository.save(bed);
			});
		}
	}

	// 응급실 침대 available
	private void releaseERBed(String bedNumber) {
        if (bedNumber != null && !bedNumber.isEmpty()) {
            bedInfoRepository.findByBedNumber(bedNumber).ifPresent(bed -> {
                bed.setStatus("AVAILABLE");
                bedInfoRepository.save(bed);
			});
		}
	}

	// 2차 예측
	@Transactional
	public void finalizeDisposition(String visitId, Integer disposition, String reason) {
		// 1. EMERGENCY_VISIT 테이블에서 방문 정보 찾기
		Optional<EmergencyVisit> optVisit = emergencyVisitRepository.findById(visitId);
		if (!optVisit.isPresent()) {
			throw new IllegalArgumentException("방문 정보를 찾을 수 없습니다: " + visitId);
		}
		EmergencyVisit visit = optVisit.get();

		 // 퇴실시간 저장 + 침대 해제
        if (disposition != null && disposition == 0) {
            String bedNumber = visit.getBedNumber();
            if (bedNumber != null && !bedNumber.isEmpty()) {
                releaseERBed(bedNumber);
                visit.setBedNumber(null); // 배정 해제!
            }
            visit.setDischargeTime(LocalDateTime.now());
        }

		// 일반/ICU 배치 때 available_beds 감소
		if (disposition != null && (disposition == 1 || disposition == 2)) {
			String wardType = (disposition == 1) ? "WARD" : "ICU";
			AvailableBeds beds = availableBedsRepository.findTopByWardTypeOrderByUpdatedTimeDesc(wardType);
			if (beds != null && beds.getAvailableCount() > 0) {
				beds.setAvailableCount(beds.getAvailableCount() - 1);
				beds.setUpdatedTime(LocalDateTime.now());
				availableBedsRepository.save(beds);
			}
		}

		// DB 저장
		emergencyVisitRepository.save(visit);

		// 4. MedicalHistory 테이블 content에 resaon 저장
		if (reason != null && !reason.trim().isEmpty()) {
			MedicalHistory history = new MedicalHistory();
			history.setVisitId(visitId);
			history.setContent("[최종 배치 사유] " + reason);
			// 로그인 사용자 아이디 기록
			String currentUserId = SecurityContextHolder.getContext().getAuthentication().getName();
			history.setUserId(currentUserId);
			medicalHistoryRepository.save(history);
		}
	}

	// 병동 병상 정보 조회
	 public BedStatusDto getAvailableBedInfoForVisit(String visitId) {
	        Optional<AiPrediction> predOpt = aiPredictionRepository
	                .findTopByEmergencyVisit_VisitIdAndPreTypeOrderByPreTimeDesc(visitId, "DISCHARGE");

	        if (!predOpt.isPresent()) {
			// 예측 결과 자체가 없음(정보 없음)
			return null;
		}

		AiPrediction pred = predOpt.get();
		int dispo = pred.getPreDisposition();

		// 일반/ICU만 병상 제공, 그 외는 null 반환
		// 프론트는 병상 관련 UI 자체를 숨기거나 "정보 없음"으로 표시해주세요!
		String wardType;
		if (dispo == 1) {
			wardType = "WARD";
		} else if (dispo == 2) {
			wardType = "ICU";
		} else {
			// 퇴원, 귀가, 기타 disposition: 아예 정보 없음
			return null;
		}

		AvailableBeds bed = availableBedsRepository.findTopByWardTypeOrderByUpdatedTimeDesc(wardType);

		if (bed == null)
			return new BedStatusDto(wardType, null, null);

		return new BedStatusDto(wardType, bed.getAvailableCount(), bed.getTotalBeds());
	}

	// 최종 배치
	@Transactional
	public void updateDisposition(String visitId, Integer disposition, String reason) {

		// 1. 파라미터 확인
		System.out.println("=== updateDisposition 호출됨 ===");
		System.out.println("visitId: " + visitId + ", disposition: " + disposition);

		Optional<EmergencyVisit> optVisit = emergencyVisitRepository.findById(visitId);
		if (!optVisit.isPresent()) {
			throw new IllegalArgumentException("방문 정보를 찾을 수 없습니다: " + visitId);
		}
		EmergencyVisit visit = optVisit.get();
		Integer prevDisposition = visit.getFinalDisposition();

		// 최종 배치 수정 status -> discharged로 변경
		visit.setStatus("DISCHARGED");
		
		 // 응급실 침대 available
        if (disposition != null && disposition == 0) {
            String bedNumber = visit.getBedNumber();
            if (bedNumber != null && !bedNumber.isEmpty()) {
                releaseERBed(bedNumber);
                visit.setBedNumber(null); // 배정 해제!
            }
            visit.setDischargeTime(LocalDateTime.now());
        }

		// 응급실 침대 occupied
		if (disposition != null && (disposition == 1 || disposition == 2)) {
			occupyERBed(visit.getBedNumber());
		}


		// 전체 병동 병상 복구(+1)
		if (prevDisposition != null && (prevDisposition == 1 || prevDisposition == 2)) {
			String wardType = (prevDisposition == 1) ? "WARD" : "ICU";
			AvailableBeds beds = availableBedsRepository.findTopByWardTypeOrderByUpdatedTimeDesc(wardType);
			if (beds != null) {
				beds.setAvailableCount(beds.getAvailableCount() + 1);
				beds.setUpdatedTime(LocalDateTime.now());
				availableBedsRepository.save(beds);
			}
		}

		// 신규 배치시 전체 병동 가용병상 -1
		if (disposition != null && (disposition == 1 || disposition == 2)) {
			String wardType = (disposition == 1) ? "WARD" : "ICU";
			AvailableBeds beds = availableBedsRepository.findTopByWardTypeOrderByUpdatedTimeDesc(wardType);
			// 음수 방지, available_count가 1 이상일 때만 감소
			if (beds != null && beds.getAvailableCount() > 0) {
				System.out.println("감소 전: " + beds.getAvailableCount());
				beds.setAvailableCount(beds.getAvailableCount() - 1); // 자동 -1
				System.out.println("감소 후: " + beds.getAvailableCount());
				beds.setUpdatedTime(LocalDateTime.now());
				availableBedsRepository.save(beds);
				System.out.println("SAVE 직후 availableCount: " + beds.getAvailableCount());
			}
		}

		// 2. setFinalDisposition 앞뒤에 로그!
		System.out.println("직전 finalDisposition: " + visit.getFinalDisposition());
		visit.setFinalDisposition(disposition);
		System.out.println("변경 후 finalDisposition: " + visit.getFinalDisposition());

		// 퇴실시간 저장
		if (disposition != null && disposition == 0) {
			visit.setDischargeTime(LocalDateTime.now());
		}

		emergencyVisitRepository.save(visit);
		System.out.println("emergencyVisitRepository.save(visit) 호출 완료!");
		// 4. save 호출 후 로그!

		// MedicalHistory 이력
		String log = String.format("[최종 배치 수정] 이전:%s → 변경:%s. 사유:%s", prevDisposition, disposition, reason);
		MedicalHistory history = new MedicalHistory();
		history.setVisitId(visitId);
		history.setContent(log);

		String currentUserId = SecurityContextHolder.getContext().getAuthentication().getName();

		history.setUserId(currentUserId);
		medicalHistoryRepository.save(history);
	}

	// 최종 배치 삭제
	@Transactional
	public void deleteDisposition(String visitId) {
		Optional<EmergencyVisit> optVisit = emergencyVisitRepository.findById(visitId);
		if (!optVisit.isPresent()) {
			throw new IllegalArgumentException("방문 정보를 찾을 수 없습니다: " + visitId);
		}
		EmergencyVisit visit = optVisit.get();
		Integer prevDisposition = visit.getFinalDisposition();

		// 기존 병동 배치 복구
		if (prevDisposition != null && (prevDisposition == 1 || prevDisposition == 2)) {
			String wardType = (prevDisposition == 1) ? "WARD" : "ICU";
			AvailableBeds beds = availableBedsRepository.findTopByWardTypeOrderByUpdatedTimeDesc(wardType);
			if (beds != null) {
				beds.setAvailableCount(beds.getAvailableCount() + 1);
				beds.setUpdatedTime(LocalDateTime.now());
				availableBedsRepository.save(beds);
			}
		}
		visit.setFinalDisposition(null); // 초기화
		emergencyVisitRepository.save(visit);

		// MedicalHistory 이력
		MedicalHistory history = new MedicalHistory();
		history.setVisitId(visitId);
		history.setContent("[최종 배치 삭제] 이전:" + prevDisposition);

		String currentUserId = SecurityContextHolder.getContext().getAuthentication().getName();

		history.setUserId(currentUserId);
		medicalHistoryRepository.save(history);
	}

}