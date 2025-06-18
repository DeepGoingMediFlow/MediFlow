package kr.bigdata.web.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import kr.bigdata.web.dto.AiPredictionResponseDto;
import kr.bigdata.web.dto.LLMResult;
import kr.bigdata.web.dto.LLMResultWrapper;
import kr.bigdata.web.dto.PatientRequest;
import kr.bigdata.web.entity.AiPrediction;
import kr.bigdata.web.entity.AvailableBeds;
import kr.bigdata.web.entity.EmergencyVisit;
import kr.bigdata.web.entity.LabResults;
import kr.bigdata.web.entity.Patient;
import kr.bigdata.web.repository.AiPredictionRepository;
import kr.bigdata.web.repository.AvailableBedsRepository;
import kr.bigdata.web.repository.EmergencyVisitRepository;
import kr.bigdata.web.repository.LabResultsRepository;

@Service
public class AiPredictionService {
	


	@Autowired
	private RestTemplate restTemplate;
	@Autowired
	private EmergencyVisitRepository emergencyVisitRepository;
	@Autowired
	private AiPredictionRepository aiPredictionRepository;
	@Autowired
	private LLMService llmService;
	@Autowired
	private LabResultsRepository labResultsRepository; 
	 // 병상 정보용 레포지토리
    @Autowired
    private AvailableBedsRepository availableBedsRepository;

	// ai_prediction 테이블 값 덮어쓰기 공통 함수
	public AiPrediction saveOrUpdatePrediction(EmergencyVisit visit, String preType, int preDisposition, int preScore,
			String reason) {
		
		preType = preType.toLowerCase(); // ← 항상 소문자!

		// 1. 기존 예측 결과 있는지 확인
		AiPrediction existing = aiPredictionRepository
				.findByEmergencyVisit_VisitIdAndPreType(visit.getVisitId(), preType).orElse(null);

		if (existing != null) {
			// 2. 있으면 덮어쓰기(업데이트)
			existing.setPreDisposition(preDisposition);
			existing.setPreScore(preScore);
			existing.setReason(reason);
			existing.setPreTime(java.time.LocalDateTime.now());
			aiPredictionRepository.save(existing);
			return existing;
		} else {
			// 3. 없으면 새로 저장
			AiPrediction prediction = new AiPrediction();
			prediction.setEmergencyVisit(visit);
			prediction.setPreType(preType);
			prediction.setPreDisposition(preDisposition);
			prediction.setPreScore(preScore);
			prediction.setReason(reason);
			prediction.setPreTime(java.time.LocalDateTime.now());
			aiPredictionRepository.save(prediction);
			return prediction;
		}
	}

	// 예측 결과 + 병상 정보 한 번에 DTO로 변환
	 public AiPredictionResponseDto toDtoWithBeds(AiPrediction prediction) {
	        AiPredictionResponseDto dto = new AiPredictionResponseDto();
	        dto.setPreId(prediction.getPreId());
	        dto.setPreType(prediction.getPreType());
	        dto.setPreDisposition(prediction.getPreDisposition());
	        dto.setPreScore(prediction.getPreScore());
	        dto.setReason(prediction.getReason());
	        dto.setVisitId(prediction.getEmergencyVisit().getVisitId());
	        dto.setPreTime(prediction.getPreTime());

	        // 병상 정보 
	        Integer disp = dto.getPreDisposition();
	        String wardType = null;
	        if (disp != null && disp != 0) {
	            if (disp == 1) wardType = "WARD";
	            else if (disp == 2) wardType = "ICU";
	        }
	        
	        // 프론트에 wardType값 전달
	        dto.setWardType(wardType);

	        if (wardType != null) {
	            AvailableBeds beds = availableBedsRepository.findTopByWardTypeOrderByUpdatedTimeDesc(wardType);
	            if (beds != null) {
	                dto.setAvailableBeds(beds.getAvailableCount());
	                dto.setTotalBeds(beds.getTotalBeds());
	            } else {
	                dto.setAvailableBeds(null);
	                dto.setTotalBeds(null);
	            }
	        } else {
	            dto.setAvailableBeds(null);
	            dto.setTotalBeds(null);
	        }

	        return dto;
	    }
 
	// 1차 예측: 입실 시
	public AiPrediction predictAdmission(String visitId) {
		
		 // DB에 예측값 있으면 DB값 반환, Flask 호출 X
	    AiPrediction existing = aiPredictionRepository
	    		.findByEmergencyVisit_VisitIdAndPreType(visitId, "admission").orElse(null);
	    if (existing != null) {
	        return existing;
	    }
	    
	    // DB값 없으면 flask 호출
		EmergencyVisit visit = emergencyVisitRepository.findById(visitId)
				.orElseThrow(() -> new IllegalArgumentException("방문 정보 없음"));

		Patient patient = visit.getPatient();

		// PatientRequest에 모든 정보 세팅!
		PatientRequest req = new PatientRequest();
		req.setGender(patient.getGender());
		req.setAge(patient.getAge());
		req.setAcuity(visit.getAcuity());
		req.setPain(visit.getPain());
		req.setChiefComplaint(visit.getChiefComplaint());
		req.setArrivalTransport(visit.getArrivalTransport());

		// Flask 호출 → LLMResultWrapper로 받기!
		HttpHeaders headers = new HttpHeaders();
		headers.setContentType(MediaType.APPLICATION_JSON);
		HttpEntity<PatientRequest> requestEntity = new HttpEntity<>(req, headers);

		ResponseEntity<LLMResultWrapper> response = restTemplate
				.postForEntity("http://127.0.0.1:5000/predict/admission", requestEntity, LLMResultWrapper.class);

		LLMResult llmResult = response.getBody().getResult();

		 // Flask 결과를 DB에 저장
        return saveOrUpdatePrediction(
            visit,
            "admission",
            Integer.valueOf(llmResult.getDisposition()),
            llmResult.getRiskScore(),
            llmResult.getClinicalReason()
        );

	}

