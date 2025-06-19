package kr.bigdata.web.service;

import java.time.LocalDateTime;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import jakarta.transaction.Transactional;
import kr.bigdata.web.entity.AvailableBeds;
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

	// 최종 배치
	@Transactional
	public void finalizeDisposition(String visitId, Integer disposition, String reason) {
		// 1. EMERGENCY_VISIT 테이블에서 방문 정보 찾기
		Optional<EmergencyVisit> optVisit = emergencyVisitRepository.findById(visitId);
		if (!optVisit.isPresent()) {
			throw new IllegalArgumentException("방문 정보를 찾을 수 없습니다: " + visitId);
		}
		EmergencyVisit visit = optVisit.get();

		// 2. final_disposition 설정 (모든 경우에 대해)
		visit.setFinalDisposition(disposition);

		// 3. 퇴실시간 저장 + 침대 해제 (모든 배치 확정시)
		if (disposition != null && (disposition == 0 || disposition == 1 || disposition == 2)) {
			String bedNumber = visit.getBedNumber();
			visit.setDischargeTime(LocalDateTime.now());

			if (bedNumber != null && !bedNumber.isEmpty()) {
				releaseERBed(bedNumber);
				visit.setBedNumber(null); // 배정 해제!
			}
		}

		// 4. 일반/ICU 배치 때 available_beds 감소
		if (disposition != null && (disposition == 1 || disposition == 2)) {
			String wardType = (disposition == 1) ? "WARD" : "ICU";
			AvailableBeds beds = availableBedsRepository.findTopByWardTypeOrderByUpdatedTimeDesc(wardType);
			if (beds != null && beds.getAvailableCount() > 0) {
				beds.setAvailableCount(beds.getAvailableCount() - 1);
				beds.setUpdatedTime(LocalDateTime.now());
				availableBedsRepository.save(beds);
			}
		}

		// 5. 상태를 DISCHARGED로 변경
		visit.setStatus("DISCHARGED");

		// 6. DB 저장
		emergencyVisitRepository.save(visit);

		// 7. MedicalHistory 테이블 content에 reason 저장
		if (reason != null && !reason.trim().isEmpty()) {
			MedicalHistory history = new MedicalHistory();
			history.setVisitId(visitId);
			history.setContent("[최종 배치] " + reason);
			// 로그인 사용자 아이디 기록
			String currentUserId = SecurityContextHolder.getContext().getAuthentication().getName();
			history.setUserId(currentUserId);
			medicalHistoryRepository.save(history);
		}
	}

	// 최종 배치 수정
	@Transactional
	public void updateDisposition(String visitId, Integer disposition, String reason) {

		// 파라미터 확인
		System.out.println("=== updateDisposition 호출됨 ===");
		System.out.println("visitId: " + visitId + ", disposition: " + disposition + ", reason: " + reason);

		Optional<EmergencyVisit> optVisit = emergencyVisitRepository.findById(visitId);
		if (!optVisit.isPresent()) {
			throw new IllegalArgumentException("방문 정보를 찾을 수 없습니다: " + visitId);
		}
		EmergencyVisit visit = optVisit.get();
		Integer prevDisposition = visit.getFinalDisposition();

		// 최종 배치 수정 status -> discharged로 변경
		visit.setStatus("DISCHARGED");

		// 응급실 침대 처리 - 퇴실/전원/사망시에만 침대 해제
		if (disposition != null && (disposition == 0 || disposition == 1 || disposition == 2)) {
			String bedNumber = visit.getBedNumber();
			visit.setDischargeTime(LocalDateTime.now());

			if (bedNumber != null && !bedNumber.isEmpty()) {
				releaseERBed(bedNumber);
				visit.setBedNumber(null); // 배정 해제
				System.out.println("응급실 침대 해제: " + bedNumber);
			}
		}

		// 일반병동/ICU 입원시 해당 병동 가용병상 감소
		if (disposition != null && (disposition == 1 || disposition == 2)) {
			String wardType = (disposition == 1) ? "WARD" : "ICU";
			AvailableBeds beds = availableBedsRepository.findTopByWardTypeOrderByUpdatedTimeDesc(wardType);

			// 음수 방지, available_count가 1 이상일 때만 감소
			if (beds != null && beds.getAvailableCount() > 0) {
				System.out.println(wardType + " 병상 수 감소 전: " + beds.getAvailableCount());
				beds.setAvailableCount(beds.getAvailableCount() - 1);
				System.out.println(wardType + " 병상 수 감소 후: " + beds.getAvailableCount());
				beds.setUpdatedTime(LocalDateTime.now());
				availableBedsRepository.save(beds);
			} else {
				System.out.println(wardType + " 가용 병상이 없습니다.");
			}
		}

		// finalDisposition 설정
		System.out.println("변경 전 finalDisposition: " + visit.getFinalDisposition());
		visit.setFinalDisposition(disposition);
		System.out.println("변경 후 finalDisposition: " + visit.getFinalDisposition());

		// 방문 정보 저장
		emergencyVisitRepository.save(visit);
		System.out.println("emergencyVisitRepository.save(visit) 완료!");

		// MedicalHistory 이력 저장
		if (reason != null && !reason.trim().isEmpty()) {
			MedicalHistory history = new MedicalHistory();
			history.setVisitId(visitId);

			// 이전 배치와 현재 배치 정보를 포함한 로그
			String dispositionText = getDispositionText(disposition);
			String prevDispositionText = getDispositionText(prevDisposition);
			history.setContent("[최종 배치 수정] " + reason);

			// 로그인 사용자 아이디 기록
			String currentUserId = SecurityContextHolder.getContext().getAuthentication().getName();
			history.setUserId(currentUserId);
			medicalHistoryRepository.save(history);

			System.out.println("MedicalHistory 저장 완료: " + reason);
		}
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
		history.setContent("이전:" + prevDisposition);

		String currentUserId = SecurityContextHolder.getContext().getAuthentication().getName();

		history.setUserId(currentUserId);
		medicalHistoryRepository.save(history);
	}

	// disposition 코드를 텍스트로 변환하는 헬퍼 메서드
	private String getDispositionText(Integer disposition) {
		if (disposition == null)
			return "미정";
		switch (disposition) {
		case 0:
			return "퇴실";
		case 1:
			return "일반병동 입원";
		case 2:
			return "중환자실 입원";
		default:
			return "알 수 없음(" + disposition + ")";
		}
	}

}