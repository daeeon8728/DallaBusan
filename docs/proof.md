> 최신 결과는 이 문서 마지막의 **전체 부산 관광정보 검색·제휴 상품 연결 — 2026-11-11** 절이다. 이전 절은 당시 상태를 보존한 이력이며 현재 요구사항은 docs/catalog-plan.md를 따른다.
# 1단계 기반 구성 검증 기록

## 범위와 환경

- 검증일: 2026-11-09, Asia/Seoul. 최종 파일·서버 종료 확인: 11:54 KST.
- 기준: plan의 4절 중 **1. 기반 구성**만 구현했다. 2단계 모델·검수 DB는 시작하지 않았다.
- 기준 커밋: ab58bf0. 구현 결과는 작업 디렉토리에 있으며 커밋·푸시·배포는 하지 않았다.
- 환경: Windows PowerShell, Node v24.14.1, npm 11.11.0. 실행 시 npm.cmd를 사용했다.
- 기존 intent.md와 spec.md는 변경하지 않았다. AGENTS.md와 plan.md의 현재 상태 안내만 구현 상태에 맞췄다.

## 구현 파일과 동작

| 파일/영역 | 이번 산출물 |
| --- | --- |
| 루트 package.json, package-lock.json, .node-version, .npmrc | private npm workspaces 3개, 정확한 버전·engines, 재현 설치, 루트 실행/검증 명령 |
| tsconfig.base.json, tsconfig.tools.json, 각 workspace tsconfig | strict·미사용 검사·정확한 optional 타입, NodeNext ESM·브라우저 Bundler 분리 |
| packages/domain | 외부 런타임 의존이 없는 locale·통화·공개 health 응답 스키마와 export 경계 |
| apps/server | Fastify 앱 생성/실행 분리, 환경 검증, GET /api/health, 빌드된 웹 정적 제공, API 404와 SPA fallback 분리 |
| apps/web | React/Vite 진입, 반응형 매거진 기본 레이아웃, 5개 언어 전환, 기본 통화 표시, 실제 health 연결·실패 재시도 |
| config, scripts | 비활성 PROVIDER_A 예시 설정, AST 기반 import/환경 접근/업체 리터럴 검사, 후속 단계 명령의 명시적인 실패 처리 |
| tests, Vitest, Playwright, ESLint | 설정·계약·서버·아키텍처 테스트와 3가지 화면 폭의 브라우저 smoke |
| .gitignore, .env.example, README.md | 비밀값·DB·빌드/테스트 산출물 제외, 자격증명 없는 로컬 실행 안내 |

Leaflet 1.9.4, react-leaflet 5.0.0, PixiJS 8.22.0은 향후 지도 통합을 위해 설치했다. 이번에는 지도·경로·Pixi 레이어를 구현하지 않았다. 화면의 포스터는 CSS 표현이며 운영용 부산 사진을 확보·검수한 것으로 간주하지 않는다.

제휴사 표시명·실제 도메인·예약 URL·파트너 ID·추적 코드를 앱 로직에 넣지 않았다. PROVIDER_A 예시 설정은 비활성이며 실제 제휴 링크와 비밀값이 없다. 경계 검사에 필요한 금지 상호 목록은 별도 도구 설정에만 존재한다.

## 고정한 주요 버전

| 도구 | 버전 |
| --- | --- |
| Node / npm | 24.14.1 / 11.11.0 |
| React / React DOM | 19.3.1 / 19.3.1 |
| Vite / React 플러그인 | 7.3.7 / 5.2.0 |
| TypeScript / Zod | 5.9.3 / 4.6.7 |
| Fastify / 정적 파일 플러그인 | 5.12.8 / 10.1.10 |
| ESLint / typescript-eslint | 10.14.0 / 8.72.1 |
| Vitest / Playwright | 4.1.12 / 1.65.0 |

최상위와 웹의 Vite 버전을 일치시켰다. minimatch는 보안 패치 11.0.5로 override했다. 이 상위 버전 조합의 호환성은 재설치·lint·타입 검사·테스트·빌드로 확인했으며, 상위 패키지 업데이트 시 override 필요성을 다시 검토해야 한다.

## 실행 결과

| 명령/확인 | 결과 | 증거 |
| --- | --- | --- |
| npm.cmd install --no-fund | 최종 종료 0 | 고정 버전·잠금 파일 생성 및 의존성 수정 |
| npm.cmd ci --no-fund | 종료 0 | 잠금 파일 기준 308개 설치, 312개 감사, 취약점 0건 |
| npm.cmd run lint | 종료 0 | 경고 허용 0 설정으로 전체 소스 통과 |
| npm.cmd run typecheck | 종료 0 | server·web·domain·도구/테스트 strict 검사 통과 |
| npm.cmd run test -- --run | 종료 0 | 테스트 파일 2개, 테스트 22개 통과 |
| npm.cmd run check:providers | 종료 0 | 실제 TS/TSX 소스 9개 통과, 금지 import/직접 환경 접근/고정 provider 결합 검출 테스트 포함 |
| npm.cmd run build | 종료 0 | domain → server → web 컴파일·번들 완료 |
| npm.cmd run test:e2e | 종료 0 | Chromium 6개 테스트, 9.5초, 360/768/1280px 각각 2개 통과 |
| npm.cmd audit --audit-level=moderate | 종료 0 | found 0 vulnerabilities |
| npm.cmd ls minimatch vite --all | 종료 0 | Vite 7.3.7·minimatch 11.0.5로 정합성 확인, invalid 항목 없음 |
| npm.cmd run dev | 정상 기동 확인 | domain 감시 모드 오류 0, Vite 5173·서버 3001 기동 |
| 개발 HTTP smoke | 종료 0 | 3001/api/health, 5173/api/health, 5173/ 모두 200 |
| npm.cmd run start | E2E 서버로 정상 실행 | 실제 dist 서버·웹을 4317에서 기동하고 health·화면·정적 번들 검사 |

npm run dev는 장기 실행 명령이므로 smoke 확인 후 Ctrl+C로 직접 종료했다. Windows 배치 종료 확인과 이에 따른 종료 코드 1은 검증용 프로세스의 의도적인 중단이며 컴파일/기동 실패가 아니다. E2E 서버도 종료됐으며 3001·5173·4317 포트가 닫힌 것을 확인했다.

빌드 산출물은 packages/domain/dist, apps/server/dist, apps/web/dist다. 웹 출력은 HTML 0.54 kB, CSS 3.61 kB, JS 296.11 kB(압축 시 93.14 kB)로 관찰됐다.

## 검증한 핵심 시나리오

- 외부 제공처 키 없이 로컬 설정·서버·웹이 실행된다. 잘못된 PORT·NODE_ENV는 민감한 입력값을 노출하지 않고 거부한다.
- 운영 인증이 없는 현재 단계에서 NODE_ENV=production 시작은 명시적으로 거부된다. 우회 로그인이나 가짜 인증을 구현하지 않았다.
- 지원 locale 5개를 검증하고 미지원 locale과 공개 health 응답의 예상 외 필드를 거부한다.
- domain에서 UI/런타임 계층 import, 웹에서 서버 설정 import, 서비스에서 직접 process.env 접근, 비즈니스 코드의 고정 PROVIDER_A 선택을 검사한다.
- 브라우저에서 실제 빌드 산출물과 서버가 연결되고 5개 언어로 전환된다. 언어별 문서 lang이 갱신되고 초기 기본 통화가 표시된다.
- 360/768/1280px에서 가로 스크롤이 발생하지 않는다. 페이지 JS 오류가 없고 미구현 일정 버튼은 비활성이다.
- health 503을 주입한 뒤 실패 상태·재시도 버튼이 표시된다. 실패 대역을 해제하고 재시도하면 실제 서버 연결 상태로 복구된다.
- Accept: text/html을 보낸 미구현 /api 경로도 HTML 성공 응답으로 바꾸지 않고 JSON 404를 반환한다.

## 화면 증거

당시 E2E가 생성한 화면에서 PC·모바일·태블릿을 확인했다. 해당 test-results 임시 산출물은 후속 E2E 실행으로 교체돼 현재 보존되지 않는다. 최신 카탈로그 화면은 문서 마지막의 docs/screenshots 캡처를 따른다.


## 발견한 문제와 수정

| 문제 | 수정 및 재확인 |
| --- | --- |
| Windows 셸의 명령 길이 제한 | 파일 생성 요청을 3개 묶음으로 분할했다. 실제 코드 파일의 누락 없이 생성 확인 |
| Vite 7/8이 동시에 설치돼 React 플러그인 타입 충돌 | 루트·웹 모두 7.3.7로 고정. 타입 검사·빌드·npm ls 통과 |
| 순수 domain의 Zod 선언에서 표준 URL 타입 누락 | TypeScript 표준 DOM 타입 라이브러리를 추가했다. UI/Node 런타임 import 없이 공통 URL 선언을 제공하고 strict 검사 통과 |
| 초기 정적 플러그인·하위 glob/minimatch 보안 감사 9건 | 정적 플러그인을 수정 버전으로 교체하고 minimatch 패치 버전을 고정. 최종 감사 0건 |
| npm이 중첩 override를 기존 트리에 적용하지 않음 | 단일 minimatch override로 정리. npm ci·npm ls·감사를 재실행해 재현 설치와 정합성 확인 |
| 기존 Fastify 요청 로그 옵션 사용 중단 경고 | LogController API로 변경. 단위·통합 테스트 재실행 시 해당 경고 없음 |

Vite/Rollup은 Zod 내부 주석의 PURE annotation 위치에 관한 경고 2건을 출력했다. 빌드는 종료 0이고 테스트·브라우저 실행도 통과했다. 외부 라이브러리 주석을 수정하거나 경고를 숨기지 않았다. Playwright 실행 중 환경의 색상 변수 경고와 선택적인 .env 파일 부재 안내도 출력됐으며 기능 실패는 없었다.

## 실제 연동·대역·미설정 구분

| 항목 | 이번 확인 상태 |
| --- | --- |
| Node HTTP·Vite 프록시·React 번들 | 실제 로컬 프로세스와 Chromium으로 확인 |
| 서버 실패 복구 | 브라우저 health 요청에 503 대역 주입 후 실제 연결 복구 확인 |
| 패키지 레지스트리·브라우저 설치 | 실제 다운로드·잠금 설치 수행 |
| DB·Repository·마이그레이션·시드 | 2단계 승인 대기. db:migrate/db:seed는 현재 명시적으로 실패하도록 예약한 명령 |
| AttractionService·언어별 원문 데이터 | 3단계 미구현, 실제 API 키/응답·사진 사용권 미검증 |
| 일정 계산·실제 경로·환율 | 4단계 이후 미구현, 실제 제공처 미정 |
| AI Skeleton·대화형 변경 | 5단계 이후 미구현, 유료 호출 없음 |
| Google/Apple 로그인·저장·공유 | 6단계 미구현, 실제 인증/계정·공유 데이터 없음 |
| Leaflet 지도·Pixi 레이어·운영 사진 | 의존성 준비만 완료, 7단계 화면·자산 검증 미실시 |
| 제휴 링크·상품 매핑·위젯 | 비활성 예시 설정만 존재, 실제 추적/클릭·예약·위젯 요청 없음 |
| 배포·운영 백업·개인정보 보존/삭제 | 미확정·미검증. 이번 결과는 출시 준비 완료를 의미하지 않음 |

## 다음 단계

사용자 지시에 따라 여기서 중단한다. 2단계 승인을 받으면 공통 모델·Repository·SQLite 마이그레이션·검수 seed·상품/장소 매핑과 임시 DB 검증부터 진행한다. 승인 전에 해당 파일이나 실제 DB를 생성하지 않는다.

## Affiliate environment preparation - 2026-11-10

Added API_BASE_URL, API_KEY, API_SECRET, PARTNER_ID and TRACKING_CODE placeholders for PROVIDER_A through PROVIDER_D. The provider-to-site mapping exists only in configuration. Existing local environment values were preserved and checked in memory without displaying credentials. Blank example fields and environment references were validated. Providers remain disabled pending verified API contracts. No external affiliate requests or runtime source changes were made; build and E2E were not rerun for this configuration-only change.

## 2단계 모델·검수 DB — 2026-11-10

최신 상태: 2단계 로컬 카탈로그 구조 구현·검증 완료. 3단계 부산 공공 API는 미구현이다. 실제 제휴 계정 조사 결과는 [api-readiness.md](api-readiness.md)에 기록했다.

구현 파일: packages/domain/src/catalog.ts 및 export, apps/server/db/migrations/001_initial.sql, apps/server/src/db/{client,repositories,seed}.ts, 서버 config의 loadDatabaseConfig, scripts/{db-migrate,seed-local}.ts, data/{places.seed.json,products.seed.json,README.md}, tests/integration/catalog.test.ts. 루트 DB 명령을 실제 동작으로 전환하고 .env/.env.example에 DATABASE_PATH가 없을 때만 추가했다. 기존 자격증명은 덮어쓰지 않았다.

공통 스키마는 출처/검수 시각, 필드별 출처, 다국어 번역, HTTP(S) 이미지 출처·저작자·라이선스, 가격 단위·원통화·decimal 문자열, 미확인 비용 null, 중립 providerId 매핑을 포함한다. Repository는 외래키·제휴사별 외부 상품 ID 중복 방지·출처 보호·트랜잭션 시드·검증 후 읽기를 구현한다. 마이그레이션은 체크섬을 기록하며 수정된 기적용 SQL을 거부한다.

| 검증 | 실제 결과 |
| --- | --- |
| npm.cmd run lint | 종료 0 |
| npm.cmd run typecheck | 종료 0 |
| npm.cmd run check:providers | 종료 0, 소스 13개 통과 |
| npm.cmd run test -- --run | 종료 0, 파일 3개·테스트 31개 통과 |
| npm.cmd run build | 종료 0, domain/server/web 빌드 완료 |
| npm.cmd run test:e2e | 종료 0, 6개 통과(9.6초). 빌드된 서버·웹 start smoke 포함 |
| npm.cmd run db:migrate 2회 | 각각 종료 0, 적용 1개 → 0개 |
| npm.cmd run db:seed 2회 | 각각 종료 0, provider 4·place 0·translation 0·product 0 |
| DB 재열기 후 실제 행 수 | migration 1·provider 4·place/translation/product 0 |

테스트는 시드 재실행, 외래키 위반, 상품 매핑 중복, 실패 시 전체 rollback, 테스트 데이터의 일반 seed 거부, 번역 분리, 검수된 로컬 장소의 API 덮어쓰기 거부, 잘못된 좌표·음수 가격을 확인한다. 자동 테스트는 메모리 DB를 사용하며 로컬 CLI 검증은 실제 SQLite 파일을 생성하고 재열어 확인했다.

주의/미검증: 현재 Node 24의 node:sqlite는 ExperimentalWarning을 출력한다. 기존 Zod 주석 관련 빌드 경고 2건과 브라우저 색상 환경 경고도 남아 있지만 검사·빌드·E2E는 성공했다. 정식 배포 전 DB 드라이버 안정성·동기 접근 성능·백업·다중 인스턴스 정책 검토가 필요하다. 실제 API 키 유효성·상품/장소 실데이터·제휴 채널 추가 승인·외부 API 요청은 이번에 검증하지 않았다. 인증·여행 저장/공유와 여행 화면은 후속 단계이며 이번 단계의 카탈로그 저장을 로그인/일정 서비스 완성으로 표시하지 않는다.

## 3단계 부산 API 구현·실연동 검증 (2026-11-10 KST)

범위: plan의 3단계 언어 라우팅·파싱·수집·캐시·부분 실패·검수 병합과 읽기 전용 조회 API다. 사용자가 다음 단계 진행을 승인했다. 4단계 계산 엔진 이후 기능은 구현하지 않았다. Node v24.14.1/npm 11.11.0을 유지하며 신규 패키지 설치와 lockfile 변경은 없다. 기존 작업 파일을 보존하고 커밋·푸시·배포는 하지 않았다.

### 구현 파일

- apps/server/src/providers/attraction/{locales,errors,parse,client}.ts: 5개 언어 허용 목록, ServiceKey 직렬화, JSON/업무/XML 오류, 안전한 좌표/이미지/본문/휴무 파싱, 요청·본문 상한·재시도·AbortSignal·캐시.
- apps/server/db/migrations/002_attraction_import.sql, src/db/attractions.ts: 영속 페이지 캐시, locale/원본 ID별 스냅샷, 수집 이력, 원자적 페이지 저장, 검수된 canonical 매핑.
- apps/server/src/services/{import-attractions,catalog}.ts, routes/places.ts: totalCount 순회·중복/빈 페이지 중단·부분 실패 보고, DB 검색/언어 대체/검수·stale 상태 조회.
- apps/server/src/{app,index}.ts, config/env.ts: 서버 연결·DB 해제, 루트 기준 DB 경로, 서버 전용 선택 설정. .env 기존 값은 보존하고 수집 한도 항목만 추가했으며 .env.example에 동기화했다.
- packages/domain/src/catalog.ts, apps/server/src/db/repositories.ts: Translation 필드별 출처, 검수된 로컬/공공 API 필드와 메타데이터 보호.
- scripts/import-attractions.ts, package.json: 실제 data:import 명령. config/attraction-mappings.json은 검수 전 빈 매핑이다.
- tests/fixtures/attraction/{ko,en,ja,zh-CN,zh-TW}.json, tests/unit/attraction.test.ts, tests/integration/attractions.test.ts: 명시된 합성 fixture와 계약·복구·병합·조회 검사. 운영 데이터로 사용하지 않는다.
- playwright.config.ts: E2E DB는 :memory:로 격리한다.
- docs/{api-contracts,operations,api-readiness,plan,proof}.md, AGENTS.md, README.md, data/README.md: 실제 구현 상태·계약·운영/검수 방법 갱신.

### 실제 API 및 DB 결과

루트 .env에 입력된 키가 존재함만 먼저 확인하고, 값/전체 요청 URL을 출력하지 않은 채 실제 호출했다. 인증키 재발급·제휴 API 호출은 하지 않았다. 공식 안내에서 ServiceKey/resultType 규격을 확인하고 실제 응답 외피·헤더·필드를 대조했다. 실제 JSON의 Content-Type은 text/plain이며 MAIN_TITLE은 영문에서도 한국어, TITLE/ITEMCNTNTS는 번역 필드인 사례를 확인했다.

| locale | 결과 | 페이지 | 언어별 레코드 | 거부 | 경고 |
| --- | --- | ---: | ---: | ---: | ---: |
| ko | complete, 종료 0 | 3 | 213 | 0 | 0 |
| en | complete, 종료 0 | 3 | 207 | 0 | 0 |
| ja | complete, 종료 0 | 3 | 208 | 0 | 1 |
| zh-CN | complete, 종료 0 | 3 | 208 | 0 | 0 |
| zh-TW | complete, 종료 0 | 3 | 208 | 0 | 1 |

각각 npm.cmd run data:import -- --locale=...로 실행했다. 국문을 한 번 더 실행해 complete/종료 0을 확인했다. DB 재열기 결과 마이그레이션 2개, 캐시 페이지 15개, 수집 이력 6개, 언어별 원본/분리 장소 총 1,044건이다. 동일 locale/원본 ID 재실행으로 중복이 늘지 않았다. **고유 실제 명소 1,044개라는 뜻은 아니다.** 다국어 동일성 매핑은 아직 검수되지 않았다.

경고 2건은 sourceId 2551의 ja/zh-TW missing-localized-title이다. 좌표 오류가 아니며 원문 제목을 대체하고 translationFallback/warnings로 표시한다. 임의 번역으로 채우지 않았다. 운영용 검수 seed는 여전히 빈 장소/상품이며 공공 API 수집본은 unverified 상태다. 권역·체류·가격·사진 사용권을 자동으로 확정하지 않는다. 공개 이미지 0건이며 제휴 설정은 비활성이다.

### 최종 검사

| 명령/검사 | 실제 결과 |
| --- | --- |
| npm.cmd run lint | 종료 0 |
| npm.cmd run typecheck | 종료 0, server/web/domain 및 도구 strict 타입 검사 |
| npm.cmd run test -- --run | 종료 0, 파일 5개·테스트 76개 통과 |
| npm.cmd run check:providers | 종료 0, 소스 21개 통과 |
| npm.cmd run build | 종료 0, domain → server → web 실제 컴파일/번들 생성 |
| npm.cmd run test:e2e | 종료 0, 모바일/태블릿/PC 기존 회귀 6개 통과(최종 7.1초) |
| 영속 캐시 재열기 | 네트워크 함수를 차단한 상태에서 국문 1페이지 100건, freshness=cache |
| 빌드 산출물 별도 smoke | dist 서버를 임시 4318 포트로 실행 후 종료. 웹 200, 5개 locale 장소 조회 각각 200·요청 언어 우선, catalog/status 200, 잘못된 locale 400 |
| 브라우저 번들 검사 | 실제 부산 API 키의 원문/디코딩 값 일치 없음 |

