# RumVue - Elastic APM RUM Integration Guide

Vue.js & Nuxt.js 환경에서 Elastic APM RUM(Real User Monitoring) 연동 프로젝트입니다.

## 프로젝트 구조

```
RumVue/
├── app/
│   ├── plugins/
│   │   └── apm.client.ts          # Elastic APM RUM 플러그인 설정
│   ├── composables/
│   │   └── useApm.ts               # APM 사용을 위한 컴포저블
│   └── pages/
│       ├── index.vue               # 메인 페이지
│       ├── simple.vue              # 간단한 상호작용 예제
│       ├── diverse.vue             # 다양한 상호작용 예제
│       └── complex.vue             # 복잡한 상호작용 예제
├── .env.example                    # 환경 변수 예제
└── nuxt.config.ts                  # Nuxt 설정
```

## 설치 및 실행

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정 (선택사항)

`.env.example` 파일을 `.env`로 복사하고 실제 Elastic APM 서버 정보를 입력합니다:

```bash
cp .env.example .env
```

`.env` 파일 내용:
```env
NUXT_PUBLIC_APM_SERVER_URL=http://your-apm-server:8200
NUXT_PUBLIC_APM_SERVICE_NAME=your-service-name
NUXT_PUBLIC_APM_SERVICE_VERSION=1.0.0
NUXT_PUBLIC_APM_ENVIRONMENT=development
```

### 3. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 `http://localhost:3000`으로 접속합니다.

## Elastic APM RUM 설정

### APM 서버 설정

`app/plugins/apm.client.ts` 파일에서 APM 설정을 커스터마이징할 수 있습니다:

```typescript
const apm = initApm({
  serviceName: 'rumvue-demo',          // 서비스 이름
  serverUrl: 'http://localhost:8200',   // APM 서버 URL
  serviceVersion: '1.0.0',              // 서비스 버전
  environment: 'development',           // 환경 (dev/staging/prod)
  transactionSampleRate: 1.0,          // 트랜잭션 샘플링 비율 (0.0-1.0)
  distributedTracing: true,            // 분산 추적 활성화
})
```

### 주요 설정 옵션

- **serviceName**: Kibana에서 표시될 애플리케이션 이름
- **serverUrl**: Elastic APM 서버 URL
- **transactionSampleRate**:
  - `1.0` = 모든 트랜잭션 추적 (개발 환경)
  - `0.1` = 10%만 샘플링 (프로덕션 권장)
- **distributedTracing**: 마이크로서비스 간 요청 추적
- **logLevel**: 디버깅을 위한 로그 레벨 (`'debug'`, `'info'`, `'warn'`, `'error'`)

## 기능 예제

### 1. 간단한 상호작용 (`/simple`)

기본적인 사용자 상호작용 추적:

- ✅ 버튼 클릭 이벤트
- ✅ 폼 입력 이벤트
- ✅ 체크박스/토글 상태 변경
- ✅ 커스텀 라벨 추가

### 2. 다양한 상호작용 (`/diverse`)

다양한 브라우저 작업 추적:

- ✅ API 호출 자동 추적 (HTTP spans)
- ✅ 비동기 작업 및 타이머
- ✅ 에러 및 예외 추적
- ✅ 로컬 스토리지 작업
- ✅ 성능 측정 (무거운 계산)

### 3. 복잡한 상호작용 (`/complex`)

고급 APM 기능 활용:

- ✅ 커스텀 트랜잭션 생성
- ✅ 중첩된 스팬 (nested spans)
- ✅ 사용자 컨텍스트 설정
- ✅ 커스텀 컨텍스트 및 라벨
- ✅ 다단계 폼 트랜잭션

## useApm 컴포저블 사용법

프로젝트 어디서나 `useApm()` 컴포저블을 사용하여 APM 기능에 접근할 수 있습니다:

