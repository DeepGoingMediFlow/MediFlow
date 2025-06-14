package kr.bigdata.web.controller;

import java.lang.reflect.Field;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import kr.bigdata.web.dto.AbnormalLabResultDto;
import kr.bigdata.web.dto.LabResultDto;
import kr.bigdata.web.entity.LabResults;
import kr.bigdata.web.entity.ReferenceRanges;
import kr.bigdata.web.repository.LabResultsRepository;
import kr.bigdata.web.repository.ReferenceRangesRepository;

@RestController
@RequestMapping("/api/visits")
public class LabResultsController {

	 private final LabResultsRepository labResultsRepository;

	    @Autowired
	    public LabResultsController(LabResultsRepository labResultsRepository) {
	        this.labResultsRepository = labResultsRepository;
	    }

	    @GetMapping("/{visitId}/labs")
	    public ResponseEntity<List<LabResultDto>> getLabResultsByVisitId(@PathVariable String visitId) {
	        List<LabResults> labs = labResultsRepository.findByVisitIdOrderByLabTimeDesc(visitId);

	        List<LabResultDto> result = labs.stream().map(l -> {
	            LabResultDto dto = new LabResultDto();
	            dto.setLabId(l.getLabId());
	            dto.setVisitId(l.getVisitId());
	            dto.setLabTime(l.getLabTime());
	            dto.setWbc(l.getWbc());
	            dto.setHemoglobin(l.getHemoglobin());
	            dto.setPlateletCount(l.getPlateletCount());
	            dto.setRedBloodCells(l.getRedBloodCells());
	            dto.setSedimentationRate(l.getSedimentationRate());
	            dto.setNa(l.getNa());
	            dto.setK(l.getK());
	            dto.setChloride(l.getChloride());
	            dto.setCa(l.getCa());
	            dto.setMg(l.getMg());
	            dto.setUreaNitrogen(l.getUreaNitrogen());
	            dto.setCreatinine(l.getCreatinine());
	            dto.setAst(l.getAst());
	            dto.setAlt(l.getAlt());
	            dto.setBilirubin(l.getBilirubin());
	            dto.setAlbumin(l.getAlbumin());
	            dto.setAp(l.getAp());
	            dto.setGgt(l.getGgt());
	            dto.setLd(l.getLd());
	            dto.setAmmonia(l.getAmmonia());
	            dto.setGlucose(l.getGlucose());
	            dto.setLactate(l.getLactate());
	            dto.setAcetone(l.getAcetone());
	            dto.setBhb(l.getBhb());
	            dto.setCrp(l.getCrp());
	            dto.setPt(l.getPt());
	            dto.setInrPt(l.getInrPt());
	            dto.setPtt(l.getPtt());
	            dto.setDDimer(l.getDDimer());
	            return dto;
	        }).collect(Collectors.toList());

	        return ResponseEntity.ok(result);
	    }
	    
	    @Autowired
	    private ReferenceRangesRepository referenceRangeRepository;

	    
	    @GetMapping("/{visitId}/labs/abnormal")
	    public ResponseEntity<List<AbnormalLabResultDto>> getAbnormalLabs(@PathVariable String visitId) {
	        List<LabResults> labs = labResultsRepository.findByVisitIdOrderByLabTimeDesc(visitId);
	        //TDD를 위해 검사 실패하면 404반환하는거 추가
	        if (labs == null || labs.isEmpty()) {
	            return ResponseEntity.notFound().build();
	        }

	        List<AbnormalLabResultDto> abnormalList = new ArrayList<>();

	        // 전체 검사 이력(labs) 반복!
	        for (LabResults lab : labs) {
	            for (Field field : LabResults.class.getDeclaredFields()) {
	                field.setAccessible(true);
	                String testName = field.getName();
	                // labId, visitId, labTime 등 PK/식별자 컬럼은 스킵
	                if (testName.equals("labId") || testName.equals("visitId") || testName.equals("labTime")) continue;
	                try {
	                    Object value = field.get(lab);
	                    if (value instanceof Double && value != null) {
	                        ReferenceRanges ref = referenceRangeRepository.findByTestName(testName.toUpperCase());
	                        if (ref != null) {
	                            double result = (Double) value;
	                            if (result < ref.getMinNormal() || result > ref.getMaxNormal()) {
	                                AbnormalLabResultDto dto = new AbnormalLabResultDto();
	                                dto.setLabTime(lab.getLabTime());
	                                dto.setTestName(testName.toUpperCase());
	                                dto.setResult(result);
	                                dto.setMinNormal(ref.getMinNormal());
	                                dto.setMaxNormal(ref.getMaxNormal());
	                                abnormalList.add(dto);
	                            }
	                        }
	                    }
	                } catch (Exception e) { e.printStackTrace(); }
	            }
	        }
	        return ResponseEntity.ok(abnormalList);
	    }

}
