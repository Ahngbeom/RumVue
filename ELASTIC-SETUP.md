# Elastic APM Server 로컬 구축 가이드

로컬 환경에서 Elastic APM Server를 Docker Compose로 구축하는 방법입니다.

## 📋 사전 요구사항

- Docker Desktop 또는 Docker Engine 설치
- Docker Compose 설치
- 최소 4GB RAM 여유 메모리 (권장: 8GB)
- 최소 10GB 디스크 공간

### Docker 설치 확인

```bash
docker --version
docker compose version
```

## 🚀 빠른 시작

### 1단계: Elastic Stack 실행

프로젝트 루트 디렉토리에서:

```bash
# Elastic Stack 시작 (Elasticsearch + Kibana + APM Server)
docker compose up -d

# 로그 확인
docker compose logs -f
```

### 2단계: 서비스 상태 확인

모든 서비스가 healthy 상태가 될 때까지 기다립니다 (약 2-3분 소요):

```bash
# 컨테이너 상태 확인
docker compose ps

# 또는 개별적으로 확인
curl http://localhost:9200          # Elasticsearch
curl http://localhost:5601/status   # Kibana
curl http://localhost:8200          # APM Server
```

### 3단계: Kibana 접속

브라우저에서 http://localhost:5601 접속

- 초기 로딩에 1-2분 정도 걸릴 수 있습니다
- 인증 없이 바로 사용 가능 (개발 환경 설정)

### 4단계: RumVue 앱 연결

```bash
# .env.local 파일을 .env로 복사
cp .env.local .env

# Nuxt 개발 서버 실행
npm run dev
```

브라우저에서 http://localhost:3000 접속하여 앱 사용

### 5단계: Kibana에서 데이터 확인

