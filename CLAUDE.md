# RumVue: Vue.js & Nuxt.js 환경에서 Elastic APM RUM(Real User Monitoring) 연동해보기

## ✅ Completed Setup

### 프로젝트 구성
- ✅ Nuxt.js 4 프로젝트 초기화
- ✅ Elastic APM RUM 패키지 설치 (`@elastic/apm-rum`, `@elastic/apm-rum-vue`)
- ✅ APM 플러그인 설정 (`app/plugins/apm.client.ts`)
- ✅ APM 컴포저블 생성 (`app/composables/useApm.ts`)

### 예제 페이지
- ✅ **간단한 상호작용** (`/simple`): 버튼 클릭, 폼 입력, 체크박스
- ✅ **다양한 상호작용** (`/diverse`): API 호출, 타이머, 에러 추적, 스토리지
- ✅ **복잡한 상호작용** (`/complex`): 커스텀 트랜잭션, 중첩 스팬, 사용자 컨텍스트

### 문서
- 📖 `README-APM.md`: 상세한 설정 및 사용 가이드
- 🚀 `QUICKSTART.md`: 빠른 시작 가이드
- 🔧 `.env.example`: 환경 변수 템플릿

## 🚀 실행 방법

```bash
npm run dev
```

브라우저에서 `http://localhost:3000` 열기
