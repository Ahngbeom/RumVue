# 🚀 실무 프로젝트에 Elastic APM RUM 적용하기

> 이 사이드 프로젝트에서 학습한 내용을 실제 프로덕션 환경에 적용하는 완벽 가이드

## 📋 목차

1. [빠른 시작](#빠른-시작)
2. [프로젝트 구조 설정](#프로젝트-구조-설정)
3. [환경별 설정](#환경별-설정)
4. [프로덕션 체크리스트](#프로덕션-체크리스트)
5. [CI/CD 통합](#cicd-통합)
6. [Claude Sub Agent 활용](#claude-sub-agent-활용)

---

## 빠른 시작

### 1. 패키지 설치

```bash
npm install @elastic/apm-rum @elastic/apm-rum-vue
```

### 2. 환경 변수 설정

```bash
# .env.production
NUXT_PUBLIC_APM_SERVER_URL=https://your-apm-server.com:8200
NUXT_PUBLIC_APM_SERVICE_NAME=your-production-app
NUXT_PUBLIC_APM_SERVICE_VERSION=1.0.0
NUXT_PUBLIC_APM_ENVIRONMENT=production
NUXT_PUBLIC_APM_SECRET_TOKEN=your-secret-token  # 선택사항
```

### 3. 파일 복사 및 수정

이 프로젝트에서 다음 파일들을 실무 프로젝트로 복사하세요:

```bash
# 필수 파일
app/plugins/apm.client.ts          → your-project/app/plugins/apm.client.ts
app/composables/useApm.ts          → your-project/app/composables/useApm.ts
app/composables/useComponentTracking.ts → your-project/app/composables/useComponentTracking.ts

# 선택적 파일 (재사용 가능한 컴포넌트)
app/components/TrackedCard.vue     → your-project/app/components/
app/components/TrackedForm.vue     → your-project/app/components/
app/components/TrackedPerformance.vue → your-project/app/components/
```

### 4. nuxt.config.ts 설정

```typescript
export default defineNuxtConfig({
  // 런타임 설정
  runtimeConfig: {
    public: {
      apmServerUrl: process.env.NUXT_PUBLIC_APM_SERVER_URL || 'http://localhost:8200',
      apmServiceName: process.env.NUXT_PUBLIC_APM_SERVICE_NAME || 'my-app',
      apmServiceVersion: process.env.NUXT_PUBLIC_APM_SERVICE_VERSION || '1.0.0',
      apmEnvironment: process.env.NUXT_PUBLIC_APM_ENVIRONMENT || 'development'
    }
  },

  // 소스맵 설정 (프로덕션)
  sourcemap: {
    server: true,
    client: process.env.NODE_ENV === 'production' ? 'hidden' : true
  }
})
```

### 5. 즉시 사용 가능!

```vue
<script setup lang="ts">
// 컴포넌트에서 바로 사용
const { trackAction, trackError } = useComponentTracking()

const handleClick = () => {
  const span = trackAction('button-click')
  // 작업 수행
  if (span) span.end()
}
</script>
```

---

## 프로젝트 구조 설정

### Nuxt 4 프로젝트

```
your-project/
├── app/
│   ├── plugins/
│   │   └── apm.client.ts              # APM 플러그인 ⭐
│   ├── composables/
│   │   ├── useApm.ts                   # APM 컴포저블 ⭐
│   │   └── useComponentTracking.ts    # 컴포넌트 추적 ⭐
│   ├── components/
│   │   ├── TrackedCard.vue            # 선택적
│   │   └── TrackedForm.vue            # 선택적
│   └── pages/
│       └── index.vue
├── scripts/
│   └── upload-sourcemaps.sh           # 소스맵 업로드 스크립트 ⭐
├── .env.production                     # 프로덕션 환경 변수 ⭐
├── .env.staging                        # 스테이징 환경 변수
├── .env.development                    # 개발 환경 변수
└── nuxt.config.ts                      # Nuxt 설정 ⭐
```

### Nuxt 3 프로젝트

```
your-project/
├── plugins/
│   └── apm.client.ts                  # ← app/ 대신 루트
├── composables/
│   ├── useApm.ts
│   └── useComponentTracking.ts
├── components/
│   └── ...
└── ...
```

---

## 환경별 설정

### Development (개발 환경)

**목표**: 모든 데이터 수집, 상세 로그, 빠른 디버깅

```bash
# .env.development
NUXT_PUBLIC_APM_SERVER_URL=http://localhost:8200
NUXT_PUBLIC_APM_SERVICE_NAME=my-app-dev
NUXT_PUBLIC_APM_SERVICE_VERSION=dev
NUXT_PUBLIC_APM_ENVIRONMENT=development
```

```typescript
// app/plugins/apm.client.ts (개발 환경 설정)
const apm = initApm({
  serviceName: config.public.apmServiceName,
  serverUrl: config.public.apmServerUrl,
  environment: 'development',

  // 개발 환경: 모든 트랜잭션 수집
  transactionSampleRate: 1.0,

  // 상세 로그
  logLevel: 'debug',

  // Timeline 필터링 비활성화 (전체 데이터 확인)
  // observe() 로직 주석 처리 또는 조건부 실행
})
```

### Staging (스테이징 환경)

**목표**: 프로덕션 유사 환경, 적절한 샘플링, 실제 성능 테스트

```bash
# .env.staging
NUXT_PUBLIC_APM_SERVER_URL=https://apm-staging.yourcompany.com:8200
NUXT_PUBLIC_APM_SERVICE_NAME=my-app-staging
NUXT_PUBLIC_APM_SERVICE_VERSION=staging-$(git rev-parse --short HEAD)
NUXT_PUBLIC_APM_ENVIRONMENT=staging
NUXT_PUBLIC_APM_SECRET_TOKEN=staging-secret-token
```

```typescript
// app/plugins/apm.client.ts (스테이징 환경 설정)
const apm = initApm({
  serviceName: config.public.apmServiceName,
  serverUrl: config.public.apmServerUrl,
  environment: 'staging',

  // 스테이징: 50% 샘플링
  transactionSampleRate: 0.5,

  // 경고만 로그
  logLevel: 'warn',

  // Timeline 필터링 활성화
  // observe() 로직 실행
})
```

### Production (프로덕션 환경)

**목표**: 최소 오버헤드, 보안, 비용 효율성

```bash
# .env.production
NUXT_PUBLIC_APM_SERVER_URL=https://apm.yourcompany.com:8200
NUXT_PUBLIC_APM_SERVICE_NAME=my-app
NUXT_PUBLIC_APM_SERVICE_VERSION=$(git rev-parse --short HEAD)
NUXT_PUBLIC_APM_ENVIRONMENT=production
NUXT_PUBLIC_APM_SECRET_TOKEN=production-secret-token
```

```typescript
// app/plugins/apm.client.ts (프로덕션 환경 설정)
const apm = initApm({
  serviceName: config.public.apmServiceName,
  serverUrl: config.public.apmServerUrl,
  environment: 'production',
  serviceVersion: config.public.apmServiceVersion,

  // 프로덕션: 10% 샘플링 (비용 절감)
  transactionSampleRate: 0.1,

  // 에러만 로그
  logLevel: 'error',

  // 분산 추적 (API 서버와 연동)
  distributedTracing: true,
  distributedTracingOrigins: [
    'https://api.yourcompany.com',
    'https://api-staging.yourcompany.com'
  ],

  // 성능 메트릭
  breakdownMetrics: true,

  // 불필요한 트랜잭션 제외
  ignoreTransactions: [
    '/health',
    '/metrics',
    '/ping',
    '/_nuxt/builds/meta/'  // Nuxt 내부 요청
  ],

  // Timeline 필터링 활성화 (데이터 절약)
  // observe() 로직 실행
})
```

### 환경별 조건부 설정

```typescript
// app/plugins/apm.client.ts

export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig()
  const isDev = config.public.apmEnvironment === 'development'
  const isProduction = config.public.apmEnvironment === 'production'

  const apm = initApm({
    serviceName: config.public.apmServiceName,
    serverUrl: config.public.apmServerUrl,
    environment: config.public.apmEnvironment,
    serviceVersion: config.public.apmServiceVersion,

    // 환경별 샘플링 비율
    transactionSampleRate: isDev ? 1.0 : isProduction ? 0.1 : 0.5,

    // 환경별 로그 레벨
    logLevel: isDev ? 'debug' : isProduction ? 'error' : 'warn',

    // 분산 추적 (프로덕션/스테이징만)
    distributedTracing: !isDev,
    distributedTracingOrigins: isDev
      ? ['http://localhost:3000']
      : ['https://api.yourcompany.com'],

    // 불필요한 트랜잭션 제외 (프로덕션/스테이징만)
    ignoreTransactions: !isDev ? ['/health', '/metrics', '/ping'] : []
  })

  // Vue 플러그인 설치
  if (apm) {
    nuxtApp.vueApp.use(ApmVuePlugin, {
      apm,
      config: { router: nuxtApp.$router }
    })

    // Timeline 필터링 (프로덕션/스테이징만)
    if (!isDev) {
      apm.observe('transaction:end', (transaction) => {
        if (transaction.type === 'page-load' || transaction.type === 'route-change') {
          const originalCount = transaction.spans.length

          transaction.spans = transaction.spans.filter(span => {
            const name = span.name || ''
            return !name.includes('node_modules') && !name.includes('/_nuxt/')
          })

          const filteredCount = originalCount - transaction.spans.length
          if (filteredCount > 0 && !isProduction) {
            console.log(
              `[APM Timeline Filter] Removed ${filteredCount} internal module spans ` +
              `(${originalCount} → ${transaction.spans.length})`
            )
          }
        }
      })
    }

    // 전역 에러 핸들러
    nuxtApp.vueApp.config.errorHandler = (err, instance, info) => {
      // ... (에러 핸들링 로직)
    }
  }

  return { provide: { apm } }
})
```

---

## 프로덕션 체크리스트

배포 전 반드시 확인하세요!

### 📦 설정 체크리스트

- [ ] **환경 변수 확인**
  - [ ] `NUXT_PUBLIC_APM_SERVER_URL` 설정
  - [ ] `NUXT_PUBLIC_APM_SERVICE_NAME` 설정
  - [ ] `NUXT_PUBLIC_APM_SERVICE_VERSION` 설정 (Git commit hash 권장)
  - [ ] `NUXT_PUBLIC_APM_ENVIRONMENT` 설정 (production/staging/development)
  - [ ] `NUXT_PUBLIC_APM_SECRET_TOKEN` 설정 (APM Server 인증 시)

- [ ] **샘플링 비율 조정**
  - [ ] 개발: `1.0` (100%)
  - [ ] 스테이징: `0.3-0.5` (30-50%)
  - [ ] 프로덕션: `0.1-0.2` (10-20%)

- [ ] **로그 레벨 변경**
  - [ ] 개발: `'debug'`
  - [ ] 스테이징: `'warn'`
  - [ ] 프로덕션: `'error'`

- [ ] **Timeline 필터링 활성화**
  - [ ] `observe('transaction:end')` 로직 확인
  - [ ] node_modules, _nuxt spans 제거 확인

- [ ] **불필요한 트랜잭션 제외**
  - [ ] `/health`, `/metrics`, `/ping` 등 제외
  - [ ] Nuxt 내부 요청 제외

### 🔒 보안 체크리스트

- [ ] **소스맵 파일 보호**
  - [ ] nginx/Cloudflare에서 `.map` 파일 접근 차단
  - [ ] `sourcemap.client: 'hidden'` 설정 확인

- [ ] **민감한 정보 필터링**
  - [ ] 사용자 이메일 제외 또는 마스킹
  - [ ] 비밀번호, API 키 등 민감 정보 제외
  - [ ] 개인정보 처리 정책 준수

- [ ] **APM Server 인증**
  - [ ] Secret Token 또는 API Key 설정
  - [ ] HTTPS 연결 확인
  - [ ] CORS 설정 확인

### 📊 모니터링 체크리스트

- [ ] **Kibana 대시보드 설정**
  - [ ] Service 확인 (APM > Services > your-app)
  - [ ] Transactions 대시보드
  - [ ] Errors 대시보드
  - [ ] Service Map

- [ ] **알림 설정**
  - [ ] Error Rate 임계값 알림
  - [ ] Transaction Duration 임계값 알림
  - [ ] Throughput 이상 알림
  - [ ] Slack/Email 알림 연동

- [ ] **소스맵 업로드**
  - [ ] 빌드 후 소스맵 파일 생성 확인
  - [ ] 소스맵 업로드 스크립트 실행
  - [ ] Kibana에서 소스맵 매핑 확인

### 🧪 테스트 체크리스트

- [ ] **기능 테스트**
  - [ ] APM Agent 초기화 확인 (브라우저 콘솔)
  - [ ] 페이지 로드 트랜잭션 확인
  - [ ] 라우트 변경 트랜잭션 확인
  - [ ] API 호출 자동 추적 확인
  - [ ] 에러 캡처 확인

- [ ] **성능 테스트**
  - [ ] 페이지 로드 시간 영향 < 50ms
  - [ ] Timeline 필터링 동작 확인
  - [ ] 메모리 누수 없음
  - [ ] 네트워크 요청 증가 < 5%

- [ ] **브라우저 호환성 테스트**
  - [ ] Chrome/Edge
  - [ ] Firefox
  - [ ] Safari
  - [ ] 모바일 브라우저

---

## CI/CD 통합

### GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy with APM

on:
  push:
    branches: [main, staging]

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Type check
        run: npm run typecheck

      - name: Build
        run: npm run build
        env:
          NODE_ENV: production
          NUXT_PUBLIC_APM_SERVER_URL: ${{ secrets.APM_SERVER_URL }}
          NUXT_PUBLIC_APM_SERVICE_NAME: my-app
          NUXT_PUBLIC_APM_SERVICE_VERSION: ${{ github.sha }}
          NUXT_PUBLIC_APM_ENVIRONMENT: ${{ github.ref == 'refs/heads/main' && 'production' || 'staging' }}
          NUXT_PUBLIC_APM_SECRET_TOKEN: ${{ secrets.APM_SECRET_TOKEN }}

      - name: Upload Source Maps to APM
        run: npm run upload-sourcemaps
        env:
          APM_SERVER_URL: ${{ secrets.APM_SERVER_URL }}
          APM_SERVICE_NAME: my-app
          APM_SERVICE_VERSION: ${{ github.sha }}
          APM_SECRET_TOKEN: ${{ secrets.APM_SECRET_TOKEN }}

      - name: Deploy to Production
        if: github.ref == 'refs/heads/main'
        run: npm run deploy:production
        env:
          # 배포 관련 환경 변수

      - name: Deploy to Staging
        if: github.ref == 'refs/heads/staging'
        run: npm run deploy:staging
        env:
          # 배포 관련 환경 변수

      - name: Notify Deployment
        if: success()
        run: |
          curl -X POST ${{ secrets.SLACK_WEBHOOK_URL }} \
            -H 'Content-Type: application/json' \
            -d '{
              "text": "✅ Deployment successful: ${{ github.sha }}",
              "attachments": [{
                "color": "good",
                "fields": [
                  { "title": "Environment", "value": "${{ github.ref == 'refs/heads/main' && 'production' || 'staging' }}", "short": true },
                  { "title": "Version", "value": "${{ github.sha }}", "short": true },
                  { "title": "APM Service", "value": "my-app", "short": true }
                ]
              }]
            }'
```

### GitLab CI

```yaml
# .gitlab-ci.yml
stages:
  - build
  - deploy

variables:
  NODE_VERSION: '20'

build:
  stage: build
  image: node:${NODE_VERSION}
  script:
    - npm ci
    - npm run typecheck
    - npm run build
  artifacts:
    paths:
      - .output/
      - .nuxt/
  cache:
    paths:
      - node_modules/

deploy_production:
  stage: deploy
  image: node:${NODE_VERSION}
  only:
    - main
  script:
    # 소스맵 업로드
    - |
      export APM_SERVER_URL=${APM_SERVER_URL_PRODUCTION}
      export APM_SERVICE_NAME=my-app
      export APM_SERVICE_VERSION=${CI_COMMIT_SHORT_SHA}
      export APM_SECRET_TOKEN=${APM_SECRET_TOKEN_PRODUCTION}
      npm run upload-sourcemaps

    # 배포
    - npm run deploy:production

  environment:
    name: production
    url: https://my-app.com

deploy_staging:
  stage: deploy
  image: node:${NODE_VERSION}
  only:
    - staging
  script:
    # 소스맵 업로드
    - |
      export APM_SERVER_URL=${APM_SERVER_URL_STAGING}
      export APM_SERVICE_NAME=my-app-staging
      export APM_SERVICE_VERSION=${CI_COMMIT_SHORT_SHA}
      export APM_SECRET_TOKEN=${APM_SECRET_TOKEN_STAGING}
      npm run upload-sourcemaps

    # 배포
    - npm run deploy:staging

  environment:
    name: staging
    url: https://staging.my-app.com
```

### Docker 환경

```dockerfile
# Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

# 의존성 설치
COPY package*.json ./
RUN npm ci

# 소스 복사 및 빌드
COPY . .
ARG APM_SERVICE_VERSION
ENV NUXT_PUBLIC_APM_SERVICE_VERSION=${APM_SERVICE_VERSION}
RUN npm run build

# 프로덕션 이미지
FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/.output /app/.output
COPY --from=builder /app/package*.json ./

# 런타임 환경 변수
ENV NODE_ENV=production
ENV NUXT_PUBLIC_APM_SERVER_URL=${APM_SERVER_URL}
ENV NUXT_PUBLIC_APM_SERVICE_NAME=${APM_SERVICE_NAME}
ENV NUXT_PUBLIC_APM_ENVIRONMENT=production

EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]
```

```bash
# 빌드 및 배포
docker build \
  --build-arg APM_SERVICE_VERSION=$(git rev-parse --short HEAD) \
  -t my-app:latest .

docker run \
  -e APM_SERVER_URL=https://apm.yourcompany.com:8200 \
  -e APM_SERVICE_NAME=my-app \
  -e APM_SECRET_TOKEN=your-token \
  -p 3000:3000 \
  my-app:latest
```

---

## Claude Sub Agent 활용

### Elastic APM RUM Expert Agent 사용법

이 프로젝트에는 **Elastic APM RUM 전문가 Sub Agent**가 포함되어 있습니다.

#### 1. Agent 파일 복사

```bash
# RumVue 프로젝트에서 실무 프로젝트로 복사
cp .claude/agents/elastic-apm-rum-expert.md \
   /path/to/your-project/.claude/agents/
```

#### 2. Claude Code에서 활용

```bash
# 실무 프로젝트에서 Claude Code 실행
cd /path/to/your-project

# Claude Code에 질문 (Agent가 자동으로 활성화됨)
"Elastic APM RUM을 이 프로젝트에 설정해줘"
"컴포넌트별 성능 추적을 추가하고 싶어"
"프로덕션 배포 전 체크리스트 확인해줘"
"Kibana에서 특정 컴포넌트 에러만 필터링하는 방법 알려줘"
```

#### 3. Agent가 도와주는 작업

**초기 설정**:
- APM 플러그인 파일 생성
- 환경 변수 설정
- nuxt.config.ts 수정
- 컴포저블 설정

**최적화**:
- Timeline 필터링 적용
- 샘플링 비율 조정
- 불필요한 트랜잭션 제외
- 성능 메트릭 추적

**디버깅**:
- APM 초기화 문제 해결
- 데이터가 Kibana에 표시되지 않는 문제
- 소스맵 매핑 문제
- CORS 설정 문제

**프로덕션 배포**:
- 체크리스트 확인
- 소스맵 업로드 스크립트 작성
- CI/CD 파이프라인 통합
- 보안 설정 검토

---

## 마이그레이션 시나리오

### 기존 프로젝트에 APM 추가

#### 시나리오 1: 기존 Nuxt 3/4 프로젝트

```bash
# 1. 패키지 설치
npm install @elastic/apm-rum @elastic/apm-rum-vue

# 2. 파일 복사
cp -r RumVue/app/plugins/apm.client.ts your-project/app/plugins/
cp -r RumVue/app/composables/useApm.ts your-project/app/composables/
cp -r RumVue/app/composables/useComponentTracking.ts your-project/app/composables/

# 3. 환경 변수 설정
cat >> your-project/.env.production << EOF
NUXT_PUBLIC_APM_SERVER_URL=https://apm.yourcompany.com:8200
NUXT_PUBLIC_APM_SERVICE_NAME=your-app
NUXT_PUBLIC_APM_SERVICE_VERSION=1.0.0
NUXT_PUBLIC_APM_ENVIRONMENT=production
EOF

# 4. nuxt.config.ts 수정
# runtimeConfig, sourcemap 추가

# 5. 빌드 및 배포
npm run build
```

#### 시나리오 2: Vue 3 SPA 프로젝트

```typescript
// main.ts
import { createApp } from 'vue'
import { init as initApm } from '@elastic/apm-rum'
import { ApmVuePlugin } from '@elastic/apm-rum-vue'
import App from './App.vue'
import router from './router'

const app = createApp(App)

// APM 초기화
const apm = initApm({
  serviceName: 'your-vue-app',
  serverUrl: 'https://apm.yourcompany.com:8200',
  environment: import.meta.env.MODE,
  transactionSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
  logLevel: import.meta.env.PROD ? 'error' : 'debug'
})

// Vue 플러그인 설치
if (apm) {
  app.use(ApmVuePlugin, {
    apm,
    config: { router }
  })
}

app.use(router)
app.mount('#app')
```

#### 시나리오 3: 레거시 Vue 2 프로젝트

```javascript
// main.js (Vue 2)
import Vue from 'vue'
import { init as initApm } from '@elastic/apm-rum'
import App from './App.vue'
import router from './router'

// APM 초기화
const apm = initApm({
  serviceName: 'your-vue2-app',
  serverUrl: 'https://apm.yourcompany.com:8200',
  environment: process.env.NODE_ENV,
  transactionSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0
})

// Vue 2에서는 직접 에러 핸들러 연결
if (apm) {
  Vue.config.errorHandler = (err, vm, info) => {
    console.error('Vue Error:', err)
    apm.captureError(err)
  }
}

new Vue({
  router,
  render: h => h(App)
}).$mount('#app')
```

---

## 비용 최적화

### APM 데이터 전송량 절감

```typescript
// 전송량 최적화 전략

// 1. 샘플링 비율 조정
transactionSampleRate: 0.1  // 90% 절감

// 2. Timeline 필터링
// node_modules, _nuxt spans 제거 → 최대 80% 절감

// 3. 불필요한 트랜잭션 제외
ignoreTransactions: ['/health', '/metrics', '/ping']

// 4. Error 샘플링
// APM Server에서 설정 가능
```

### 월 비용 예상 (대규모 앱 기준)

| 설정 | 월 페이지뷰 | APM 데이터 | 월 비용 (추정) |
|------|------------|-----------|--------------|
| 최적화 전 | 1,000,000 | 15GB | $300 |
| 샘플링 (10%) | 1,000,000 | 1.5GB | $50 |
| Timeline 필터링 | 1,000,000 | 0.4GB | $15 |
| **최종 (전체 최적화)** | **1,000,000** | **0.4GB** | **$15** |

**절감액**: $285/월 (95% 절감) 💰

---

## 트러블슈팅

### 자주 발생하는 문제

#### 1. APM이 초기화되지 않음

**증상**:
```
브라우저 콘솔에 APM 관련 로그 없음
Kibana에 데이터 표시 안 됨
```

**해결**:
```bash
# 1. APM 서버 상태 확인
curl https://apm.yourcompany.com:8200

# 2. 환경 변수 확인
echo $NUXT_PUBLIC_APM_SERVER_URL

# 3. 브라우저 Network 탭에서 요청 확인
# endpoint: /intake/v2/rum/events

# 4. CORS 설정 확인 (apm-server.yml)
apm-server.rum.allow_origins: ['*']
```

#### 2. 소스맵이 매핑되지 않음

**증상**:
```
Kibana Error 스택: main.xyz.js:1:234
원본 파일 위치 표시 안 됨
```

**해결**:
```bash
# 1. Service Version 일치 확인
# APM Agent와 소스맵 업로드 버전이 같아야 함

# 2. 소스맵 업로드 확인
curl -X GET "https://apm.yourcompany.com:8200/assets/v1/sourcemaps"

# 3. Bundle filepath 확인
# 소스맵 업로드 시 bundle_filepath가 정확해야 함
```

#### 3. 성능 오버헤드

**증상**:
```
페이지 로드 시간 증가
메모리 사용량 증가
```

**해결**:
```typescript
// 1. 샘플링 비율 낮추기
transactionSampleRate: 0.05  // 5%

// 2. Timeline 필터링 강화
// 더 많은 spans 제거

// 3. 성능 추적 선택적 사용
// trackPerformance: false (필요한 컴포넌트만 true)

// 4. 로그 레벨 낮추기
logLevel: 'error'
```

---

## 다음 단계

### 고급 기능 활용

1. **User Context 추적**
   ```typescript
   const { setUserContext } = useApm()
   setUserContext({
     id: user.id,
     username: user.username
   })
   ```

2. **Custom Labels**
   ```typescript
   const { addLabels } = useApm()
   addLabels({
     user_tier: 'premium',
     feature_flag: 'new_checkout'
   })
   ```

3. **분산 추적**
   ```typescript
   // API 호출이 자동으로 추적됨
   // APM Server와 Backend APM Agent 연동 시
   ```

4. **Service Map 구축**
   - Frontend → Backend → Database
   - 마이크로서비스 간 요청 추적

### 모니터링 개선

1. **Kibana 대시보드 커스터마이징**
   - 주요 메트릭 위젯 추가
   - 팀별/기능별 대시보드 생성

2. **알림 규칙 설정**
   - Error Rate > 5% → Slack 알림
   - P95 Latency > 3s → PagerDuty

3. **정기 리뷰**
   - 주간 성능 리포트
   - 월간 에러 트렌드 분석

---

## 추가 자료

- [RumVue 프로젝트 README](../../README.md)
- [APM 설정 가이드](./apm-setup.md)
- [컴포넌트 추적 가이드](./component-tracking.md)
- [Timeline 필터링 가이드](./timeline-filtering.md)
- [Elastic APM 공식 문서](https://www.elastic.co/guide/en/apm/agent/rum-js/current/index.html)

---

**이 가이드로 실무 프로젝트에 Elastic APM RUM을 성공적으로 적용하세요!** 🚀
