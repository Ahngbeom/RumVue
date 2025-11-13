# Claude Sub Agents

이 디렉토리에는 특정 도메인에 전문화된 Claude Sub Agent 프롬프트가 포함되어 있습니다.

## 📁 Available Agents

### 1. `elastic-apm-rum-expert.md` - Elastic APM RUM 전문가

**전문 분야**:
- Vue.js/Nuxt.js 환경에서 Elastic APM RUM 설정 및 최적화
- 컴포넌트 추적 시스템 구현
- 성능 모니터링 및 Timeline 최적화
- 에러 추적 및 디버깅
- 프로덕션 배포 설정

**언제 사용하나요?**
- Elastic APM RUM을 처음 설정할 때
- 컴포넌트별 성능 추적이 필요할 때
- APM Timeline을 최적화하고 싶을 때
- Kibana에서 데이터 분석 방법을 알고 싶을 때
- 프로덕션 배포 전 체크리스트가 필요할 때

**사용 예시**:
```bash
# Claude Code에서
"Elastic APM RUM을 Nuxt 4 프로젝트에 설정해줘"
"컴포넌트별로 성능을 추적하고 싶어"
"APM Timeline에서 node_modules를 제거하고 싶어"
"Kibana에서 특정 컴포넌트의 에러만 필터링하는 방법 알려줘"
```

### 2. `debugger.md` - 디버깅 전문가 (기존)

복잡한 이슈 진단, 루트 원인 분석, 체계적인 문제 해결을 지원합니다.

### 3. `error-detective.md` - 에러 탐정 (기존)

복잡한 에러 패턴 분석, 상관관계 파악, 루트 원인 발견을 전문으로 합니다.

### 4. `performance-engineer.md` - 성능 엔지니어 (기존)

시스템 최적화, 병목 지점 식별, 확장성 엔지니어링을 담당합니다.

### 5. `code-reviewer.md` - 코드 리뷰어 (기존)

코드 품질, 보안 취약점, 베스트 프랙티스 검토를 수행합니다.

### 6. `git-commit-pusher.md` - Git 커밋 푸셔 (기존)

변경사항 분석, 커밋 메시지 작성, 코드 푸시를 자동화합니다.

## 🚀 Sub Agent 사용 방법

### Claude Code에서 사용

Sub Agent를 호출하려면 Claude Code의 **Task 도구**를 사용합니다:

```typescript
// 사용자 요청:
"Elastic APM RUM을 설정해줘"

// Claude Code가 자동으로:
Task tool 호출 → elastic-apm-rum-expert agent 실행
```

### 수동으로 Agent 컨텍스트 제공

특정 에이전트의 전문성이 필요할 때, 해당 에이전트 파일을 명시적으로 참조할 수도 있습니다:

```bash
"elastic-apm-rum-expert.md의 지식을 바탕으로 APM을 설정해줘"
```

## 📝 새로운 Sub Agent 만들기

### 1. 파일 생성

`.claude/agents/` 디렉토리에 `.md` 파일을 생성합니다:

```bash
touch .claude/agents/my-expert-agent.md
```

### 2. 프롬프트 구조

```markdown
# [Agent Name]

당신은 **[전문 분야]** 전문가입니다.

## 전문 분야

### 1. [주요 영역 1]
- 세부 항목 1
- 세부 항목 2

### 2. [주요 영역 2]
...

## 핵심 지식

### [중요 개념 1]

```[언어]
// 코드 예시와 설명
```

### [중요 개념 2]
...

## [도구/참고 자료]

- 공식 문서 링크
- 내부 문서 링크
- 유용한 도구

## 작업 시 원칙

1. 원칙 1
2. 원칙 2
...

## 사용자 요청 처리 방법

### [요청 카테고리 1]
- 처리 방법 1
- 처리 방법 2

---

**당신은 이 모든 지식을 바탕으로 사용자를 돕는 전문가입니다.**
```

### 3. 베스트 프랙티스

**DO**:
- ✅ 구체적이고 실행 가능한 예제 코드 포함
- ✅ 실제 프로젝트에서 검증된 베스트 프랙티스 제공
- ✅ 문제 해결 체크리스트 제공
- ✅ 관련 도구 및 참고 자료 링크
- ✅ 일반적인 실수와 해결책 명시

**DON'T**:
- ❌ 너무 일반적이거나 추상적인 설명
- ❌ 검증되지 않은 방법 제시
- ❌ 프로젝트 컨텍스트 무시
- ❌ 과도하게 긴 프롬프트 (2000-5000 토큰 권장)

