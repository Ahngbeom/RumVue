# Component Tracking in Elastic APM

APM에서 Vue 컴포넌트를 추적하고 디버깅하는 방법에 대한 가이드입니다.

## 목차

1. [개요](#개요)
2. [기본 사용법](#기본-사용법)
3. [추적되는 정보](#추적되는-정보)
4. [APM에서 확인하는 방법](#apm에서-확인하는-방법)
5. [고급 기능](#고급-기능)
6. [예제](#예제)

---

## 개요

`useComponentTracking` 컴포저블을 사용하면 Vue 컴포넌트의 라이프사이클, 사용자 액션, 에러를 자동으로 Elastic APM에 추적할 수 있습니다.

### 주요 기능

- ✅ 컴포넌트명 자동 추적
- ✅ 컴포넌트 계층 구조 추적 (부모 > 자식 > 손자)
- ✅ 컴포넌트 브레드크럼 (최근 방문 경로)
- ✅ 컴포넌트별 액션 추적
- ✅ 컴포넌트별 에러 추적 (자동 컨텍스트 포함)
- ✅ Props 및 상태 정보 자동 수집

---

## 기본 사용법

### 1. 컴포넌트에서 기본 추적 설정

```vue
<script setup lang="ts">
const { componentName, trackAction, trackError } = useComponentTracking({
  trackLifecycle: true,  // mount/unmount 자동 추적
  trackProps: true,      // props를 브레드크럼에 포함
})

// 컴포넌트명이 자동으로 추적됩니다
console.log('Current component:', componentName)
</script>
```

### 2. 사용자 액션 추적

```vue
<script setup lang="ts">
const { trackAction } = useComponentTracking()

const handleButtonClick = () => {
  const span = trackAction('button-clicked', {
    button_type: 'submit',
    form_valid: true
  })

  // 작업 수행
  doSomething()

  // 스팬 종료
  if (span) span.end()
}
</script>
```

### 3. 에러 추적

```vue
<script setup lang="ts">
const { trackError } = useComponentTracking()

const handleSubmit = async () => {
  try {
    await submitForm()
  } catch (error) {
    // 컴포넌트 정보와 함께 에러 추적
    trackError(error, {
      user_action: 'form_submit',
      form_data: { /* ... */ }
    })
  }
}
</script>
```

### 4. 커스텀 컴포넌트명 지정

```vue
<script setup lang="ts">
const { componentName } = useComponentTracking({
  componentName: 'MyCustomComponentName'
})
</script>
```

---

## 추적되는 정보

### 자동으로 수집되는 정보

#### 1. 컴포넌트 기본 정보
- `component_name`: 컴포넌트 이름
- `component_hierarchy`: 컴포넌트 계층 구조 (문자열)
- `component.hierarchy`: 컴포넌트 계층 배열
- `component.route`: 현재 라우트 경로

#### 2. 라이프사이클 이벤트
- `component_lifecycle: 'mounted'`: 컴포넌트 마운트
- `component_lifecycle: 'unmounted'`: 컴포넌트 언마운트
- `component.mounted_at`: 마운트 시간 (ISO 8601)

#### 3. 브레드크럼
- 최근 방문한 20개 컴포넌트 경로
- 각 브레드크럼에 포함:
  - `name`: 컴포넌트 이름
  - `timestamp`: 방문 시간
  - `route`: 라우트 경로
  - `props`: 컴포넌트 props (선택적)

#### 4. 에러 컨텍스트
에러 발생 시 자동으로 추가되는 정보:
- `error_component`: 에러 발생 컴포넌트명
- `error_hierarchy`: 컴포넌트 계층 경로
- `error_component.name`: 컴포넌트 이름
- `error_component.hierarchy`: 계층 배열
- `error_component.breadcrumbs`: 최근 10개 브레드크럼

---

## APM에서 확인하는 방법

### 1. Errors 탭에서 컴포넌트별 에러 확인

**Kibana APM > Errors**

필터 사용:
```
error_component: "ComponentName"
error_hierarchy: "Parent > Child > ComponentName"
```

에러 상세 페이지에서 확인 가능한 정보:
- **Labels** 탭:
  - `error_component`: 에러 발생 컴포넌트
  - `error_hierarchy`: 전체 계층 경로

- **Metadata** 탭:
  - `error_component.name`: 컴포넌트명
  - `error_component.hierarchy`: 계층 배열
  - `error_component.breadcrumbs`: 브레드크럼 (최근 10개)
  - `error_component.route`: 라우트 경로

### 2. Transactions 탭에서 컴포넌트 액션 확인

**Kibana APM > Transactions**

필터 사용:
```
component_name: "ComponentName"
component_action: "action-name"
```

트랜잭션 상세 페이지에서 확인 가능한 정보:
- **Labels** 탭:
  - `component_name`: 액션 발생 컴포넌트
  - `component_action`: 액션 이름
  - `component_hierarchy`: 계층 경로

- **Metadata** 탭:
  - `component_action.component`: 컴포넌트명
  - `component_action.action`: 액션명
  - `component_action.metadata`: 커스텀 메타데이터

### 3. 컴포넌트 계층 구조로 필터링

특정 컴포넌트 계층에서 발생한 모든 이벤트 찾기:

```
component_hierarchy: "*Parent*Child*"
```

특정 부모 컴포넌트 하위의 모든 이벤트:

```
component_hierarchy: "ParentComponent*"
```

---

## 고급 기능

### 1. 컴포넌트 정보 조회

```vue
<script setup lang="ts">
const { getComponentInfo, getComponentBreadcrumbs } = useComponentTracking()

// 현재 컴포넌트 정보
const info = getComponentInfo()
console.log('Component info:', info)
// {
//   name: 'MyComponent',
//   hierarchy: ['App', 'Layout', 'MyComponent'],
//   hierarchyPath: 'App > Layout > MyComponent',
//   route: '/my-route',
//   breadcrumbs: [...]
// }

// 최근 브레드크럼 가져오기
const breadcrumbs = getComponentBreadcrumbs(5)
console.log('Recent breadcrumbs:', breadcrumbs)
</script>
```

### 2. 전역 에러 핸들러

모든 Vue 컴포넌트 에러는 자동으로 APM 플러그인의 전역 에러 핸들러에 의해 캐치됩니다.

`app/plugins/apm.client.ts`에서 설정:

```typescript
nuxtApp.vueApp.config.errorHandler = (err, instance, info) => {
  // 컴포넌트 정보 자동 수집
  // APM에 에러 전송
}
```

이를 통해 명시적으로 `trackError`를 호출하지 않아도 모든 에러가 컴포넌트 정보와 함께 추적됩니다.

### 3. 브레드크럼 관리

브레드크럼은 전역으로 관리되며 최근 20개까지 저장됩니다:

```vue
<script setup lang="ts">
import { getComponentBreadcrumbs } from '@/composables/useComponentTracking'

// 전역 브레드크럼 가져오기
const allBreadcrumbs = getComponentBreadcrumbs(20)
</script>
```

---

## 예제

### 예제 1: 기본 카드 컴포넌트 추적

```vue
<template>
  <div class="card">
    <h3>{{ title }}</h3>
    <button @click="handleAction">Click Me</button>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  title: string
}>()

const { trackAction, trackError } = useComponentTracking({
  trackLifecycle: true,
  trackProps: true
})

const handleAction = () => {
  const span = trackAction('button-click', {
    title: props.title
  })

  try {
    // 작업 수행
    doSomething()
  } catch (error) {
    trackError(error, {
      user_action: 'button_click',
      card_title: props.title
    })
  } finally {
    if (span) span.end()
  }
}
</script>
```

### 예제 2: 폼 컴포넌트 추적

```vue
<template>
  <form @submit.prevent="handleSubmit">
    <input
      v-model="formData.name"
      @focus="trackFieldFocus('name')"
      @blur="trackFieldBlur('name')"
    />
    <button type="submit">Submit</button>
  </form>
</template>

<script setup lang="ts">
const { trackAction, trackError } = useComponentTracking()

const formData = reactive({ name: '' })

const trackFieldFocus = (field: string) => {
  const span = trackAction('field-focus', { field })
  if (span) setTimeout(() => span.end(), 50)
}

const trackFieldBlur = (field: string) => {
  const span = trackAction('field-blur', {
    field,
    value_length: formData[field].length
  })
  if (span) setTimeout(() => span.end(), 50)
}

const handleSubmit = async () => {
  const span = trackAction('form-submit', {
    form_data: formData
  })

  try {
    await submitToAPI(formData)
  } catch (error) {
    trackError(error, {
      user_action: 'form_submit',
      form_state: formData
    })
  } finally {
    if (span) span.end()
  }
}
</script>
```

### 예제 3: 중첩된 컴포넌트 추적

```vue
<!-- ParentComponent.vue -->
<template>
  <div>
    <ChildComponent :data="parentData" />
  </div>
</template>

<script setup lang="ts">
const { componentName } = useComponentTracking({
  componentName: 'ParentComponent'
})
// Hierarchy: ParentComponent
</script>

<!-- ChildComponent.vue -->
<template>
  <div>
    <GrandchildComponent />
  </div>
</template>

<script setup lang="ts">
const { componentName, hierarchyPath } = useComponentTracking()
// Hierarchy: ParentComponent > ChildComponent
console.log(hierarchyPath) // "ParentComponent > ChildComponent"
</script>

<!-- GrandchildComponent.vue -->
<script setup lang="ts">
const { trackError } = useComponentTracking()
// Hierarchy: ParentComponent > ChildComponent > GrandchildComponent

const throwError = () => {
  trackError(new Error('Test error'), {
    level: 'grandchild'
  })
  // APM에 다음 정보가 기록됩니다:
  // - error_component: GrandchildComponent
  // - error_hierarchy: ParentComponent > ChildComponent > GrandchildComponent
}
</script>
```

---

## 데모 페이지

실제 동작을 확인하려면 다음 페이지를 방문하세요:

**`/component-tracking`**

이 페이지에서는 다음을 시연합니다:
- 컴포넌트 정보 실시간 표시
- 브레드크럼 추적
- 다양한 컴포넌트 액션 추적
- 폼 인터랙션 추적
- 에러 추적 (페이지 레벨, 비동기, 중첩 컴포넌트)
- APM에서 확인하는 방법

---

## 파일 구조

```
app/
├── plugins/
│   └── apm.client.ts              # 전역 에러 핸들러 포함
├── composables/
│   ├── useApm.ts                   # 기본 APM 기능
│   └── useComponentTracking.ts    # 컴포넌트 추적 기능 ⭐
├── components/
│   ├── TrackedCard.vue            # 추적 가능한 카드 컴포넌트
│   ├── TrackedList.vue            # 추적 가능한 리스트 컴포넌트
│   ├── TrackedListItem.vue        # 추적 가능한 리스트 아이템
│   └── TrackedForm.vue            # 추적 가능한 폼 컴포넌트
└── pages/
    └── component-tracking.vue     # 데모 페이지
```

---

## 문제 해결

### 컴포넌트명이 "AnonymousComponent"로 표시됨

**원인**: 컴포넌트에 명시적인 이름이 없습니다.

**해결책**:
```vue
<script setup lang="ts">
// 옵션 1: useComponentTracking에 이름 지정
const { componentName } = useComponentTracking({
  componentName: 'MyComponent'
})

// 옵션 2: 컴포넌트에 name 지정 (Vue 3.3+)
defineOptions({
  name: 'MyComponent'
})
</script>
```

### 브레드크럼이 기록되지 않음

**원인**: `trackProps: false`로 설정되어 있거나 컴포넌트가 마운트되지 않았습니다.

**해결책**:
```vue
<script setup lang="ts">
useComponentTracking({
  trackLifecycle: true,  // 라이프사이클 추적 활성화
  trackProps: true        // props 브레드크럼 포함
})
</script>
```

### APM에 데이터가 보이지 않음

1. Elastic APM 서버가 실행 중인지 확인
2. 환경 변수 설정 확인 (`.env` 파일)
3. 브라우저 개발자 도구의 Network 탭에서 APM 요청 확인
4. `/debug-apm` 페이지에서 APM 상태 확인

---

## 추가 자료

- [Elastic APM RUM 공식 문서](https://www.elastic.co/guide/en/apm/agent/rum-js/current/index.html)
- [Vue Error Handling](https://vuejs.org/api/application.html#app-config-errorhandler)
- [APM 설정 가이드](./apm-setup.md)
- [전체 문서 보기](../README.md)