DB/서버 smoke는 08:22 KST까지 실제 확인했다. E2E는 메모리 DB를 사용하며 외부 API를 호출하지 않는다. 실제 수집 DB를 사용하는 별도 smoke에서는 키·미승인 사진이 공개 응답에 들어가지 않으며 unverified/eligibleForPlanning=false를 확인했다. 사진/휴무를 실제 사용 승인 또는 영업시간 확정으로 취급하지 않는다.

오류 수정: 첫 타입 검사에서 미사용 import, exactOptionalPropertyTypes의 선택 필드 타입, 기본값의 좁은 리터럴 타입을 발견해 제거/명시적 설정 인터페이스로 수정했다. 조회 통합 검사 1건에서 SQL의 바인딩 개수가 맞지 않아 503이 발생했고, locale 조건과 인수를 맞춰 수정했다. 요청 언어 우선 정렬과 검수된 공공 API 출처의 안전한 갱신을 보강한 뒤 전체 검사·빌드·E2E를 다시 통과했다. 검사를 비활성화하거나 성공 코드를 강제하지 않았다.

### 한계와 다음 단계

Node SQLite ExperimentalWarning, 기존 Zod PURE 주석 관련 빌드 경고 2건, Playwright 색상 환경 경고는 비차단 상태로 남는다. 공식 안내 페이지의 웹 오류를 API 실패로 간주하지 않았고 실제 API 성공 증거를 별도로 확보했다.

부산 API 키/5개 언어 수집은 **실연동**, 오류 주입·fixture·E2E는 **대역**, 다국어 장소 매핑/사진 사용권·권역·체류·가격 검수는 **미완료**다. 계산 엔진·실제 경로·환율·AI·실인증·여행 저장/공유·예약 상품 API·매거진 일정/지도 화면은 후속 단계다. 관리자·위젯·내부 결제는 구현하지 않았다. 운영 호출량/보존·삭제/백업·배포 정책과 데이터 검수는 사람이 확정해야 한다. 다음 단계는 4단계 계산 엔진이며 이번 작업에서 선행 구현하지 않았다.


## 부산 제휴 상품 사이트 구현·실제 링크 확보 — 2026-11-10

### 범위 변경과 문서 충돌 해소

사용자의 최신 지시로 4단계 계산 엔진은 코드 착수 전에 중단했다. AI·설문·예산·동선·일정·인증 대신 부산 상품 소개와 실제 제휴 링크를 구현했다. intent/spec/AGENTS를 현 범위로 갱신하고 plan 상단에서 catalog-plan을 현재 작업 순서로 지정했다. 과거 1~3단계 구현·DB·검증 이력은 보존한다. 예전의 다음 단계 승인/production 시작 차단/제휴 비활성 설명은 당시 상태이며 현재 카탈로그 상태가 아니다.

Node v24.14.1 / npm 11.11.0을 유지했다. 신규 패키지·lockfile 변경은 없다. 사용자 .env 값과 기존 SQLite 데이터는 보존했다. 커밋·푸시·공개 배포는 하지 않았다.

### 실제 수집과 공개 상품 수

| provider | 확보한 원본 | 제외 | 공개 | 링크 근거 |
| --- | ---: | ---: | ---: | --- |
| PROVIDER_A | 93 | 14 | 79 | 포털에서 확인한 공통 추적 템플릿을 실제 상품 URL에 적용 |
| PROVIDER_B | 29 | 0 | 29 | 공식 상품 탐색기 부산 전체 선택 CSV export |
| PROVIDER_C | 261 | 76 | 185 | 각 상품의 실제 단축 제휴 링크 발급 |
| PROVIDER_D | 10 | 0 | 10 | 실제 텍스트 링크 생성기의 개별 숙소 링크 |
| 합계 | 393 | 90 | 303 | 공식 발급/export/승인 템플릿을 구분해 기록 |

PROVIDER_C는 투어/티켓 검색에서 중복 제거 258개와 부산 관련 패키지 3개다. 공개 검색의 275라는 수치를 수집한 고유 상품 수로 사용하지 않았다. 일반 배송 상품·무관한 지역/부산 동명 해외 업체·명백한 지난 기간·위치/이용 지점이 불명확한 상품은 제외했다. PROVIDER_A도 해외 추천·여행 입국 서류 대행·지역 불명확 상품 등을 제외했다. 제외 사유와 원본 수는 config/catalog/exclusions.json에 남겼다.

공개 분류는 티켓 42 / 체험 73 / 스냅 23 / 하루 투어 70 / 요트 19 / 스파 9 / 교통 27 / 패키지 15 / 숙소 25다. 판매처별 별도 옵션은 이름만으로 병합하지 않았다. 모든 OTA의 전체 부산 재고를 확보한 수치가 아니다.

PROVIDER_A는 도시/개별 detail 2종/유료 명소의 포털 발급 결과 4종에서 공통 추적 구조를 검증했다. 79개를 각각 UI에서 따로 발급했다고 주장하지 않는다. PROVIDER_B 29개는 export가 제공한 공식 광고 이미지다. 나머지 상품은 라이선스가 확인된 부산 대표 사진임을 표시하며 출처·저작자·라이선스·CSS 크롭 고지를 제공한다.

PROVIDER_D 공식 전체 숙소 ZIP은 기대 크기 466,787,815 byte였다. Node 스트리밍과 curl 두 방식 모두 upstream 전송 중 종료로 실패했고 마지막 수신량은 63,205,564 byte였다. 부분 ZIP은 ignored var/imports에 격리하고 가져오지 않았다. 10개 숙소와 공식 부산 도시 전체 보기 링크만 제공한다. PROVIDER_C 개발 문서는 점검 중이어서 API 규격을 추측하거나 상품 API를 호출하지 않았다.

기존 채널에서 링크를 만들었으며 신규 Trip Fit 웹사이트 승인 상태는 각 registry의 websiteApproval=unverified다. 이 로컬 결과를 채널 승인·공개 배포 완료로 표시하지 않는다. 로그인 포털에서 링크 생성/export 외에 계약 동의·사이트 제출·키 발급/재발급·계정/금융 변경·예약·결제는 하지 않았다.

### 주요 변경 파일

- packages/domain/src/offers.ts 및 index.ts: strict query/카테고리/범위/가격/공개 DTO 계약.
- config/catalog/{offers,exclusions,provider-*-source,provider-c-packages,provider-a-attractions} 및 공식 CSV: 원본·검수 결과·중립 provider 설정·실제 URL. 원본은 재현 근거이며 공개 응답에는 설정 전체를 넣지 않는다.
- apps/server/src/config/offers.ts, services/offers.ts, routes/offers.ts, app.ts, index.ts: 시작 시 설정 검증, 공통 링크 정책, 안정된 정렬, 필터/페이지/상세, 미승인/만료 차단, 읽기 전용 API.
- apps/server/src/config/env.ts: 현재 익명 읽기 전용 카탈로그의 production 시작 허용. 이전 계정 기능의 선행 차단만 제거했으며 테스트 로그인·인증 우회·개인정보 쓰기 엔드포인트를 추가하지 않았다.
- apps/web/src/App.tsx, styles/global.css, i18n 5개 파일, index.html, public/catalog-fonts.css: 사진 중심 반응형 홈페이지·검색·카테고리/판매처/범위 필터·상품 상세·외부 예약·언어·재시도·원문/가격/대표 이미지 고지. 시스템 글꼴을 사용한다.
- tests/integration/offers.test.ts: 신규 24건. tests/unit/foundation.test.ts: 바뀐 공개 실행 범위 검증. tests/e2e/foundation.spec.ts: 6가지 동작을 모바일/태블릿/PC에서 검사.
- .gitignore: var/imports 제외. AGENTS/README/intent/spec/plan/catalog-plan/api-contracts/api-readiness/operations/proof 및 docs/screenshots: 현재 범위·운영·검증 증거.

### 최종 검사 결과

| 명령/검사 | 실제 결과 |
| --- | --- |
| npm.cmd run lint | 종료 0 |
| npm.cmd run typecheck | 종료 0 |
| npm.cmd run test -- --run | 종료 0, 파일 6개 / 테스트 100개 통과 |
| npm.cmd run check:providers | 종료 0, 소스 25개 통과 |
| npm.cmd run build | 종료 0, domain → server → web 컴파일/번들 완료 |
| npm.cmd run test:e2e | 종료 0, 18개 통과 / 20.4초 |
| dist production start smoke | 127.0.0.1:4318, 웹 및 상품 API 200, catalogTotal 303 / provider 4 |
| 실제 HTTP 조회 | 5개 locale 200, 잘못된 locale 400, /api/trips 404 |
| 브라우저 번들 비밀값 검사 | 설정된 비밀 필드 3개의 원문/디코딩 값 일치 없음, 종료 0. 값은 출력하지 않음 |
| git diff --check | 종료 0. 기존 대부분 소스가 untracked인 상태이므로 이것만으로 전체 검증을 대신하지 않음 |
| ignore 검사 | .env, var/trip-fit.sqlite, var/imports/provider-d-hotels.partial.zip 모두 제외 확인 |

신규 통합 검사는 실제 303개 설정 검증, 잘못된 HTTPS/호스트/경로/필수 추적 중복/중첩 목적지/원본 호스트, 미승인/비활성, 설정만으로 추가한 provider, 중복 ID, 잘못된 이미지, 만료/미확인 가격, 원통화·필터·페이지·결정적 정렬·공개 DTO를 포함한다. API 비밀값/전체 설정을 응답하지 않는 것을 확인한다.

E2E는 5개 언어·반응형·검색/판매처·빈 결과/초기화·카테고리·페이지·동일 요청 반복·상세 Escape/포커스 복구·새 창·실패 시 마지막 성공 결과/입력 보존과 재시도·오래된 응답 무시·미확인 가격을 확인한다. 외부 이미지/예약 페이지는 대역이다. 실제 제휴 클릭을 반복하지 않았다.

### 실패와 수정

첫 E2E에서 12개 통과/6개 실패였다. 상세 dialog를 닫은 뒤 포커스가 돌아오지 않는 실제 UI 문제 3건은 showModal 전에 활성 요소를 보존하고 close 후 연결 상태 확인과 focus로 수정했다. 나머지 3건은 초기화 버튼의 장식 문자 때문에 exact 텍스트가 달라진 테스트 선택자를 실제 접근 가능한 이름에 맞춰 수정했다. 이후 전체 lint/typecheck/test/check:providers/build/E2E를 다시 실행해 모두 통과했다.

Windows 명령 길이 초과(os error 206)로 큰 UI 작성 명령이 실행되지 않은 경우는 파일 쓰기를 작은 묶음으로 나눠 해결했다. 검사를 끄거나 종료 코드를 0으로 강제하지 않았다. Node SQLite experimental 경고·기존 Zod PURE 주석 경고 2건·Playwright 색상 환경 경고는 비차단 상태다.

### 실제 화면과 산출물

빌드된 production 서버를 별도로 실행해 실제 광고 이미지를 로드했다. 1440px 데스크톱과 390px 모바일에서 가로 넘침이 없고 첫 페이지 24개 및 화면 내 상품 이미지 4개 로드를 확인했다. 페이지 오류는 없으며 실제 외부 예약 이동은 0회다. 상세 이미지 로딩 완료 후 모바일 캡처도 확인했다.

- [PC 캡처](screenshots/catalog-desktop.png)
- [모바일 캡처](screenshots/catalog-mobile.png)
- [상품 상세 캡처](screenshots/catalog-detail.png)
- [HTTP/화면 smoke 기록](screenshots/visual-smoke.json)

미리보기 주소는 http://127.0.0.1:4318 이다. 사용자 확인을 위해 로컬 서버를 유지하며 공개 인터넷 배포가 아니다. Codex 브라우저 패널 열기 요청은 queued 응답까지만 확인했으므로 패널이 실제 표시됐다고 주장하지 않는다.

### 연동 상태와 남은 한계

- **실제 확인:** 로그인 포털 링크/export, 검증한 템플릿, 303개 스냅샷, 로컬 HTTP·실제 광고 이미지. 기존 부산 공공 API 실연동 이력은 위 3단계를 따른다.
- **대역:** 단위/통합 실패 주입·E2E 외부 이미지/예약 이동. 실제 결제·예약·제휴 전환/정산은 검사하지 않았다.
- **미구현/미확정:** 제휴 상품 API 자동 동기화, 실시간 재고/가격, 전체 숙소 수집, 상품 원문 번역, 신규 사이트 채널 승인, 공개 배포, 갱신 담당·주기. API 키가 있어도 자동 연결로 표시하지 않는다.
- **현 범위 제외:** AI·예산·일정·계산 엔진·로그인·지도/위젯·관리자·내부 결제. 이전 기능을 삭제해 DB를 손상시키지 않고 UI와 현재 요구에서 제외했다.
- 문서 마무리 변경은 구조/참조/정합성을 확인했다. 코드가 바뀌지 않아 통과한 빌드를 문서 변경만으로 반복하지 않았다.



## 검색 페이지·이달의 관광명소·명소별 제휴 상품 — 2026-11-11

### 변경 범위와 실제 데이터

사용자 요청에 따라 독립 검색 페이지 /search와 '이달의 관광명소' 배너, 명소 소개 → 설명/주소/휴무 → 관련 투어·티켓·체험·주변 권역 숙소 → 상품 상세 → 외부 제휴 예약 흐름을 구현했다. 홈에서도 같은 명소 배너에 진입할 수 있다. AI·예산·일정·지도·계정·관리자·내부 결제는 추가하지 않았다.

명소는 실제 attraction_records의 sourceId 365(감천문화마을), 377(광안리해수욕장) 및 각 5개 locale, 총 10개 언어 레코드를 명시적으로 확인해 선별했다. 원본 수집일은 2026-11-10 KST, 공개 스냅샷/상품 관계 검수일은 2026-11-11이다. 전체 1,044개 언어 레코드가 검수된 것으로 표시하지 않는다. 소개는 HTML을 제거한 짧은 원문 발췌이며 출처·수집일을 제공한다. 주소는 감천문화마을 공식 오시는 길과 부산시티투어 위치 안내를 확인했다.

config/catalog/destinations.json에서 공개용 선별 스냅샷을 관리한다. 추천 월은 2026-11이며 Asia/Seoul 현재 월과 일치할 때만 월간 배너로 표시한다. 그 외에는 일반 명소 가이드로 표시한다. Trip Fit 편집 추천임을 명시하며 공식 월간 선정·현재 행사/실시간 운영이라고 주장하지 않는다.

기존 상품 303개를 유지하고 10개의 명시적 관계만 추가했다. 새로운 제휴 링크/가격을 합성하지 않았다.

| 명소 | 투어·패키지 그룹 | 관련 티켓 | 체험 | 숙소 |
| --- | ---: | ---: | ---: | ---: |
| 감천문화마을 | 기존 일일 투어 3 | 리틀프린스하우스 전시 1 | 한복 대여·스냅 투어 2 | 남포동 권역 1 |
| 광안리해수욕장 | 0 | 기존 야간 투어 티켓 1 | 패들보드·요트 2 | 0 |

검수 근거는 각 관계의 evidenceUrl/reviewedOn으로 설정에 기록했다. 감천 숙소는 기존 아벤트리 호텔 상품의 판매처 위치 안내에서 남포동/광복로39번길 소재를 확인해 연결했다. '주변 권역'을 '바로 옆/도보권'으로 표시하지 않고 이동 확인 안내를 제공한다. 광안리 숙소 및 미확인 숙박 패키지는 임의로 채우지 않고 빈 상태를 표시한다. 관련 시설 티켓이 마을/해변 자체의 입장료를 의미하지 않는다고 안내한다.

공공 API의 미승인 이미지 대신 기존 사용권이 확인된 감천문화마을·광안리 사진을 사용하고 저작자/라이선스를 표시했다. 상품 카드는 기존 제휴 export 이미지 또는 대표 이미지 표시를 유지한다. 루트 .env·lockfile·기존 DB·이전 단계 기록을 보존했고 신규 패키지 설치·커밋·푸시·공개 배포는 하지 않았다.

### 구현 파일

- packages/domain/src/destinations.ts 및 index.ts: strict slug/명소/목록·상세·관련 상품 DTO.
- apps/server/src/config/destinations.ts, config/catalog/destinations.json: 2개 명소의 다국어 선별 스냅샷·주소/사진 출처·월/상품 관계 설정.
- apps/server/src/services/destinations.ts: 월 유효성, locale 우선/명시적 대체, 중복 식별/관계 검증, 기존 OfferService 검증 결과만 재사용. 만료/비활성 상품은 상세에서도 노출하지 않는다.
- apps/server/src/routes/destinations.ts, app.ts, index.ts: 읽기 전용 GET /api/destinations 및 /api/destinations/:slug, no-store, 잘못된 입력 400·없는 명소 404.
- apps/web/src/{App,Offer,Destinations}.tsx, i18n/guide.ts, styles/global.css: 공용 카드/dialog, 별도 검색/URL 복원·브라우저 뒤로/앞으로, 다국어 배너·명소 상세·실패/재시도·관련 상품 그룹·이미지 실패 대체.
- tests/integration/destinations.test.ts, tests/e2e/destinations.spec.ts, playwright.config.ts: 계약/관계/만료/번역/오류/전체 흐름 검사와 Windows 캡처 동시 실행 상한.
- README 및 docs/{intent,spec,catalog-plan,api-contracts,operations,proof}.md, screenshots: 사용자 추가 요구·운영·증거.

### 검사 결과

| 명령/검사 | 결과 |
| --- | --- |
| npm.cmd run lint | 종료 0 |
| npm.cmd run typecheck | 종료 0 |
| npm.cmd run test -- --run | 종료 0, 7개 파일 / 111개 통과(신규 11개 포함) |
| npm.cmd run check:providers | 종료 0, 소스 32개 통과 |
| npm.cmd run build | 종료 0, domain → server → web. 138 modules, JS 363.12 kB / CSS 25.20 kB |
| npm.cmd run test:e2e | 최종 종료 0, 30개 통과 / 34.5초. 기존 회귀 18개 + 신규 12개 |
| dist production start smoke | 127.0.0.1:4320, 메모리 DB로 기존 사용자 DB와 격리 |
| 실제 HTTP | /search 및 /places/gamcheon?locale=en 200, 명소 목록/영문 상세 200, 없는 명소 404, 잘못된 locale 400 |
| PC/모바일 시각 확인 | 1440px/390px 검색·명소 상세 4개 화면 가로 넘침 없음, 명소 사진 로드, 페이지 오류 0 |
| 실제 상품 이미지 | 감천 관련 투어 3개 이미지 로드 확인, 실제 외부 제휴 이동 0회 |

통합 테스트는 실제 스냅샷과 10개 관계·최소 DTO, 5개 언어, 없는 번역의 대체 표시, 추천 월 만료, 비활성·만료 상품 비노출, 중복 명소/번역·잘못된 숙소 관계 거부, strict query/404/쓰기 엔드포인트 부재를 검사한다. E2E는 검색→배너→명소 소개/주소/휴무→관련 상품→대역 예약 새 창, 검색 조건 새로고침·뒤로/앞으로, 직접 진입·5개 언어·언어 유지, 실패 재시도·없는 페이지·빈 숙소를 모바일/태블릿/PC에서 확인한다.

초기 E2E는 28개 통과/2개 실패였다. 실패 2개는 태블릿의 full-page screenshot에서 Chromium Page.captureScreenshot 프로토콜 오류였다. 8개 브라우저 동시 실행을 2개로 제한한 뒤 **모든 검사·캡처를 유지한 상태로 전체 30개를 다시 실행해 통과**했다. UI assertion을 제거하거나 retry/강제 성공으로 숨기지 않았다. Node SQLite experimental, 기존 Zod PURE 주석 2건, Playwright 색상 환경 경고는 비차단 상태다.

별도 smoke의 최초 localhost 요청은 읽기 전용 sandbox의 EACCES로 막혀 승인된 실행 환경에서 동일 요청을 다시 수행해 성공했다. 코드 오류로 처리하거나 접근 제한을 우회하지 않았다.

### 화면 및 남은 한계

