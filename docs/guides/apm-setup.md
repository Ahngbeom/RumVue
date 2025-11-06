# RumVue - Elastic APM RUM Integration Guide

Vue.js & Nuxt.js 환경에서 Elastic APM RUM(Real User Monitoring) 연동 프로젝트입니다.

## 프로젝트 구조

```
RumVue/
├── app/
│   ├── plugins/
│   │   └── apm.client.ts                # Elastic APM RUM 플러그인 설정
│   ├── composables/
│   │   ├── useApm.ts                    # APM 사용을 위한 컴포저블
│   │   └── useComponentTracking.ts     # 컴포넌트 추적 & 성능 측정
│   ├── components/
│   │   ├── TrackedPerformance.vue       # 성능 추적 컴포넌트
│   │   ├── TrackedCard.vue              # 추적 가능한 카드 컴포넌트
│   │   ├── TrackedForm.vue              # 추적 가능한 폼 컴포넌트
│   │   └── TrackedList.vue              # 추적 가능한 리스트 컴포넌트
│   └── pages/
│       ├── index.vue                    # 메인 페이지
│       ├── simple.vue                   # 간단한 상호작용 예제
│       ├── diverse.vue                  # 다양한 상호작용 예제
│       ├── complex.vue                  # 복잡한 상호작용 예제
│       ├── component-tracking.vue       # 컴포넌트 추적 예제
│       └── performance.vue              # 성능 추적 예제 ⭐ NEW
├── .env.example                         # 환경 변수 예제
└── nuxt.config.ts                       # Nuxt 설정
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

### 4. 컴포넌트 성능 추적 (`/performance`) ⭐ NEW

컴포넌트 렌더링 성능 및 메모리 사용량 모니터링:

- ✅ 렌더링 시간 자동 측정 (onBeforeMount → onMounted)
- ✅ 메모리 사용량 추적 (Chrome/Edge)
- ✅ 업데이트 성능 분석 (re-render 소요 시간)
- ✅ Performance Timeline 마크 생성 (DevTools 연동)
- ✅ 실시간 메트릭 대시보드
- ✅ APM에 자동으로 전송 (Kibana에서 확인 가능)

#### 사용 방법

```vue
<script setup>
const { performanceMetrics, getPerformanceMetrics } = useComponentTracking({
  trackPerformance: true  // 성능 추적 활성화
})

// 실시간 메트릭 접근
console.log(performanceMetrics.value.renderTime)      // 렌더링 시간 (ms)
console.log(performanceMetrics.value.updateCount)     // 업데이트 횟수
console.log(performanceMetrics.value.avgUpdateTime)   // 평균 업데이트 시간 (ms)
console.log(performanceMetrics.value.memory?.usedMB)  // 메모리 사용량 (MB)

// 현재 메트릭 스냅샷
const metrics = getPerformanceMetrics()
</script>
```

#### TrackedPerformance 컴포넌트

성능 추적이 내장된 재사용 가능한 컴포넌트:

```vue
<template>
  <TrackedPerformance
    title="My Component"
    :showMetrics="true"
    :showActions="true"
  >
    <!-- 여기에 컨텐츠 추가 -->
  </TrackedPerformance>
</template>
```

#### 추적되는 성능 메트릭

| 메트릭 | 설명 | 단위 |
|--------|------|------|
| **renderTime** | 컴포넌트 마운트 소요 시간 | ms |
| **updateCount** | 컴포넌트 업데이트 횟수 | count |
| **lastUpdateTime** | 마지막 업데이트 소요 시간 | ms |
| **avgUpdateTime** | 평균 업데이트 소요 시간 | ms |
| **memory.usedMB** | JS 힙 메모리 사용량 (Chrome/Edge) | MB |
| **memory.totalMB** | JS 힙 메모리 전체 크기 | MB |

#### Performance Timeline 확인

1. 브라우저 DevTools 열기 (F12)
2. **Performance** 탭 선택
3. 🔴 Record → 페이지 상호작용 → ⏹️ Stop
4. **User Timing** 섹션에서 컴포넌트별 타임라인 확인:
   - `ComponentName-render-start`
   - `ComponentName-render-end`
   - `ComponentName-update-N-start`
   - `ComponentName-update-N-end`

또는 콘솔에서 직접 확인:
```javascript
performance.getEntriesByType('measure')
  .filter(entry => entry.name.includes('TrackedPerformance'))
