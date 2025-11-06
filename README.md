# RumVue

Vue.js & Nuxt.js 환경에서 Elastic APM RUM(Real User Monitoring) 연동 데모 프로젝트

## 🚀 빠른 시작

### 1. 의존성 설치 (이미 완료됨)
```bash
npm install
```

### 2. Elastic Stack 실행 (로컬)
```bash
# Docker Compose로 Elasticsearch + Kibana + APM Server 실행
docker compose up -d

# 상태 확인 (약 2-3분 후)
./scripts/check-elastic.sh
# 또는
docker compose ps
```

### 3. 환경 변수 설정
```bash
# .env.local을 .env로 복사 (로컬 APM Server 사용 시)
cp .env.local .env
```

### 4. 개발 서버 실행
```bash
npm run dev
```

브라우저에서 http://localhost:3000 접속

### 5. Kibana에서 데이터 확인
http://localhost:5601 접속 후 **Observability → APM** 메뉴

## 📚 문서

- **[QUICKSTART.md](QUICKSTART.md)** - 앱 사용 빠른 시작 가이드
- **[ELASTIC-SETUP.md](ELASTIC-SETUP.md)** - Elastic APM Server 로컬 구축 가이드 ⭐
- **[README-APM.md](README-APM.md)** - 상세 APM 설정 및 사용법
- **[SOURCEMAP-GUIDE.md](SOURCEMAP-GUIDE.md)** - 소스맵 업로드 및 활용 가이드 📦
- **[APM-TIMELINE-FILTERING.md](APM-TIMELINE-FILTERING.md)** - APM Timeline 필터링 가이드 🔍
- **[CLAUDE.md](CLAUDE.md)** - 프로젝트 개요

## 🎯 주요 기능

### 자동 추적
- ✅ 페이지 로드 성능
- ✅ 라우트 변경 (Vue Router)
- ✅ HTTP 요청 (Fetch/XHR)
- ✅ JavaScript 에러
- ✅ Core Web Vitals (FCP, LCP, FID)

### 예제 페이지
1. **Simple** (`/simple`) - 기본 상호작용
   - 버튼 클릭
   - 폼 입력
   - 체크박스/토글

2. **Diverse** (`/diverse`) - 다양한 작업
   - API 호출
   - 타이머
   - 에러 추적
   - 로컬 스토리지

3. **Complex** (`/complex`) - 고급 기능
   - 커스텀 트랜잭션
   - 중첩 스팬
   - 사용자 컨텍스트

## 🛠️ 프로젝트 구조

```
RumVue/
├── app/
│   ├── plugins/
│   │   └── apm.client.ts          # APM 플러그인
│   ├── composables/
│   │   └── useApm.ts               # APM 컴포저블
│   └── pages/
│       ├── index.vue               # 홈
│       ├── simple.vue              # 간단한 예제
│       ├── diverse.vue             # 다양한 예제
│       └── complex.vue             # 복잡한 예제
├── scripts/
│   └── check-elastic.sh            # Elastic 상태 확인 스크립트
├── docker-compose.yml              # Elastic Stack 설정
├── .env.local                      # 로컬 환경 변수 템플릿
└── .env.example                    # 환경 변수 예제
```

## ⚙️ 환경 변수

```env
# APM Server URL
NUXT_PUBLIC_APM_SERVER_URL=http://localhost:8200

# Service 정보
NUXT_PUBLIC_APM_SERVICE_NAME=rumvue-demo
NUXT_PUBLIC_APM_SERVICE_VERSION=1.0.0
NUXT_PUBLIC_APM_ENVIRONMENT=development
```

## 🔧 유용한 명령어

### Elastic Stack 관리
```bash
# 시작
docker compose up -d

# 중지
docker compose down

# 로그 확인
docker compose logs -f apm-server

# 상태 확인
./scripts/check-elastic.sh
```

### 앱 개발
```bash
# 개발 서버
npm run dev

# 빌드
npm run build

# 프로덕션 프리뷰
npm run preview
```

## 🌐 접속 URL

- **RumVue App**: http://localhost:3000
- **Kibana**: http://localhost:5601
- **APM UI**: http://localhost:5601/app/apm
- **Elasticsearch**: http://localhost:9200
- **APM Server**: http://localhost:8200

## 📊 데이터 확인 방법

1. RumVue 앱에서 페이지 이동 및 상호작용
2. Kibana (http://localhost:5601) 접속
3. **Observability → APM** 메뉴 클릭
4. **Services** 목록에서 `rumvue-demo` 선택
5. Transactions, Errors, Metrics 탭에서 데이터 확인

## ✨ 프로젝트 특징

### 🎓 학습 목적의 실전 데모
- Elastic APM RUM의 실제 사용 방법을 단계별로 학습
- 간단한 예제부터 복잡한 커스텀 추적까지 점진적으로 제공
- 로컬 환경에서 완전한 APM 스택을 쉽게 구축

### 🧩 재사용 가능한 컴포넌트
- `TrackedCard`, `TrackedForm`, `TrackedList` 등 추적 기능이 내장된 컴포넌트
- 컴포넌트별 에러 및 트랜잭션 자동 구분
- 실무에서 바로 사용 가능한 패턴 제공

### 🔄 Nuxt 3/4 호환
- Nuxt 4로 개발, Nuxt 3와 95% 이상 코드 호환
- 최소한의 수정으로 Nuxt 3 프로젝트에 적용 가능
- 자세한 마이그레이션 가이드 포함 (CLAUDE.md)

### 🛡️ 프로덕션 레디
- 클라이언트 사이드 전용 실행으로 SSR 안전성 보장
- 환경별 설정 분리 (development/production)
- 에러 핸들링 및 성능 최적화 적용

### 🐳 Docker로 간편한 설정
- `docker compose up -d` 한 줄로 전체 APM 스택 실행
- Elasticsearch, Kibana, APM Server 자동 구성
- 즉시 사용 가능한 로컬 개발 환경

## 🛠️ 기술 스택

- **Frontend**: Nuxt 4 (Vue 3, Composition API)
- **APM**: Elastic APM RUM (`@elastic/apm-rum`, `@elastic/apm-rum-vue`)
- **Backend**: Elasticsearch 8.x + Kibana + APM Server
- **Infrastructure**: Docker Compose
- **Language**: TypeScript

## 📖 참고 자료

- [Elastic APM RUM 문서](https://www.elastic.co/guide/en/apm/agent/rum-js/current/index.html)
- [Vue Integration](https://www.elastic.co/guide/en/apm/agent/rum-js/current/vue-integration.html)
- [Nuxt.js 문서](https://nuxt.com)

## 📝 라이센스

MIT

---

**Made with ❤️ for learning Elastic APM RUM**