- [검색 PC](screenshots/search-desktop.png) / [검색 모바일](screenshots/search-mobile.png)
- [감천 상세 PC](screenshots/gamcheon-desktop.png) / [감천 상세 모바일](screenshots/gamcheon-mobile.png)
- [실제 산출물 smoke 결과](screenshots/destinations-smoke.json)

별도 시각 검사는 실제 로컬 명소 사진·상품 이미지를 확인했으며 예약 링크를 클릭하지 않았다. E2E의 외부 이미지/예약 이동은 대역이고 실제 결제·전환/정산을 검증하지 않는다. 공공 API는 기존 실제 수집본을 사용했으며 이번 작업에서 키 발급/재발급 또는 추가 대량 수집을 수행하지 않았다.

명소 소개와 월별 선정/관계는 수동 검수 스냅샷이다. data:import가 자동으로 공개 스냅샷을 갱신하지 않는다. 상품 가격·재고 자동 동기화, 모든 명소/주변 숙소 매핑, 신규 사이트 제휴 채널 승인·공개 배포는 여전히 미완료다. Codex 패널 열기 요청은 queued 응답이며 실제 표시됐다고 보장하지 않는다. 로컬 미리보기는 http://127.0.0.1:4320/search 및 /places/gamcheon 이다.

최종 정리 검사: 변경 문서의 로컬 참조 22개가 유효했고, 새 프런트 번들에서 설정된 비밀 필드 3개의 원문/디코딩 값 일치가 없었다. .env와 기존 SQLite 파일의 ignore를 확인했다. git diff --check는 종료 0이며 대부분 소스가 기존부터 untracked인 상태라 전체 검증을 대신하지 않는다. Playwright 동시 실행 설정 변경 후 lint/typecheck를 다시 실행해 각각 종료 0을 확인했다.


## 전체 부산 관광정보 검색·제휴 상품 연결 — 2026-11-11

### 완료 범위

사용자가 수집한 관광명소 API 전체 목록을 검색과 명소 상세에 연결했다. /search에서 같은 검색어로 공공 관광정보와 상품을 찾고, 명소 이름·검수 별칭에 연결된 상품도 상품 결과에 포함한다. '연결 상품이 있는 명소만' 필터, 관광정보 6건 페이지 이동, 명소 상세 → 관련 상품 → 기존 외부 예약 흐름을 제공한다.

| 항목 | 실제 수 |
| --- | ---: |
| 보존한 언어별 원본 레코드 | 1,044 |
| 검색 가능한 원본 ID 그룹 | 220 |
| 국문 원본 | 213 |
| 주소가 있는 관광정보 그룹 | 213 |
| 실제 연결 상품이 있는 그룹 | 25 |
| 연결된 기존 상품(중복 제거) | 117 |
| 명소-상품 관계 | 190 |
| 전체 공개 제휴 상품 | 303 |

220은 서로 다른 관광 소개를 물리 명소 단위로 중복 제거한 수가 아니다. 국문에 없는 외국어 전용 원본 ID 7개도 빠뜨리지 않았다. 같은 원본 ID의 다국어 원제목과 비어 있지 않은 좌표가 모두 일치함을 확인했으며 충돌 0건이었다. 원본 ID가 다른 유사 소개는 그대로 보존했다. 기존 DB의 canonical mapping이나 검수 상태를 임의로 변경하지 않았다.

기존 감천문화마을/광안리 외에 흰여울·태종대·해동용궁사·오륙도·송정·송도·청사포/미포·다대포·영화체험박물관·용두산/부산타워·황령산·해운대·범어사·벡스코·롯데월드·송도케이블카·포디움다이브·리틀프린스하우스·유엔기념공원·전포공구길의 확인된 상품을 연결했다. 명시적 원본/상품 ID와 증빙을 config/catalog/destination-relations.json에 기록했다. 런타임에서 상품 이름만 보고 새로운 관계를 자동 승인하지 않는다.