1. Kibana (http://localhost:5601) 접속
2. 왼쪽 메뉴에서 **Observability → APM** 클릭
3. **Services** 목록에서 `rumvue-demo` 확인
4. 클릭하여 트랜잭션, 에러, 메트릭 확인

## 📊 구성 요소

### Elasticsearch (포트: 9200)
- APM 데이터를 저장하는 검색 엔진
- 메모리: 512MB (개발용)
- 데이터는 Docker 볼륨에 영구 저장

### Kibana (포트: 5601)
- 데이터 시각화 대시보드
- APM UI 제공
- URL: http://localhost:5601

### APM Server (포트: 8200)
- RUM 에이전트로부터 데이터 수집
- Elasticsearch로 데이터 전송
- URL: http://localhost:8200

## 🔧 상세 설정

### docker-compose.yml 주요 설정

#### APM Server RUM 설정
```yaml
- apm-server.rum.enabled=true                    # RUM 활성화
- apm-server.rum.allow_origins=['*']             # CORS 모든 origin 허용 (개발용)
- apm-server.rum.allow_headers=['*']             # 모든 헤더 허용
- apm-server.auth.anonymous.enabled=true         # 인증 없이 사용 (개발용)
```

⚠️ **프로덕션 환경에서는 반드시 변경해야 할 설정:**
- `allow_origins`: 실제 앱 도메인만 허용
- `anonymous.enabled`: false로 설정하고 API 키 사용

### 메모리 설정 변경

시스템 리소스에 맞게 조정:

```yaml
# docker-compose.yml에서 수정
environment:
  - "ES_JAVA_OPTS=-Xms1g -Xmx1g"  # Elasticsearch 메모리 (기본: 512m)
```

## 🛠️ 관리 명령어

### 시작/중지
```bash
# 전체 스택 시작
docker compose up -d

# 전체 스택 중지
docker compose down

# 중지하고 데이터 삭제
docker compose down -v

# 재시작
docker compose restart

# 특정 서비스만 재시작
docker compose restart apm-server
```

### 로그 확인
```bash
# 모든 서비스 로그
docker compose logs -f

# 특정 서비스 로그
docker compose logs -f apm-server
docker compose logs -f elasticsearch
docker compose logs -f kibana

# 최근 100줄만 보기
docker compose logs --tail=100 apm-server
```

### 상태 확인
```bash
# 컨테이너 상태
docker compose ps

# 리소스 사용량
docker stats
```

### 데이터 초기화
```bash
# 모든 데이터 삭제하고 재시작
docker compose down -v
docker compose up -d
```

## 🔍 Kibana APM 사용법

### 1. 서비스 개요
- **Observability → APM → Services**
- `rumvue-demo` 서비스 선택
- 평균 응답 시간, 처리량, 에러율 확인

### 2. 트랜잭션 분석
- **Transactions** 탭 선택
- 페이지별 성능 메트릭 확인
- 느린 트랜잭션 찾기

### 3. 에러 추적
- **Errors** 탭 선택
- 발생한 에러 목록 및 상세 정보
- 스택 트레이스 확인

### 4. 서비스 맵
- **Service Map** 선택
- API 호출 관계도 시각화

### 5. 메트릭
- **Metrics** 탭
- 브라우저 메트릭 (FCP, LCP, FID 등)
- 사용자 경험 점수

## 🎯 데이터 확인 예제

### 1. 간단한 상호작용 데이터
1. RumVue 앱에서 `/simple` 페이지 방문
2. 버튼 몇 개 클릭
3. Kibana APM에서 확인:
   - Transactions → `page-load` 또는 특정 페이지 트랜잭션
   - Labels에서 커스텀 라벨 확인

### 2. API 호출 추적
1. `/diverse` 페이지에서 "Fetch Users" 클릭
2. Kibana에서:
   - Transaction detail → Timeline
   - HTTP 요청 span 확인 (jsonplaceholder.typicode.com)

### 3. 에러 추적
1. `/diverse` 페이지에서 "Trigger Sync Error" 클릭
2. Kibana Errors 탭에서:
   - 에러 메시지 및 스택 트레이스 확인
   - 발생 빈도 확인

### 4. 복잡한 워크플로우
1. `/complex` 페이지에서 "Start Complex Workflow" 클릭
2. Kibana에서:
   - `complex-workflow` 트랜잭션 찾기
   - Timeline에서 각 스텝의 span 확인
   - 전체 워크플로우 소요 시간 분석

## 🐛 문제 해결

### APM Server 연결 실패

**증상**: 브라우저 콘솔에서 APM 관련 에러

**확인사항**:
```bash
# APM Server 상태 확인
curl http://localhost:8200

# 정상 응답:
# {
#   "build_date": "...",
#   "build_sha": "...",
#   "version": "8.11.0"
# }

# 로그 확인
docker compose logs apm-server
```

**해결방법**:
```bash
# APM Server 재시작
docker compose restart apm-server

# 전체 재시작
docker compose restart
```

### Elasticsearch 메모리 부족

**증상**: Elasticsearch 컨테이너가 계속 재시작됨

**확인**:
```bash
docker compose logs elasticsearch | grep -i "memory"
```

**해결**:
```yaml
# docker-compose.yml에서 메모리 줄이기
- "ES_JAVA_OPTS=-Xms256m -Xmx256m"
```

또는 Docker Desktop에서 메모리 할당량 증가

### Kibana 로딩 느림

**원인**: 초기 인덱스 생성 중

**해결**: 2-3분 기다리기. 다음 명령어로 상태 확인:
```bash
curl http://localhost:5601/api/status
```

### 데이터가 Kibana에 표시되지 않음

**확인사항**:
1. APM Server가 running 상태인지
2. 브라우저 Network 탭에서 APM 요청이 성공하는지
3. 시간 범위 설정 (Kibana 우측 상단에서 "Last 15 minutes" 선택)

**재시도**:
```bash
# RumVue 앱 재시작
npm run dev

# 브라우저 새로고침
# Kibana 페이지 새로고침
```

### 포트 충돌

**증상**: "port is already allocated" 에러

**확인**:
```bash
# 포트 사용 중인 프로세스 확인
lsof -i :9200
lsof -i :5601
lsof -i :8200
```

**해결**: docker-compose.yml에서 포트 변경
```yaml
ports:
  - "9201:9200"  # 9200 → 9201
  - "5602:5601"  # 5601 → 5602
  - "8201:8200"  # 8200 → 8201
```

그리고 `.env` 파일도 업데이트:
```env
NUXT_PUBLIC_APM_SERVER_URL=http://localhost:8201
```

## 🔐 보안 설정 (프로덕션용)

현재 설정은 개발 환경용입니다. 프로덕션에서는:

### 1. 인증 활성화
```yaml
# docker-compose.yml
- xpack.security.enabled=true
- apm-server.auth.anonymous.enabled=false
- apm-server.auth.secret_token=your-secret-token
```

### 2. CORS 제한
```yaml
- apm-server.rum.allow_origins=['https://yourdomain.com']
```

### 3. HTTPS 사용
- 프로덕션에서는 반드시 HTTPS 사용
- Let's Encrypt 등으로 SSL 인증서 설정

## 📚 추가 자료

- [Elastic APM Server 공식 문서](https://www.elastic.co/guide/en/apm/server/current/index.html)
- [RUM Agent 설정](https://www.elastic.co/guide/en/apm/agent/rum-js/current/configuration.html)
- [Kibana APM UI](https://www.elastic.co/guide/en/kibana/current/xpack-apm.html)
- [Docker Compose 문서](https://docs.docker.com/compose/)

## 💰 비용

로컬 개발 환경은 **완전 무료**입니다:
- Elasticsearch: 무료 (Basic 라이선스)
- Kibana: 무료
- APM Server: 무료
- 데이터는 로컬 Docker 볼륨에 저장

프로덕션 환경에서는:
- 자체 호스팅 (무료, 하지만 인프라 비용 발생)
- Elastic Cloud (유료, 관리 불필요)

## 🎉 완료!

이제 다음을 할 수 있습니다:
- ✅ 로컬에서 완전한 Elastic Stack 실행
- ✅ RumVue 앱에서 실시간 APM 데이터 수집
- ✅ Kibana에서 성능 분석 및 모니터링
- ✅ 에러 추적 및 디버깅

Happy Monitoring! 🚀
