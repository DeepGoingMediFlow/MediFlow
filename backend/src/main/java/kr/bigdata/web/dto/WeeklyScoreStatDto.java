package kr.bigdata.web.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class WeeklyScoreStatDto {
    private Integer preScore;
    private Long thisWeekCount;
    private Long lastWeekCount;

    public WeeklyScoreStatDto(Integer preScore, Long thisWeekCount, Long lastWeekCount) {
        this.preScore = preScore;
        this.thisWeekCount = thisWeekCount != null ? thisWeekCount : 0L;
        this.lastWeekCount = lastWeekCount != null ? lastWeekCount : 0L;
    }

}