	// 2차 예측: 퇴실/최종
	public AiPrediction predictDischarge(String visitId) {
		 // DB에 예측값 있으면 반환 Flask 호출 X
	    AiPrediction existing = aiPredictionRepository
	    		.findByEmergencyVisit_VisitIdAndPreType(visitId, "discharge").orElse(null);
	    if (existing != null) {
	        return existing;
	    }
	    // 값 없으면 flask 호출
		EmergencyVisit visit = emergencyVisitRepository.findById(visitId)
				.orElseThrow(() -> new IllegalArgumentException("방문 정보 없음"));
		Patient patient = visit.getPatient();

		// 여러 행을 받아옴! ->lab_result 테이블 자체가 여러 row을 갖고 있어서
		List<LabResults> labList = labResultsRepository.findAllByVisitId(visitId);

		// *** PatientRequest에 Lab 값 포함해서 세팅 ***
		PatientRequest req = new PatientRequest();
		req.setGender(patient.getGender());
		req.setAge(patient.getAge());
		req.setAcuity(visit.getAcuity());
		req.setPain(visit.getPain());
		req.setChiefComplaint(visit.getChiefComplaint());
		req.setArrivalTransport(visit.getArrivalTransport());

		// 최신 검사 결과 1개만 저장
		LabResults lab = null;
		if (labList != null && !labList.isEmpty()) {
			lab = labList.stream().max(java.util.Comparator.comparing(LabResults::getLabTime)) // 검사 시각이 최신인 행
					.orElse(null);
		}

		if (lab != null) {
			req.setHemoglobin(lab.getHemoglobin());
			req.setWbc(lab.getWbc());
			req.setPlateletCount(lab.getPlateletCount());
			req.setRedBloodCells(lab.getRedBloodCells());
			req.setSedimentationRate(lab.getSedimentationRate());
			req.setNa(lab.getNa());
			req.setK(lab.getK());
			req.setChloride(lab.getChloride());
			req.setCa(lab.getCa());
			req.setMg(lab.getMg());
			req.setUreaNitrogen(lab.getUreaNitrogen());
			req.setCreatinine(lab.getCreatinine());
			req.setAst(lab.getAst());
			req.setAlt(lab.getAlt());
			req.setBilirubin(lab.getBilirubin());
			req.setAlbumin(lab.getAlbumin());
			req.setAp(lab.getAp());
			req.setGgt(lab.getGgt());
			req.setLd(lab.getLd());
			req.setAmmonia(lab.getAmmonia());
			req.setGlucose(lab.getGlucose());
			req.setLactate(lab.getLactate());
			req.setAcetone(lab.getAcetone());
			req.setBhb(lab.getBhb());
			req.setCrp(lab.getCrp());
			req.setPt(lab.getPt());
			req.setInrPt(lab.getInrPt());
			req.setPtt(lab.getPtt());
			req.setDDimer(lab.getDDimer());
			req.setTroponinT(lab.getTroponinT());
			req.setCk(lab.getCk());
			req.setCkmb(lab.getCkmb());
			req.setNtprobnp(lab.getNtprobnp());
			req.setAmylase(lab.getAmylase());
			req.setLipase(lab.getLipase());
			req.setPh(lab.getPh());
			req.setPco2(lab.getPco2());
			req.setPo2(lab.getPo2());
			req.setCtco2(lab.getCtco2());
			req.setBcb(lab.getBcb());
		}

		// Flask 서버로 2차 예측 요청
		HttpHeaders headers = new HttpHeaders();
		headers.setContentType(MediaType.APPLICATION_JSON);
		HttpEntity<PatientRequest> requestEntity = new HttpEntity<>(req, headers);

		// ⭐ 여기서 실제 Flask로 보냄! (Flask 코드와 라우팅 이름 반드시 일치해야 함!)
		ResponseEntity<LLMResultWrapper> response = restTemplate
				.postForEntity("http://127.0.0.1:5000/predict/discharge", requestEntity, LLMResultWrapper.class);

		LLMResult llmResult = response.getBody().getResult();

		 // Flask 결과를 DB에 저장
        return saveOrUpdatePrediction(
            visit,
            "discharge",
            Integer.valueOf(llmResult.getDisposition()),
            llmResult.getRiskScore(),
            llmResult.getClinicalReason()
        );
		
	}

	// 예측 결과 조회
	public AiPrediction getPredictionByVisitIdAndPreType(String visitId, String preType) {
        return aiPredictionRepository.findTopByEmergencyVisit_VisitIdAndPreTypeOrderByPreTimeDesc(visitId, preType)
            .orElseThrow(() -> new IllegalArgumentException("예측 결과 없음"));
	}
}
