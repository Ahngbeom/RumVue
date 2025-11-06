# RUM Agent 자동화 도구 개발 검토서

**작성일:** 2025-11-03
**목적:** Elastic APM RUM 계측을 자동화하는 Claude Agent 개발 가능성 검토

---

## 📋 목차
1. [개요](#개요)
2. [제안 도구 목록](#제안-도구-목록)
3. [상세 설계](#상세-설계)
4. [구현 난이도 평가](#구현-난이도-평가)
5. [추천 우선순위](#추천-우선순위)
6. [구현 계획](#구현-계획)

---

## 🎯 개요

### 문제점

현재 RUM 계측 방식의 문제:
- ❌ 모든 이벤트 핸들러마다 수동으로 `startTransaction()` 추가 필요
- ❌ 보일러플레이트 코드 반복
- ❌ 개발자가 놓치기 쉬움 (Human Error)
- ❌ 일관성 없는 트랜잭션 네이밍
- ❌ 리팩토링 시 APM 코드 누락 가능

### 목표

**자동화 도구로 달성할 목표:**
1. 🎯 수동 계측 작업 최소화
2. 🎯 일관된 트랜잭션 네이밍
3. 🎯 코드 품질 및 유지보수성 향상
4. 🎯 팀 전체의 APM 도입 장벽 낮춤

---

## 🛠 제안 도구 목록

### 1. RUM Auto-Instrumenter (코드 생성기)

**목적:** Vue 컴포넌트를 분석하여 자동으로 APM 계측 코드 추가

**기능:**
```bash
# CLI 도구
npx rum-instrumenter scan ./app/pages
npx rum-instrumenter add ./app/pages/my-page.vue
npx rum-instrumenter validate ./app/pages
```

**예시:**
```vue
<!-- Before -->
<button @click="handleSubmit">Submit</button>

<script setup>
const handleSubmit = () => {
  // business logic
}
</script>

<!-- After (자동 변환) -->
<button @click="handleSubmit">Submit</button>

<script setup>
const { startTransaction } = useApm()

const handleSubmit = () => {
  const transaction = startTransaction('Form Submit', 'user-interaction')

  try {
    // business logic
  } finally {
    if (transaction) transaction.end()
  }
}
</script>
```

**기술 스택:**
- AST 파싱: `@vue/compiler-sfc`, `babel-parser`
- 코드 변환: `jscodeshift`, `recast`
- CLI: `commander`, `inquirer`

**개발 난이도:** ⭐⭐⭐⭐ (높음)

---

### 2. Vue Directive Plugin (런타임 자동화)

**목적:** Vue 디렉티브로 선언적 계측

**사용법:**
```vue
<template>
  <button
    v-apm-track="'Button Click'"
    @click="handleClick"
  >
    Click Me
  </button>

  <form
    v-apm-track="{ name: 'Form Submit', type: 'form-submit' }"
    @submit.prevent="handleSubmit"
  >
    <!-- ... -->
  </form>
</template>
```

**구현:**
```typescript
// app/plugins/apm-directive.client.ts
export default defineNuxtPlugin((nuxtApp) => {
  const { startTransaction } = useApm()

  nuxtApp.vueApp.directive('apm-track', {
    mounted(el, binding, vnode) {
      const config = typeof binding.value === 'string'
        ? { name: binding.value, type: 'user-interaction' }
        : binding.value

      // 원본 이벤트 핸들러 래핑
      const originalHandler = vnode.props?.onClick || vnode.props?.onSubmit

      if (originalHandler) {
        const wrappedHandler = (...args: any[]) => {
          const transaction = startTransaction(config.name, config.type)

          try {
            const result = originalHandler(...args)

            // Promise 처리
            if (result instanceof Promise) {
              return result.finally(() => {
                if (transaction) transaction.end()
              })
            }

            if (transaction) {
              setTimeout(() => transaction.end(), 100)
            }

            return result
          } catch (error) {
            if (transaction) transaction.end()
            throw error
          }
        }

        // 이벤트 핸들러 교체
        if (vnode.props?.onClick) vnode.props.onClick = wrappedHandler
        if (vnode.props?.onSubmit) vnode.props.onSubmit = wrappedHandler
      }
    }
  })
})
```

**장점:**
- ✅ 최소한의 코드 변경
- ✅ 선언적이고 읽기 쉬움
- ✅ 런타임에 동적으로 활성화/비활성화 가능

**단점:**
- ⚠️ 모든 이벤트 타입 지원 필요 (click, submit, input, etc.)
- ⚠️ 복잡한 이벤트 핸들러는 수동 처리 필요

**개발 난이도:** ⭐⭐⭐ (중간)

---

### 3. Composable Helper (개발자 편의 도구)

**목적:** 보일러플레이트 코드 감소

**구현:**
```typescript
// app/composables/useApmTracking.ts
export const useApmTracking = () => {
  const { startTransaction } = useApm()

  /**
   * 이벤트 핸들러를 APM 트랜잭션으로 래핑
   */
  const trackHandler = <T extends (...args: any[]) => any>(
    name: string,
    handler: T,
    options?: {
      type?: string
      labels?: Record<string, any>
    }
  ): T => {
    return ((...args: any[]) => {
      const transaction = startTransaction(
        name,
        options?.type || 'user-interaction'
      )

      if (transaction && options?.labels) {
        transaction.addLabels(options.labels)
      }

      try {
        const result = handler(...args)

        // Promise 처리
        if (result instanceof Promise) {
          return result.finally(() => {
            if (transaction) {
              setTimeout(() => transaction.end(), 100)
            }
          })
        }

        if (transaction) {
          setTimeout(() => transaction.end(), 100)
        }

        return result
      } catch (error) {
        if (transaction) transaction.end()
        throw error
      }
    }) as T
  }

  /**
   * 버튼 클릭 전용 헬퍼
   */
  const trackClick = (name: string, handler: () => void) => {
    return trackHandler(name, handler, {
      type: 'user-interaction',
      labels: { interaction_type: 'click' }
    })
  }

  /**
   * API 호출 전용 헬퍼
   */
  const trackApiCall = async <T>(
    name: string,
    apiCall: () => Promise<T>
  ): Promise<T> => {
    const transaction = startTransaction(name, 'api-call')

    try {
      const result = await apiCall()

      if (transaction) {
        transaction.addLabels({
          api_success: true
        })
      }

      return result
    } catch (error) {
      if (transaction) {
        transaction.addLabels({
          api_success: false
        })
      }
      throw error
    } finally {
      if (transaction) transaction.end()
    }
  }

  /**
   * 폼 제출 전용 헬퍼
   */
  const trackFormSubmit = (
    name: string,
    handler: () => void | Promise<void>,
    formData?: Record<string, any>
  ) => {
    return trackHandler(name, handler, {
      type: 'form-submit',
      labels: {
        interaction_type: 'form_submit',
        has_data: !!formData
      }
    })
  }

  return {
    trackHandler,
    trackClick,
    trackApiCall,
    trackFormSubmit
  }
}
```

**사용 예시:**
```vue
<script setup lang="ts">
const { trackClick, trackApiCall, trackFormSubmit } = useApmTracking()

// Before (수동)
const handleClick = () => {
  const transaction = startTransaction('Button Click', 'user-interaction')
  clickCount.value++
  if (transaction) {
    transaction.addLabels({ ... })
    transaction.end()
  }
}

// After (헬퍼 사용)
const handleClick = trackClick('Button Click', () => {
  clickCount.value++
})

// API 호출
const fetchUsers = () => trackApiCall('Fetch Users', async () => {
  const response = await fetch('/api/users')
  return response.json()
})

// 폼 제출
const handleSubmit = trackFormSubmit('Form Submit', () => {
  // business logic
}, formData)
</script>
```

**장점:**
- ✅ 구현 간단
- ✅ 즉시 사용 가능
- ✅ 타입 안전성
- ✅ 기존 코드와 호환

**개발 난이도:** ⭐ (낮음)

---

### 4. ESLint Plugin (코드 품질 검증)

**목적:** 계측 누락 감지 및 경고

**규칙:**
```typescript
// eslint-plugin-apm-rum/rules/require-tracking.js
module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Ensure user interactions are tracked with APM',
    },
  },
  create(context) {
    return {
      // @click 핸들러 감지
      'VAttribute[key.name="click"]'(node) {
        const handler = node.value

        // startTransaction 호출 확인
        // (간단한 구현 예시)
        const hasTracking = checkIfHandlerHasTracking(handler)

        if (!hasTracking) {
          context.report({
            node,
            message: 'Click handler should be tracked with APM',
            suggest: [
              {
                desc: 'Wrap with trackClick()',
                fix(fixer) {
                  // 자동 수정 코드
                }
              }
            ]
          })
        }
      }
    }
  }
}
```

**.eslintrc.js 설정:**
```javascript
module.exports = {
  plugins: ['apm-rum'],
  rules: {
    'apm-rum/require-tracking': 'warn',
    'apm-rum/consistent-naming': 'error',
    'apm-rum/no-missing-transaction-end': 'error'
  }
}
```

**경고 예시:**
```
⚠ Click handler should be tracked with APM (apm-rum/require-tracking)
  at components/Button.vue:45:10

💡 Suggestion: Wrap with trackClick()
```

**개발 난이도:** ⭐⭐⭐⭐ (높음)

---

### 5. VSCode Extension (개발 경험 향상)

**목적:** IDE 내에서 APM 계측 자동 완성 및 스니펫

**기능:**

1. **스니펫:**
```json
{
  "APM Track Handler": {
    "prefix": "apm-track",
    "body": [
      "const ${1:handlerName} = trackClick('${2:Transaction Name}', () => {",
      "  $0",
      "})"
    ]
  },
  "APM Transaction": {
    "prefix": "apm-trans",
    "body": [
      "const transaction = startTransaction('${1:name}', '${2:user-interaction}')",
      "try {",
      "  $0",
      "} finally {",
      "  if (transaction) transaction.end()",
      "}"
    ]
  }
}
```

2. **Hover 정보:**
```typescript
// 함수 위에 마우스 올리면 표시
/**
 * ⚠️ This handler is not tracked by APM
 *
 * Suggested: Wrap with trackClick()
 */
const handleClick = () => { ... }
```

3. **CodeLens (인라인 액션):**
```vue
<script>
const handleClick = () => { ... }
// [Track with APM] 버튼 표시
</script>
```

**개발 난이도:** ⭐⭐⭐⭐ (높음)

---

### 6. Testing Utilities (테스트 자동화)

**목적:** APM 계측이 올바르게 작동하는지 검증

**구현:**
```typescript
// tests/utils/apm-test-helper.ts
import { vi } from 'vitest'

export const createApmMock = () => {
  const transactions: any[] = []

  const mockApm = {
    startTransaction: vi.fn((name: string, type: string) => {
      const transaction = {
        name,
        type,
        labels: {} as Record<string, any>,
        addLabels: vi.fn((labels) => {
          Object.assign(transaction.labels, labels)
        }),
        end: vi.fn()
      }
      transactions.push(transaction)
      return transaction
    })
  }

  return {
    mockApm,
    transactions,
    getLastTransaction: () => transactions[transactions.length - 1],
    assertTransactionCreated: (name: string) => {
      const found = transactions.find(t => t.name === name)
      expect(found).toBeDefined()
      return found
    },
    assertTransactionEnded: (name: string) => {
      const transaction = transactions.find(t => t.name === name)
      expect(transaction?.end).toHaveBeenCalled()
    }
  }
}
```

**테스트 예시:**
```typescript
// tests/pages/simple.spec.ts
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import SimplePage from '@/pages/simple.vue'
import { createApmMock } from '@/tests/utils/apm-test-helper'

describe('SimplePage APM tracking', () => {
  it('should track button click', async () => {
    const { mockApm, assertTransactionCreated, assertTransactionEnded } = createApmMock()

    // Mock useApm
    vi.mock('@/composables/useApm', () => ({
      useApm: () => ({ startTransaction: mockApm.startTransaction })
    }))

    const wrapper = mount(SimplePage)

    // 버튼 클릭
    await wrapper.find('button').trigger('click')

    // 검증
    const transaction = assertTransactionCreated('Button Click: Button 1')
    expect(transaction.type).toBe('user-interaction')
    expect(transaction.labels.interaction_type).toBe('button_click')
    assertTransactionEnded('Button Click: Button 1')
  })
})
```

**개발 난이도:** ⭐⭐ (낮음-중간)

---

## 📊 구현 난이도 평가

| 도구 | 난이도 | 개발 시간 | 유지보수 | 즉시 효과 | 추천도 |
|------|--------|-----------|----------|-----------|--------|
| **Composable Helper** | ⭐ | 2-4시간 | 낮음 | ⭐⭐⭐⭐⭐ | ✅✅✅✅✅ |
| **Testing Utilities** | ⭐⭐ | 4-8시간 | 낮음 | ⭐⭐⭐⭐ | ✅✅✅✅ |
| **Vue Directive** | ⭐⭐⭐ | 1-2일 | 중간 | ⭐⭐⭐⭐ | ✅✅✅ |
| **ESLint Plugin** | ⭐⭐⭐⭐ | 3-5일 | 높음 | ⭐⭐⭐ | ✅✅ |
| **Auto-Instrumenter** | ⭐⭐⭐⭐ | 5-10일 | 높음 | ⭐⭐⭐⭐⭐ | ✅✅✅ |
| **VSCode Extension** | ⭐⭐⭐⭐ | 5-7일 | 중간 | ⭐⭐⭐ | ✅✅ |

---

## 🎯 추천 우선순위

### Phase 1: 즉시 구현 (1-2일)
**목표:** 개발자 경험 즉시 개선

1. ✅ **Composable Helper** (`useApmTracking`)
   - 개발 시간: 2-4시간
   - 즉시 사용 가능
   - 기존 코드 리팩토링에 활용

2. ✅ **Testing Utilities**
   - 개발 시간: 4-8시간
   - CI/CD 통합
   - 회귀 방지

### Phase 2: 중기 개선 (1-2주)
**목표:** 자동화 강화

3. ✅ **Vue Directive Plugin**
   - 개발 시간: 1-2일
   - 선언적 계측
   - 신규 컴포넌트에 적용

4. ✅ **VSCode Snippets** (Extension 전 단계)
   - 개발 시간: 2-3시간
   - JSON 스니펫만 추가
   - 개발 속도 향상

### Phase 3: 장기 고도화 (1개월+)
**목표:** 엔터프라이즈급 도구

5. ⏸️ **ESLint Plugin**
   - 팀 규모가 커질 때
   - 코드 품질 강화

6. ⏸️ **Auto-Instrumenter CLI**
   - 레거시 코드 마이그레이션
   - 대규모 리팩토링 시

7. ⏸️ **VSCode Extension (전체)**
   - 커뮤니티 공유
   - 오픈소스화

---

## 🚀 구현 계획

### Phase 1: Quick Wins (이번 주)

#### 1️⃣ Composable Helper

**작업 단계:**
```bash
1. app/composables/useApmTracking.ts 생성
2. trackClick, trackApiCall, trackFormSubmit 구현
3. simple.vue 리팩토링 (예제)
4. 테스트 작성
5. 문서화 (README-APM.md 업데이트)
```

**예상 결과:**
```vue
<!-- 기존: 10줄 -->
const handleClick = () => {
  const transaction = startTransaction('Button Click', 'user-interaction')
  clickCount.value++
  if (transaction) {
    transaction.addLabels({ ... })
    setTimeout(() => transaction.end(), 100)
  }
}

<!-- 개선: 3줄 -->
const handleClick = trackClick('Button Click', () => {
  clickCount.value++
})
```

**코드 감소:** 약 70% ⬇️

#### 2️⃣ Testing Utilities

**작업 단계:**
```bash
1. tests/utils/apm-test-helper.ts 생성
2. Vitest 설정
3. simple.vue 테스트 작성 (예제)
4. CI/CD 통합 (.github/workflows/test.yml)
5. 커버리지 리포트 설정
```

**예상 효과:**
- ✅ 계측 누락 방지
- ✅ 리팩토링 자신감
- ✅ 문서화된 예제

---

### Phase 2: Automation (다음 주)

#### 3️⃣ Vue Directive Plugin

**작업 단계:**
```bash
1. app/plugins/apm-directive.client.ts 생성
2. v-apm-track 디렉티브 구현
3. 이벤트 타입별 처리 (click, submit, input)
4. diverse.vue 적용 (예제)
5. 문서화 및 데모
```

**마이그레이션 예시:**
```vue
<!-- Before -->
<button @click="handleClick">Click</button>

<script setup>
const handleClick = trackClick('Button 1', () => { ... })
</script>

<!-- After -->
<button
  v-apm-track="'Button 1 Click'"
  @click="() => { ... }"
>
  Click
</button>

<!-- 더 이상 trackClick 래퍼 불필요 -->
```

#### 4️⃣ VSCode Snippets

**작업 단계:**
```bash
1. .vscode/apm.code-snippets 생성
2. 주요 패턴 10개 스니펫 작성
3. 팀 공유 (workspace 설정)
4. 사용 가이드 작성
```

**스니펫 목록:**
- `apm-track` - trackClick 헬퍼
- `apm-trans` - 전체 트랜잭션 블록
- `apm-api` - API 호출 추적
- `apm-form` - 폼 제출 추적
- 등등...

---

### Phase 3: Enterprise (향후)

#### 5️⃣ ESLint Plugin

**구현 범위:**
- 계측 누락 감지
- 네이밍 컨벤션 검증
- 트랜잭션 종료 검증
- 자동 수정 제안

#### 6️⃣ Auto-Instrumenter CLI

**기능:**
- AST 파싱 및 코드 변환
- Dry-run 모드
- Git diff 생성
- 배치 처리

#### 7️⃣ Full VSCode Extension

**고급 기능:**
- IntelliSense
- 코드 액션
- 리팩토링 도구
- APM 데이터 뷰어

---

## 💡 빠른 시작 가이드

### 지금 바로 시작할 수 있는 것

#### Option A: Composable Helper (추천)

**1. 파일 생성:**
```bash
touch app/composables/useApmTracking.ts
```

**2. 코드 작성:** (위 "Composable Helper" 섹션 참고)

**3. 사용:**
```vue
<script setup>
const { trackClick } = useApmTracking()

const handleClick = trackClick('Button Click', () => {
  // business logic
})
</script>
```

**결과:** ✅ 즉시 코드 간소화

---

#### Option B: VSCode Snippets

**1. 파일 생성:**
```bash
mkdir -p .vscode
touch .vscode/apm.code-snippets
```

**2. 스니펫 작성:**
```json
{
  "APM Track Click": {
    "prefix": "apm-click",
    "body": [
      "const ${1:handlerName} = trackClick('${2:Transaction Name}', () => {",
      "  $0",
      "})"
    ],
    "description": "Track button click with APM"
  }
}
```

**3. 사용:**
- `apm-click` 입력 → Tab
- 자동 완성

**결과:** ✅ 개발 속도 향상

---

## ✅ 결론

### 실현 가능성

| 항목 | 평가 | 비고 |
|------|------|------|
| **기술적 실현 가능성** | ✅ 높음 | 모든 도구가 현재 기술로 구현 가능 |
| **ROI (투자 대비 효과)** | ✅ 높음 | Phase 1만으로도 큰 효과 |
| **유지보수 부담** | ⚠️ 중간 | Phase 1-2는 낮음, Phase 3은 높음 |
| **팀 도입 장벽** | ✅ 낮음 | 점진적 도입 가능 |

### 추천 사항

**✅ 즉시 시작:**
1. Composable Helper (`useApmTracking`) 구현
2. VSCode Snippets 추가
3. Testing Utilities 구현

**⏸️ 추후 검토:**
4. Vue Directive Plugin
5. ESLint Plugin
6. Auto-Instrumenter CLI

### 예상 효과

**정량적 효과:**
- 코드량 감소: 약 60-70% ⬇️
- 개발 시간 단축: 약 50% ⬇️
- 버그 감소: 테스트 자동화로 약 80% ⬇️

**정성적 효과:**
- ✅ 개발자 경험 향상
- ✅ 코드 일관성 증가
- ✅ 팀 협업 효율화
- ✅ 신규 개발자 온보딩 간소화

---

## 🎬 다음 단계

### 즉시 실행 가능

1. **Composable Helper 구현** (2-4시간)
   ```bash
   touch app/composables/useApmTracking.ts
   # 코드 작성
   # simple.vue 리팩토링
   # 테스트
   ```

2. **VSCode Snippets 추가** (30분)
   ```bash
   mkdir -p .vscode
   touch .vscode/apm.code-snippets
   # 스니펫 작성
   ```

3. **문서 업데이트** (1시간)
   ```bash
   # README-APM.md에 새로운 패턴 추가
   # 예제 코드 업데이트
   ```

### 의사결정 필요

- Phase 2 도구 개발 여부
- Phase 3 장기 투자 검토
- 오픈소스 공개 여부

---

**검토 완료일:** 2025-11-03
**권장 조치:** Phase 1 도구 즉시 구현 시작 ✅
**예상 완료:** 1-2일 내
