package kr.bigdata.web.dto;

import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonFormat;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class LabResultDto {
	
	private Long labId;
    private String visitId;
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime labTime;
    private Double wbc;
    private Double hemoglobin;
    private Double plateletCount;
    private Double redBloodCells;
    private Double sedimentationRate;
    private Double na;
    private Double k;
    private Double chloride;
    private Double ca;
    private Double mg;
    private Double ureaNitrogen;
    private Double creatinine;
    private Double ast;
    private Double alt;
    private Double bilirubin;
    private Double albumin;
    private Double ap;
    private Double ggt;
    private Double ld;
    private Double ammonia;
    private Double glucose;
    private Double lactate;
    private Double acetone;
    private Double bhb;
    private Double crp;
    private Double pt;
    private Double inrPt;
    private Double ptt;
    private Double dDimer;
    private Double troponinT;
    private Double ck;
    private Double ckmb;
    private Double ntprobnp;
    private Double amylase;
    private Double lipase;
    private Double ph;
    private Double pco2;
    private Double po2;
    private Double ctco2;
    private Double bcb;
    
    // VitalSign 필드
    private Long recordId;
    private LocalDateTime recordTime;
    private Integer hr;
    private Integer rr;
    private Double spo2;
    private Integer sbp;
    private Integer dbp;
    private Double bt;

}
