package kr.bigdata.web.dto;

import java.time.LocalDate;
import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

public class DailyDispositioDto {

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class DailyDispositionResponse {
        private List<DailyDispositionStats> data;
        private LocalDate startDate;
        private LocalDate endDate;
        private String periodDescription;
    }
    
    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class DailyDispositionStats {
        private String date;        // MM/dd 형식
        private Integer discharge;  // 0: 퇴원
        private Integer ward;       // 1: 일반병동
        private Integer icu;        // 2: 중환자실
    }
}