추가 별칭 근거: [부산 공식 전포공구길 소개](https://www.visitbusan.net/index.do?contentsSid=22&lang_cd=ko&uc_seq=1329), [부산시보의 전리단길 설명](https://www.busan.go.kr/news/specnews/view?dataNo=68104&gugun=Prev). 해운대 권역 숙소는 기존 판매처 위치 정보와 공식 관광정보를 대조했고, 권역을 명시하며 도보/거리/시간을 만들어 넣지 않았다.

티켓으로 잘못 분류됐던 일일 투어 4개(c-3885009/c-7126287/c-7258612/b-2278)는 실제 상품 제목의 일정/투어 내용에 맞춰 tour로 수정했다. 원본 파일·상품 URL·파트너 추적 값·가격 관찰일은 유지했다. 새 상품/가격/후기/재고/제휴 키를 만들어 추가하지 않았다. 상품 연결이 없는 관광정보 195개는 소개를 계속 제공하고 빈 예약 그룹으로 표시한다. 미연결 상품 186개도 일반 상품 검색에서 유지한다.

### 실제 API와 갱신 경계

부산 API의 국문 응답에서 ADDR1을 실제 확인한 뒤 서버 파서에 addressRaw를 추가했다. 루트 .env의 기존 키로 npm.cmd run data:import -- --locale=ko를 실행해 **complete / 3페이지 / 213건 / 거부 0 / 경고 0 / 종료 0**을 확인했다. 기존 캐시/DB payload에 주소 필드가 없는 경우 null로 읽어 하위 호환성을 유지한다. 언어별 수는 ko 213/en 207/ja 208/zh-CN 208/zh-TW 208로 유지됐고 기존 DB와 검수 필드를 삭제하지 않았다.

npm.cmd run data:publish는 DB를 readOnly로 열어 전체 원본과 검수 관계를 검증하고 공개용 스냅샷을 갱신한다. 실제 최종 출력은 1044/220/25/190/117이었다. 빈 수집본, 중복 locale, 서로 다른 좌표/원제목으로 같은 ID를 묶으려는 경우 실패한다. 검증 성공 후 임시 파일 rename으로 공개 파일을 교체한다. 방문자의 검색/API 조회는 외부 서비스를 호출하지 않으며 키가 프런트에 가지 않는다.

미검수 원문 안내 218개는 reviewStatus=source, reviewedOn=null이다. 기존 편집 가이드 2개만 curated 상태다. 주소가 없는 외국어 전용 자료는 권역과 공식 확인 안내를 표시한다. API 사진 URL이 있다는 이유만으로 사용권을 승인하지 않고 해당 명소의 사진은 준비 중으로 표시한다. 기존 허용된 명소 사진 2개 및 상품 이미지의 출처/대표 이미지 표시는 유지한다.

### 변경 파일

- packages/domain/src/destinations.ts: strict 전체 검색 query, 페이지/전체/연결 수, nullable 주소/사진/검수일, 원문 상태 DTO.
- apps/server/src/{config,services,routes}/destinations.ts: 전체 검색/locale 대체, 원문/검수 구분, 실제 활성 링크 수, 월별 추천 유지.
- apps/server/src/services/publish-destinations.ts, scripts/publish-destinations.ts: 원본 식별 검증과 공개 스냅샷 갱신.
- config/catalog/{destinations,destination-relations,destination-coverage,offers}.json: 전체 목록·명시적 관계·커버리지·분류 교정.
- apps/server/src/services/offers.ts, routes/offers.ts, app.ts: 상품명 결과와 검수한 명소 연관 상품의 합집합. 기존 provider/category/scope/만료/호스트 검증 유지.
- apps/server/src/providers/attraction/parse.ts: 실제 ADDR1 선택 필드 파싱과 기존 payload 호환.
- apps/web/src/{App,Destinations}.tsx, i18n/guide.ts, styles/global.css: 전체 관광정보 결과/필터/페이지·이전 결과 보존/재시도·nullable 상태·5개 언어.
- tests/integration/{destination-search,destinations,attractions}.test.ts, tests/unit/attraction.test.ts, tests/e2e/destinations.spec.ts: 전체 목록/관계/주소/갱신·회귀 검사.
- package.json, .gitignore, AGENTS.md, README 및 관련 docs: data:publish·임시 파일 제외·최신 운영 계약/증거.

Node/npm·기존 의존성/lockfile·루트 .env 값을 유지했다. 신규 패키지 설치·커밋·푸시·공개 배포는 하지 않았다.

### 최종 검증

| 검사 | 실제 결과 |
| --- | --- |
| npm.cmd run lint | 종료 0 |
| npm.cmd run typecheck | 종료 0 |
| npm.cmd run test -- --run | 최종 종료 0, 8개 파일 / 119개 통과 |
| npm.cmd run check:providers | 종료 0, 소스 33개 통과 |
| npm.cmd run build | 종료 0, domain → server → web, 138 modules / JS 370.17 kB / CSS 28.39 kB |
| npm.cmd run test:e2e | 최종 종료 0, 39개 통과 / 41.5초 |
| npm.cmd run data:import -- --locale=ko | 종료 0, 실제 API 3페이지 / 213건 |
| npm.cmd run data:publish | 종료 0, 실제 전체 스냅샷 갱신 |
| dist production start smoke | 기존 소유 프로세스/포트 확인 후 4320 미리보기를 최신 산출물로 재시작, 메모리 DB로 사용자 DB 격리 |

통합 검사는 원본 전체 페이지 순회 220개/중복 없음, 다국어 별칭·공백 검색, 연결 그룹 25개 필터, 명소를 통한 숙소 검색에도 분류/판매처 조건 유지, 실제 주소 213개·원문 상태·외국어 대체·사진 null, 빈/충돌/중복 수집본 거부 및 다른 sourceId 비병합을 확인한다.

신규 브라우저 검사는 전체 정보 페이지 이동·연결 필터·범어사 상세/주소/관련 스냅, Gamcheon + 숙소 검색, 외국어 전용 자료의 명시적 대체, 관광정보 조회 실패 시 기존 6개 카드/입력 보존 후 재시도를 모바일/태블릿/PC에서 확인한다. 기존 30개 회귀와 합쳐 39개다. E2E 외부 이미지와 예약 이동은 대역이며 실제 제휴 클릭을 반복하지 않았다.

초기 타입 검사에서 새 addressRaw 필드가 빠진 테스트용 typed record 1건을 발견해 null을 명시했다. 기존 '2개 명소/7개·3개 관계' 테스트는 확장 계약에 맞게 220개/22개·14개 및 페이지 수로 갱신했다. 첫 확장 E2E는 36개 통과/3개 실패였고, 재시도 결과를 이름 단독 검색 1건으로 기대했던 assertion이 원문 소개까지 검색하는 실제 계약의 5건과 달랐다. 기존 결과 보존과 재시도 UI는 정상이며, 예상 결과 수와 실제 범어사 카드 표시를 함께 검사하도록 수정한 뒤 전체를 재실행했다. 이후 추가 공식 별칭/관계까지 반영하고 단위·통합 119개 및 E2E 39개를 다시 통과했다. 검사를 끄거나 성공 코드를 강제하지 않았다.

### 실제 화면과 실행 상태

최신 production 서버에서 /search 200, 전체 목록 total/catalogTotal=220 및 linkedTotal=25, 범어사 원문 검색 5건, linked 필터 25건, Gamcheon+stay 상품 1건, 범어사 실제 주소를 확인했다. 1440px/390px 화면에 가로 넘침·페이지 오류가 없고 실제 외부 예약 이동은 0회다.

- [전체 관광정보 PC](screenshots/all-tourism-desktop.png)
- [관광정보 검색 모바일](screenshots/all-tourism-mobile.png)
- [API 명소 상세](screenshots/api-place-detail.png)
- [최신 HTTP/화면 smoke](screenshots/all-tourism-smoke.json)
- [원본별 연결/미연결 커버리지](../config/catalog/destination-coverage.json)

현재 미리보기는 http://127.0.0.1:4320/search 이다. Codex 패널 열기 요청은 queued 응답까지만 확인했고 직접 HTTP/Chromium으로 별도 검증했다. Node SQLite experimental·기존 Zod PURE 2건·Playwright 색상 환경 경고는 비차단 상태다.

정기 수집/게시 스케줄러, 제휴 상품 API 자동 가격·재고 갱신, 미확인 명소 사진/상품 관계, 실제 제휴 전환·정산, 신규 사이트 채널 승인·공개 배포는 미완료다. 현재 확인된 자료 전체를 검색에 넣은 결과이며 모든 관광정보가 유료 예약 상품을 가진다는 의미는 아니다.


## 2026-11-12 실제 제휴 상품 사진 교체

사용자 요청에 따라 공개 상품의 목적지·일반 활동 예시 사진을 해당 판매처 상품의 대표 사진으로 교체했다. 데이터는 303개를 보존하고, 원본이 빈 검색 결과로 이동하는 a-54291624 한 건은 enabled=false로 노출 보류했다. 원본 가격·관찰일·제휴 href는 유지했다.

- 공개 상품 302개: PROVIDER_A 78 / B 29 / C 185 / D 10. 모두 image.kind=product다.
- 기존 링크 생성 당시의 사용자 프로젝트 수집 파일에서 C 상품 이미지 169건을 ID·원본 URL로 복원했다. 그중 1건 대표 사진을 갱신하고 미포함 16건을 실제 원본 페이지에서 확인해 185건으로 채웠다.
- A는 실제 상세 갤러리 69건과 유료 명소 대표 사진 9건을 읽었다. 로딩용 data URI·회원 아바타·후기 이미지는 선택하지 않았다. 조회 불가 1건에 임의 사진을 붙이지 않았다.
- B 공식 CSV 상품 사진 29개를 유지했다. D는 로그인된 공식 이미지 링크 도구에서 기존 사이트 채널과 정확한 숙소 ID를 선택해 10개 사진을 확보했다. 신규 도메인·계정·키·계약을 제출하지 않았다.
- 서로 다른 판매 옵션에 판매처가 같은 사진을 제공할 수 있다. 임의로 사진을 바꾸어 유일하게 만들지 않고 실제 제공 이미지를 따른다.
- config/catalog/product-image-sources.json과 media-evidence.json에 제공처·externalId·원본·이미지 URL·근거·관찰일을 보관한다. 판매처 홍보 목적이며 오픈 이미지 라이선스라고 표시하지 않는다. 상품 이미지 source 링크도 기존 승인 제휴 href로 연결하고 sponsored noopener noreferrer를 적용한다.
- config 로더에서 제공처·상품 ID·원본 URL·이미지 URL의 불일치와 중복을 거부한다. 일반 예시 이미지로 조용히 되돌리는 동작은 없다. 이미지 오류는 중립 대체 화면으로 표시한다. 공공 관광정보 사진 220건은 별도다.

변경: config/catalog/{offers,product-image-sources,media-evidence}.json; apps/server/src/config/offers.ts, services/offers.ts; apps/web/src/Offer.tsx; tests/integration/{offers,localization-media}.test.ts, tests/e2e/destinations.spec.ts; 시연 캡처와 본 기록. 기존 수집 파일·DB·.env·lockfile은 수정/삭제하지 않았고, 교체 전 JSON은 var/imports에 보존했다.

검증: npm.cmd run lint / typecheck / test -- --run / check:providers / build / test:e2e 모두 종료 0. 단위·통합 9개 파일 134개, 업체 경계 소스 34개, E2E 모바일·태블릿·PC 51개(약 1.2분) 통과. 신규 이미지 URL 263개와 공식 숙소 도구 10개는 별도 HEAD 검사에서 모두 200이었다. E2E 외부 이미지·예약 이동은 대역이다. 실제 공개 Chromium에서는 상품 사진 24개 로딩·관련 카드 22개·모바일 가로 넘침 없음·페이지 오류 없음·실제 제휴 예약 클릭 0회를 확인했다. 상품명/가격/재고·사진 권리 계약/신규 사이트 채널의 전체 재검증을 완료했다는 의미는 아니다.

초기 복원에서 패키지 externalId의 pkg- 접두어를 확인해 매핑을 수정했다. 상품 사진의 로딩 placeholder를 실제 src로 오인하지 않도록 HTTPS 대표 갤러리가 준비된 후 읽었다. 기존의 모든 카드 이미지가 유일해야 한다는 검사는 실제 공급자 이미지의 상품 ID 매칭 검사로 대체했으며, 잘못된 이미지 근거 거부·개별 상품 비활성 회귀를 추가했다. Node SQLite experimental·Zod PURE 주석·Playwright 색상 경고는 비차단 상태다.

기존 임시 터널은 Tunnel not found로 끊어져 새 터널로 복구했다. 로컬 production 서버는 4320 포트, 메모리 DB로 기존 DB를 격리한다. 공개 페이지 200 / 카탈로그 302 / 실제 상품 사진 상태를 확인했다. 새 미리보기: https://consistently-permits-deaf-component.trycloudflare.com/ . PC와 서버·터널이 켜져 있어야 유지되는 임시 주소이며 정식 상시 호스팅·신규 제휴 채널 승인 완료를 뜻하지 않는다.

- [PC 실제 상품 사진](screenshots/seller-product-photos-desktop.png)
- [모바일 실제 상품 사진](screenshots/seller-product-photos-mobile.png)
- [공개 산출물 smoke](screenshots/seller-product-photo-smoke.json)

## 2026-11-12 맛집 찾기·추천여행 탭, JSON 복사 및 서버 재개

사용자 FoodService 요청은 서버 종료로 구현 전에 중단됐으므로 완료로 간주하지 않고 이번에 마무리했다. 새 RecommendedService도 같은 방식으로 독립 구현했다. 이후 사용자 요청으로 JSON 3개를 바탕화면에 복사하고, 최신 서버 재개 지시에 따라 검증된 서버와 외부 터널을 다시 열었다. 이전 기록의 종료 상태·임시 주소보다 이 절이 최신이다.

### 실제 구현

- 상단 맛집 찾기(/food)·추천여행(/recommended) 및 각각 /:id 상세, 5개 언어, 12건씩 검색/지역/테마/페이지, URL 직접 진입·새로고침·뒤로/앞으로를 제공한다. 음식점은 대표메뉴·운영시간·주소·연락처, 추천여행은 전체 소개·운영/휴무·교통·시설 요금 원문을 표시한다.
- API는 서버 CLI만 호출한다. ServiceKey와 resultType=json, 정확한 5개 엔드포인트를 사용한다. .env에 FOOD_SERVICE_KEY 및 RECOMMENDED_SERVICE_KEY를 분리하고 .env.example에는 빈 항목만 추가했다. 기존 값은 보존했다.
- JSON+XML 서비스에서 JSON을 요청하며 text/plain JSON·XML 인증 오류를 처리한다. HTTPS 고정 호스트·리디렉션 금지·요청 취소·15초 제한·페이지/전체/행/ID 검사·4MB 스트림 한도·오류 원문 비노출을 적용했다. 자동 재시도·유료 API·AI 호출은 없다.
- 5개 언어 모두 완전하게 수집돼야 새 스냅샷을 원자 발행한다. 잘린 페이지·중복 ID·변하는 전체 수·원제목/좌표 충돌은 발행을 중단한다. 서비스별 ID를 분리하고 다른 ID의 유사 장소를 병합하지 않는다. 서로 다른 언어의 같은 ID 충돌은 실제 수집본에서 0건이었다.
- 목록은 요청 언어가 실제 제공하는 자료만 보여준다. 상세만 같은 ID의 한국어로 명시적 원문 대체를 허용한다. 한국어도 없으면 없음 화면이다. 누락된 영업시간/가격/평점/사진을 생성하지 않는다. 영업 중 여부를 계산하지 않는다. 소개에 제휴 상품을 자동 연결하지 않았다. 기존 공개 상품 302개와 관광정보 220개 그룹은 유지한다.
- 외부 내용은 텍스트로 렌더링하고 마크업을 정리한다. 공공 이미지 URL은 공식 Visit Busan 콘텐츠 경로만 허용하며 출처/이용허락/수집일을 표시한다. 이미지 오류는 중립 대체다. 44px·키보드·선택기 접근성 이름·요청 취소/응답 순서·이전 검색 결과/입력 유지·재시도를 검증했다.

### 실제 수집 상태

| 서비스 | ko | en | ja | zh-CN | zh-TW | 언어 레코드 합계 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| FoodService | 536 | 532 | 437 | 337 | 285 | 2,127 |
| RecommendedService | 252 | 238 | 233 | 234 | 234 | 1,191 |

음식점 수집 시각은 2026-11-12 11:28:29 KST, 추천여행은 11:32:43 KST다. 음식점 원본 ID 그룹 538개 / 추천여행 402개는 언어 합집합이며 물리 장소 중복 제거 수나 한국어 목록 수가 아니다. 음식점 사진은 언어 레코드 1,986개(ko489/en485/ja390/간체337/번체285), 추천여행 사진은 1,191개다. 검증된 음식점 이미지가 없는 141개 언어 레코드는 대체 사진을 만들지 않았다. 한국어 음식점은 운영시간 471/536·메뉴 522/536, 추천여행은 운영시간 102/252를 제공한다. 나머지는 미등록 상태다. 사진 HTTP 전체 재검증·모든 업소의 현재 영업 여부는 확인하지 않았다.

공식 [음식점 데이터셋](https://www.data.go.kr/data/15063472/openapi.do)과 [테마여행 데이터셋](https://www.data.go.kr/data/15063506/openapi.do)의 이용허락범위 제한 없음과 정확한 서비스/응답을 확인했다. 수집본 source에 공식 출처·이용허락 URL·credit·시점을 기록했다.

### 변경 파일

- domain: packages/domain/src/guides.ts, index.ts. 서버: config/{env,guides}.ts, providers/guides/{client,parse}.ts, services/{guides,refresh-guides}.ts, routes/guides.ts, app.ts/index.ts.
- 데이터/명령: config/catalog/{food,recommended}.json, scripts/refresh-guides.ts, package.json의 data:food:refresh/data:recommended:refresh, .env(비공개)/.env.example. 의존성과 lockfile은 유지했다.
- UI: PublicGuides.tsx, hooks/useGuideRequest.ts, i18n/public-guides.ts, App.tsx/Destinations.tsx, styles/global.css. 기존 관광지의 요청 훅을 공용 파일로 옮기고 기존 흐름도 회귀 검증했다.
- 검사: tests/unit/guides.test.ts, tests/integration/guides.test.ts, tests/e2e/public-guides.spec.ts. AGENTS/intent/spec/plan/catalog-plan/operations와 이 기록·캡처를 갱신했다.

### 명령과 결과

Node v24.14.1, npm 11.11.0. 아래 최종 명령은 모두 종료 0이다.

| 검증 | 결과 |
| --- | --- |
| npm.cmd run data:food:refresh | 공식 5개 언어 전체 24페이지 수집·발행 |
| npm.cmd run data:recommended:refresh | 공식 5개 언어 전체 15페이지 수집·발행 |
| npm.cmd run lint | 통과, 경고 0 |
| npm.cmd run typecheck | 모든 workspace와 도구 strict 통과 |
| npm.cmd run test -- --run | 11개 파일, 171개 통과 |
| npm.cmd run check:providers | 소스 44개 통과 |
| npm.cmd run build | domain→server→web, Vite 143 modules, JS395.08KB/CSS35.79KB |
| npm.cmd run test:e2e | 360/768/1280px, 69개 모두 통과(약 1.4분) |
| 빌드 산출물 production start smoke | 격리 포트 4319, 10개 언어별 API·4개 직접 진입·실제 메뉴/시간·키 비노출·수평 넘침/페이지 오류 없음 확인, 완료 후 임시 서버 종료 |
| 외부 미리보기 HTTP | health·맛집/추천여행 HTML·두 API 200 확인 |

E2E의 외부 사진·예약 이동은 대역이며 실제 예약/제휴 클릭은 0이다. 별도 production Chromium에서는 해당 공식 사진을 실제로 로드하고 1280x1000/360x1000 화면을 캡처했다. 공개 API와 클라이언트 번들에 제공한 키가 들어가지 않았음을 별도 검사했다.

초기 실패: (1) ESLint preserve-caught-error 1건은 파일 읽기 오류에 cause를 연결해 수정했다. (2) 첫 E2E는 테마 select의 정확한 접근성 이름을 찾지 못해 3개 화면 크기에서 실패했다(66/69 통과). 지역/테마 select에 번역된 aria-label을 명시한 뒤 전체 69개가 통과했다. (3) 첫 산출물 점검은 상위 .env의 포트를 상속해 임시 포트 응답이 없었다. 상위 .env 자동 로드를 제거하고 자식의 전용 override env를 마지막에 읽도록 수정해 재검증했다. (4) 외부 HTML 검사도 Accept: text/html을 지정해 SPA 직접 진입을 검증했다. Zod PURE 주석·Node SQLite experimental·Playwright 색상 경고는 기존 의존성의 비차단 안내다.

### 요청한 바탕화면 복사

원본을 유지하고 Copy-Item 후 각각 SHA-256 일치를 검증했다. .env·비밀키는 복사하지 않았다.

- C:/Users/user/Desktop/TripFit-관광지정보-2026-11-12.json ← config/catalog/destinations.json (3,970,883 bytes, 220 source-ID 그룹/1,044개 언어 자료).
- C:/Users/user/Desktop/TripFit-음식점정보-2026-11-12.json ← config/catalog/food.json (2,326,047 bytes, 2,127개 언어 레코드).
- C:/Users/user/Desktop/TripFit-제휴상품링크-2026-11-12.json ← config/catalog/offers.json (307,181 bytes, 303개 저장 상품 중 공개 302개; 공개 URL의 발급 추적 값 포함, API 비밀키 아님).

### 최신 서버 상태·캡처·제한

사용자의 최종 서버 재개 요청에 따라 production 서버 PID23436(127.0.0.1:4320)와 cloudflared PID28008을 숨김 실행했다. 메모리 DB로 기존 DB를 격리하며 원본 .env는 보존한다. 현재 URL: https://newbie-spending-laundry-launched.trycloudflare.com/food?locale=ko 및 /recommended?locale=ko . PC/서버/터널 종료 시 끊기는 임시 주소이며 상시 호스팅·신규 사이트 제휴 승인 완료가 아니다.

- [음식점 PC](screenshots/food-desktop.png), [음식점 모바일](screenshots/food-mobile.png)
- [추천여행 PC](screenshots/recommended-desktop.png), [추천여행 모바일](screenshots/recommended-mobile.png)
- [산출물·실사진 smoke 결과](screenshots/public-guides-smoke.json)

정기 자동 수집·전체 사진 URL 가용성 재검증·전 업소 현장 검수·메뉴 가격 정규화·새 관광정보와 제휴 상품의 자동 매칭·신규 제휴 채널 신청/승인은 이번에 실행하지 않았다. 데이터 갱신 후 실행 중인 서버를 재시작해야 반영된다.

## 2026-11-13 사용자 제공 dallaBusan 로고 적용

사용자가 첨부한 PNG를 상단·하단 로고로 교체했다. 원본은 apps/web/public/brand/dallabusan-logo.png에 바이트 그대로 보존했다. 별도 생성/색상 변환/래스터 편집 없이 CSS 표시 영역으로 넓은 바깥 흰 여백을 제외하고 원본 비율을 유지한다. 이미지의 산·갈매기·탑·금색 곡선·문자를 그대로 사용했다.

변경 파일: apps/web/src/App.tsx(상단/하단 이미지·접근성 이름·하단 표시명), apps/web/src/styles/global.css(원본 표시 영역·반응형 크기·모바일 상단 자동 높이/하단 세로 배치), apps/web/index.html(공개 제목·설명의 로고 브랜드명), apps/web/public/brand/dallabusan-logo.png, 본 기록 및 캡처. 내부 패키지/프로젝트 ID, .env, 의존성·lockfile, 상품/관광 데이터·승인 링크는 유지했다. 사용자 제공 로고를 공식 API/제휴 상품 사진으로 분류하지 않았다.

검증 명령은 모두 종료 0: npm.cmd run lint, npm.cmd run typecheck, npm.cmd run test -- --run(11개 파일/171개), npm.cmd run check:providers(44개 소스), npm.cmd run build(domain→server→web; 143 modules), npm.cmd run test:e2e -- tests/e2e/foundation.spec.ts --grep "built catalog renders"(360/768/1280px 3개 모두 통과). 로고 변경이므로 새 단위 테스트를 만들지 않고 해당 홈페이지 반응형/5개 언어 E2E를 실행했다. 관련 없는 전체 E2E 69개는 이번 로고 변경에서 반복하지 않았다.

별도 production dist start smoke: 전용 4319 포트와 메모리 DB로 산출물을 실행했다. 원본/공개 PNG의 SHA-256 일치, PNG 200·자연 너비1254px, 두 로고의 접근성 이름·최소 조작 크기, 로고/메뉴가 헤더 내부에 있음, 3개 화면 크기에서 가로 넘침 없음, 각 5개 언어, 하단 로고 로딩, 브라우저 오류 0을 확인했다. 외부 이미지·예약은 대역이며 공공 API 수집·제휴 클릭·예약은 실행하지 않았다. 임시 4319 서버는 검사 후 종료했다. 기존 Zod PURE 주석/SQLite experimental/Playwright 색상 안내는 비차단 상태다.

열려 있는 4320 production 서버는 정적 산출물을 바로 제공하므로 재시작 없이 반영됐다. 로컬 및 https://teachers-sleeping-musical-lows.trycloudflare.com/ 에서 HTML(브랜드 제목), 로고 PNG(원본과 해시 일치), 최신 JS 번들 모두 HTTP200을 별도로 확인했다. 사용자 PC와 서버/터널 실행에 의존하는 기존 임시 주소이며 상시 호스팅 완료를 뜻하지 않는다.

- [PC 상단 로고](screenshots/dallabusan-logo-desktop.png), [모바일 상단 로고](screenshots/dallabusan-logo-mobile.png), [태블릿 상단 로고](screenshots/dallabusan-logo-tablet.png)
- [PC 하단 로고](screenshots/dallabusan-footer-desktop.png), [모바일 하단 로고](screenshots/dallabusan-footer-mobile.png), [태블릿 하단 로고](screenshots/dallabusan-footer-tablet.png)
- [원본 일치·production 검증 결과](screenshots/dallabusan-logo-smoke.json)

## 2026-11-14 테마여행·공영주차장 활용 계획과 서버 설정

요청 범위: 두 API의 향후 코스 추천 활용 계획과 endpoint/키 준비다. 코스 추천 엔진·주차 페이지·지도·AI·예산·운영 주차 수집 파이프라인은 구현하지 않았다. 기존 추천여행 탭/전체 수집본은 유지한다.

변경 파일: docs/tourism-parking-plan.md(정식 계획), docs/plan.md·catalog-plan.md·api-contracts.md(현재 계획 참조/준비 계약), apps/server/src/config/parking.ts(고정 HTTPS endpoint/getPblcPrkngInfo/공식 출처), apps/server/src/config/env.ts(loadParkingApiConfig), .env(비공개 PARKING_SERVICE_KEY 추가), .env.example(빈 항목과 미연동 설명), 본 기록. RecommendedService의 endpoint와 RECOMMENDED_SERVICE_KEY는 이미 존재하고 실제 연결돼 있어 재사용했다. 기존 키·DB·상품/사진/링크·로고·의존성·lockfile은 보존했다. 공개 코드에는 키 값을 넣지 않았다.

공식 문서: [주차장 서비스](https://www.data.go.kr/data/15004683/openapi.do), [주차장 카탈로그](https://www.data.go.kr/catalog/15004683/openapi.json), [테마여행](https://www.data.go.kr/data/15063506/openapi.do). 공식 HTML에서도 주차장 실제 메서드 getPblcPrkngInfo를 확인했다. 임의 메서드나 다국어 주차 엔드포인트를 생성하지 않았다.

실제 연동 확인은 ServiceKey/resultType=json/pageNo=1/numOfRows=1로 각1회만 했다. 주차장 HTTP200/resultCode00/전체615건/1건 수신, 테마 국문 HTTP200/header.code00/전체252건/1건 수신이다. 주차장 외피는 response.header/body/items.item, 테마는 getRecommendedKr.header/item이다. 원본 JSON은 비공개 임시 수집 경로 var/imports/*-planning-sample-2026-11-14.json에 저장했고 요청 URL/키는 기록하지 않았다. 이 결과는 주차장 전체615건 수집/정규화 완료가 아니다.

표본 주차장 관리번호2009000012는 총77면, 위도35.093/경도129.011, fnlDt08/24/2009, 시간·요금구분·currava '-'와 요금0이었다. 따라서 무료/현재 영업/실시간 빈자리로 표시할 수 없다. currava 필드는 존재하지만 갱신/관측시각 보장은 확인하지 못했다. 테마의 자연어 소개를 구조화된 완성 코스로 간주하지 않고, 계획서에 장소/순서 검수·서비스별 ID 관계·직선거리와 실제 경로 구분·시간/신선도/요금 상태·외국어 원문 처리·쿼터·후속 파일/순서/Proof/위험을 명시했다.

최종 검증은 모두 종료0:

| 명령/검사 | 결과 |
| --- | --- |
| npm.cmd run lint | 통과 |
| npm.cmd run typecheck | workspace 및 도구 strict 통과 |
| npm.cmd run test -- --run | 11개 파일/171개 통과 |
| npm.cmd run check:providers | 45개 소스 통과 |
| npm.cmd run build | domain→server→web 성공,143 modules |
| npm.cmd run test:e2e -- tests/e2e/foundation.spec.ts --grep "built catalog renders" | 모바일/태블릿/PC 3개 통과,5개 언어 기본 흐름 유지 |
| 설정·문서 개별 검사 | 두 키의 서비스 간 fallback 없음, 미설정 null, 긴 비밀 값 오류 비노출, 공식 고정 endpoint, .env.example 빈 값, .env gitignore, 계획 참조/키 비노출 통과 |
| production dist start smoke | 임시4319/메모리DB, PARKING_SERVICE_KEY 미설정으로도 실행, 홈/health/추천여행200, /api/parking404, 공개 응답/번들에 주차 키 없음. 검사 후 임시 서버 종료 |

화면/API/업무 로직 변경이 없어 새 단위 테스트나 전체69개 E2E를 추가/반복하지 않았다. 관련 기존 E2E의 홈페이지 캡처는 test-results의 catalog-home.png로 재생성됐으며 UI 변경이 없어 새 공개 시연 캡처는 추가하지 않았다. 기존 화면/공개 상품302개(저장303개)·관광정보220개 그룹·음식점/추천여행 스냅샷은 변경하지 않았다. Node SQLite experimental/Zod PURE 주석/Playwright 색상 경고는 비차단이다.

미구현/미검증: 주차 전체 수집/정규화/저장, 주차 HTTP 런타임 어댑터, 실시간 잔여면수 갱신·현장 운영시간/요금, 경로 API/휴일 데이터, 코스 템플릿 검수/추천 엔진, 자동 스케줄러, 배포/신규 제휴 채널 승인. 현재 주차장은 **설정 준비 + 단건 인증 확인** 상태다. 운영 연결/전체 수집/일정 추천 완료로 표시하지 않는다.

## 2026-11-14 공영주차장 전체 수집·정규화 구현 완료

사용자 요청에 따라 tourism-parking-plan의 단계1~2를 구현했다. 페이지·공개 주차 API·주차 후보 선택·코스 추천·AI·예산·지도는 추가하지 않았다. 기존 제휴 상품·관광지·음식점·추천여행 화면과 데이터는 보존했다. 기존 공개 상품302개/저장303개·관광정보220개 그룹도 변경하지 않았다.

### 실제 수집과 식별 규칙

PARKING_SERVICE_KEY를 기존 루트 .env에서 읽어 공식 getPblcPrkngInfo에 ServiceKey/resultType=json/pageNo/numOfRows를 전달했다. 100행 페이지를 실제 지원하는 것을 확인하며 총7회 요청으로615행을 받았다. 마지막 페이지는15행이었다. 실제 수집 완료2026-11-14T10:26:10.292Z(19:26:10.292 KST). 이후 정규화 보완·검증에는 이미 받은 원본을 재사용해 API를 다시 호출하지 않았다.

최초 전역 관리번호 가정에서는250행이 고유하고365행이 중복으로 격리됐다. 전체 원본을 분석하니 관리번호360개 중110개가 서로 다른 관리기관에서 재사용됐고, 관리기관+번호 조합은615개 모두 고유했다. 원본 sourceId는 그대로 두고 sourceKey=JSON.stringify([관리기관명,관리번호])로 분리하도록 정규화 버전2를 적용했다. 다른 기관의 행을 합치거나 임의의 물리 장소 ID를 만들지 않았다. 동일 복합키 충돌은 여전히 전부 격리하며 기관 없는 행도 격리한다. 최초 중간 산출물은 var/imports/parking/global-management-number-prototype.json에 보존했다.

최종615행 수신/615행 정규화/격리0. 단일 config/catalog/parking.json(2,069,183 bytes)에 원본 필드, 정규화, 페이지 SHA-256/시각, 격리 자료, 품질 집계를 보관한다. 실행별 전체 원본 응답은 var/imports/parking/의 타임스탬프+UUID 파일에 별도 보관했다. 요청 URL/키는 파일과 로그에 넣지 않았다. .env의 기존 키 값과 의존성/lockfile/기존 DB는 유지했다.

### 구현 파일과 보장

- packages/domain/src/parking.ts 및 index.ts: 순수 레코드/시간/기준일/품질/격리/스냅샷 계약, 복합키·전체 행 분할·집계 불변식.
- apps/server/src/providers/parking/{errors,parse,normalize,client}.ts: 안전한 JSON 외피·XML 오류 확인·1회 인코딩·고정 HTTPS 원본/리디렉션 금지·15초/4MB 제한·429/인증/취소·비밀 비노출. 자동 재시도 없음.
- services/refresh-parking.ts: 순차 페이지 수집, 전체 수 변화/잘린 페이지/반복 페이지(키 순서와 무관한 해시)/상한/빈 결과 검사, 원본 보존/정규화/품질 집계.
- repositories/parking.ts: 모든 원본에서 필드/시간/품질/페이지 해시를 다시 계산해 저장본과 일치하는지 검사. 검사 후 소유한 임시 파일만 fsync/닫기/rename으로 원자 교체한다. 네트워크/취소/부분/빈/미식별/변조/쓰기 실패는 기존 파일을 바꾸지 않는다. 다른 작업의 임시 파일을 삭제하지 않는다.
- config/{parking,env}.ts 및 .env.example: 내부 저장 경로와 수집 상한 옵션. PARKING_TIMEOUT_MS/ MAX_PAGES/ PAGE_SIZE가 빈 값이면 기본15000/100/100이다. .env 실제 값은 수정하지 않았다.
- scripts/{refresh-parking,check-parking}.ts 및 package.json: data:parking:refresh/check. check는 API 호출이 없고 .env도 필요 없다.
- tests/fixtures/parking.ts, unit/parking.test.ts, integration/parking-import.test.ts: 개발 fixture는 테스트에서만 사용하고 실제 운영 자료는 공식 전체 응답이다.
- AGENTS.md·spec·catalog-plan·tourism-parking-plan·operations·본 proof, [고정 품질 보고서](parking-quality-2026-11-14.md)를 갱신했다.

### 실제 데이터 품질

유효 부산 영역 좌표294/누락320/영역 밖1, 전체 기준일2009-01-13~2020-08-18로 전부30일 초과다. 영역 밖 원본 위도5.139를35.139로 추정하지 않았다. 총구획수-41/-4 두 행은0이 아닌null+경고로 기록했고, 실제0면6행은 별도로 보존했다.

feeInfo는615행 모두 '-'라서 요금0을 무료로 해석하지 않았다. 잔여면수 미제공611/숫자 있지만 관측시각 없는4행이며 usableForLiveRecommendation=false다. 시간창1,845개는 parsed1,326/missing330/invalid27/ambiguous162. 파싱 성공을 현재 영업으로 표시하지 않는다. 00:00~00:00과24:00 시작을24시간으로 바꾸지 않았다.

### 명령·종료 결과와 실연동 구분

| 검사 | 최종 결과 |
| --- | --- |
| npm.cmd run data:parking:refresh | 종료0, 공식 전체7페이지615행 수집. 식별 규칙 보완 후 원본 아카이브의 같은7페이지를 API 재호출0으로 버전2 재정규화/발행 |
| npm.cmd run data:parking:check | 종료0, 원본·모든 정규화 필드·집계·페이지 해시 오프라인 재검증 |
| npm.cmd run lint | 종료0 |
| npm.cmd run typecheck | 종료0, workspace/도구 strict 통과 |
| npm.cmd run test -- --run | 종료0,13개 파일223개 통과. 신규 주차52개 포함 |
| npm.cmd run check:providers | 종료0,52개 소스 경계 통과 |
| npm.cmd run build | 종료0,domain→server→web,144 modules,JS401.92KB/CSS36.05KB |
| npm.cmd run test:e2e -- tests/e2e/foundation.spec.ts --grep "built catalog renders" | 종료0,360/768/1280px3개 통과,5개 언어 홈페이지 유지 |
| production dist start smoke | 종료0,임시4319/메모리DB. 미설정 주차 키로도 홈·health·추천여행200, /api/parking 및 /config/catalog/parking.json404,615행 재계산·공개 응답/번들/저장본에 키 없음 확인. 검사 후 임시 서버 종료 |

신규 검사는 같은 기관 내 충돌 격리·타 기관 같은 번호 유지·시간/달력 경계·원본 기준일/수집일 분리·0/누락 구분·키 echo 거부·XML/401/403/429/5xx·응답 크기·취소/타임아웃·전체 수 변동/반복 페이지·원자 저장/변조 탐지/이전 파일 보존을 검증했다. 관련 기존 E2E의 외부 이미지/예약은 대역이며 실제 제휴 클릭·예약·유료 API는0이다. 해당 E2E의 홈페이지 캡처는 test-results에 재생성했다. 새 UI가 없어 별도 주차 화면 캡처/전체69개 E2E 재실행은 하지 않았다. 기존 SQLite experimental·Zod PURE·Playwright 색상 경고는 비차단이다.

산출물 smoke의 기계 판독 결과는 var/imports/parking-import-production-smoke-2026-11-14.json이다. 현재 사이트 서버를 이 내부 CLI 작업 때문에 재시작하거나 공개 배포/제휴 채널 신청하지 않았다. 동시 refresh는 운영상 지원하지 않으며 단일 실행을 사용한다. 스케줄러·실시간 빈자리 갱신·현장 운영시간/요금 검수·경로/주차 후보·코스 템플릿 검수는 미구현이다. 현재 결과는 향후 검수를 위한 원본/정규화 자료다.


## 2026-11-15 테마 코스 템플릿·관광지/맛집 연결·원문 순서 검수

### 범위와 변경 파일

최신 사용자 요청으로 tourism-parking-plan의 단계3 중 저장된 원문 기반의 코스 구조화·장소 연결·방문 순서 대조를 구현했다. 새 페이지·공개 API·지도·AI·예산·자동 일정·주차 후보는 추가하지 않았다. 기존 사이트 서버와 터널은 재시작하지 않았다.

- packages/domain/src/theme-routes.ts, index.ts: 순수 Zod 계약, 서비스별 장소 ID·원문 순서/검토 상태·연속 구간·별도 맛집 후보·coverage.
- apps/server/src/config/theme-routes.ts: 정해진 원본 파일과 출처/종류/언어별 ID 계약 검증.
- apps/server/src/services/theme-route-catalog.ts: semantic fingerprint, 명시 매핑·검토 별칭/인용, 선언된 순서·방향성 서술 대조, 미해결 노드에서 구간 분리, Haversine 직선거리 기반 맛집 후보 검사.
- apps/server/src/repositories/theme-routes.ts: 현재 의존성을 이용한 전체 재계산/위변조 검사, fsync·rename 원자 발행과 실패 시 이전 파일 유지.
- scripts/export-route-attractions.ts, build-theme-routes.ts, check-theme-routes.ts 및 package.json: 읽기 전용 추출/생성/오프라인 검사 CLI. 새 패키지 설치·lockfile 변경·.env 변경 없음.
- config/catalog/route-attraction-sources.json, route-place-mappings.json, theme-route-templates.json, theme-routes.json: 기존 실제 공공 자료 추출·검토 입력·파생 스냅샷. 웹 공개 디렉터리에 두지 않았다.
- tests/fixtures/theme-routes.ts, tests/unit/theme-routes.test.ts, theme-route-publication.test.ts: 신규21개 회귀 테스트. fixture는 테스트에만 사용한다.
- AGENTS.md, docs/spec.md, plan.md, catalog-plan.md, tourism-parking-plan.md, operations.md 및 [코스별 검수 보고서](theme-route-review-2026-11-14.md): 현재 단계와 미해결·운영 절차 기록.

### 실제 로컬 자료 결과

테마402개 ID 그룹/1,191언어 레코드 전체에 coverage를 만들고16개 원본 그룹에서17개 전체/부분 템플릿을 선별했다. 386개 원본 그룹은 미선별이며 외국어 전용 ID를 다른 제목/ID와 합치지 않았다. 명소는 기존 SQLite의1,044언어 레코드를 읽기 전용으로 추출했고, 추출 전후 DB의 SHA-256이 같았다. 명시 매핑44개는 명소32/맛집12다.

원문 순서 확인15개, 장소까지 자료 대조를 통과한 템플릿1개, 검토 대기16개, 확인된 연속 구간8개다. 통과1개는 해운대해수욕장→동백섬 두 장소의 원문 부분 구간이며 완성된 여행 일정이 아니다. 명소 연결35회·맛집 방문 연결2회는 템플릿 내 발생 횟수로 고유 장소 수가 아니다. 별도 맛집 후보19개(원문 언급2/직선1km17)를 확인했다. 맛집은 방문 순서에 자동 삽입하지 않는다.

43개 방문 노드의 미해결 사유를 유지했다. 흰여울마을의 별칭 근거 부족, 박물관 본관/별관의 모호함, 향교·고분군·해변/공원 묶음 레코드의 대표 좌표, 독립 레코드 부재를 임의 추정으로 채우지 않았다. 교통 환승 안내의 화살표·단순 나열·방향 없는 서술은 검증된 방문 순서가 아니다. 미해결 노드를 건너 연결하지 않는다.

모든 템플릿은 assistant-source-evidence, humanApproval=pending, fieldValidation=not-performed, recommendationEnabled=false다. 사람·현장 검수 완료로 표시하지 않으며 실제 도로/입구·운영시간·휴무·보행 접근성·이동시간을 확인한 결과가 아니다. 주차장615건은 변경 없이 유지했다. 이번에 포털 상품 수집/새 제휴링크 발급은0이며 기존 상품의 승인 상태를 바꾸지 않았다. 모든 OTA 전체 재고 확보·신규 사이트 승인·공개 배포 완료를 뜻하지 않는다.

### 실행 명령과 결과

| 명령/검사 | 최종 결과 |
| --- | --- |
| npm.cmd run data:themes:export-attractions | 종료0,1,044레코드; 기존 SQLite 바이트 동일 |
| npm.cmd run data:themes:build | 종료0,17템플릿 원자 발행 |
| npm.cmd run data:themes:check | 종료0,현재 원본·매핑과 전체 파생 결과 재계산 일치 |
| npm.cmd run lint | 종료0 |
| npm.cmd run typecheck | 종료0,workspaces와 tools strict 검사 |
| npm.cmd run test -- --run | 종료0,15파일/244테스트 통과(신규21) |
| npm.cmd run check:providers | 종료0,56소스 파일 통과 |
| npm.cmd run build | 종료0,domain→server→web;145모듈 빌드 |
| npm.cmd run test:e2e -- tests/e2e/foundation.spec.ts --grep "built catalog renders" | 종료0,360/768/1280px의3테스트 통과;각5개 언어 전환/기존 카탈로그 확인 |
| 컴파일된 서버·내부 코스 읽기 production smoke | 종료0,임시4319 서버 정리 완료 |

원문 변경/삭제·장소 좌표 변경/삭제·다른 서비스의 같은 ID·미선별 외국어 ID·역순/누락/반복 노드·별칭 근거 부족·복합 장소·1km 밖 맛집·거짓 인용·snapshot 위변조·누락 디렉터리 발행 실패를 검사했다. 오래된 snapshot은 현재 의존성 검사에서 거부하고 새 빌드는 변경된 연결을 보류한다. 수집시각만 변경한 경우 semantic 검토는 유지하지만 전체 snapshot 재생성이 필요하다. 발행 검증 실패 후 기존 파일과 임시 파일 정리를 확인했다.

초기 누락 순서 테스트1개가 최소2노드 스키마에 의해 예상보다 먼저 거부됐다. 테스트를 수정해 누락은 입력 거부, 역순/반복은 검토 대기임을 각각 검증했고 전체244개가 통과했다. 작업 중 Windows npm workspace 프로세스의 일시적 spawn EPERM이 있었고 동일 typecheck 재실행에서 전체 종료0을 확인했다. 검사를 끄거나 에러를 숨기지 않았다. SQLite experimental·Zod PURE 주석·Playwright 색상 환경 경고는 기존 비차단 경고다.

production smoke에서 /, /api/health, /api/guides/recommended?locale=ko는200, /api/theme-routes와4개 코스 config/catalog JSON 및 기존 주차 API/파일은404였다. 컴파일된 config/repository로 로컬 코스 snapshot을 재검증하고 모든 추천 비활성/사람 승인 대기 상태를 확인했다. 주차 키는 선택 환경에서도 서버 시작이 가능하며, 실제 키가 공개 응답·웹 JS bundle·코스 자료에 없음을 검사했다. 결과 파일은 var/imports/theme-routes-production-smoke-2026-11-15.json(로컬 검사 이력)이다.

### 화면 증거·미실행 항목

새 UI가 없으므로 기존 홈페이지 회귀 캡처를 보관했다. 모바일/PC는 직접 이미지 확인했고 가로 넘침 없이 기존 로고·탐색·카탈로그가 유지됐다. [모바일](screenshots/theme-routes-regression-mobile-2026-11-15.png), [태블릿](screenshots/theme-routes-regression-tablet-2026-11-15.png), [PC](screenshots/theme-routes-regression-desktop-2026-11-15.png). 외부 상품 이미지/예약은 E2E 대역이며 실제 제휴 클릭·예약·유료 API·외부 API 재수집은0이다.

기존 전체69개 E2E는 새 UI/공개 API 변경이 없어 재실행하지 않고 관련3개를 실행했다. 실제 현장 경로·운영시간/휴무·보행성·사람 승인·나머지386개 원본의 장소 검수·주차 후보·지도/공개 추천 화면은 후속 범위다. 정기 스케줄러와 외부 라우팅 API는 추가하지 않았다.

기존 제휴 카탈로그를 컴파일된 서버 config/service로 다시 읽어 저장303개·공개302개를 확인했다. 활성 구성은 PROVIDER_A78/B29/C185/D10이며 비활성1개를 유지했다. 기존 채널 데이터 재사용이며 신규 사이트 승인 결과가 아니다.


## 2026-11-18 GitHub 개발 인수인계 준비

사용자가 지정한 daeeon8728/DallaBusan 저장소는 접근 시 공개·빈 저장소였고 push 권한을 확인했다. 현재 소스·테스트·상품/공공 데이터·로고/사진·계획/검증 문서를 포함한다. 기존 origin은 다른 저장소이므로 보존하고 별도 대상 remote로 게시한다. 공개 배포나 사이트 서버 시작을 뜻하지 않는다.

새 파일: scripts/restore-database.ts, scripts/lib/restore-database.ts, tests/unit/database-restore.test.ts, data/snapshots/trip-fit.sqlite와 manifest.json, docs/handoff.md, .gitattributes. 변경: README.md, AGENTS.md, data/README.md, package.json(db:restore 명령), .gitignore, proof.md. 새 의존성이나 lockfile 변경은 없다.

기존 DB는 읽기 전용 연결과 SQLite backup으로 일관 백업했다. schema_migrations2/providers4/places1044/place_translations1044/products0/attraction_pages15/attraction_records1044/attraction_imports12이며 무결성·외래키·원본 마이그레이션 checksum을 확인했다. DB의 products0은 별도 JSON 상품303개/공개302개와 다른 저장소임을 명시했다. 백업11,087,872바이트와 SHA-256 manifest를 포함한다. SQL은 Git 줄바꿈 변환을 제외해 기존 migration checksum을 보존한다.

복원은 SHA-256·스키마/테이블·행 수·무결성 검사 후 새 파일에만 수행하며 기존 DB를 덮어쓰지 않는다. 실제 .env·런타임 DB·node_modules·dist·임시 수집/로그·호스팅 세션은 제외하고 README/handoff에 필요한 재생성/개별 키 복사 방법을 기록했다. 현재 PC의 .env·기존 DB는 삭제/수정하지 않는다.

첫 비밀키 검사에서 Git의 디렉터리 항목을 파일로 읽으려 해 EISDIR로 중단됐고, 실제 파일만 검사하도록 수정했다. 후보206파일·기존2커밋·DB에서 환경에 설정된 실제 비밀 값6개의 원문/URL인코딩 일치가0건이었다. 이는 공개 제휴 링크의 추적 ID와 구분한 검사다. 문서 작성 도구의 템플릿 문자열 구문 오류는 파일 변경 전에 발생했고 안전한 코드 펜스로 수정했다. 초기 lint가 테스트 finally 내 throw를 지적해 경로 확인을 finally 밖으로 옮겼고 수정 후 lint 종료0이다. 오류를 숨기거나 검사를 비활성화하지 않았다.


## 2026-11-18 로그인 없는 찜하기·부산 주차 공개자료 연동

### 변경과 현재 동작

- apps/web/src/saved/{store,useSaved,SaveButton,SavedPage}: 버전1 localStorage 계약·200개 제한·동일 기기/사이트 주소의 재접속 복원·저장/삭제·다중 탭 이벤트 동기화·종류별 필터·12개씩 조회. 관광지·맛집·상품의 중립 종류/ID/저장 당시 이름/시각만 저장한다. 예약 URL/가격/계정/API 키는 저장하지 않는다. 현재 언어·공개 여부는 기존 검증 API에서 다시 조회한다.
- App.tsx, Offer.tsx, Destinations.tsx, PublicGuides.tsx: 목록·상세의44px 하트, /saved 및 상단 저장 개수, 저장 실패/손상 안내 연결. 손상 자료는 명시적 확인 전 보존하며 초기화도 해당 키만 지운다. 다른 브라우저/기기로 자동 동기화하지 않는다. 동시에 다른 탭이 변경할 때는 localStorage의 마지막 저장을 기준으로 갱신한다.
- packages/domain/src/parking-directory.ts, server/config/parking-directory.ts, providers/parking-directory/client.ts, services/{normalize-parking-directory,parking-directory}.ts, repositories/parking-directory.ts, routes/parking-directory.ts: 공개 다운로드 계약·전체 페이지 검증·기관+관리번호 정규화·중복 보류·원자 게시·안전한 공개 DTO·검색/주변 조회. 기존 서버 app/index에 연결했다.
- scripts/refresh-parking-directory.ts, check-parking-directory.ts, package.json: 키 없는 공개자료 전체 수동 갱신/로컬 재계산 검사. config/catalog/parking-directory.json에 원본653행·페이지별 해시·품질·보류 사유와 파생641건을 보관한다. 실패 시 마지막 성공본을 보존하고 방문자 검색으로 외부 API를 재호출하지 않는다.
- web/Parking.tsx, i18n/{saved,parking}.ts, global.css: 기존 검색에서 주차 검색/요금·운영 구분 필터·페이지 이동, 관광지/맛집 상세에서 대표 좌표1km 이내 최대3건·외부 위치 링크·주소 복사·출처/날짜/원문 안내.5개 UI 언어를 지원한다. 별도 주차 페이지·내장 지도·AI·일정 엔진은 추가하지 않았다.
- tests/unit/saved-items.test.ts, parking-directory.test.ts, fixtures/parking-directory.ts, e2e/saved-parking.spec.ts: 새로고침·언어·다중 탭·실패·손상/초기화·만료 데이터·주차 필터/원문/거리/수집 완전성 회귀 검사.
- AGENTS/README/intent/spec/plan/catalog-plan/operations와 [주차 수집 보고서](parking-directory-2026-11-18.md)를 갱신했다. eslint.config.js는 var의 수집 원본·생성 자료·이전 임시 복제본을 정식 소스 검사와 분리했다. apps/packages/scripts/tests의 검사는 유지한다. 의존성 설치·lockfile·.env·기존 DB·기존 주차615행은 변경하지 않았다.

### 실제 수집 범위와 데이터 판단

2026-11-18에 [전국주차장정보표준데이터](https://www.data.go.kr/data/15012896/standard.do)를 확인하고 공식 웹 다운로드의 전체18,994행(10,000/8,994)을 수집해 부산 주소/기관653행을 선별했다. 실제 수집 CLI에서도 header→2개 데이터 페이지→최종 header의4번 공개 요청을 수행해 전체 건수/계약/페이지별 해시를 검증했다. 수집시각은2026-11-18T10:25:21.470Z, 원본 개별 기준일은2026-04-17~2026-10-30이다. 수집시각을 시설의 현재 상태로 사용하지 않는다.

원본은 공영423/민영230, 유료613/무료40이다. 중복 식별12행을 보류한 게시641건은 공영411/민영230, 유료603/자료상 무료37/요금 미확인1이다. 무료 표기와 양수 요금이 모순된1건은 무료로 분류하지 않았다. 좌표 없는8건은 검색에 남기되 주변 거리 계산/지도 링크에서 제외했다. 구·군16개에 자료가 있으나 구별 전체 시설 대비 수록률과 모든 민영/부설/신규 시설 포함 여부는 알 수 없다. 원본 대상 밖 거주자우선 구역도 포함하지 않는다. UI/API의 allCityParkingGuaranteed=false, liveAvailability=false를 검증했다.

[부산시설공단 실시간 API](https://www.data.go.kr/data/15157490/openapi.do)는 별도 서비스 활용 키를 요구한다. 신규 신청·약관 동의를 대신 하지 않았으며 빈자리 API를 연결했다고 표시하지 않는다. OSM 공개 질의는HTTP406으로 실패해 결과를 사용하지 않았다. 다른 서비스의 미검수 주차료/영업 상태는 가져오지 않았다. 기존615건의 오래된 공영 자료를 신규641건과 합쳐 전체 개수를 부풀리지 않았다.

### 검증 명령과 최종 종료 결과

| 명령/검사 | 결과 |
| --- | --- |
| npm.cmd run data:parking-directory:refresh | 종료0,실제 전체 다운로드·653원본/641게시/12보류 원자 저장 |
| npm.cmd run data:parking-directory:check | 종료0,원본→정규화→품질 재계산 일치 |
| npm.cmd run lint | 종료0 |
| npm.cmd run typecheck | 종료0,workspaces와 tools strict |
| npm.cmd run test -- --run | 종료0,18파일/278개 통과(기존249+신규29) |
| npm.cmd run check:providers | 종료0,70소스 파일 통과 |
| npm.cmd run build | 종료0,domain→server→web153모듈 |
| npm.cmd run test:e2e -- --reporter=line | 종료0,모바일360/태블릿768/PC1280의전체90개 통과(기존69+신규21) |
| dist production start smoke | 종료0,임시 포트·메모리 DB로 실행 후 서버 종료 |

저장 키 차단/공간 부족은 성공으로 표시하지 않고 마지막 저장을 보존한다. 손상 데이터/잘못된 버전·불필요 URL 필드·잘못된 ID는 거부한다.200개 한도에서 삭제 가능, 최대 길이의200개 이름도 정상 복원됨을 확인했다. 판매 중단/404 상품을 자동 삭제하거나 예전 예약 링크로 복원하지 않는다. 현재 API 실패 시 찜 자체를 유지한다. 공식 수집 HTTP 실패·부분 페이지·수집 중 전체 건수 변경·파생 결과 변조·중복 ID·무료/유료 충돌·다른 기관의 동일 번호·좌표 누락/범위 밖·오래된 자료·모호한 위치·빈 결과·엄격한 HTTP 입력을 검증했다.

초기 lint가 catch 변수의 원인 정보 누락을 지적해 안전한 source config 오류에 cause를 연결했다. 테스트 입력의 선택 필드 타입 오류는 누락 가능성을 명시해 수정했다. 첫 찜 한도 테스트에서 초기화 전 toggle의 오류 상태가 덮이는 문제를 발견해 초기화 시점을 고쳤고, 큰 정상 저장 자료가 크기 제한으로 손상 취급되지 않도록 경계도 검증했다. 최초 전체 E2E는85통과/5실패였다. 태블릿 영어 메뉴 폭 초과2건은 헤더를 두 줄/내부 스크롤로 수정했다. 나머지3건은 다대포 명칭이 주차장 원본 이름에 없어 빠진 경우였다. 공식 명소명/별칭과 대표 좌표1km 안의 주차장 검색을 합치고 해당 근거를 UI에 표시했다. 이후 전체90개를 다시 실행해 모두 통과했다. 검사를 끄거나 실패를 숨기지 않았다.

### 산출물 실행·비밀 경계·화면 증거

실제 production 모드의 /, /saved?locale=en, /food, /api/health, /api/offers?limit=1, 주차 검색/무료/민영/다대포/감천 주변 API는200이었다. 공개 상품302개, 주차641개/무료37개/민영230개, 다대포 명소명 결과와 반경 제한을 확인했다. raw config/DB/.env의JSON 요청과 테마 추천 API는404다. /.env에HTML을 요청하면 SPA 셸만 반환되는 기존 동작을 별도 검사했고 키·환경 필드 내용은 없었다. 실제 환경 비밀 값이 공개 응답·웹 JS에 포함되지 않음을 검사했다. 기존 SQLite는 사용하지 않고 임시 메모리 DB를 정리했다. 결과는 var/imports/saved-parking-production-smoke-2026-11-18.json에 있다.

화면 캡처: [찜 모바일](screenshots/saved-mobile-2026-11-18.png), [찜 태블릿](screenshots/saved-tablet-2026-11-18.png), [찜 PC](screenshots/saved-desktop-2026-11-18.png), [주차 모바일](screenshots/parking-mobile-2026-11-18.png), [주차 태블릿](screenshots/parking-tablet-2026-11-18.png), [주차 PC](screenshots/parking-desktop-2026-11-18.png). 찜 모바일/PC와 주차 PC 이미지를 직접 확인했다. 파란 단색 상품/맛집 이미지는 외부 요청 대역이며 운영 사진을 교체한 것이 아니다. 실제 제휴 클릭·예약·결제·유료 API·새 포털 상품 수집은0이다. 상품 저장303/공개302와 PROVIDER_A78/B29/C185/D10을 유지했다. 미검증 계정/사이트 승인·전체 OTA 재고·공개 배포로 과장하지 않는다.

모든 실제 주차장 전수 목록과 실시간 빈자리/현재 운영의 확보, 공단 신규 API 신청·개별 현장 검수·주차 예약·자동 수집 스케줄러·기기간 계정 동기화는 미구현이다. 이 기능을 확인할 기존3001/4320/5173 서버는 검사 시 실행 중이지 않았으며 임시 검사 서버만 실행/종료했다. 운영 서버를 임의로 공개 배포하거나 제휴 채널에 제출하지 않았다.

### 최종 미번역 표시 점검

찜 목록에서도 서버가 원문 대체를 반환하면 원문 제목 안내와 실제 제목 언어(lang)를 표시하도록 확인했다. 이후 최종 lint/typecheck/build는 종료0이다. 관련 E2E에 원문 대체 시나리오를 추가해 총8시나리오×3화면=24개를 재검증했다. 앞선 전체90개 통과 이후 추가된3개를 포함하며 기존69개 화면 시나리오는 그대로다. 단위·통합278개와 주차 수집/산출물 검사 결과는 유지된다.


## 2026-11-18 상품 장바구니·통화별 참고 합계

### 변경 파일과 동작

- packages/domain/src/cart.ts와 index.ts: 수량1~99·100상품 저장 계약, 중복/상태 검증, 원통화별 십진수 합산/곱셈. BigInt로0.10+0.20 및 큰 금액을 정확하게 계산한다. React·HTTP·DB·환경 변수에 의존하지 않는다.
- apps/web/src/cart/{store,useCart,money,CartControls,useCartOffers,CartPage}: 별도 localStorage 키 dallabusan.cart.v1, 반복 담기 중복 방지, 수량·삭제·새로고침/다중 탭 유지, 손상/저장 실패 안내, 현재 공개 DTO 재조회와 통화별 합계 화면.
- App.tsx: 오른쪽 위 언어 선택창 옆 cart-nav를 header-actions 안에 배치하고 /cart 직접 진입·언어·뒤로 가기를 연결했다.
- Offer.tsx 및 saved/SavedPage.tsx: 모든 상품 카드·관련 상품·상품 상세·찜한 상품에 담기 버튼을 제공한다. 관광지/맛집 공공 정보 자체를 판매 상품처럼 장바구니에 넣지 않는다.
- i18n/cart.ts와 global.css:5개 UI 언어와 모바일/태블릿/PC,44px 조작, 상품별 수량과 참고 합계·통화별 합계·미확인/제외 안내.
- tests/fixtures/cart.ts, unit/cart.test.ts, e2e/cart.spec.ts: 계산/저장19개 단위 테스트와6개 브라우저 시나리오×3화면. fixture는 테스트에서만 사용한다.
- intent/spec/plan/catalog-plan/operations, README, AGENTS 및 이 proof: 사용자 승인 범위와 가격 기준·미구현 범위를 기록했다. 새 의존성·lockfile·.env·기존 DB·상품/주차 데이터는 변경하지 않았다. 이전 찜/주차 작업의 수정 상태를 보존했다.

### 가격과 상품 정체성 경계

현재 원본303개 가격은 KRW254/USD29/가격 없음20이며 공개 DTO는 승인·기간 검증 후302개다. 원본의 금액은 관찰한 참고가로, 실제 옵션별 최소가·실시간 최저가 필드가 없다. 따라서 실제 최저가를 만들어 표시하지 않고 **표시 가격 기준 참고 합계**라고 명시했다. 원래 가격의 관찰일을 보여주고 사용자 선택 수량만 곱한다. 인원·박수·세금·최종 옵션·재고·환율을 임의 적용하지 않는다. 통화가 다르면 별도 합계이며 전체 원화 환산·내부 결제·AI/여행 예산 엔진은 추가하지 않는다.

장바구니에는 id/providerId/externalId/title/quantity/addedAt만 보관한다. URL·가격·통화·서명/계정 비밀을 저장하지 않는다. 목록을 열거나 새로고침/명시적 갱신 시 기존 검증된 /api/offers/:id를 현재 언어로 동시 최대6건 조회하며 오래된 요청/응답을 차단한다. provider/external 정체성이 바뀌거나404/실패하면 항목을 자동 삭제하지 않되 그 가격/예약 링크는 제외한다. 미확인 가격은0원으로 세지 않고 별도 개수로 표시하며, 확인된 금액만 있으면 부분 합계라고 안내한다. 전부 미확인이면 통화 금액을 생성하지 않는다.

### 실행과 최종 결과

| 명령/검사 | 최종 결과 |
| --- | --- |
| npm.cmd run lint | 종료0 |
| npm.cmd run typecheck | 종료0,workspaces 및 tools strict |
| npm.cmd run test -- --run | 종료0,19파일/297개(기존278+신규19) |
| npm.cmd run check:providers | 종료0,78소스 파일 통과 |
| npm.cmd run build | 종료0,domain→server→web161모듈 |
| npm.cmd run test:e2e -- --reporter=line | 종료0,전체111개(기존93+장바구니18),360/768/1280px |
| dist production start smoke | 종료0,/cart?locale=en 포함,임시 메모리 DB 사용 후 서버 종료 |

소수 오차·큰 금액·다른 통화·단위 누락·중복 ID·수량 경계·100개 제한·반복 담기·새로고침·다중 탭·차단/할당량 실패·손상 자료의 명시적 초기화·찜 보존을 검증했다. 브라우저에서 카드/상세/찜에서 담기, 수량·삭제·언어 전환, 서버에서 다시 받은 가격 반영, 통화별 금액/미확인 제외,404 및 같은 ID의 externalId 변경 시 과거 링크 차단을 확인했다. 단위/브라우저 검사는 첫 실행부터 최종 종료0이며 검사를 끄거나 실패를 숨기지 않았다. SQLite experimental·Zod PURE·Playwright 색상 환경 경고는 기존 비차단 경고다.

production smoke에서 /cart?locale=en,기존 홈/찜/맛집/상품 API/주차 검색·다대포/감천 주변은200이고 내부 config/DB/.env JSON 요청/미구현 테마 추천 API는404였다. 최종 웹 bundle에 장바구니 코드가 포함되고 실제 환경 비밀 값이 공개 응답/웹 JS에 없음을 확인했다. 공개 상품302개와 주차641건을 유지했다. 결과 파일은 var/imports/cart-production-smoke-2026-11-18.json이다.

시연: [모바일](screenshots/cart-mobile-2026-11-18.png), [태블릿](screenshots/cart-tablet-2026-11-18.png), [PC](screenshots/cart-desktop-2026-11-18.png). 모바일/PC 이미지를 직접 확인해 언어 선택창 옆 배치·수량·합계·가로 넘침 없음을 확인했다. 단색 상품 이미지는 E2E 외부 이미지 대역이며 운영 사진을 교체한 것이 아니다. 실제 제휴 예약 클릭/결제·새 포털 상품 수집·가격 API/환율 호출·공개 배포는0이다. 기존 승인/미승인 상태와 상품 카탈로그 데이터를 변경하지 않았다.

실시간 최소가 확보·옵션/인원/박수 계산·환율 환산·재고 예약·통합 결제·기기간 계정 동기화는 미구현이다. 현재 합계를 최종 지불액이나 실제 최저가로 표시하지 않는다.


## 2026-11-19 언어별 상품 표시 환산

최신 요청으로 이전의 표시 환산 제외만 해제했다. ko/KRW, en/USD, ja/JPY, zh-CN/CNY, zh-TW/TWD이며 원래 통화/금액/가격 관찰일·providerId/externalId·제휴 URL은 보존한다. 카드·상세·관광지 연관 카드·찜한 상품·장바구니에 공용 표시를 적용했다. 환산가(≈)와 원가격, 제공일 범위·출처·실패 복구/재시도를 제공하며 환율 없음은 원통화와 분리 합계로 복구한다. 가격 없음은0원이 아니며 현재 판매 확인 실패/정체성 불일치는 이전 규칙대로 제외한다.

변경 파일: packages/domain/src/{exchange,cart,index}.ts; apps/server/src/config/exchange.ts,services/exchange.ts,routes/exchange.ts,app.ts,index.ts; apps/web/src/currency/{context.ts,ExchangeProvider.tsx,Price.tsx},i18n/exchange.ts,main.tsx,App.tsx,Offer.tsx,saved/SavedPage.tsx,cart/CartPage.tsx,styles/global.css; tests/{fixtures/exchange.ts,unit/exchange.test.ts,integration/exchange.test.ts,e2e/exchange.spec.ts}; AGENTS.md,README.md,docs/{intent,spec,plan,catalog-plan,operations,proof}.md. 의존성/lockfile/.env/원본 상품·가격·제휴 설정/기존 DB는 변경하지 않았다. 상품 원본303·공개302를 유지하며 신규 포털 수집0, 제휴 클릭/예약/결제0이다.

실제 연동: [공식 문서](https://frankfurter.dev/) 확인 후 keyless v2/rates의 USD→KRW/JPY/CNY/TWD 실제4개 행을 파싱했다. 운영 API는 /api/exchange-rates에서 조회200, USD1을 포함한5개 통화와 검증된 DTO만 제공한다. 실제 제공일이 KRW/JPY/CNY2026-11-19,TWD2026-11-18로 달라 날짜 범위를 그대로 보인다. 실시간 거래/체결 환율이나 오늘의 모든 통화 동시 고시라고 주장하지 않는다. API키 설정은 추가로 필요 없으며 임의 환율/개발 fixture를 운영에 사용하지 않았다.

수치는 유리수 BigInt 교차환산·half-up 단가 반올림(KRW/JPY0,USD/CNY/TWD2자리) 후 수량을 곱해 합산한다. 매우 큰 중간값·0원 원자료·소수 경계·다른 통화 교차환산을 검증했다. 공개 원가격 스키마를 넓히지 않고 장바구니 계산 중간값만128자리까지 허용한다. 다른 통화의 원금액을 직접 더하거나 가격/환율/예약 URL을 localStorage에 저장하지 않는다.

서버는 고정 HTTPS 소스·리디렉션 차단·8초/16KiB 한계,1시간 메모리 캐시/동시요청 통합/실패60초 재시도,최대24시간 마지막 성공 캐시(오래된 환율 표기)를 적용한다. 누락/중복/음수/0/미래/7일 초과/과대/손상 응답과 임의 URL 쿼리는 거부한다. 브라우저는 취소/이전 응답 차단·시간초과·1시간 재조회·재시도를 제공한다. 언어는 통화 기본값이며 국적을 판정하지 않는다.

실패와 수정: 최초 E2E에서3가지 시나리오×3화면의9개가 실패했다. 전역 환율 안내 role=status가 기존 맛집 검색 상태와 중복돼6개가 실패해 aria-live=polite로 안내를 유지하면서 역할 충돌을 해소했다. 신규 환산 테스트3개는 역순으로 저장되는 장바구니의 첫 항목(가격 없음)을 증량하고 금액 변화를 기대한 테스트 선택 오류였으며 가격이 있는 원본 offer ID를 명시해 고쳤다. 기존 검사를 완화/삭제하지 않았다. 최초 dist smoke는 백그라운드 시작 직후 요청해 ECONNREFUSED였고 준비 후 같은 산출물로 재검증해 성공했다. 기존 SQLite experimental·Zod PURE·Playwright 색상 경고는 비차단 경고다.

실제 dist smoke: localhost3001·내부4320·기존 공개 HTTPS에서 health/메인/cart?locale=ja/saved?locale=zh-TW/환율 API/공개 상품 API 정상,비공개 .env/config JSON404를 확인했다. 결과는 var/imports/exchange-production-smoke-2026-11-19.json이다. 실제10USD 표시는 당시 KRW13334/JPY1594/CNY66.62/TWD329.28,영어USD10으로 검증했다. 기존 공개 터널을 유지하며 PC/프로세스에 의존하는 임시 미리보기다. 신규 사이트 채널 승인·상시 호스팅·실시간 상품 가격 수집은 이 결과에 포함하지 않는다.

최종 검증 표·시연 캡처는 아래에 기록한다.

추가 검증:2차 E2E는119/120 통과했다. 모바일 새로고침 직후 의도된 원통화 로딩 상태(2개 합계)에서 단일 합계를 바로 검사해 strict selector가 실패한 타이밍 문제였다. 오류 캡처 시점에는 이미 환산 합계42000으로 정상 전환돼 있었으며 새로고침 후 환율 출처가 표시되고 합계가1개가 될 때까지 기다린 뒤 정확한 금액을 검사하도록 수정했다. 임의 대기나 재시도로 실패를 무시하지 않고 준비 상태를 검증한다.


| 최종 검증 | 결과 |
| --- | --- |
| npm.cmd run lint | 종료0 |
| npm.cmd run typecheck | 종료0,workspaces 및 tools strict |
| npm.cmd run test -- --run | 종료0,21파일314개(기존297+환율17) |
| npm.cmd run check:providers | 종료0,86소스 파일 |
| npm.cmd run build | 종료0,domain→server→web166모듈 |
| npm.cmd run test:e2e -- --reporter=line | 최종 종료0,120개 전체(기존111+환율9),360/768/1280px,2.1분 |
| dist production start/실제 환율 smoke | 종료0,localhost3001·4320·공개HTTPS,공개상품302 유지 |
| 공개 최신 bundle/비밀값 검사 | 종료0,index-C5Xgh789.js와CSS200,환율 코드 포함,실제 .env 비밀값 노출0 |

단위/통합/E2E의 환율·가격 수치는 fixture/대역이며 외부 이미지도 대역이다. 실제 keyless API 연동과 production smoke는 별도 실제 요청이며 가격/제휴 URL을 수집·갱신한 검사가 아니다. 실제 제휴 이동·결제/유료 API 호출·키 변경·공개 채널 신규 신청은 수행하지 않았다. 브라우저 검사는5개 언어의 카드/상세/찜/장바구니·통화 혼합 교차환산·수량·미확인 제외·새로고침/언어 전환·느린 환율 응답·오류/재시도와 기존 전체 기능을 포함한다.

시연: [모바일](screenshots/exchange-mobile-2026-11-19.png), [태블릿](screenshots/exchange-tablet-2026-11-19.png), [PC](screenshots/exchange-desktop-2026-11-19.png). 모바일/PC 이미지를 직접 열어 원가격과 환산가·수량·참고 합계·안내 영역과 가로 넘침 없음을 확인했다. 단색 상품 사진은 검증용 대역이며 운영 사진을 대체하지 않았다. 실제 bundle 확인 결과는 var/imports/exchange-bundle-smoke-2026-11-19.json이다.

현재 공개 미리보기 https://fin-precisely-lexmark-dynamic.trycloudflare.com 과 http://localhost:3001 에 새 산출물을 반영했다. 기존 브라우저는 새로고침 후 새 코드가 적용된다. 환산은 참고 표시이며 판매처의 기존 발급 예약 링크/외부 통화·수수료·가격을 변경하지 않는다. 주차/음식점 원문 요금의 자동 환산·실제 환전/결제·AI/예산 엔진은 범위 밖이다.


## 2026-11-19 콘텐츠 다국어 전수 수정

원인·보완 수·필드 범위·준비 번역 서비스와 미검수 상태·사진 원본 확인은 [검수 보고서](localization-review-2026-11-19.md)를 따른다. 상품302·관광지220·맛집538의5개 언어 주요 표시 필드 검사0건 오류를 확인했다. 기계 번역은 별도 표기하며 원문 보기/원본 DTO와 주차 원문은 유지한다.

변경: config/catalog/{content-translations,offers}.json; 서버 config/{localization,offers}.ts,services/{guides,destinations,offers}.ts,index.ts; domain/{guides,destinations}.ts; web Offer.tsx,PublicGuides.tsx,Destinations.tsx,i18n/localization.ts; scripts/check-localization.ts; tests/integration/content-localization.test.ts,tests/e2e/content-localization.spec.ts; package.json의 오프라인 검수 명령과 관련 명세/운영/AGENTS. 기존 수정 파일과 사용자 작업을 보존했다. npm 의존성/lockfile/.env·공공 원본/DB·상품 URL/가격/관찰일·사진은 변경하지 않았다. 원본 상품303/공개302, 신규 포털 수집0/제휴 클릭0/예약·결제0/유료 API0이다.

준비 과정의 긴 URL/섞인 한글/기하 문자 때문에31개 번역 단위를 보류해 발행하지 않았다. 긴 문장을 분할하고 기존 외국어 본문은 한글 조각만 보완해3544개 전체가 검증된 후 원자 게시했다. 성공 캐시를 보존하고 운영 트래픽에 번역 제공처를 연결하지 않았다. 최초 단위 실행은 번역 데이터가 아직 발행되기 전이라3개 파일 읽기 검사가 실패했으며 데이터 완성 후 전체321개 통과를 확인했다. 모달 effect의 객체 의존성 lint 경고는 실제 사용하는 상품 ID에 의존하도록 고쳐0경고를 유지했다.

후속 질문의 사진 누락47건은 실제 음식점 API2회로 전부 사진/썸네일 URL 없음이 확인됐다. 주소가 있는3개 이미지 표본은HTTP200이었다. 원본 사진 미제공과 파일 손상/네트워크 실패를 구분했고 사진을 임의 교체하지 않았다.

최종 검증·시연과 서버 상태는 아래에 기록한다.


| 最終 검증 | 결과 |
| --- | --- |
| npm.cmd run lint | 종료0,최종 테스트 수정 후 재검사 포함 |
| npm.cmd run typecheck | 종료0,모든 workspaces/tools strict |
| npm.cmd run test -- --run | 종료0,22파일321개(기존314+신규7) |
| npm.cmd run check:providers | 종료0,88소스 파일 |
| npm.cmd run data:localization:check | 종료0,5개 언어×상품302/관광지220/음식점538,주요 표시 필드 오류0 |
| npm.cmd run build | 종료0,domain→server→web167모듈 |
| 변경 E2E 집중 검사 | 종료0,6개/15초,기존 fallback 검증의 변경된 동작과 이전 DTO 상세 재조회 |
| npm.cmd run test:e2e -- --reporter=line | 최종 종료0,126개 전체/2.3분,360/768/1280px |
| dist production start smoke | 종료0,localhost3001/4320 재시작 및 공개 HTTPS4개 외국어 API/페이지 확인 |

최초 E2E는120통과/6실패였다.3개는 한국어 요청에서 일본어 원문 fallback을 기대한 과거 검증이 이제 실제 한국어 번역을 받는 정상 변경과 충돌한 것이므로 번역 상태 machine/요청 locale/연관 상품 검증으로 갱신했다. 원문이 바뀌거나 번역이 없는 경우의 fallback 검사 자체는 단위/통합 테스트에 유지한다. 나머지3개는 로딩 중 pointer-events:none인 기존 카드에 클릭을 강제하려던 새 테스트 시나리오가 불가능한 것이었다. 강제 클릭이나 타임아웃 증대 없이 실제 이전 언어 DTO를 대역으로 반환해 현재 언어 상세 API의 재조회가 정상 동작하는지 검사하도록 고쳤다. 집중6개 및 전체126개를 통과했다. 검사를 끄거나 실패를 숨기지 않았다.

실제 서버 smoke는 신규 번들 index-U9h2Ixnk.js와4개 외국어 상품/관광지/음식점 응답200,목록538,직접 상세/장바구니 경로200,비공개 .env/번역 JSON404,실제 .env 비밀값 노출0을 확인했다. 기존 임시 터널은 Unauthorized:Tunnel not found 및 DNS 소멸로 만료됐으므로 새HTTP/2 터널로 전환했다. 상시 호스팅·신규 제휴 채널 승인은 아니다. 결과는 var/imports/localization-production-smoke-2026-11-19.json이다. 전수 결과는 [기계 판독 검수 결과](localization-audit-2026-11-19.json)다.

시연: [모바일](screenshots/localized-food-mobile-2026-11-19.png), [태블릿](screenshots/localized-food-tablet-2026-11-19.png), [PC](screenshots/localized-food-desktop-2026-11-19.png). 모바일/PC를 직접 열어 번체 표시·기계 번역 안내·접힌 원문 이름·없는 상세 정보의 미제공 표시·가로 넘침 없음을 확인했다. 단색 사진은 E2E 대역이며 실제 사진 교체가 아니다. 브라우저 검사의 환율/외부 이미지/이전 언어 DTO는 대역이고 실제 부산 음식점 API사진 대조2회와 production HTTPS검사는 별도 실연동이다.

현재 공개 주소: https://wing-convenient-compound-checks.trycloudflare.com . 로컬 주소 http://localhost:3001 도 최신 산출물이다.


## 2026-11-19 사진 없는 중복 음식점24건 제외

사용자가 지시한 사진 있는/없는 중복 쌍 중 사진 없는24개만 공개 제외했다. 원본 고유 ID538개/사진 없는47개는 원본 파일에 보존하고 공개514개/사진 있는491개/사진 없는 독립23개를 유지한다. 사진 있는 항목끼리의 중복 가능성은 이번에 삭제하지 않았다. 이름이 같은 별도 무궁화1591과1230을 모두 유지한다. ID24쌍·원문 주소 충돌과 전화/좌표 대조는 [검수 보고서](food-dedup-review-2026-11-19.md)를 따른다.

변경 파일: apps/server/src/config/food-visibility.ts,config/catalog/food-visibility.json,services/guides.ts,index.ts; scripts/check-localization.ts; tests/integration/{food-visibility,content-localization}.test.ts,tests/e2e/food-visibility.spec.ts; docs/localization-audit-2026-11-19.json 및 intent/spec/plan/catalog-plan/operations/검수 보고서/proof/AGENTS/README/시연. 원본 공공 JSON·DB·내부 테마 fingerprint·기존 사용자 파일·사진·가격·제휴 URL과 .env/의존성/lockfile은 변경하지 않았다. 공개 상품302/관광지220은 유지한다. 포털 수집/새 공공 API/실제 제휴 이동·예약·결제·유료 API/번역 서비스 호출0이다.

목록의 페이지 계산 전 제외하고 상세에서도404를 반환해 한국어 fallback으로 되살리지 않는다. 같은 숫자의 추천여행 ID에는 적용하지 않는다. 기존 찜의 삭제된 ID를 자동 삭제/재매핑하지 않고 저장 이름과 공개 확인 불가 상태를 유지한다. 설정은 source fingerprint·사진 상태·존재/중복/self/chain을 검증하므로 원본이나 사진이 바뀌면 재검수를 요구한다. 자동 유사도 병합이나 현장 확인 완료가 아니다.

| 검증 명령 | 결과 |
| --- | --- |
| npm.cmd run lint | 종료0 |
| npm.cmd run typecheck | 종료0,workspace/tools strict |
| npm.cmd run test -- --run | 종료0,23파일328개(기존321+신규7) |
| npm.cmd run check:providers | 종료0,89소스 파일 |
| npm.cmd run data:localization:check | 종료0,5개 언어의 현재 공개 음식점514개/주요 표시 필드 오류0 |
| npm.cmd run build | 종료0,domain→server→web167모듈 |
| npm.cmd run test:e2e -- --reporter=line | 종료0,132개 전체(기존126+신규6),360/768/1280px,2.4분 |
| dist production start smoke | 종료0,localhost3001/4320 재시작 및 기존 공개 HTTPS확인 |

이번 구현의 단위/브라우저 검사는 첫 전체 실행부터 통과했다. 오류를 숨기거나 검사를 비활성화하지 않았다. 기존 SQLite experimental·Zod PURE·색상 환경 경고는 비차단 경고다. 단위/통합에서24개×5개 언어 상세 차단/유지 사진,목록514/사진 없음23,같은 이름 다른지점 보호,다른 서비스 보존,새 사진·원문 변경의 재검수,원본 객체 불변,서버404를 검증했다. E2E는 기장손칼국수 검색1건/사진 있는1817 유지·새로고침·제외1541 오류 안내·독립1591 유지·기존 찜 보존을 검증한다.

실제 공개 API에서5개 언어 모두 목록514/기장손칼국수 검색1건(ID1817·사진 URL있음)/제외1541의404/독립 무궁화1591의 유지와 사진 없음,화면200,비공개 .env/검수 JSON404를 확인했다. 결과는 var/imports/food-dedup-production-smoke-2026-11-19.json이다. 실제 원격 사진 파일의 전체 가용성·현재 영업/주소/좌표의 현장 확인을 의미하지 않는다. 브라우저의 외부 이미지는 대역이며 실제 부산 API나 외부 예약을 반복하지 않았다.

시연: [모바일](screenshots/food-deduplicated-mobile-2026-11-19.png), [태블릿](screenshots/food-deduplicated-tablet-2026-11-19.png), [PC](screenshots/food-deduplicated-desktop-2026-11-19.png). 모바일/PC 캡처를 직접 열어 사진 있는 유지 ID의 단일 상세·정보·가로 넘침 없음을 확인했다. 단색 사진은 검증 대역으로 실제 사진을 대체하지 않았다.

반영된 공개 주소: https://wing-convenient-compound-checks.trycloudflare.com . 로컬 http://localhost:3001 도 최신 산출물이며 PC/터널 프로세스에 의존하는 미리보기다.


## 2026-11-23 제휴 링크 우선순위·조건부 한국어 예약

### 변경과 데이터 결과

- 설정 우선순위: 클룩(PROVIDER_B,10) → 트립닷컴(PROVIDER_A,20) → 아고다(PROVIDER_D,30). 마이리얼트립(PROVIDER_C,40)은4가지 증빙을 모두 요구하는 조건부 정책이다. 이름/도메인/추적 값은 기존 config 경계에 두고 서비스·컴포넌트에 업체별 분기를 넣지 않았다.
- 원본303개를 보존했다. 기존 비활성1개와 조건 미확인185개를 공개 제외하여 공개 예약 링크117개가 남는다. 확인한 동일 숙소4묶음은 메인에서 우선 링크1개씩 선택해113개 대표 상품을 표시한다. 메인 숙소21개다. 검색/상세에는 유효한 대체 판매처를 유지하며, 직접 판매처 필터를 고르면 해당 판매처 상품을 볼 수 있다.
-4묶음은 그랜드 조선 부산/아스티 부산역/롯데호텔 부산/파라다이스 부산이다. 원본 ID·제목·판매처·출처 URL을 묶음 근거에 고정하고 변경 시 재검수를 요구한다. 서로 다른 투어·옵션·숙소 지점은 이름 유사도로 합치지 않는다. 객실·날짜·인원·가격의 동일성을 주장하지 않는다.
- 마이리얼트립185개에는 한국인 가이드/외국인 참여/통역사/해외카드의 공동 증빙이 없으므로 공개 링크를 제외했다. 실제 해당 조건 확인0개, 운영 예약 배지0개다. 조건을 모두 확인한 미래 상품만 이미지 오른쪽 위에5개 언어 예약 안내를 표시한다. 증빙은 신원·기간·허용 출처를 검증하고 매 요청에서 만료를 다시 확인한다. 증빙 원문은 DTO에 넣지 않는다.
- 제외 상품의 직접 API는404이며 디렉터리 우회 링크도 차단한다. 기존 찜/장바구니는 보존하되 예전 URL을 다시 노출하지 않는다. 상세창은 최신 상품 조회 성공 뒤에만 예약 링크를 표시한다. 비동기 상세창 전환 후 닫을 때 최초 실행 버튼으로 초점을 복구한다.

상세 근거: [제휴 노출 검수](affiliate-presentation-review-2026-11-23.md).

### 변경 파일

- config/catalog/offers.json: 중립 판매처 순위·조건 정책·검수된 숙소4묶음. 기존 원본 링크/가격/사진을 바꾸지 않았다.
- packages/domain/src/offers.ts: home/catalog 조회 계약과 공개 예약 안내 코드.
- apps/server/src/config/offers.ts, apps/server/src/services/offers.ts: 증빙/그룹 스키마·정확한 원본 검증·전체 노출 경로 제한·순위와 대표 선택.
- apps/web/src/App.tsx, Offer.tsx, BookingNotice.tsx, styles/global.css: 메인 조회·조건 배지·실패 시 이전 링크 차단·초점 복원.
- tests/integration/offer-presentation.test.ts, tests/e2e/offer-presentation.spec.ts: 신규10개 단위/통합과9개 반응형 브라우저 시나리오. 기존 offers/localization/content-localization/destination-search/destinations/foundation/exchange 검사는 새로운 공개 범위를 반영했다.
- AGENTS.md, README.md, docs/intent.md, spec.md, plan.md, catalog-plan.md, operations.md와 위 검수 문서: 최신 정책/복구 방법. docs/localization-audit-2026-11-19.json은 현재 공개117/220/514 기준으로 재계산했다.
- .env 기존 값·공공 JSON/DB·제휴 발급 URL·상품 원가격·원본 사진·lockfile을 이번 작업에서 변경하지 않았다. 다른 이전 작업 변경은 그대로 보존했다.

### 최종 검증

| 명령 | 결과 |
| --- | --- |
| npm.cmd run lint | 종료0 |
| npm.cmd run typecheck | 종료0 |
| npm.cmd run test -- --run | 종료0,24파일338개 전체 통과 |
| npm.cmd run check:providers | 종료0,90소스 파일 통과 |
| npm.cmd run data:localization:check | 종료0,5개 언어별 상품117/관광지220/음식점514,오류0 |
| npm.cmd run build | 종료0,domain → server → web,168모듈 |
| npm.cmd run test:e2e -- --reporter=line | 종료0,141개 전체 통과,360/768/1280px,1.5분 |
| npm.cmd run test:e2e -- tests/e2e/offer-presentation.spec.ts --reporter=line | 종료0,9개 통과,11.1초; 배지가 보이는 카드 영역으로 캡처 보완 |
| dist start smoke | localhost3001/preview4320 최신 산출물 시작·health200;5개 언어/117링크/113대표/제한 상품404/대체 상세200/비공개 파일404 확인 |

단위 검사는 설정만으로 순위 변경,3단계 대체 순위,원가격/링크 신원 보존,명시 판매처 필터,변경된 그룹 거부,4조건/ID/출처/확인일/유효기한 검증,실행 중 증빙 만료와404를 확인한다. 브라우저는 메인 중복 제거·재로딩·5개 언어 배지 위치/가로 넘침·이전 상세 URL 차단과 기존 저장/장바구니/환율/다국어/음식점 기능을 확인한다.

### 실패와 수정

초기 단위 검사7개는 이전302개 공개 범위/4개 판매처를 전제로 했거나 이제 제외된 상품을 분류 오류 fixture로 사용했다. 실제 공개 범위와 활성 fixture로 수정했다. 첫 전체 E2E는12개가 실패했다: 관련 관광지25→13,숙소 대표20 예상→21,첫 페이지 원통화KRW 예상→USD 변경과 상세창 비동기 전환 시 초점 복원 회귀였다. 데이터 기반 기대값을 고치고 초점은 상위 상세창에서 최초 버튼을 보관·복원하도록 수정했다. 다음 검사에서 남은3개는 관련상품 필터 해제 뒤 범어사 원문 검색이 인근 설명 포함5개를 반환하는 정상 결과를1개로 가정했다. 기존 다른 검색 회복 테스트와 동일한 원문 검색 범위5개로 고친 뒤 전체141개가 통과했다. 검사를 끄거나 오류를 숨기지 않았다.

로컬 편집/검증 보조 명령에서 Python 경로 없음,JavaScript 문자열/메서드 오타,CRLF 일치 실패와 require/top-level await 혼용이 있었다. Node 사용/정확한 메서드/개행 정규화/명시적 ESM 실행으로 수정했다. 새 공개 주소의 첫 확인은 응답 검증/기록 뒤 강제 process.exit가 Windows Node 종료 assert를 일으켜 자연 종료로 다시 검사했다. 기존 임시 공개 주소는 fetch 실패하여 HTTP/2 터널을 새로 연결했다. SQLite experimental/Zod PURE/색상 환경 알림은 빌드·검사를 막지 않는 기존 경고다.

### 실제·대역·미실행

운영 데이터의 조건부 배지는0개다. 양성 배지/유효 증빙/테스트용 중간 판매처는 테스트 전용이며 운영 상품/검수 완료로 발행하지 않았다. 공개 상품 추가0,신규 제휴 URL 발급0,실제 제휴 클릭/예약/결제0,유료 AI/API 호출0이다. 공식 공개 상품 페이지2개를 읽으려 했고1개는 조회 실패했다. 영어 진행·외국인 참여만으로4조건 충족이나 해외카드 지원을 보장하지 않았다. 신규 채널 승인/모든 OTA 전체 재고/실시간 가격·재고 확인은 수행하지 않았다. 외부 이미지/예약 페이지의 E2E는 대역이다.

캡처는 조건부 배지의 테스트 전용 양성 시연: [모바일](screenshots/booking-notice-mobile-2026-11-23.png), [태블릿](screenshots/booking-notice-tablet-2026-11-23.png), [PC](screenshots/booking-notice-desktop-2026-11-23.png). 모바일/PC 이미지를 직접 열어 오른쪽 위 배지와 찜 버튼이 겹치지 않음을 확인했다. 단색 상품 이미지는 대역이며 실제 운영 상품 사진을 교체하지 않았다.

터미널 상세 로그: var/imports/affiliate-{lint,typecheck,tests,providers,localization,e2e,badge-e2e}-20261123.log. 실제 HTTP 결과: var/imports/affiliate-production-smoke-2026-11-23.json. 공개 연결 확인 결과는 아래 최종 반영 기록을 따른다.

최종 공개 반영: https://restoration-harper-considerations-choir.trycloudflare.com . localhost3001/preview4320/공개 HTTPS3개 서버 모두5개 언어 및 위 HTTP 검증을 통과했고 자연 종료0을 확인했다. 기존 임시 URL은 새 주소로 교체했다. PC·터널 프로세스에 의존하는 임시 미리보기이며 영구 호스팅/신규 제휴 사이트 승인을 의미하지 않는다.


## 2026-11-23 조건부 예약 상품 공식 전체 재검수

후속 요청에 따라 마이리얼트립 기존185개 상품의 공식 상세 URL을 직접 수집했다. 가이드 관련46개를 먼저 확인하고 나머지139개까지 확장했다.185개 모두HTTP200이고 본상품 쿼리와 providerId/externalId 신원이 일치한다(체험/투어182,패키지3; pkg- namespace 유지). 함께 본 상품/광고/후기 내용은 본상품 조건 증빙에서 제외했다. 자체 본문 구조와 주요 외국인 대상8개 후보 안내를 대조했다. 모든 이미지 속 문구·모든 선택 옵션·개인 문의까지 검증한 것은 아니다.

해외카드는 공식 도움말에서3DS 인증,VISA/Mastercard/JCB/UnionPay 및 발급사/BIN 승인 제한을 확인했다. 한국인 가이드 진행/외국인 참가/통역 제공까지4조건을 모두 확인한 상품은0개다. 운영 bookingEligibility에 미확인 값을 추가하지 않았고 재노출0개/실제 배지0개,기존 공개117/메인113을 유지한다. 조건 미확인은 실제 이용 불가를 뜻하지 않는다. 회사 소재지나 한국어·외국어 진행으로 가이드 국적/통역사 동반을 추정하지 않았다.

변경 파일은 docs/provider-c-eligibility-review-2026-11-23.md(주요 후보·조건별 근거·추가 확인 필요 사항),docs/booking-eligibility-audit-2026-11-23.json(185개 ID/출처/확인일/원문 SHA-256/보류 결정),docs/affiliate-presentation-review-2026-11-23.md(최신 재검수 링크),이 proof다. 검수 JSON은 공개 상품 설정으로 불러오지 않는다. 코드/기존 상품/URL/사진/가격/.env/lockfile/DB는 이번 작업에서 변경하지 않았다. 실제 예약 URL 방문/결제/제휴 발급/파트너 메시지 전송은0건이다.

검증: 전체 수집 종료0(185/185),원문 SHA-256과 본상품 ID 대조 종료0(불일치0),기존 실제 설정 기반 서비스 조회 종료0(제한185개 상세 전부null/공개117/메인113),npm.cmd run test -- --run tests/integration/offer-presentation.test.ts 종료0(10개 통과). 감사 기록의185개 유일성/상태/보류 결정과 문서5개 상대 참조를 검사했다. 결과 로그는 var/imports/provider-c-eligibility-20261123/verification.log,원문 HTML/수집 색인은 같은 디렉터리다.

실패/복구: 검색 웹 리더가 일부 상품을 읽지 못했으나 직접 공식 HTTP로185개를 확보했다. 공식 결제 도움말의 직접 HTTP 접근은403이어서 최초 보조 감사 명령의200기대 검사가 실패했고 Windows Node 종료 assert도 발생했다. 공식 웹 리더에서는 해당 본문을 읽을 수 있어 접근 방법을 명시해 기록했다.403을200으로 바꾸지 않았으며,검증 가능한 상품 신원/파일 해시와 현재 서비스 차단 검사는 분리하여 종료0으로 확인했다.

미실행: AGENTS.md의 문서만 변경 시 구조/참조 검증 규칙에 따라 lint/typecheck/전체 테스트/전체 E2E/build와서버 재시작을 반복하지 않았다. 이번에는 실제 복원/배지 변경이 없어 신규 화면 캡처도 만들지 않았다. 이전 대역 배지를 실제 조건 확인의 근거로 쓰지 않았다. 실제 카드 결제/판매자 문의/현장·사람 승인은 수행하지 않았다.

[재검수 보고서](provider-c-eligibility-review-2026-11-23.md),[185개 상품 감사 기록](booking-eligibility-audit-2026-11-23.json).


## 2026-11-23 KKday 부산 상품285개 추가

### 적용/검수 결과

KKpartners 로그인 채널의 부산 목록/상품12213 전용 링크 발급을 직접 확인했다. 포털이 안내한 선택 CID 추적 규칙으로 기존 원본 URL의 제휴 링크를 구성했다. 실제 발급1개는 portal-generated,나머지284개는 approved-template로 구분한다. 임의 추적 값/단축 URL을 만들지 않았다. 새 계약 동의/사이트 채널 신청·키 발급·예약/결제·메시지 전송은 수행하지 않았다. websiteApproval=unverified를 유지한다.

5개 언어×6개 상위 부산 범주의 고유136페이지를 수집했다. 재시도1회 포함137개 캡처/1,221개 카드에서290개 원본 ID로 정규화하고285개를 추가했다.5개는 지역 불일치·범위 불명확·상담용으로 보류했다. 기존 상품303개와 원본 미검증185개 제외를 보존하며 현재 raw588/public402/home398이다. 원본 상품 ID를 언어별로 병합하고,다른 판매 옵션/다른 판매처를 제목 유사도로 합치지 않았다. 동일 숙소4묶음의 기존 우선 대표도 유지한다.

신규 구분: 관광132/스파22/요트9/체험45/사진7/음식10/교통24/패키지8/티켓28. 범위: 부산 내203/부산 출발26/부산 도착9/지역 복합47. 관찰 참고가279/가격 미확인6,명시 무료 가격9개다. 미확인은0으로 넣지 않았다. 상품별 공식 사진 URL285개가 서로 다르며,각 원본 상품 카드/상세와의 연결을 보존한다.5개의 원어 지연 로딩 사진은 같은 상품의 다른 언어 카드에서 보완하고36659는 공식 상세 첫 이미지를 확인했다. 모든 사진의 시각적 고유성/전체 CDN 가용성을 보장하는 수치는 아니다.

[검수 보고서](provider-e-catalog-review-2026-11-23.md)에 범주/언어별 수·5개 보류 ID·상세 지역 확인·범위/옵션 제한·사진/번역 근거를 기록했다. 131061의 자체 설명에서 확인한4개 명소에만 투어 관계를 추가했다. 스카이캡슐 포함 여부가 B/C/W 옵션별로 다름을 기록했다.

### 변경 파일

config/catalog/offers.json: PROVIDER_E/순위35/추적·호스트·ID 패턴,285개 원본 ID·언어별 URL·가격·이미지·정적 제목·원문 해시. provider-e-source.json: 공식 원본/채널 근거/제외/현재 발행 대조. provider-e-editorial-titles.json: 누락/미번역의 원문 고정 편집 요약(machine-unreviewed). product-image-sources.json:285개 정확한 상품별 사진 근거. destination-relations.json과destinations.json:확인된 투어1개×명소4곳. config/provider-boundaries.json:신규 상호 경계 검사.

apps/server/src/config/offers.ts:원문 해시/다국어 URL·원본 언어/공식 카드 사진 계약. apps/server/src/services/offers.ts:설정 기반 원본 ID/CID/다국어 목적지 검증·동일한 언어의 사진 출처 링크. packages/domain/src/offers.ts:최소 공개 bookingLocale. apps/web/src/BookingLanguage.tsx,Offer.tsx,styles/global.css:관찰한 원어 예약 페이지가 없을 때 실제 예약 페이지 언어 안내. 업체별 UI/비즈니스 분기는 추가하지 않았다.

신규 tests/integration/provider-extension.test.ts의7개 검사와 tests/e2e/provider-extension.spec.ts의9개 반응형 검사. 기존 검사는402개 공개/398개 메인·명소 관계17개·실제 전체 페이지와 언어별 링크에 맞췄다. docs/intent/spec/plan/catalog-plan/operations,AGENTS.md,README.md와 다국어 감사 결과를 갱신했다. 기존 .env·lockfile·공공 DB/원본·비공개 API 값은 이번 작업에서 변경하지 않았다. 기존 사용자의 다른 변경은 보존했다.

### 최종 실행 결과

| 명령 | 결과 |
| --- | --- |
| npm.cmd run lint | 종료0 |
| npm.cmd run typecheck | 종료0 |
| npm.cmd run test -- --run | 종료0,25파일345개(기존338+신규7) 통과 |
| npm.cmd run check:providers | 종료0,91소스 파일 |
| npm.cmd run data:localization:check | 종료0,5개 언어별 상품402/명소220/음식점514,오류0 |
| npm.cmd run build | 종료0,domain→server→web169모듈 |
| npm.cmd run test:e2e -- --reporter=line | 종료0,150개 전체(기존141+신규9),360/768/1280px,1.7분 |
| dist start smoke | 종료0,localhost3001/preview4320/공개 HTTPS3개에서5개 언어×285개 전부 확인 |

원본 언어·제목 변경 시 번역 재검수,다른 상품 ID/잘못된 호스트/잘못된·중복·누락 CID의 거부,원어 미제공 URL 보존과 실제 예약 언어,제외 상품404,현재 DTO에 소스/증빙/개인 설정 미노출을 검증했다. 브라우저에서는 필터/페이지/재로딩·5개 언어 상세·이미지 연결/스폰서 링크·기존 장바구니/찜/환율/공공 정보도 통과했다. 실제 제휴 링크를 클릭하거나 결제하지 않았다.

실제 API에서 새 공급자285개,전체402/메인398,4개 판매처 순서,각 상품의 원본 ID·CID와 실제 언어별 href·사진 출처 href,명소 관계,보류5개/기존 제한 상품404와원어 미제공시 일본어 유지(e-36659)를 확인했다. 비공개 JSON은404이며 HTML Accept의 /.env 응답은 기존 SPA fallback으로 공개 index.html과 완전히 같은 내용임을 확인했다. 실제 .env 값/설정은 노출되지 않았다. 이는 /.env에 대한 HTML 요청까지404였다고 주장하는 결과가 아니다.

실제 CDN 표본3개(e-12213,e-36659,e-131061)는200,image/jpeg 또는image/webp였다. 브라우저 E2E의 외부 이미지/환율 실패는 대역이며 실제 사진285개 전체를 HTTP 검사하거나 실시간 가격/재고를 확인한 것은 아니다. 서버 결과는 var/imports/provider-e-20261123/production-smoke.json,검사 로그는 같은 디렉터리의 lint/typecheck/tests/providers/localization/build/e2e.log다.

### 실패와 수정

일반 HTTP 수집403은 정상 로그인 브라우저 UI로 대체했다. 초기 로딩/페이지 번호만 바뀌는 상태와 재렌더링을 실제 상품 ID·마지막 페이지 수로 검출해 잘못된 중간 캡처는 제외했다. 원어 카드 사진이 비어 있던6개를 같은 상품의 관찰된 사진으로 보완했다. 일반 OS 클립보드 저장은 가상 클립보드와 달라 실패했고 다른 클립보드 내용은 저장하지 않았다. 고정 파일/Origin·CSRF·크기 제한의 임시 loopback 폼으로 옮긴 후 해당 서버를 종료했다.

초기 단위6개 실패는 미번역 한국어2건,고정7페이지 가정,다국어 href와 사진 출처의 불일치였다. 원문 실제 언어·번역/전체 페이지·해당 언어 사진 출처를 수정했다. 다음3개는 서로 다른 언어여도 같은 고유명사 표기가 가능하다는 점을 반영하지 못한 테스트였다. 공식 라운지 미번역도 보완하고 각 언어의 정확한 검수 제목과 대조하도록 수정했다. 이전 build가 새 이미지 근거 enum을 모르는 상태의 E2E 시작 실패는 fresh build 후 해소했다. 첫 전체 E2E147통과/3실패는 새 테스트가 실제 접근성 이름의 화살표를 빠뜨린 것이었고 올바른 이름으로150개 통과했다. 서버 smoke는 브라우저 HTML Accept 유무/기존 SPA fallback의 index 응답을 구분하도록 수정한 후3개 서버 전부 종료0을 확인했다. 검사를 비활성화하거나 시간 제한을 늘리지 않았다.

### 시연과 반영 주소

실제 포털 발급 [캡처](screenshots/kkday-affiliate-link-2026-11-23.jpg)를 직접 열어 상품 원본 URL/CID 발급 결과를 확인했다. 상품 목록 [모바일](screenshots/provider-e-mobile-2026-11-23.png),[태블릿](screenshots/provider-e-tablet-2026-11-23.png),[PC](screenshots/provider-e-desktop-2026-11-23.png)도 저장했고 모바일/PC를 직접 열어285개 필터 결과·카드 정렬·가로 넘침 없음을 확인했다. 단색 사진/환율 실패 안내는 테스트 대역이며 운영 이미지를 변경하지 않았다.

실제 반영: https://restoration-harper-considerations-choir.trycloudflare.com/search?provider=PROVIDER_E&locale=zh-TW . localhost3001도 최신 산출물이다. 공개 주소는 기존 PC/터널 프로세스에 의존하는 임시 미리보기다. 전체 OTA 재고/모든 국적의 가입·결제 성공/신규 채널 승인·영구 호스팅 완료로 보고하지 않는다.


## 2026-11-23 누락·깨진 사진 검수 및 보완

### 변경과 결과

공개 상품402/관광지220/맛집514의 사진을 확인했다. 고유 이미지1,111개를 전체 GET 후 Chromium Image.decode로 실제 검사해1,110개 정상/1개 고장을 확인했다. 상품·관광지에는 이번 검사에서 누락/깨짐이 없었다. 맛집은 누락23개 중 동일 장소의 사용 가능한 공공사진4개를 추가하고 부산명물횟집(1612)의 깨진 사진1개를 교체했다. 원본538/공개514/중복 제외24 유지, 표시 사진 있음495/미확보19다. 미확보19곳의 이름·주소·확인 출처·미적용 사유를 [검수 목록](photo-review-2026-11-23.md)에 모두 기록했고 개별 네트워크/디코딩 결과는 [JSON](photo-audit-2026-11-23.json)에 보존했다. 신규 포털 상품 수집/추가0이며 공개 상품402를 유지했다.

변경 파일: apps/server/src/config/food-photos.ts, config/catalog/food-photo-overrides.json, apps/server/src/index.ts, apps/server/src/services/guides.ts, tests/integration/food-photos.test.ts, tests/e2e/food-photos.spec.ts, AGENTS.md와 위 검수 문서/JSON 및 이 proof·캡처3개. 기존 작업의 다른 수정 파일은 보존했다. .env·package/lockfile·원본 food.json·DB·관광지/상품 사진·번역·테마 지문·음식점 중복 정책은 변경하지 않았다.

사진 연결은 서비스별 ID의 명시 검수5쌍이며 이름/거리 자동 매칭이 아니다. 대상/사진 원본의 전체 언어 지문·원래 URL·제공 ID/사진·데이터셋·라이선스를 검증한 뒤 공개 중복 제외 다음에 표시만 보완한다. 원본이 바뀌면 재검수하며 추천여행의 같은 숫자 ID는 건드리지 않는다. 전화/주소/좌표 표기 차이를 임의 교정하거나 가게ID를 병합하지 않았다. 사진 제공은 부산시 FoodService의 실제 해당 장소 이미지로 한정하고 기존 출처·이용 조건 표기를 유지했다. 검수는 assistant-source-evidence이며 사람·현장 승인과 구별한다.

### 실행한 검증

| 명령/확인 | 결과 |
| --- | --- |
| npm.cmd run lint | 종료0 |
| npm.cmd run typecheck | 종료0 |
| npm.cmd run test -- --run | 종료0,26파일351테스트 통과 |
| npm.cmd run check:providers | 종료0,92소스 통과 |
| npm.cmd run data:localization:check | 종료0,5언어 issues=[] |
| npm.cmd run build | 종료0,domain→server→web,web169모듈 |
| npm.cmd run test:e2e | 종료0,모바일/태블릿/PC153개 통과 |
| dist start smoke | localhost3001/preview4320/기존 공개 터널 모두 종료0 |
| 실제 이미지 GET/디코딩 | 기존1,111주소 중 정상1,110/실패1; 적용 후 연결된1,110고유주소는 전부 정상 확인 주소 |
| 실제 FoodService5언어+공식 상세24곳 | 정상/썸네일 누락 및 공통 기본 이미지 대조,원본 발행/덮어쓰기 없음 |

새 통합 테스트는5개 언어 목록/상세/한국어 fallback의 일관성,514개 공개/19개 미확보,원본 무변경,기존 중복24개404,다른 지점/추천여행 namespace 분리,대상·사진 원본 변경 시 실패,잘못된 사진/원본ID·라이선스·중복설정 거부,최소 DTO를 확인했다. E2E는 언어별 목록/상세/새로고침/이미지 실패 안내와 반응형 가로 넘침을 검사했다. 기존 찜·장바구니·환율·제휴 링크 회귀 검증도 전체 통과했다.

실행 로그와 작업 원본은 로컬 var/imports/photo-review-20261123/{typecheck,tests,providers,localization,build,e2e}.log 및 image-audit.json,food-api-current-*.json,official-page-audit.json,source-*.html,production-smoke.json,screenshots.json에 있다. lint는 터미널 종료0으로 확인했다. 이미지 네트워크 요약/전체 결과는 Git 포함 docs/photo-audit-2026-11-23.json에서도 볼 수 있다.

### 실제/대역/미실행과 실패 처리

E2E 외부 이미지는 대역이고 예약/제휴 클릭은 테스트 대역이다. 실제 사진 검수는 별도 전체 GET/디코딩이며 부산시 API는 기존 .env 서버 전용 키로 읽기만 했다. 사진 URL이 없던 곳에 공통 기본 이미지/다른 지점/권리 미확인 이미지/생성 이미지를 넣지 않았다. 인터넷 전체 사진 부재나 실시간 영업·재고·예약을 검증한 것으로 보고하지 않는다. 외부 사진의 향후 변경/접근 차단을 보장하지 않는다. 로그인·일정·지도·유료 API·예약/결제는 미실행이며 본 요청 범위가 아니다.

일반 샌드박스의 공식 페이지 요청 실패는 승인된 네트워크 실행으로 재시도해 성공했다. 1612의 정상/썸네일 모두200 HTML임을 별도 확인하여 잘못된 성공 판정을 피했다. 서버 재시작 직후 첫 smoke는 준비 전 fetch failed였고 준비 상태 확인 후3개 주소 전체에서 다시 통과했다. 구현 검사 실패는 없었고 검사 비활성화는 하지 않았다. SQLite 실험 기능 및 의존성 Rollup 주석 경고는 기존 환경의 비차단 경고이며 빌드는 성공했다.

### 실행 서버와 시연 캡처

실제 dist 서버3001/4320을 새 산출물로 교체했다. 각 주소에서 사진5건×5언어=25상세,미확보19건의 null,중복1541의404,비공개 사진 설정404,상품402/관광지220/맛집514와 직접 상세 HTML 진입을 확인했다. 공개 반영 주소: https://restoration-harper-considerations-choir.trycloudflare.com/food/1639?locale=en . 기존 PC/터널에 의존하는 임시 미리보기다.

[모바일](screenshots/food-photo-mobile-2026-11-23.png),[태블릿](screenshots/food-photo-tablet-2026-11-23.png),[PC](screenshots/food-photo-desktop-2026-11-23.png) 캡처는 실제 외부 사진(대역 없음)을 표시했다. 모두 이미지1200×545 디코딩과 가로 넘침 없음을 확인했고 모바일/PC를 직접 열어 올바른 광안점 사진·출처 표기·다국어 설명을 확인했다.


## 2026-11-23 외국인 영어 기본 진입·메인 특가 쿠폰

### 변경 및 실제 공개 범위

웹 첫 진입/언어 없는 URL/잘못된 locale은 영어(en)로 열고,명시적 유효 언어와 헤더 선택을 우선한다. HTML lang/title/description도 영어로 바꿨다. 선택 언어는 URL과 홈 브랜드/검색 링크·새로고침/뒤로가기에 유지한다. 기기 언어·국적 자동 추정이나 별도 저장 키는 추가하지 않았다. API의 기존 기본언어 계약은 보존하고 UI가 선택 locale을 보낸다.

메인 추천 명소 앞에 특가·쿠폰3건을5개 언어로 표시한다. 공식 기간·시장/신규회원·최소 결제액/상한·여행일·확인일·쿠폰 복사·공식 조건·검증된 제휴 이동을 제공한다. source 날짜와 짧은 재검수 만료를 구별하며 서버/클라이언트 모두 만료를 제거한다. 현재 재검수 기한은2026-11-26 00:00 Asia/Seoul이다. 클라이언트60초/포커스 복귀 재조회는 로컬 API이며 외부 이벤트 자동 수집은 아니다.

이번 포털 상품 수집/카탈로그 상품 추가0,프로모션 공개3,제공처 보류2사다. 상품402/메인398/관광지220/맛집514 및 기존 사진·중복 제외·찜/장바구니 데이터는 보존했다. 새 아쿠아리움 목적지는 공식 행사에서 확인한 예약 프로모션으로만 연결했고 새 가격/상품 재고를 만들어 등록하지 않았다. 할인액을 가격/환산/장바구니에서 미리 차감하지 않았다. 제공처별 근거·적용 조건·종료/미확인/자격 보류 사유는 [검수 문서](promotion-review-2026-11-23.md)와 [JSON](promotion-review-2026-11-23.json)에 있다.

### 변경 파일

- UI: apps/web/index.html,App.tsx,Promotions.tsx,i18n/{index,locale,promotions}.ts,styles/global.css.
- 계약/서버: packages/domain/src/{index,promotions}.ts,apps/server/src/{app,index}.ts,config/promotions.ts,services/promotions.ts,routes/promotions.ts. services/offers.ts의 기존 validateLink를 공통 검증 함수로 내보내 재사용했다.
- 설정: config/catalog/promotions.json,offers.json의 공식 글로벌 출처 호스트1개 추가. 업체별 분기/상호·도메인/추적 값은 서비스·UI·domain에 넣지 않았다.
- 검증: tests/unit/default-locale.test.ts,tests/integration/promotions.test.ts,tests/e2e/promotions.spec.ts 및 기존 한국어 시나리오 E2E의 명시 locale URL.
- 문서: AGENTS.md,docs/{intent,spec,plan,catalog-plan,proof}.md,프로모션 검수 MD/JSON,화면 캡처4개. .env/lockfile/의존성/원본 공공 DB·스냅샷·번역·테마 자료는 변경하지 않았다.

### 실행 결과

| 명령/확인 | 결과 |
| --- | --- |
| npm.cmd run lint | 종료0 |
| npm.cmd run typecheck | 종료0 |
| npm.cmd run test -- --run | 종료0,28파일369테스트 통과 |
| npm.cmd run check:providers | 종료0,99소스 통과 |
| npm.cmd run data:localization:check | 종료0,5언어 issues=[] |
| npm.cmd run build | 종료0,domain→server→web,173모듈 |
| npm.cmd run test:e2e | 종료0,모바일/태블릿/PC162개 통과 |
| 새 dist 서버 smoke | localhost3001/preview4320/공개 터널 모두 종료0 |

새 테스트는 한국어 브라우저에서도 영어 신규 진입,잘못된 언어 fallback,명시 언어·헤더 변경·새로고침·브랜드 홈·뒤로가기,5개 언어 조건,공식 제공처 호스트/추적·중첩 목적지,상품 정체성/공개 자격,새 중립 제공처 확장,시작 전·종료·보류·재검수 만료 제외,최소 DTO,쿠폰 복사 성공/실패,미갱신 캐시의 만료 제거/재시도,메인 배치와 필터 진입을 확인했다. 기존 찜·장바구니·환율·음식점/관광지·예약 링크 회귀도 통과했다.

로그: var/imports/promotions-20261123/{lint,typecheck,tests,providers,localization,build,e2e}.log. 초기 실패 로그 e2e-first.log도 보존했다. 공식 원문 HTML과 실제 공개 서버/시연 결과는 같은 폴더의 production-smoke.json,screenshots.json과 원문 *.html에 있다(작업 파일은 Git 제외).

### 실패와 수정

첫 빌드의 ProviderIdSchema import 경로를 domain catalog 경계로 바로잡았다. React 렌더 중 Date.now 호출은 lazy state 초기화로 수정해 purity 검사를 통과했다. 문서 저장 스크립트의 CommonJS/ESM 실행 형식 오류는 올바른 실행 형식으로 수정한 뒤 저장했다. 최초 전체 E2E는144통과/18실패였으며 원인은6개 기존 한국어 시나리오×3뷰포트의 언어 없는 추가 URL9개였다. 해당 시나리오가 의도한 한국어를 URL로 명시하고 새 영어 기본 진입 테스트를 유지한 뒤 전체162개가 통과했다. 테스트를 삭제/건너뛰거나 시간 제한을 늘리지 않았다. 기존 SQLite/Rollup 의존성 경고는 비차단이며 빌드 종료0이다.

### 실제·대역·보류 및 서버 반영

공식 행사 원문 검색/HTTP 조회는 실제다. 아쿠아리움 상세 일반 HTTP403과 일부 공식 행사403은 공식 검색 도구의 원문/날짜·실제 연결 ID와 대조했으며 보호를 우회하지 않았다. 아고다 정적 HTML의 오래된 상시 카드,끝난 마이리얼트립 부산 행사/외국인 자격 미확인 항목은 발행하지 않았다. 쿠폰이 모든 국적·계정·옵션에서 결제 적용된다고 주장하지 않는다.

E2E 외부 이미지/제휴 예약은 대역이며 실제 제휴 클릭·예약·결제·쿠폰 발급/소진은 수행하지 않았다. 시연 캡처의 외부 상품 이미지는 대역,특가 카드는 외부 사진 없는 실제 UI다. 실제 공개 API/HTML smoke는 별도이며 /api/promotions의 기본 en·5언어 각3건·공개 상품402/맛집514·검수 설정404를 확인했다. 신규 사이트 채널 승인이나 정식 도메인 배포는 이번 범위가 아니다.

로컬3001과 preview4320을 새 dist로 교체했고 공개 주소 https://restoration-harper-considerations-choir.trycloudflare.com/ 에 반영했다. PC/서버/터널에 의존하는 기존 임시 미리보기다. 한국어 브라우저 설정으로도 실제 첫 URL이 /?locale=en이 된 것을3개 뷰포트에서 확인했다.

[영어 첫 화면](screenshots/home-english-desktop-2026-11-23.png),특가 영역 [모바일](screenshots/home-promotions-mobile-2026-11-23.png)/[태블릿](screenshots/home-promotions-tablet-2026-11-23.png)/[PC](screenshots/home-promotions-desktop-2026-11-23.png)를 저장했다. 모바일/PC를 직접 열어 조건·쿠폰·기한·출처/예약 동작과 가로 넘침 없음을 확인했다.