## 🎯 Agent 설계 원칙

### 1. 전문성 (Expertise)

Agent는 **특정 도메인에 깊은 전문성**을 가져야 합니다.

**Good**:
```markdown
# Elastic APM RUM Expert
- APM RUM 설정, 컴포넌트 추적, 성능 모니터링 전문
```

**Bad**:
```markdown
# JavaScript Expert
- 너무 광범위함
```

### 2. 실행 가능성 (Actionability)

Agent는 **즉시 실행 가능한 코드와 명령**을 제공해야 합니다.

**Good**:
```typescript
// 구체적인 코드 예시
const apm = initApm({
  serviceName: 'my-app',
  serverUrl: 'http://localhost:8200'
})
```

**Bad**:
```markdown
APM을 초기화하세요.
```

### 3. 컨텍스트 인식 (Context Awareness)

Agent는 **현재 프로젝트의 구조와 기술 스택**을 이해해야 합니다.

**Good**:
```markdown
Nuxt.js 4 환경에서는 `app/plugins/apm.client.ts` 파일 사용
```

**Bad**:
```markdown
프로젝트에 APM 파일을 추가하세요.
```

### 4. 문제 해결 중심 (Problem-Solving)

Agent는 **일반적인 문제와 해결책**을 미리 제공해야 합니다.

**Good**:
```markdown
### APM이 초기화되지 않음

**원인**: CORS 설정 문제
**해결**: apm-server.yml에서 allow_origins 설정
```

**Bad**:
```markdown
문제가 발생하면 문서를 확인하세요.
```

## 📚 Sub Agent 활용 사례

### 사례 1: 기술 스택별 전문가

```markdown
# Next.js App Router Expert
- App Router 구조, Server Components, Route Handlers 전문

# TailwindCSS Expert
- 유틸리티 클래스, 커스텀 테마, 반응형 디자인 전문

# GraphQL Expert
- 스키마 설계, Query 최적화, Apollo Client 전문
```

### 사례 2: 도구별 전문가

```markdown
# Docker Compose Expert
- 컨테이너 오케스트레이션, 네트워크 설정, 볼륨 관리 전문

# GitHub Actions Expert
- CI/CD 파이프라인, Workflow 최적화, Secrets 관리 전문

# Vitest Expert
- 유닛 테스트, 모킹, 커버리지 리포팅 전문
```

### 사례 3: 특정 기능별 전문가

```markdown
# Authentication Expert
- OAuth2, JWT, Session 관리, 보안 베스트 프랙티스 전문

# API Design Expert
- RESTful API, OpenAPI, 버전 관리, 에러 핸들링 전문

# Database Migration Expert
- Prisma, TypeORM, 마이그레이션 전략, 롤백 전문
```

## 🔍 Agent 효과 측정

### Before (Sub Agent 없음)

**문제점**:
- 😰 일반적인 답변 → 프로젝트 컨텍스트 부족
- 😰 매번 같은 질문 반복 → 시간 낭비
- 😰 베스트 프랙티스 불명확 → 잘못된 구현

### After (Sub Agent 있음)

**개선점**:
- ✅ 프로젝트 맞춤형 답변
- ✅ 즉시 실행 가능한 코드
- ✅ 검증된 베스트 프랙티스
- ✅ 일관된 품질

## 🛠️ Agent 유지보수

### 정기적인 업데이트

1. **기술 스택 변경 시**
   - 새로운 버전의 API 반영
   - 변경된 베스트 프랙티스 업데이트

2. **프로젝트 진화 시**
   - 새로운 패턴 추가
   - 더 이상 사용하지 않는 방법 제거

3. **피드백 반영**
   - 사용자 피드백 수집
   - 일반적인 실수 패턴 추가

### 버전 관리

```bash
# Git으로 Agent 변경사항 추적
git log .claude/agents/elastic-apm-rum-expert.md

# 중요 변경사항은 커밋 메시지에 명시
git commit -m "feat(agent): Add Timeline filtering strategy to APM expert"
```

## 📖 추가 자료

- [Claude Code 공식 문서](https://docs.claude.com/claude-code)
- [Prompt Engineering 가이드](https://docs.anthropic.com/claude/docs/prompt-engineering)
- [Agent 디자인 패턴](https://docs.anthropic.com/claude/docs/agent-design-patterns)

---

**이 Sub Agent들은 실제 프로젝트 경험을 바탕으로 만들어졌으며, 실무에서 즉시 활용 가능합니다.**
