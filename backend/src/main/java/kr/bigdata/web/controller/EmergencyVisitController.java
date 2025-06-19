package kr.bigdata.web.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import kr.bigdata.web.dto.FinalizeDispositionRequest;
import kr.bigdata.web.dto.VisitDetailDto;
import kr.bigdata.web.dto.VisitSummaryDto;
import kr.bigdata.web.entity.EmergencyVisit;
import kr.bigdata.web.repository.EmergencyVisitRepository;
import kr.bigdata.web.service.EmergencyVisitService;

@CrossOrigin(origins = "http://localhost:3000")
@RestController
@RequestMapping("/api")
public class EmergencyVisitController {

   private final EmergencyVisitRepository emergencyVisitRepository;
   private final EmergencyVisitService emergencyVisitService;

   @Autowired
   public EmergencyVisitController(EmergencyVisitRepository emergencyVisitRepository,
         EmergencyVisitService emergencyVisitService) {
      this.emergencyVisitRepository = emergencyVisitRepository;
      this.emergencyVisitService = emergencyVisitService;
   }

   // 환자 방문 요약 리스트 조회
   @GetMapping("/visits/{patientId}")
   public ResponseEntity<List<VisitSummaryDto>> getPatientVisitSummaries(@PathVariable String patientId) {
      List<VisitSummaryDto> summaries = emergencyVisitRepository.findVisitSummariesByPatientId(patientId);
      return ResponseEntity.ok(summaries);
   }

   // 방문 상세 조회
   @GetMapping("/visit-detail/{visitId}")
   public ResponseEntity<VisitDetailDto> getVisitDetail(@PathVariable String visitId) {
      EmergencyVisit visit = emergencyVisitRepository.findById(visitId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "방문(ADM) 정보 없음"));

      VisitDetailDto dto = new VisitDetailDto();
      dto.setVisitId(visit.getVisitId());
      dto.setPatientId(visit.getPatient().getPatientId()); // FK 맞게!
      dto.setAdmissionTime(visit.getAdmissionTime());
      dto.setDischargeTime(visit.getDischargeTime());
      dto.setAcuity(visit.getAcuity());
      dto.setPain(visit.getPain());
      dto.setChiefComplaint(visit.getChiefComplaint());
      dto.setArrivalTransport(visit.getArrivalTransport());
      dto.setDiagnosis(visit.getDiagnosis());
      dto.setFinalDisposition(visit.getFinalDisposition());
      dto.setBedNumber(visit.getBedNumber());
      dto.setStatus(visit.getStatus());
      return ResponseEntity.ok(dto);
   }

   // 최종 배치 확정 api
   @PostMapping("/visits/{visitId}/disposition")
   public ResponseEntity<?> finalizeDisposition(@PathVariable String visitId,
         @RequestBody FinalizeDispositionRequest request) {

      System.out.println("최종 배치 확정 API 호출됨! visitId=" + visitId + ", disposition=" + request.getDisposition());

      emergencyVisitService.finalizeDisposition(visitId, request.getDisposition(), request.getReason());
      return ResponseEntity.ok().build();
   }

   //  최종 배치 정보 수정 (PUT: 수정)
   @PutMapping("/visits/{visitId}/disposition")
   public ResponseEntity<?> updateDisposition(@PathVariable String visitId,
         @RequestBody FinalizeDispositionRequest request) {

      emergencyVisitService.updateDisposition(visitId, request.getDisposition(), request.getReason());
      return ResponseEntity.ok().build();
   }

   // 최종 배치 정보 삭제 (DELETE: 취소/초기화)
   @DeleteMapping("/visits/{visitId}/disposition")
   public ResponseEntity<?> deleteDisposition(@PathVariable String visitId) {
      emergencyVisitService.deleteDisposition(visitId);
      return ResponseEntity.ok().build();
   }

}