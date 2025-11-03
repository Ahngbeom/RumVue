# RumVue 프로젝트 작업 보고서

**작업일자:** 2025-11-03
**프로젝트:** RumVue - Elastic APM RUM 연동 데모
**작업자:** Claude (AI Assistant)

---

## 📋 목차
1. [문제 정의](#문제-정의)
2. [문제 원인 분석](#문제-원인-분석)
3. [해결 방법](#해결-방법)
4. [작업 내용](#작업-내용)
5. [기술적 세부사항](#기술적-세부사항)
6. [테스트 및 검증](#테스트-및-검증)
7. [향후 개선 사항](#향후-개선-사항)

---

## 🎯 문제 정의

### 초기 상황
- Elastic APM UI에서 `rumvue-demo` 서비스는 정상적으로 표시됨
- 트랜잭션 목록에 `page-load`, `page-exit`만 표시됨
- **사용자 상호작용(버튼 클릭, 폼 제출 등)이 전혀 추적되지 않음**

### 사용자 요구사항
브라우저 사용자의 상호작용 로그(버튼 클릭, API 호출, 폼 제출 등)를 Elastic APM에서 확인하고 싶음

---

## 🔍 문제 원인 분석

### 1. 기존 코드 문제점

기존 구현에서는 `addLabels()`와 `setCustomContext()`만 사용:

```typescript
// ❌ 잘못된 구현 (app/pages/simple.vue)
const handleClick = (buttonName: string) => {
  clickCount.value++

  addLabels({
    interaction_type: 'button_click',
    button_name: buttonName
  })
}
```

### 2. 근본 원인

**Elastic APM RUM의 동작 방식:**
- `addLabels()`와 `setCustomContext()`는 **현재 활성화된 트랜잭션**에만 메타데이터를 추가
- 사용자 상호작용 시점에는 `page-load` 트랜잭션이 이미 종료됨
- 새로운 트랜잭션이 자동으로 생성되지 않음
- 결과적으로 labels와 context가 **버려짐**

### 3. APM RUM 자동 추적 범위

Elastic APM RUM이 **자동으로 추적하는 항목:**
- ✅ 페이지 로드 (`page-load`)
- ✅ 페이지 언로드 (`page-exit`)
- ✅ HTTP 요청 (fetch, XHR)
- ✅ 라우트 변경 (SPA)

**자동으로 추적하지 않는 항목:**
- ❌ 버튼 클릭
- ❌ 폼 입력/제출
- ❌ 체크박스/토글 변경
- ❌ 로컬 스토리지 작업
- ❌ 커스텀 비즈니스 로직

👉 **이러한 상호작용은 반드시 명시적으로 커스텀 트랜잭션을 생성해야 함**

---

## ✅ 해결 방법

### 핵심 솔루션

각 사용자 상호작용마다 **명시적으로 커스텀 트랜잭션 생성:**

```typescript
// ✅ 올바른 구현
const handleClick = (buttonName: string) => {
  // 1. 트랜잭션 시작
  const transaction = startTransaction(
    `Button Click: ${buttonName}`,
    'user-interaction'
  )

  clickCount.value++

  // 2. 트랜잭션에 메타데이터 추가
  if (transaction) {
    transaction.addLabels({
      interaction_type: 'button_click',
      button_name: buttonName,
      click_count: clickCount.value
    })

    // 3. 트랜잭션 종료
    setTimeout(() => {
      transaction.end()
    }, 100)
  }
}
```

### 트랜잭션 라이프사이클

```
User Action → startTransaction() → 비즈니스 로직 → addLabels() → transaction.end()
     ↓                                                                    ↓
[사용자 클릭]                                                     [APM으로 전송]
```

---

## 🛠 작업 내용

### 1. simple.vue 수정 (`app/pages/simple.vue`)

**수정한 함수들:**
- ✅ `handleClick()` - 버튼 클릭 추적
- ✅ `handleInput()` - 폼 입력 추적
- ✅ `submitForm()` - 폼 제출 추적
- ✅ `handleToggle()` - 토글 변경 추적
- ✅ `handleCheckbox()` - 체크박스 변경 추적

**생성되는 트랜잭션:**
```
- "Button Click: Button 1"
- "Button Click: Button 2"
- "Button Click: Button 3"
- "Form Input: name"
- "Form Input: email"
- "Form Submit"
- "Toggle Change"
- "Checkbox: opt1"
- "Checkbox: opt2"
- "Checkbox: opt3"
```

### 2. diverse.vue 수정 (`app/pages/diverse.vue`)

**수정한 함수들:**
- ✅ `fetchUsers()` - API 호출 추적
- ✅ `fetchPosts()` - API 호출 추적
- ✅ `startTimer()` / `stopTimer()` - 타이머 작업 추적
- ✅ `throwSyncError()` - 동기 에러 추적
- ✅ `throwAsyncError()` - 비동기 에러 추적
- ✅ `simulateNetworkError()` - 네트워크 에러 추적
- ✅ `saveToStorage()` - 로컬 스토리지 저장 추적
- ✅ `loadFromStorage()` - 로컬 스토리지 로드 추적
- ✅ `clearStorage()` - 로컬 스토리지 삭제 추적
- ✅ `runHeavyComputation()` - 무거운 연산 추적

**생성되는 트랜잭션:**
```
- "Fetch Users"
- "Fetch Posts"
- "Timer Operation"
- "Sync Error Test"
- "Async Error Test"
- "Network Error Test"
- "Storage Save"
- "Storage Load"
- "Storage Clear"
- "Heavy Computation"
```

### 3. complex.vue 검증 (`app/pages/complex.vue`)

**확인 결과:**
- ✅ 이미 올바르게 구현되어 있음
- ✅ `runComplexWorkflow()` - custom transactions 사용
- ✅ `runNestedOperations()` - nested spans 사용
- ✅ `submitMultiStep()` - multi-step form tracking 사용

### 4. 디버그 페이지 생성 (`app/pages/debug-apm.vue`)

**목적:**
APM 트랜잭션 생성 및 전송을 실시간으로 디버깅

**기능:**
- ✅ APM 인스턴스 초기화 상태 확인
- ✅ 간단한 트랜잭션 생성 테스트
- ✅ 라벨이 포함된 트랜잭션 테스트
- ✅ 수동 APM API 호출 테스트
- ✅ 콘솔 로그 상세 출력
- ✅ 실시간 테스트 결과 표시

**사용 방법:**
```
http://localhost:3000/debug-apm
```

### 5. 홈페이지 업데이트 (`app/pages/index.vue`)

**추가 사항:**
- ✅ 디버그 페이지 링크 추가
- ✅ 시각적 구분을 위한 노란색 테마 적용

---

## 🔧 기술적 세부사항

### 1. Transaction vs Labels vs Context

| 항목 | 용도 | 사용 시점 | 메서드 |
|------|------|-----------|---------|
| **Transaction** | 사용자 행동의 전체 흐름 추적 | 상호작용 시작 시 | `startTransaction()` |
| **Labels** | 검색/필터링 가능한 태그 | 트랜잭션 내 | `transaction.addLabels()` |
| **Context** | 상세한 메타데이터 | 트랜잭션 내 | `setCustomContext()` (전역) |
| **Span** | 트랜잭션 내 세부 작업 | 트랜잭션 내부 | `startSpan()` |

### 2. Transaction 객체 API

```typescript
// ✅ 사용 가능한 메서드
transaction.addLabels({ key: value })
transaction.end()
transaction.mark(name)

// ❌ 사용 불가능한 메서드
transaction.setCustomContext()  // 존재하지 않음!
```

**중요:** `setCustomContext()`는 **전역 APM 인스턴스의 메서드**이므로 별도로 호출해야 함:

```typescript
// ✅ 올바른 사용법
const transaction = startTransaction('Form Submit', 'user-interaction')

setCustomContext({  // 전역 함수 사용
  form_data: { ... }
})

if (transaction) {
  transaction.addLabels({ ... })  // 트랜잭션 메서드 사용
  transaction.end()
}
```

### 3. 트랜잭션 타이밍 최적화

**문제:** 매우 짧은 트랜잭션은 간혹 누락될 수 있음

**해결책:** `setTimeout()`으로 최소 지속 시간 보장

```typescript
const transaction = startTransaction('Button Click', 'user-interaction')

if (transaction) {
  transaction.addLabels({ ... })

  // 100ms 후 종료하여 안정적인 전송 보장
  setTimeout(() => {
    transaction.end()
  }, 100)
}
```

### 4. 비동기 작업 추적 패턴

**API 호출 패턴:**
```typescript
const fetchData = async () => {
  const transaction = startTransaction('Fetch Users', 'user-interaction')

  try {
    const response = await fetch(url)
    const data = await response.json()

    if (transaction) {
      transaction.addLabels({
        http_status: response.status,
        response_count: data.length
      })
    }
  } catch (error) {
    captureError(error)
  } finally {
    if (transaction) transaction.end()
  }
}
```

**타이머 작업 패턴:**
```typescript
let timerTransaction = null

const startTimer = () => {
  timerTransaction = startTransaction('Timer Operation', 'user-interaction')
  // ... 타이머 로직
}

const stopTimer = () => {
  if (timerTransaction) {
    timerTransaction.addLabels({ ... })
    timerTransaction.end()
    timerTransaction = null
  }
}
```

### 5. 에러 추적 통합

```typescript
const handleError = () => {
  const transaction = startTransaction('Error Test', 'user-interaction')

  try {
    throw new Error('Test error')
  } catch (error) {
    captureError(error)  // APM에 에러 전송

    if (transaction) {
      transaction.addLabels({
        error_type: 'sync',
        error_caught: true
      })
    }
  } finally {
    if (transaction) transaction.end()
  }
}
```

---

## 🧪 테스트 및 검증

### 1. 브라우저 테스트

**확인 항목:**
- ✅ Console에서 "Transaction created" 로그 확인
- ✅ Console에서 "Ending transaction" 로그 확인
- ✅ Network 탭에서 `intake/v2/rum` 요청 확인 (202 응답)
- ✅ Payload에 커스텀 트랜잭션 데이터 포함 확인

### 2. Kibana APM UI 검증

**위치:**
```
Kibana → APM → Services → rumvue-demo → Transactions
```

**확인 항목:**
- ✅ Transaction type 드롭다운에 `user-interaction` 추가됨
- ✅ 버튼 클릭 시 "Button Click: Button X" 트랜잭션 표시
- ✅ API 호출 시 "Fetch Users", "Fetch Posts" 트랜잭션 표시
- ✅ 각 트랜잭션의 Labels 확인 가능
- ✅ 타임라인에서 트랜잭션 지속 시간 확인 가능

### 3. 디버그 페이지 테스트

**테스트 시나리오:**
1. `/debug-apm` 페이지 방문
2. "Test Simple Transaction" 버튼 클릭
3. 콘솔 및 화면에서 테스트 결과 확인
4. Network 탭에서 전송 확인
5. Kibana에서 "Test Simple Transaction" 확인

**결과:** ✅ 모든 테스트 통과

---

## 📊 성과 및 결과

### Before (수정 전)
```
APM Transactions:
├─ page-load
└─ page-exit

👉 사용자 상호작용 추적 불가
```

### After (수정 후)
```
APM Transactions:
├─ page-load
├─ page-exit
├─ user-interaction
│   ├─ Button Click: Button 1
│   ├─ Button Click: Button 2
│   ├─ Form Submit
│   ├─ Toggle Change
│   ├─ Checkbox: opt1
│   ├─ Fetch Users
│   ├─ Fetch Posts
│   ├─ Timer Operation
│   ├─ Storage Save
│   ├─ Heavy Computation
│   └─ ... (총 20+ 트랜잭션 타입)
└─ custom
    ├─ complex-workflow
    ├─ nested-operations
    └─ multi-step-form

👉 모든 사용자 상호작용 추적 가능 ✅
```

### 추적 가능한 메트릭

**각 트랜잭션마다:**
- 📊 실행 횟수
- ⏱️ 평균 지속 시간
- 📈 시간대별 분포
- 🏷️ 커스텀 라벨 (필터링/그룹화 가능)
- 📝 커스텀 컨텍스트 (상세 정보)
- ❌ 에러율

---

## 🎓 학습 내용

### 1. Elastic APM RUM 이해

**핵심 개념:**
- RUM은 페이지 로드와 네트워크 요청을 자동 추적
- 사용자 상호작용은 명시적으로 계측(instrumentation) 필요
- Transaction → Span 계층 구조로 성능 추적

### 2. Vue.js/Nuxt.js 통합

**Best Practices:**
- Composable 패턴으로 APM API 래핑 (`useApm()`)
- Client-side only 플러그인 (`apm.client.ts`)
- 환경 변수로 설정 관리

### 3. 디버깅 기법

**효과적인 디버깅 절차:**
1. 브라우저 콘솔 로그 확인
2. Network 탭에서 요청 확인
3. Payload 내용 검증
4. Kibana 시간 범위 및 필터 조정
5. 전용 디버그 페이지 활용

---

## 🚀 향후 개선 사항

### 1. 자동화 개선

**제안사항:**
- Vue 디렉티브로 자동 추적 구현
  ```vue
  <button v-apm-track="'Button 1 Click'">Click Me</button>
  ```
- Composable 개선으로 보일러플레이트 감소
  ```typescript
  const { trackClick } = useApmTracking()
  <button @click="trackClick('Button 1', handleClick)">
  ```

### 2. 성능 최적화

**고려사항:**
- 샘플링 비율 조정 (`transactionSampleRate`)
- 배치 전송 설정
- 로컬 환경에서 APM 비활성화 옵션

### 3. 추가 메트릭

**추적 가능한 항목:**
- ✅ Core Web Vitals (LCP, FID, CLS)
- ✅ 사용자 세션 정보
- ✅ A/B 테스트 variant 추적
- ✅ Feature flag 상태
- ✅ 사용자 권한 레벨

### 4. 모니터링 대시보드

**구축 아이디어:**
- Kibana Canvas로 커스텀 대시보드
- 주요 사용자 흐름 추적
- 에러율 알림 설정
- SLA 모니터링

### 5. 문서화

**작성 예정:**
- ✅ 팀원을 위한 APM 사용 가이드
- ✅ 트랜잭션 네이밍 컨벤션
- ✅ 라벨 표준화 가이드
- ✅ 트러블슈팅 가이드

---

## 📂 파일 변경 이력

### 수정된 파일

| 파일 | 변경 내용 | 라인 수 |
|------|-----------|---------|
| `app/pages/simple.vue` | 사용자 상호작용 추적 추가 | ~195줄 |
| `app/pages/diverse.vue` | API/타이머/에러 추적 추가 | ~420줄 |
| `app/pages/complex.vue` | 검증 (변경 없음) | ~632줄 |
| `app/pages/debug-apm.vue` | 디버그 페이지 생성 (신규) | ~240줄 |
| `app/pages/index.vue` | 디버그 링크 추가 | ~140줄 |

### 영향받지 않은 파일

- ✅ `app/plugins/apm.client.ts` - 변경 없음
- ✅ `app/composables/useApm.ts` - 변경 없음
- ✅ `.env` - 변경 없음
- ✅ `nuxt.config.ts` - 변경 없음

---

## 🎯 결론

### 주요 성과

1. ✅ **문제 해결:** 사용자 상호작용이 APM에서 보이지 않던 문제 완전 해결
2. ✅ **코드 개선:** 3개 예제 페이지에 20+ 커스텀 트랜잭션 추가
3. ✅ **도구 개발:** 디버깅 페이지로 향후 문제 진단 시간 단축
4. ✅ **지식 전달:** 상세한 기술 문서 및 Best Practices 정리

### 비즈니스 가치

- 📊 **가시성 향상:** 실제 사용자 행동 패턴 추적 가능
- 🐛 **버그 발견:** 에러 발생 컨텍스트 파악
- ⚡ **성능 개선:** 느린 상호작용 식별 및 최적화
- 👥 **사용자 경험:** 데이터 기반 UX 개선 의사결정

### 기술적 배움

Elastic APM RUM의 동작 원리와 Vue.js 통합 방법을 완전히 이해하고,
실전에서 바로 적용 가능한 패턴과 디버깅 기법을 습득했습니다.

---

## 📞 참고 자료

- [Elastic APM RUM 공식 문서](https://www.elastic.co/guide/en/apm/agent/rum-js/current/index.html)
- [Vue.js Integration Guide](https://www.elastic.co/guide/en/apm/agent/rum-js/current/vue-integration.html)
- [Transaction API Reference](https://www.elastic.co/guide/en/apm/agent/rum-js/current/transaction-api.html)

---

**보고서 작성일:** 2025-11-03
**프로젝트 상태:** ✅ 완료
**다음 단계:** RUM Agent 자동화 도구 개발 검토
