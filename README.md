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

## 🐛 문제 해결

### APM 연결 실패
```bash
# APM Server 상태 확인
curl http://localhost:8200

# 컨테이너 재시작
docker compose restart apm-server
```

### Kibana에 데이터가 안 보임
1. 시간 범위 확인 (우측 상단: "Last 15 minutes")
2. 앱에서 페이지 이동/상호작용 후 30초 대기
3. Kibana 페이지 새로고침

### 메모리 부족
```yaml
# docker-compose.yml 수정
- "ES_JAVA_OPTS=-Xms256m -Xmx256m"
```

## 📖 참고 자료

- [Elastic APM RUM 문서](https://www.elastic.co/guide/en/apm/agent/rum-js/current/index.html)
- [Vue Integration](https://www.elastic.co/guide/en/apm/agent/rum-js/current/vue-integration.html)
- [Nuxt.js 문서](https://nuxt.com)

## 📝 라이센스

MIT

---

**Made with ❤️ for learning Elastic APM RUM**
