package kr.bigdata.web.controller;

import java.lang.reflect.Field;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeMap;

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
    public LabResultsController(LabResultsRepository labResultsRepository, VitalSignsRepository vitalSignsRepository) {
        this.labResultsRepository = labResultsRepository;
        this.vitalSignsRepository = vitalSignsRepository;
    }

    @GetMapping("/{visitId}/labs")
    public ResponseEntity<List<LabResultDto>> getLabResultsByVisitId(@PathVariable String visitId) {
        List<LabResults> labs = labResultsRepository.findByVisitIdOrderByLabTimeDesc(visitId);
        List<VitalSigns> vitals = vitalSignsRepository.findByVisitIdOrderByRecordTimeDesc(visitId);

        // 날짜/시간별로 그룹핑하기 위한 Map
        Map<LocalDateTime, LabResultDto> timeBasedResults = new TreeMap<>(Collections.reverseOrder());

        // Lab 데이터 처리
        for (LabResults lab : labs) {
            LocalDateTime labTime = lab.getLabTime();
            LabResultDto dto = timeBasedResults.computeIfAbsent(labTime, k -> new LabResultDto());
            
            // Lab 정보 세팅
            dto.setLabId(lab.getLabId());
            dto.setVisitId(lab.getVisitId());
            dto.setLabTime(lab.getLabTime());
            dto.setWbc(lab.getWbc());
            dto.setHemoglobin(lab.getHemoglobin());
            dto.setPlateletCount(lab.getPlateletCount());
            dto.setRedBloodCells(lab.getRedBloodCells());
            dto.setSedimentationRate(lab.getSedimentationRate());
            dto.setNa(lab.getNa());
            dto.setK(lab.getK());
            dto.setChloride(lab.getChloride());
            dto.setCa(lab.getCa());
            dto.setMg(lab.getMg());
            dto.setUreaNitrogen(lab.getUreaNitrogen());
            dto.setCreatinine(lab.getCreatinine());
            dto.setAst(lab.getAst());
            dto.setAlt(lab.getAlt());
            dto.setBilirubin(lab.getBilirubin());
            dto.setAlbumin(lab.getAlbumin());
            dto.setAp(lab.getAp());
            dto.setGgt(lab.getGgt());
            dto.setLd(lab.getLd());
            dto.setAmmonia(lab.getAmmonia());
            dto.setGlucose(lab.getGlucose());
            dto.setLactate(lab.getLactate());
            dto.setAcetone(lab.getAcetone());
            dto.setBhb(lab.getBhb());
            dto.setCrp(lab.getCrp());
            dto.setPt(lab.getPt());
            dto.setInrPt(lab.getInrPt());
            dto.setPtt(lab.getPtt());
            dto.setDDimer(lab.getDDimer());
            dto.setTroponinT(lab.getTroponinT());
            dto.setCk(lab.getCk());
            dto.setCkmb(lab.getCkmb());
            dto.setNtprobnp(lab.getNtprobnp());
            dto.setAmylase(lab.getAmylase());
            dto.setLipase(lab.getLipase());
            dto.setPh(lab.getPh());
            dto.setPco2(lab.getPco2());
            dto.setPo2(lab.getPo2());
            dto.setCtco2(lab.getCtco2());
            dto.setBcb(lab.getBcb());
        }

        // Vital 데이터 처리
        for (VitalSigns vital : vitals) {
            LocalDateTime recordTime = vital.getRecordTime();
            LabResultDto dto = timeBasedResults.computeIfAbsent(recordTime, k -> new LabResultDto());
            
            // Vital 정보 세팅
            dto.setRecordId(vital.getRecordId());
            dto.setRecordTime(vital.getRecordTime());
            dto.setHr(vital.getHr());
            dto.setRr(vital.getRr());
            dto.setSpo2(vital.getSpo2() != null ? vital.getSpo2().doubleValue() : null);
            dto.setSbp(vital.getSbp());
            dto.setDbp(vital.getDbp());
            dto.setBt(vital.getBt() != null ? vital.getBt().doubleValue() : null);
        }

        // Map의 값들을 List로 변환 (이미 시간 역순으로 정렬됨)
        List<LabResultDto> result = new ArrayList<>(timeBasedResults.values());
        
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
