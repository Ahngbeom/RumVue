# 📦 Elastic APM 소스맵 업로드 및 활용 가이드

> **프로덕션 환경에서 의미 있는 에러 스택 트레이스를 위한 완벽 가이드**

## 목차

- [소개](#소개)
- [왜 소스맵이 필요한가?](#왜-소스맵이-필요한가)
- [설정 및 구성](#설정-및-구성)
- [소스맵 업로드](#소스맵-업로드)
- [보안 Best Practices](#보안-best-practices)
- [검증 및 테스트](#검증-및-테스트)
- [CI/CD 통합](#cicd-통합)
- [문제 해결](#문제-해결)
- [실전 팁과 트릭](#실전-팁과-트릭)
- [FAQ](#faq)

---

## ⚠️ 중요: APM Server 버전 호환성

> **이 가이드의 자동 업로드 스크립트는 APM Server 7.x에서만 작동합니다.**

### APM Server 버전별 소스맵 업로드 방법

| APM Server 버전 | 자동 업로드 스크립트 | Kibana UI | 권장 방법 |
|----------------|-------------------|-----------|----------|
| **7.x** | ✅ 지원 (`npm run upload-sourcemaps`) | ✅ 지원 | 스크립트 (자동화) |
| **8.x** | ❌ 미지원 (API 변경) | ✅ 지원 | Kibana UI (수동) |

### 현재 버전 확인

```bash
# APM Server 버전 확인
curl http://localhost:8200 | jq '.version'
# 출력 예: "8.11.0"
```

### APM Server 8.x 사용 시

**자동 업로드가 필요한 경우**:
```bash
# docker-compose.yml에서 7.17.x로 변경 (권장)
# APM Server 7.17.x는 소스맵 API를 완벽 지원
```

**수동 업로드로 충분한 경우**:
1. Kibana 접속: http://localhost:5601
2. **Stack Management → APM → Source Maps**
3. **Upload Source Map** 버튼 클릭
4. 파일 선택 및 메타데이터 입력

### 프로덕션 환경 권장사항

- **CI/CD 자동화 필요**: APM Server 7.17.x 사용
- **수동 관리 가능**: APM Server 8.x + Kibana UI

---

## 소개

### 소스맵(Source Map)이란?

소스맵은 **압축/난독화된 프로덕션 코드를 원본 소스 코드로 매핑**하는 파일입니다.

```
압축된 코드: main.abc123.js:1:4567
       ↓ (소스맵 매핑)
원본 코드: src/components/UserProfile.vue:45:12
```

### Elastic APM에서의 역할

Elastic APM RUM Agent는 브라우저에서 발생한 에러의 스택 트레이스를 수집합니다. 프로덕션에서는 코드가 압축되어 있어 에러 위치를 파악하기 어렵습니다. 소스맵을 APM Server에 업로드하면 **Kibana에서 원본 소스 코드 위치를 표시**합니다.

---

## 왜 소스맵이 필요한가?

### 실제 사례 비교

#### ❌ 소스맵 없이

```javascript
// Kibana APM Error 화면
Error: Cannot read property 'name' of undefined
  at e.t (main.abc123.js:1:4567)
  at n.r (chunk-vendors.xyz789.js:2:8910)
  at o (chunk-vendors.xyz789.js:3:1234)
```

**문제점**:
- 어떤 파일의 에러인지 알 수 없음
- 어떤 함수에서 발생했는지 알 수 없음
- 압축된 코드를 수동으로 디코딩해야 함 (거의 불가능)
- 디버깅에 30분~수 시간 소요

#### ✅ 소스맵 있음

```javascript
// Kibana APM Error 화면
Error: Cannot read property 'name' of undefined
  at getUserProfile (src/components/UserProfile.vue:45:12)
  at handleClick (src/composables/useAuth.ts:23:5)
  at onClick (app/pages/dashboard.vue:78:20)
```

**장점**:
- 정확한 파일, 함수, 라인 번호 표시
- 즉시 문제 코드 위치 파악
- 디버깅 시간 1분 이내
- 팀원 간 명확한 커뮤니케이션

### 투자 대비 효과 (ROI)

| 항목 | 시간/비용 | 효과 |
|------|----------|------|
| **초기 설정** | 10분 (1회) | 이 가이드 따라하기 |
| **매 배포마다** | 30초 | `npm run upload-sourcemaps` |
| **디버깅 시간 절약** | 29분/에러 | 30분 → 1분 |
| **월 10개 에러 기준** | 4.8시간 절약 | ≈ $480 절약 (시급 $100 기준) |

**결론**: 설정 10분 투자로 매월 수백 달러 절약!

---

## 설정 및 구성

### 1. Nuxt.js 소스맵 설정

`nuxt.config.ts`에 이미 설정되어 있습니다:

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  sourcemap: {
    server: true,
    client: process.env.NODE_ENV === 'production' ? 'hidden' : true
  }
})
```

**옵션 설명**:
- `server: true`: 서버 사이드 코드 소스맵 생성
- `client: 'hidden'`: 클라이언트 소스맵 생성하되 브라우저에서 숨김
- `client: true`: 개발 환경에서만 브라우저에서 접근 가능

**`'hidden'` 모드란?**
- ✅ 소스맵 파일(`.map`) 생성
- ✅ 번들 파일에 `sourceMappingURL` **미포함**
- ✅ 브라우저에서 소스맵 다운로드 불가 (보안)
- ✅ APM Server에는 직접 업로드 가능

### 2. 환경 변수 설정

`.env` 파일 생성:

```env
# APM 기본 설정
NUXT_PUBLIC_APM_SERVER_URL=http://localhost:8200
NUXT_PUBLIC_APM_SERVICE_NAME=rumvue-demo
NUXT_PUBLIC_APM_SERVICE_VERSION=1.0.0
NUXT_PUBLIC_APM_ENVIRONMENT=production

# 소스맵 업로드 설정
APM_SERVER_URL=http://localhost:8200
APM_SERVICE_NAME=rumvue-demo
APM_SERVICE_VERSION=1.0.0

# 선택사항: APM Server 인증
# APM_SECRET_TOKEN=your-secret-token-here
```

**중요**: `APM_SERVICE_VERSION`은 실제 배포 버전과 **정확히 일치**해야 합니다!

### 3. 빌드 및 소스맵 생성

```bash
# 프로덕션 빌드
NODE_ENV=production npm run build

# 생성된 소스맵 확인
ls -lh .output/public/_nuxt/*.map
```

**출력 예시**:
```
-rw-r--r--  34K  entry.abc123.js.map
-rw-r--r--  1.4M chunk-vendors.xyz789.js.map
-rw-r--r--  13K  UserProfile.def456.js.map
...
```

---

## 소스맵 업로드

### 기본 사용법

#### 방법 1: npm 스크립트 (권장)

```bash
npm run upload-sourcemaps
```

**출력**:
```
========================================
  Elastic APM Source Map Upload
========================================

APM Server:      http://localhost:8200
Service Name:    rumvue-demo
Service Version: 1.0.0

Found 16 source map file(s)

Uploading: entry.abc123.js.map
  Bundle path: /_nuxt/entry.abc123.js
  ✓ Success (HTTP 202)

Uploading: chunk-vendors.xyz789.js.map
  Bundle path: /_nuxt/chunk-vendors.xyz789.js
  ✓ Success (HTTP 202)

...

========================================
  Upload Summary
========================================
Total:   16
Success: 16
Failed:  0

✓ All source maps uploaded successfully!
```

#### 방법 2: 환경 변수 오버라이드

```bash
# 환경 변수로 설정 오버라이드
APM_SERVER_URL=https://my-apm.example.com \
APM_SERVICE_NAME=my-app \
APM_SERVICE_VERSION=2.3.4 \
npm run upload-sourcemaps
```

#### 방법 3: 스크립트 직접 실행

```bash
./scripts/upload-sourcemaps.sh
```

### 고급 사용법

#### Git Commit Hash를 버전으로 사용 (강력 권장)

```bash
# Short hash 사용
APM_SERVICE_VERSION=$(git rev-parse --short HEAD) npm run upload-sourcemaps

# Full hash 사용
APM_SERVICE_VERSION=$(git rev-parse HEAD) npm run upload-sourcemaps

# 예시 출력: Service Version: a1b2c3d
```

**장점**:
- 배포마다 고유한 버전 자동 생성
- Git 기록과 APM 데이터 완벽히 연결
- 롤백 시 정확한 버전 추적

#### Tag + Timestamp 조합

```bash
# v1.2.3-20250106-143022 형식
VERSION="$(git describe --tags --always)-$(date +%Y%m%d-%H%M%S)"
APM_SERVICE_VERSION=$VERSION npm run upload-sourcemaps
```

#### Branch + Build Number (CI/CD 환경)

```bash
# feature-auth-fix-build-123 형식
VERSION="${GIT_BRANCH}-build-${BUILD_NUMBER}"
APM_SERVICE_VERSION=$VERSION npm run upload-sourcemaps
```

### APM Server 인증

APM Server가 Secret Token을 요구하는 경우:

```bash
# 환경 변수로 토큰 제공
export APM_SECRET_TOKEN=your-secret-token-here
npm run upload-sourcemaps

# 또는 한 줄로
APM_SECRET_TOKEN=your-token npm run upload-sourcemaps
```

**보안 팁**:
- Token을 환경 변수로 관리
- `.env` 파일은 `.gitignore`에 추가
- CI/CD에서는 Secret으로 관리

---

## 보안 Best Practices

### 1. 웹 서버에서 소스맵 파일 차단

#### Nginx

```nginx
# /etc/nginx/sites-available/your-app
server {
    listen 80;
    server_name your-app.com;
    root /var/www/your-app;

    # 소스맵 파일 접근 차단
    location ~* \.map$ {
        deny all;
        return 404;
    }

    # 또는 특정 디렉토리만 허용
    location ~* ^/_nuxt/.*\.map$ {
        deny all;
        return 404;
    }
}
```

**테스트**:
```bash
curl -I https://your-app.com/_nuxt/entry.abc123.js.map
# 출력: HTTP/1.1 404 Not Found
```

#### Apache

```apache
# .htaccess 또는 httpd.conf
<FilesMatch "\.map$">
    Require all denied
</FilesMatch>

# 또는
RewriteEngine On
RewriteRule \.map$ - [F,L]
```

#### Cloudflare

**Firewall Rules**:
```
(http.request.uri.path contains ".map")
Action: Block
```

**Page Rules**:
```
URL: */*.map
Setting: Forwarding URL
Status Code: 404 - Not Found
```

### 2. Service Version 전략

#### ❌ 나쁜 예

```bash
# 고정된 버전 - 여러 배포가 같은 버전 사용
APM_SERVICE_VERSION=1.0.0
```

**문제점**:
- 새 배포 시 이전 소스맵 덮어씀
- 롤백 시 소스맵 매칭 불가
- 여러 환경에서 버전 충돌

#### ✅ 좋은 예

```bash
# 방법 1: Git commit hash (최고)
APM_SERVICE_VERSION=$(git rev-parse --short HEAD)
# 예: a1b2c3d

# 방법 2: Semantic version + hash
APM_SERVICE_VERSION="1.2.3-$(git rev-parse --short HEAD)"
# 예: 1.2.3-a1b2c3d

# 방법 3: Timestamp (간단한 프로젝트)
APM_SERVICE_VERSION=$(date +%Y%m%d-%H%M%S)
# 예: 20250106-143022
```

### 3. APM Agent 버전 동기화

**중요**: RUM Agent의 `serviceVersion`과 업로드한 소스맵의 버전이 **정확히 일치**해야 합니다!

#### 환경 변수로 통합

```typescript
// app/plugins/apm.client.ts
const config = useRuntimeConfig()
const apm = initApm({
  serviceName: config.public.apmServiceName,
  serviceVersion: config.public.apmServiceVersion, // ← 중요!
  serverUrl: config.public.apmServerUrl
})
```

```bash
# 빌드 시 버전 설정
export NUXT_PUBLIC_APM_SERVICE_VERSION=$(git rev-parse --short HEAD)
npm run build

# 같은 버전으로 소스맵 업로드
APM_SERVICE_VERSION=$(git rev-parse --short HEAD) npm run upload-sourcemaps
```

#### package.json 스크립트로 자동화

```json
{
  "scripts": {
    "build:prod": "NODE_ENV=production NUXT_PUBLIC_APM_SERVICE_VERSION=$(git rev-parse --short HEAD) nuxt build",
    "upload-sourcemaps:auto": "APM_SERVICE_VERSION=$(git rev-parse --short HEAD) ./scripts/upload-sourcemaps.sh",
    "deploy": "npm run build:prod && npm run upload-sourcemaps:auto"
  }
}
```

---

## 검증 및 테스트

### 1. 업로드 확인

#### 스크립트 출력 확인

성공 시:
```
✓ Success (HTTP 202)
```

실패 시:
```
✗ Failed (HTTP 404)
Response: {"error": "404 page not found"}
```

#### Curl로 직접 확인

```bash
# 업로드된 소스맵 목록 조회
curl -X GET "http://localhost:8200/assets/v1/sourcemaps" \
  -H "Authorization: Bearer ${APM_SECRET_TOKEN}"
```

**응답 예시**:
```json
{
  "sourcemaps": [
    {
      "service_name": "rumvue-demo",
      "service_version": "a1b2c3d",
      "bundle_filepath": "/_nuxt/entry.abc123.js",
      "created": "2025-01-06T14:30:22Z"
    }
  ]
}
```

### 2. Kibana에서 확인

#### Stack Management에서 확인

1. Kibana 접속
2. **Stack Management → APM → Source Maps**
3. 업로드된 소스맵 목록 확인

**확인 항목**:
- Service Name
- Service Version
- Bundle Filepath
- Upload Time

#### 실제 에러로 테스트

```vue
<!-- app/pages/test-error.vue -->
<template>
  <button @click="throwError">Throw Test Error</button>
</template>

<script setup>
const throwError = () => {
  // 의도적 에러 발생
  const user = null
  console.log(user.name) // ← TypeError 발생
}
</script>
```

**프로세스**:
1. 프로덕션 빌드 및 소스맵 업로드
2. 앱 배포
3. `/test-error` 페이지 접속
4. "Throw Test Error" 버튼 클릭
5. Kibana APM → Errors 확인

**기대 결과**:
```
Error: Cannot read property 'name' of null
  at throwError (app/pages/test-error.vue:10:23)  ← 원본 파일 경로!
```

### 3. 브라우저 Network 탭 확인

**중요**: `hidden` 모드가 제대로 작동하는지 확인

1. 프로덕션 앱 접속
2. F12 → Network 탭
3. `.map` 파일 요청 확인

**정상 동작** (hidden 모드):
- ❌ `.map` 파일 요청 없음
- ✅ `.js` 파일만 로드됨

**비정상 동작**:
- ⚠️ `.map` 파일 요청 있음 → 소스맵이 공개됨
- 👉 `nuxt.config.ts` 설정 재확인 필요

---

## CI/CD 통합

### GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Build and Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v3
        with:
          fetch-depth: 0  # 전체 Git 히스토리 (for git rev-parse)

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Get Git commit hash
        id: git_hash
        run: echo "hash=$(git rev-parse --short HEAD)" >> $GITHUB_OUTPUT

      - name: Build application
        run: npm run build
        env:
          NODE_ENV: production
          NUXT_PUBLIC_APM_SERVICE_VERSION: ${{ steps.git_hash.outputs.hash }}

      - name: Upload Source Maps
        run: npm run upload-sourcemaps
        env:
          APM_SERVER_URL: ${{ secrets.APM_SERVER_URL }}
          APM_SERVICE_NAME: rumvue-demo
          APM_SERVICE_VERSION: ${{ steps.git_hash.outputs.hash }}
          APM_SECRET_TOKEN: ${{ secrets.APM_SECRET_TOKEN }}

      - name: Deploy to production
        run: npm run deploy
        # 배포 로직...

      - name: Notify deployment
        run: |
          echo "Deployed version: ${{ steps.git_hash.outputs.hash }}"
          echo "Source maps uploaded successfully"
```

**Secrets 설정**:
- `APM_SERVER_URL`: APM Server URL
- `APM_SECRET_TOKEN`: APM Server 인증 토큰

### GitLab CI

```yaml
# .gitlab-ci.yml
variables:
  NODE_ENV: production

stages:
  - build
  - upload
  - deploy

build:
  stage: build
  image: node:20
  script:
    - npm ci
    - export GIT_HASH=$(git rev-parse --short HEAD)
    - export NUXT_PUBLIC_APM_SERVICE_VERSION=$GIT_HASH
    - npm run build
  artifacts:
    paths:
      - .output/
    expire_in: 1 hour

upload_sourcemaps:
  stage: upload
  image: node:20
  dependencies:
    - build
  script:
    - export GIT_HASH=$(git rev-parse --short HEAD)
    - export APM_SERVICE_VERSION=$GIT_HASH
    - npm run upload-sourcemaps
  only:
    - main

deploy:
  stage: deploy
  dependencies:
    - build
  script:
    - npm run deploy
  only:
    - main
```

### Jenkins

```groovy
// Jenkinsfile
pipeline {
    agent any

    environment {
        NODE_ENV = 'production'
        GIT_HASH = sh(script: 'git rev-parse --short HEAD', returnStdout: true).trim()
    }

    stages {
        stage('Install') {
            steps {
                sh 'npm ci'
            }
        }

        stage('Build') {
            steps {
                sh """
                    export NUXT_PUBLIC_APM_SERVICE_VERSION=${GIT_HASH}
                    npm run build
                """
            }
        }

        stage('Upload Source Maps') {
            steps {
                withCredentials([string(credentialsId: 'apm-secret-token', variable: 'APM_SECRET_TOKEN')]) {
                    sh """
                        export APM_SERVICE_VERSION=${GIT_HASH}
                        export APM_SERVER_URL=${env.APM_SERVER_URL}
                        export APM_SERVICE_NAME=rumvue-demo
                        npm run upload-sourcemaps
                    """
                }
            }
        }

        stage('Deploy') {
            steps {
                sh 'npm run deploy'
            }
        }
    }

    post {
        success {
            echo "Deployed version: ${GIT_HASH}"
            echo "Source maps uploaded"
        }
    }
}
```

---

## 문제 해결

### ⚠️ APM Server 8.x에서 업로드 실패 (HTTP 404)

**증상**:
```bash
npm run upload-sourcemaps

Uploading: entry.abc123.js.map
  Bundle path: /_nuxt/entry.abc123.js
  ✗ Failed (HTTP 404)
  Response: {"error": "404 page not found"}
```

**원인**: APM Server 8.x는 직접 API를 통한 소스맵 업로드를 지원하지 않습니다.

**해결책**:

#### 옵션 1: Kibana UI 사용 (추천 - 간단)

```bash
# 1. Kibana 접속
open http://localhost:5601

# 2. 경로: Stack Management → APM → Source Maps
# 3. "Upload Source Map" 버튼 클릭
# 4. 파일 및 메타데이터 입력:
#    - Service Name: rumvue-demo
#    - Service Version: 1.0.0 (또는 git hash)
#    - Bundle filepath: /_nuxt/entry.abc123.js
#    - Source map file: entry.abc123.js.map 선택
```

#### 옵션 2: APM Server 7.17.x로 다운그레이드 (CI/CD 자동화 필요 시)

**docker-compose.yml 수정**:
```yaml
services:
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:7.17.15  # 8.11.0 → 7.17.15
    # ... 기타 설정 동일

  kibana:
    image: docker.elastic.co/kibana/kibana:7.17.15  # 8.11.0 → 7.17.15
    # ... 기타 설정 동일

  apm-server:
    image: docker.elastic.co/apm/apm-server:7.17.15  # 8.11.0 → 7.17.15
    # ... 기타 설정 동일
```

**재시작**:
```bash
docker compose down
docker compose up -d

# 스택이 준비될 때까지 대기 (약 2-3분)
./scripts/check-elastic.sh

# 소스맵 업로드 재시도
npm run upload-sourcemaps
```

**장점**:
- ✅ 자동 업로드 스크립트 사용 가능
- ✅ CI/CD 파이프라인 통합 용이
- ✅ APM 7.17.x는 안정적이고 완전히 지원됨

**단점**:
- ⚠️ Elasticsearch/Kibana도 함께 다운그레이드 필요
- ⚠️ Elastic Stack 8.x의 최신 기능 사용 불가

#### 옵션 3: Elastic Cloud 사용

Elastic Cloud는 Fleet을 통한 소스맵 관리를 지원합니다:
```bash
# Elastic Cloud CLI 설치
npm install -g @elastic/cloud-cli

# 소스맵 업로드
elastic-cloud sourcemap upload \
  --service-name rumvue-demo \
  --service-version 1.0.0 \
  .output/public/_nuxt/*.map
```

---

### 소스맵 파일이 생성되지 않음

**증상**:
```bash
ls .output/public/_nuxt/*.map
# 출력: No such file or directory
```

**해결책**:

1. **nuxt.config.ts 확인**:
```bash
cat nuxt.config.ts | grep -A 3 sourcemap
```

2. **Vite 설정 확인**:
```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  vite: {
    build: {
      sourcemap: true  // 명시적으로 활성화
    }
  }
})
```

3. **빌드 로그 확인**:
```bash
npm run build 2>&1 | grep -i "map"
```

### 업로드 실패 (HTTP 401/403)

**증상**:
```
✗ Failed (HTTP 401)
Response: {"error": "Unauthorized"}
```

**원인**: APM Server가 인증을 요구함

**해결책**:

```bash
# 1. APM Server 설정 확인
curl http://localhost:8200

# 2. Secret Token 설정
export APM_SECRET_TOKEN=your-secret-token
npm run upload-sourcemaps

# 3. Token이 올바른지 확인
curl -H "Authorization: Bearer ${APM_SECRET_TOKEN}" \
  http://localhost:8200/assets/v1/sourcemaps
```

### 업로드 실패 (HTTP 404)

**증상**:
```
✗ Failed (HTTP 404)
Response: {"error": "404 page not found"}
```

**원인 1**: APM Server가 실행되지 않음

**해결책**:
```bash
# APM Server 상태 확인
curl http://localhost:8200
docker compose ps apm-server
```

**원인 2**: 잘못된 엔드포인트

**해결책**:
```bash
# APM Server 버전 확인 (7.0 이상 필요)
curl http://localhost:8200 | jq '.version'

# 올바른 엔드포인트: /assets/v1/sourcemaps
```

### Kibana에서 소스맵 매핑 안됨

**증상**: Kibana에서 여전히 압축된 스택 트레이스 표시

**원인 1**: Service Version 불일치

**확인**:
```bash
# 1. RUM Agent 버전 확인 (브라우저 콘솔)
apm.serviceVersion  # 예: "a1b2c3d"

# 2. 업로드된 소스맵 버전 확인
curl http://localhost:8200/assets/v1/sourcemaps | jq '.sourcemaps[].service_version'
# 예: ["1.0.0"]  ← 불일치!
```

**해결책**:
```bash
# 같은 버전으로 다시 업로드
APM_SERVICE_VERSION=a1b2c3d npm run upload-sourcemaps
```

**원인 2**: Bundle Filepath 불일치

**확인**:
```javascript
// 에러 스택에서 파일 경로 확인
at e.t (/_nuxt/entry.abc123.js:1:4567)
       ^^^^^^^^^^^^^^^^^^^^^^^^
       이 경로가 업로드 시 bundle_filepath와 일치해야 함
```

**해결책**:
```bash
# 스크립트에서 자동으로 처리하지만, 수동 업로드 시:
curl -X POST http://localhost:8200/assets/v1/sourcemaps \
  -F bundle_filepath="/_nuxt/entry.abc123.js" \  # ← 정확한 경로!
  -F sourcemap=@.output/public/_nuxt/entry.abc123.js.map
```

### 스크립트 권한 에러

**증상**:
```bash
npm run upload-sourcemaps
# 출력: Permission denied: ./scripts/upload-sourcemaps.sh
```

**해결책**:
```bash
chmod +x scripts/upload-sourcemaps.sh
```

---

## 실전 팁과 트릭

### 1. 빌드 및 업로드 자동화

**One-liner 스크립트**:

```bash
#!/bin/bash
# deploy.sh

set -e  # 에러 시 중단

echo "🚀 Starting deployment..."

# Git hash 추출
GIT_HASH=$(git rev-parse --short HEAD)
echo "📌 Version: $GIT_HASH"

# 빌드
echo "🔨 Building..."
NODE_ENV=production NUXT_PUBLIC_APM_SERVICE_VERSION=$GIT_HASH npm run build

# 소스맵 업로드
echo "📤 Uploading source maps..."
APM_SERVICE_VERSION=$GIT_HASH npm run upload-sourcemaps

# 배포
echo "🚢 Deploying..."
npm run deploy

echo "✅ Deployment complete! Version: $GIT_HASH"
```

### 2. 소스맵 크기 최적화

**문제**: 소스맵 파일이 너무 큼 (수 MB)

**해결책**:

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  vite: {
    build: {
      sourcemap: process.env.NODE_ENV === 'production' ? 'hidden' : true,
      // 소스맵 압축
      minify: 'terser',
      terserOptions: {
        sourceMap: true,
        compress: {
          drop_console: true,  // console 제거로 크기 감소
          drop_debugger: true
        }
      }
    }
  }
})
```

### 3. 여러 환경별 소스맵 관리

**시나리오**: dev, staging, production 각각 별도 소스맵

**전략**:

```bash
# 환경별 버전 네이밍
# dev: dev-a1b2c3d-20250106
# staging: staging-a1b2c3d-20250106
# prod: a1b2c3d

ENV=${1:-production}
GIT_HASH=$(git rev-parse --short HEAD)
DATE=$(date +%Y%m%d)

case $ENV in
  dev)
    VERSION="dev-${GIT_HASH}-${DATE}"
    ;;
  staging)
    VERSION="staging-${GIT_HASH}-${DATE}"
    ;;
  production)
    VERSION="${GIT_HASH}"
    ;;
esac

APM_SERVICE_VERSION=$VERSION npm run upload-sourcemaps
```

### 4. 소스맵 보존 정책

**문제**: APM Server에 소스맵이 계속 쌓임

**권장 정책**:

- **최근 10개 버전**: 보존
- **30일 이상 지난 버전**: 삭제
- **프로덕션 릴리스**: 영구 보존

**수동 삭제** (APM Server API):
```bash
# 특정 버전 삭제
curl -X DELETE "http://localhost:8200/assets/v1/sourcemaps" \
  -H "Authorization: Bearer ${APM_SECRET_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "service_name": "rumvue-demo",
    "service_version": "old-version-123"
  }'
```

### 5. 대용량 앱의 증분 업로드

**문제**: 100개 이상의 소스맵 파일, 업로드 시간 오래 걸림

**최적화**:

```bash
# 병렬 업로드 (GNU parallel 사용)
find .output/public/_nuxt -name "*.js.map" | \
  parallel -j 4 \
  'curl -X POST http://localhost:8200/assets/v1/sourcemaps \
    -F service_name=rumvue-demo \
    -F service_version=$VERSION \
    -F bundle_filepath=/_nuxt/{/.}.js \
    -F sourcemap=@{}'
```

### 6. 로컬 개발 시 소스맵 테스트

**개발 환경에서 소스맵 동작 확인**:

```bash
# 1. 프로덕션 모드로 빌드 (소스맵 생성)
NODE_ENV=production npm run build

# 2. 로컬 APM Server 실행
docker compose up -d apm-server

# 3. 소스맵 업로드
npm run upload-sourcemaps

# 4. 프리뷰 모드 실행
npm run preview

# 5. 의도적 에러 발생 후 Kibana 확인
```

---

## FAQ

### Q1: 소스맵 파일을 Git에 커밋해야 하나요?

**A**: ❌ **아니요**. 소스맵은 빌드 산출물이므로 Git에 포함하지 않습니다.

```bash
# .gitignore
.output/
dist/
*.map
```

빌드 시 매번 생성하고 APM Server에 업로드합니다.

---

### Q2: 소스맵을 CDN에 배포해야 하나요?

**A**: ❌ **절대 안 됩니다**. 소스맵은 소스 코드를 포함하므로 공개하면 보안 위험이 있습니다.

**올바른 방법**:
- ✅ APM Server에만 업로드
- ✅ 웹 서버에서 `.map` 접근 차단
- ✅ CDN에서 `.map` 파일 제외

---

### Q3: 매 배포마다 소스맵을 업로드해야 하나요?

**A**: ✅ **예**. 각 배포는 고유한 빌드 결과물이므로 소스맵도 업데이트해야 합니다.

자동화하면 부담이 없습니다:
```bash
npm run build && npm run upload-sourcemaps && npm run deploy
```

---

### Q4: APM Server 없이 로컬에서 소스맵 테스트할 수 있나요?

**A**: ✅ **예**. 브라우저 DevTools에서 직접 테스트 가능합니다.

**방법**:
1. 개발 모드로 실행 (`npm run dev`)
2. 브라우저에서 소스맵 자동 로드
3. 에러 발생 시 원본 소스 위치 표시

하지만 **프로덕션 환경과 정확히 동일한 테스트는 APM Server 필요**합니다.

---

### Q5: Service Version을 변경하지 않으면 어떻게 되나요?

**A**: ⚠️ **이전 배포의 소스맵을 덮어씁니다**.

**문제점**:
- 롤백 시 소스맵 매칭 불가
- 여러 버전이 동시에 실행 중일 때 충돌
- 디버깅 정확도 저하

**해결**: Git commit hash 사용으로 자동화
```bash
APM_SERVICE_VERSION=$(git rev-parse --short HEAD)
```

---

### Q6: 소스맵 업로드 실패해도 앱은 정상 동작하나요?

**A**: ✅ **예**. 앱 동작에는 영향 없습니다.

소스맵은 **디버깅 도구**일 뿐이므로:
- ✅ 앱은 정상 실행
- ❌ Kibana에서 압축된 스택 트레이스만 표시
- 👉 가능한 빨리 소스맵 업로드 권장

---

### Q7: Nuxt 3와 Nuxt 4 모두 동일한 방법인가요?

**A**: ✅ **예**. 이 가이드는 Nuxt 3와 4 모두 호환됩니다.

유일한 차이점:
- Nuxt 4: `sourcemap` 설정 직접 지원
- Nuxt 3: `vite.build.sourcemap` 설정 사용

---

### Q8: 비용은 얼마나 드나요?

**A**: APM Server 소스맵 저장소 비용만 발생합니다.

**예상 비용** (AWS S3 기준):
- 소스맵 파일 크기: 평균 10MB/버전
- 저장 기간: 30일
- 배포 빈도: 주 5회
- 월 저장량: 10MB × 5 × 4 = 200MB
- **비용: $0.005/월** (거의 무료!)

---

### Q9: TypeScript의 타입 정보도 포함되나요?

**A**: ✅ **예**. 소스맵은 컴파일 전 TypeScript 원본을 가리킵니다.

**Kibana 스택 트레이스**:
```typescript
at handleSubmit (src/composables/useForm.ts:45:12)
                 ^^^^^^^^^^^^^^^^^^^^^^^^^^^
                 TypeScript 파일 경로
```

---

### Q10: 소스맵이 너무 큽니다. 압축할 수 있나요?

**A**: ✅ **예**. APM Server가 gzip 압축을 지원합니다.

스크립트가 자동으로 처리하지만, 수동 업로드 시:
```bash
# gzip 압축 후 업로드
gzip -c entry.abc123.js.map > entry.abc123.js.map.gz

curl -X POST http://localhost:8200/assets/v1/sourcemaps \
  -H "Content-Encoding: gzip" \
  -F sourcemap=@entry.abc123.js.map.gz \
  ...
```

---

## 추가 리소스

### 공식 문서
- [Elastic APM Source Maps](https://www.elastic.co/guide/en/apm/guide/current/sourcemap-api.html)
- [Nuxt.js Source Maps](https://nuxt.com/docs/api/nuxt-config#sourcemap)
- [Vite Source Maps](https://vitejs.dev/config/build-options.html#build-sourcemap)

### 커뮤니티
- [Elastic Discuss](https://discuss.elastic.co/)
- [Nuxt Discord](https://discord.com/invite/nuxt)

### 관련 문서
- [README-APM.md](./README-APM.md) - APM 기본 설정
- [QUICKSTART.md](./QUICKSTART.md) - 빠른 시작 가이드

---

## 라이센스

MIT

---

**Made with ❤️ for better debugging experience**

마지막 업데이트: 2025-01-06
