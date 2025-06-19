package kr.bigdata.web.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class FinalizeDispositionRequest {

	private int disposition; // 0: 퇴원, 1: 일반병동, 2: 중환자실
	private String reason; // 의료진이 AI 예측과 다르게 선택했을 때 사유 (필요시)

	@Override
	public String toString() {
		return "FinalizeDispositionRequest{" + "disposition=" + disposition + ", reason='" + reason + '\'' + '}';
	}
}