# Quick Start Guide

## 🚀 빠른 시작

### 1단계: 프로젝트 실행

```bash
# 개발 서버 시작 (의존성은 이미 설치됨)
npm run dev
```

브라우저에서 `http://localhost:3000` 열기

### 2단계: 데모 페이지 탐색

1. **홈페이지** (`/`): 프로젝트 개요 및 APM 상태 확인
2. **Simple Interactions** (`/simple`): 기본적인 상호작용 예제
   - 버튼 클릭
   - 폼 입력
   - 체크박스/토글
3. **Diverse Interactions** (`/diverse`): 다양한 작업 예제
   - API 호출
   - 타이머
   - 에러 추적
   - 로컬 스토리지
4. **Complex Interactions** (`/complex`): 고급 기능 예제
   - 커스텀 트랜잭션
   - 중첩 스팬
   - 사용자 컨텍스트

### 3단계: 브라우저 개발자 도구 확인

1. F12를 눌러 개발자 도구 열기
2. **Console 탭**: APM 로그 확인
3. **Network 탭**: APM 서버로의 요청 확인 (필터: `intake/v2/rum`)

## ⚙️ APM 서버 연결 (선택사항)

현재는 demo 설정으로 실행됩니다. 실제 Elastic APM 서버에 연결하려면:

### 방법 1: 환경 변수 사용

```bash
# .env 파일 생성
cp .env.example .env

# .env 파일 수정
NUXT_PUBLIC_APM_SERVER_URL=http://your-apm-server:8200
NUXT_PUBLIC_APM_SERVICE_NAME=rumvue-demo
```

### 방법 2: 플러그인 직접 수정

`app/plugins/apm.client.ts` 파일 수정:

```typescript
const apm = initApm({
  serviceName: 'your-service-name',
  serverUrl: 'http://your-apm-server:8200',
  // ... 기타 설정
})
```

## 🔍 주요 파일 위치

```
app/
├── plugins/
│   └── apm.client.ts          ← APM 설정 파일
├── composables/
│   └── useApm.ts               ← APM 헬퍼 함수
└── pages/
    ├── index.vue               ← 홈페이지
    ├── simple.vue              ← 간단한 예제
    ├── diverse.vue             ← 다양한 예제
    └── complex.vue             ← 복잡한 예제
```

## 📊 코드에서 APM 사용하기

```vue
<script setup>
const { addLabels, startTransaction, captureError } = useApm()

// 라벨 추가
addLabels({
  user_action: 'button_click'
})

// 커스텀 트랜잭션
const transaction = startTransaction('checkout', 'user-interaction')
// ... 작업 수행
transaction.end()

// 에러 캡처
try {
  // 코드
} catch (error) {
  captureError(error)
}
</script>
```

## 📚 더 알아보기

- 상세 문서: `README-APM.md` 참고
- Elastic 공식 문서: https://www.elastic.co/guide/en/apm/agent/rum-js/current/

## ❓ 문제 해결

### APM이 작동하지 않는 경우

1. 브라우저 콘솔에서 에러 확인
2. 개발자 도구 Network 탭에서 APM 요청 확인
3. `app/plugins/apm.client.ts`의 `logLevel: 'debug'` 설정 확인

### 포트가 이미 사용 중인 경우

```bash
# 다른 포트로 실행
PORT=3001 npm run dev
```

## 🎯 다음 단계

1. ✅ 각 페이지의 예제 실행해보기
2. ✅ 브라우저 콘솔에서 APM 로그 확인
3. ✅ 실제 APM 서버 연결하기 (Elastic Cloud 또는 로컬 설치)
4. ✅ Kibana에서 수집된 데이터 확인
5. ✅ 자신의 프로젝트에 APM 적용하기

Happy Monitoring! 🎉