```vue
<script setup>
const {
  startTransaction,
  startSpan,
  setUserContext,
  setCustomContext,
  addLabels,
  captureError
} = useApm()

// 커스텀 트랜잭션 시작
const transaction = startTransaction('checkout-process', 'user-interaction')

// 스팬 생성
const span = startSpan('validate-cart', 'validation')
// ... 작업 수행
span.end()

// 트랜잭션 종료
transaction.end()

// 사용자 컨텍스트 설정
setUserContext({
  id: 'user-123',
  username: 'john_doe',
  email: 'john@example.com'
})

// 커스텀 컨텍스트 추가
setCustomContext({
  shopping_cart: {
    items: 3,
    total: 99.99
  }
})

// 라벨 추가
addLabels({
  payment_method: 'credit_card',
  coupon_used: true
})

// 에러 캡처
try {
  // ... 코드
} catch (error) {
  captureError(error)
}
</script>
```

## 자동으로 추적되는 항목

Elastic APM RUM은 다음 항목을 자동으로 추적합니다:

1. **Page Loads**: 페이지 로드 성능
2. **Route Changes**: Vue Router 경로 변경
3. **HTTP Requests**: Fetch/XHR API 호출
4. **User Interactions**: 클릭, 입력 등
5. **JavaScript Errors**: 처리되지 않은 예외
6. **Long Tasks**: 50ms 이상 걸리는 작업
7. **Browser Metrics**: FCP, LCP, FID 등 Core Web Vitals

## Kibana에서 확인하기

APM 데이터는 Kibana의 APM UI에서 확인할 수 있습니다:

1. Kibana 접속
2. **Observability → APM** 메뉴로 이동
3. 서비스 목록에서 `rumvue-demo` 선택
4. 다음 항목들을 확인:
   - **Transactions**: 페이지별 성능 메트릭
   - **Errors**: 발생한 에러 목록
   - **Metrics**: CPU, 메모리 사용량
   - **Service Map**: 서비스 간 관계도

## 프로덕션 배포 시 권장사항

### 1. 샘플링 비율 조정

```typescript
transactionSampleRate: 0.1  // 10%만 샘플링
```

### 2. 민감한 정보 제외

```typescript
// 사용자 이메일 마스킹
setUserContext({
  id: user.id,
  username: user.username,
  // email은 포함하지 않음
})
```

### 3. 환경별 설정 분리

```typescript
const apm = initApm({
  serviceName: process.env.NUXT_PUBLIC_APM_SERVICE_NAME,
  serverUrl: process.env.NUXT_PUBLIC_APM_SERVER_URL,
  environment: process.env.NUXT_PUBLIC_APM_ENVIRONMENT,
  logLevel: process.env.NODE_ENV === 'development' ? 'debug' : 'warn'
})
```

### 4. 에러 필터링

불필요한 에러는 필터링하여 노이즈를 줄입니다:

```typescript
ignoreTransactions: ['/health', '/metrics'],
```

## 문제 해결

### APM이 초기화되지 않음

1. 브라우저 콘솔에서 에러 확인
2. APM 서버 URL이 올바른지 확인
3. CORS 설정 확인 (APM 서버에서 허용 필요)

### 데이터가 Kibana에 표시되지 않음

1. APM 서버가 실행 중인지 확인
2. `logLevel: 'debug'`로 설정하여 디버그 로그 확인
3. 네트워크 탭에서 APM 서버로의 요청 확인

### 성능 영향

- RUM 에이전트는 매우 가볍고 성능 영향이 미미합니다
- 샘플링 비율을 조정하여 오버헤드 최소화
- 프로덕션에서는 10-20% 샘플링 권장

## 참고 자료

- [Elastic APM RUM 공식 문서](https://www.elastic.co/guide/en/apm/agent/rum-js/current/index.html)
- [Vue.js Integration](https://www.elastic.co/guide/en/apm/agent/rum-js/current/vue-integration.html)
- [Configuration Options](https://www.elastic.co/guide/en/apm/agent/rum-js/current/configuration.html)
- [API Reference](https://www.elastic.co/guide/en/apm/agent/rum-js/current/api.html)

## 라이센스

MIT
