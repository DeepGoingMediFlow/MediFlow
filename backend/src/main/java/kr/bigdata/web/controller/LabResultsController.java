package kr.bigdata.web.controller;

import java.lang.reflect.Field;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
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
import kr.bigdata.web.entity.VitalSigns;
import kr.bigdata.web.repository.LabResultsRepository;
import kr.bigdata.web.repository.ReferenceRangesRepository;
import kr.bigdata.web.repository.VitalSignsRepository;

@RestController
@RequestMapping("/api/visits")
public class LabResultsController {

	private final VitalSignsRepository vitalSignsRepository;
	private final LabResultsRepository labResultsRepository;
	
	@Autowired
	private ReferenceRangesRepository referenceRangeRepository;


	    @Autowired
	    public LabResultsController(LabResultsRepository labResultsRepository,VitalSignsRepository vitalSignsRepository  ) {
	        this.labResultsRepository = labResultsRepository;
	        this.vitalSignsRepository = vitalSignsRepository;
	    }

	    @GetMapping("/{visitId}/labs")
	    public ResponseEntity<List<LabResultDto>> getLabResultsByVisitId(@PathVariable String visitId) {
	        List<LabResults> labs = labResultsRepository.findByVisitIdOrderByLabTimeDesc(visitId);
	        List<VitalSigns> vitals = vitalSignsRepository.findByVisitIdOrderByRecordTimeDesc(visitId);

	        int maxSize = Math.max(labs.size(), vitals.size());
	        List<LabResultDto> result = new ArrayList<>();

	        for (int i = 0; i < maxSize; i++) {
	            LabResultDto dto = new LabResultDto();

	            // Lab 정보 세팅
	            if (i < labs.size()) {
	                LabResults l = labs.get(i);
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
	                dto.setTroponinT(l.getTroponinT());
	                dto.setCk(l.getCk());
	                dto.setCkmb(l.getCkmb());
	                dto.setNtprobnp(l.getNtprobnp());
	                dto.setAmylase(l.getAmylase());
	                dto.setLipase(l.getLipase());
	                dto.setPh(l.getPh());
	                dto.setPco2(l.getPco2());
	                dto.setPo2(l.getPo2());
	                dto.setCtco2(l.getCtco2());
	                dto.setBcb(l.getBcb());
	            }

	            // Vital 정보 세팅
	            if (i < vitals.size()) {
	                VitalSigns v = vitals.get(i);
	                dto.setRecordId(v.getRecordId());
	                dto.setRecordTime(v.getRecordTime());
	                dto.setHr(v.getHr());
	                dto.setRr(v.getRr());
	                dto.setSpo2(v.getSpo2() != null ? v.getSpo2().doubleValue() : null);
	                dto.setSbp(v.getSbp());
	                dto.setDbp(v.getDbp());
	                dto.setBt(v.getBt() != null ? v.getBt().doubleValue() : null);
	            }
	            result.add(dto);
	        }
	        return ResponseEntity.ok(result);
	    }

	    @GetMapping("/{visitId}/labs/abnormal")
	    public ResponseEntity<List<AbnormalLabResultDto>> getAbnormalLabs(@PathVariable String visitId) {
	        List<LabResults> labs = labResultsRepository.findByVisitIdOrderByLabTimeDesc(visitId);
	        List<VitalSigns> vitals = vitalSignsRepository.findByVisitIdOrderByRecordTimeDesc(visitId);

	        if ((labs == null || labs.isEmpty()) && (vitals == null || vitals.isEmpty())) {
	            return ResponseEntity.notFound().build();
	        }

	        List<AbnormalLabResultDto> abnormalList = new ArrayList<>();
	        // 중복 방지용 Set
	        Set<String> uniqueSet = new HashSet<>();

	        // 1. Lab 검사 비정상값
	        for (LabResults lab : labs) {
	            for (Field field : LabResults.class.getDeclaredFields()) {
	                field.setAccessible(true);
	                String testName = field.getName();
	                if (testName.equals("labId") || testName.equals("visitId") || testName.equals("labTime")) continue;
	                try {
	                    Object value = field.get(lab);
	                    if (value instanceof Double && value != null) {
	                        ReferenceRanges ref = referenceRangeRepository.findByTestName(testName.toUpperCase());
	                        if (ref != null) {
	                            double result = (Double) value;
	                            if (result < ref.getMinNormal() || result > ref.getMaxNormal()) {
	                                String key = lab.getLabTime().toString() + "|" + testName.toUpperCase();
	                                if (!uniqueSet.contains(key)) {
	                                    uniqueSet.add(key);
	                                    AbnormalLabResultDto dto = new AbnormalLabResultDto();
	                                    dto.setType("LAB");
	                                    dto.setLabTime(lab.getLabTime());
	                                    dto.setTestName(testName.toUpperCase());
	                                    dto.setResult(result);
	                                    dto.setMinNormal(ref.getMinNormal());
	                                    dto.setMaxNormal(ref.getMaxNormal());
	                                    abnormalList.add(dto);
	                                }
	                            }
	                        }
	                    }
	                } catch (Exception e) { e.printStackTrace(); }
	            }
	        }

	        // 2. 바이탈 비정상값 (날짜+항목별로 한 번만!)
	        for (VitalSigns vital : vitals) {
	            addAbnormalVitalWithDupCheck(abnormalList, uniqueSet, vital.getRecordTime(), "HR", vital.getHr());
	            addAbnormalVitalWithDupCheck(abnormalList, uniqueSet, vital.getRecordTime(), "RR", vital.getRr());
	            addAbnormalVitalWithDupCheck(abnormalList, uniqueSet, vital.getRecordTime(), "SPO2", vital.getSpo2());
	            addAbnormalVitalWithDupCheck(abnormalList, uniqueSet, vital.getRecordTime(), "SBP", vital.getSbp());
	            addAbnormalVitalWithDupCheck(abnormalList, uniqueSet, vital.getRecordTime(), "DBP", vital.getDbp());
	            addAbnormalVitalWithDupCheck(abnormalList, uniqueSet, vital.getRecordTime(), "BT", vital.getBt());
	        }

	        return ResponseEntity.ok(abnormalList);
	    }

	    // 중복 방지용 바이탈 처리 함수
	    private void addAbnormalVitalWithDupCheck(
	            List<AbnormalLabResultDto> list, Set<String> uniqueSet,
	            java.time.LocalDateTime time, String testName, Number value) {
	        if (value == null) return;
	        ReferenceRanges ref = referenceRangeRepository.findByTestName(testName);
	        if (ref == null) return;
	        double result = value.doubleValue();
	        if (result < ref.getMinNormal() || result > ref.getMaxNormal()) {
	            String key = time.toString() + "|" + testName.toUpperCase();
	            if (!uniqueSet.contains(key)) {
	                uniqueSet.add(key);
	                AbnormalLabResultDto dto = new AbnormalLabResultDto();
	                dto.setType("VITAL");
	                dto.setLabTime(time);
	                dto.setTestName(testName.toUpperCase());
	                dto.setResult(result);
	                dto.setMinNormal(ref.getMinNormal());
	                dto.setMaxNormal(ref.getMaxNormal());
	                list.add(dto);
	            }
	        }
	    }
}
