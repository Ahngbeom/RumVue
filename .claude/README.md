# Claude Code Configuration

이 디렉토리는 Claude Code의 커스텀 설정을 포함합니다.

## Available Agents

### 🎯 rum-agent (Elastic APM RUM Agent)

Elastic APM RUM 계측 작업을 전문적으로 처리하는 에이전트입니다.

**사용법:**
```
@rum-agent [your request]
```

**예시:**
```
@rum-agent 새로운 Product 페이지에 APM 추적 기능을 추가해줘

@rum-agent simple.vue를 useApmTracking 헬퍼를 사용해서 리팩토링 해줘

@rum-agent 버튼 클릭이 APM에서 안보이는데 디버깅 도와줘
```

**처리 가능한 작업:**
- ✅ 새로운 컴포넌트에 APM 추적 추가
- ✅ 기존 코드를 헬퍼 함수로 리팩토링
- ✅ 커스텀 트랜잭션 생성
- ✅ API 호출 추적
- ✅ 폼 제출 추적
- ✅ 에러 추적 추가
- ✅ APM 디버깅 지원
- ✅ 성능 모니터링 구현

**에이전트 특징:**
- 모든 Best Practices 숙지
- useApmTracking() 헬퍼 우선 사용
- 일관된 네이밍 컨벤션 적용
- 자동 에러 처리
- 테스트 방법 제공

**파일 위치:** `.claude/agents/rum-agent.md`

---

## 에이전트 추가하기

새로운 전문 에이전트를 추가하려면:

1. `.claude/agents/` 디렉토리에 마크다운 파일 생성
2. 파일명이 에이전트 이름이 됨 (예: `my-agent.md`)
3. 파일 내용에 에이전트의 역할, 지시사항, 예제 작성
4. `@my-agent` 형식으로 호출

---

**마지막 업데이트:** 2025-11-03