```

#### Kibana에서 확인

1. **APM → Services → rumvue-demo**
2. **Transactions** 탭
3. 필터링: `transaction.type: "component-render"`
4. 라벨로 검색:
   ```
   labels.component_name: "TrackedPerformance"
   labels.render_time_ms > 50
   ```

#### 제약사항

- **메모리 API**: Chrome/Edge만 지원 (Firefox, Safari 미지원)
- **정확도**: 프로덕션 환경에서 메모리 측정 정확도가 낮을 수 있음
- **오버헤드**: 모든 컴포넌트 추적 시 성능 영향 → 중요한 컴포넌트만 선택적 추적 권장

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

## 📦 소스맵 업로드 (Source Map Upload)

### 소스맵이 필요한 이유

프로덕션 환경에서는 JavaScript 코드가 압축/난독화됩니다. 소스맵을 APM Server에 업로드하면:

✅ **읽기 쉬운 에러 스택 트레이스**
```javascript
// 소스맵 없이
Error: Cannot read property 'user' of undefined
  at e.t (main.abc123.js:1:4567)

// 소스맵 있음
Error: Cannot read property 'user' of undefined
  at handleUserClick (src/components/UserProfile.vue:45:12)
```

✅ **빠른 디버깅**: 원본 파일명과 정확한 라인 번호
✅ **프로덕션 지원**: 압축된 코드를 수동으로 분석할 필요 없음
✅ **팀 협업**: 명확한 에러 위치 공유

### 설정 방법

#### 1. 소스맵 생성 (자동 완료)

`nuxt.config.ts`에 이미 설정되어 있습니다:

```typescript
sourcemap: {
  server: true,
  client: process.env.NODE_ENV === 'production' ? 'hidden' : true
}
```

**설명**:
- `'hidden'`: 소스맵 파일 생성하되, 브라우저에서 접근 불가 (보안)
- `true`: 개발 환경에서 소스맵 활성화

#### 2. 빌드 실행

```bash
npm run build
```

빌드 후 `.output/public/_nuxt/*.js.map` 파일들이 생성됩니다.

#### 3. APM Server에 소스맵 업로드

**방법 A: npm 스크립트 사용 (권장)**

```bash
# 환경 변수 설정 (선택사항)
export APM_SERVER_URL=http://localhost:8200
export APM_SERVICE_NAME=rumvue-demo
export APM_SERVICE_VERSION=1.0.0

# 업로드 실행
npm run upload-sourcemaps
```

**방법 B: 스크립트 직접 실행**

```bash
./scripts/upload-sourcemaps.sh
```

**방법 C: 환경 변수와 함께 실행**

```bash
APM_SERVICE_VERSION=$(git rev-parse --short HEAD) npm run upload-sourcemaps
```

#### 4. 업로드 결과 확인

성공 시 출력:
```
========================================
  Elastic APM Source Map Upload
========================================

APM Server:      http://localhost:8200
Service Name:    rumvue-demo
Service Version: 1.0.0

Found 15 source map file(s)

Uploading: entry.abc123.js.map
  Bundle path: /_nuxt/entry.abc123.js
  ✓ Success (HTTP 202)

...

========================================
  Upload Summary
========================================
Total:   15
Success: 15
Failed:  0

✓ All source maps uploaded successfully!
```

### 환경 변수 설정

`.env` 파일에 소스맵 업로드 설정 추가:

```env
# Source Map Upload Configuration
APM_SERVER_URL=http://localhost:8200
APM_SERVICE_NAME=rumvue-demo
APM_SERVICE_VERSION=1.0.0

# Optional: Secret token for APM Server authentication
# APM_SECRET_TOKEN=your-secret-token-here
```

### CI/CD 통합 예제

#### GitHub Actions

```yaml
name: Deploy with Source Maps

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build
        env:
          NODE_ENV: production

      - name: Upload Source Maps
        run: npm run upload-sourcemaps
        env:
          APM_SERVER_URL: ${{ secrets.APM_SERVER_URL }}
          APM_SERVICE_NAME: rumvue-demo
          APM_SERVICE_VERSION: ${{ github.sha }}
          APM_SECRET_TOKEN: ${{ secrets.APM_SECRET_TOKEN }}

      - name: Deploy
        run: npm run deploy
```

### 보안 고려사항

#### 1. 소스맵 파일 공개 방지

**nginx 설정**:
```nginx
# 소스맵 파일 접근 차단
location ~* \.map$ {
  deny all;
  return 404;
}
```

**Cloudflare 설정**:
- Firewall Rules에서 `*.map` 파일 차단

#### 2. Service Version 관리

각 배포마다 **고유한 버전**을 사용해야 소스맵 매칭이 정확합니다:

```bash
# Git commit hash 사용 (권장)
APM_SERVICE_VERSION=$(git rev-parse --short HEAD) npm run upload-sourcemaps

# 타임스탬프 사용
APM_SERVICE_VERSION=$(date +%Y%m%d-%H%M%S) npm run upload-sourcemaps
```

#### 3. APM Server 인증

APM Server가 인증을 요구하는 경우:

```bash
export APM_SECRET_TOKEN=your-secret-token
npm run upload-sourcemaps
```

### Kibana에서 확인

1. **APM → Services → rumvue-demo → Errors**
2. 에러 클릭
3. **Stack Trace** 섹션에서 원본 파일명과 라인 번호 확인

**소스맵 없이**:
```
at e.t (main.abc123.js:1:4567)
```

**소스맵 있음**:
```
at handleUserClick (src/components/UserProfile.vue:45:12)
at onClick (src/composables/useAuth.ts:23:5)
```

### 문제 해결

#### 소스맵 파일이 생성되지 않음

```bash
# nuxt.config.ts 확인
cat nuxt.config.ts | grep sourcemap

# 빌드 후 파일 확인
ls -la .output/public/_nuxt/*.map
```

#### 업로드 실패 (HTTP 401/403)

```bash
# APM Server 인증 필요
export APM_SECRET_TOKEN=your-token
npm run upload-sourcemaps
```

#### 업로드 실패 (HTTP 404)

```bash
# APM Server URL 확인
curl http://localhost:8200

# APM Server 버전 확인 (7.x 이상 필요)
curl http://localhost:8200 | grep version
```

#### Kibana에서 소스맵 매핑 안됨

원인:
- **Service Version 불일치**: APM Agent와 소스맵의 버전이 다름
- **Bundle Path 불일치**: 파일 경로가 맞지 않음

해결:
```bash
# 1. Service Version 확인
echo $APM_SERVICE_VERSION

# 2. 업로드된 소스맵 확인 (Kibana)
# Stack Management → APM → Source Maps

# 3. Bundle filepath 확인
curl -X GET "http://localhost:8200/assets/v1/sourcemaps" \
  -H "Authorization: Bearer ${APM_SECRET_TOKEN}"
```

### 효과 비교

| 항목 | 소스맵 없음 | 소스맵 있음 |
|------|-----------|----------|
| 에러 위치 파악 | ⏱️ 30분+ | ⚡ 1분 |
| 스택 트레이스 | `main.xyz.js:1:234` | `UserProfile.vue:45:12` |
| 디버깅 난이도 | 😰 매우 어려움 | 😊 쉬움 |
| 프로덕션 디버깅 | 🔴 불가능 | 🟢 가능 |
| 팀 협업 | 😓 혼란 | 👍 명확 |

### 권장 워크플로우

```bash
# 1. 개발
npm run dev

# 2. 테스트
npm run typecheck

# 3. 프로덕션 빌드
NODE_ENV=production npm run build

# 4. 소스맵 업로드
APM_SERVICE_VERSION=$(git rev-parse --short HEAD) npm run upload-sourcemaps

# 5. 배포
npm run deploy
```

## 참고 자료

- [Elastic APM RUM 공식 문서](https://www.elastic.co/guide/en/apm/agent/rum-js/current/index.html)
- [Vue.js Integration](https://www.elastic.co/guide/en/apm/agent/rum-js/current/vue-integration.html)
- [Configuration Options](https://www.elastic.co/guide/en/apm/agent/rum-js/current/configuration.html)
- [API Reference](https://www.elastic.co/guide/en/apm/agent/rum-js/current/api.html)

## 라이센스

MIT
