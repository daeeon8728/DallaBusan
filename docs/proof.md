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


## Vercel Services 배포 구성 검토

### 범위와 변경 파일

사용자가 제공한 Services 안내에 맞춰 최종 확인 가능한 로컬 구성을 작성했다. 루트의 가상 app 대신 web(apps/web,Vite)와 server(apps/server,Fastify)만 정의했다. /api 및 /api/**는 server,나머지는 web으로 전달하며 API 접두사를 유지한다. 정적 브라우저→동일 출처 공개 /api 구조이므로 서버 간 호출/내부 바인딩은0개다. 빌드/브라우저에 런타임 바인딩 변수를 넣지 않았다.

- 구성: vercel.json,.gitignore,apps/web/vite.config.ts. 서비스별 domain 선행 빌드,SPA 경로,API 전용 JSON/DB 포함과 Node24 런타임을 명시했다.
- 서버: apps/server/src/{app-factory,runtime,app,index}.ts,config/env.ts,db/client.ts. 기존 앱 조립을 보존하고 로컬 listen과 지연 초기화 HTTP 함수를 분리했다. 함수는 VERCEL 변수 유무와 관계없이 공개 SQLite 스냅샷을 읽기 전용으로 열며 DB 생성/마이그레이션을 하지 않는다. 로컬/수집 CLI DB 동작은 유지한다.
- 검사: tests/integration/vercel.test.ts의5개 검사로 그래프/라우팅/SPA/서버 전용 포함/DB 쓰기 거부와 SHA 불변을 확인한다.
- 문서: AGENTS.md,README.md,docs/operations.md,docs/vercel-deployment-2026-11-24.md와 본 기록. 시연은 docs/screenshots/vercel-services-desktop-2026-11-24.png다.

.env,package.json,package-lock.json 내용과 공공 DB·상품·원본/번역·테마 자료는 변경하지 않았다. 포털 신규 수집0건,상품 추가/제외0건이며 기존 공개 상품402/관광지220/음식점514를 유지한다. 전체 OTA 재고/신규 사이트 승인/공개 배포를 수행했다고 주장하지 않는다.

### 명령과 결과

| 명령/확인 | 결과 |
| --- | --- |
| npm.cmd run lint | 종료0 |
| npm.cmd run typecheck | 종료0 |
| npm.cmd run test -- --run | 종료0,29파일374테스트 |
| npm.cmd run check:providers | 종료0,101소스 |
| npm.cmd run data:localization:check | 종료0,issues=[] |
| npm.cmd run build | 종료0,domain→server→web,173모듈 |
| npm.cmd run test:e2e | 종료0,전체162개 |
| 최신 공식 CLI66.6.0 JS vercel dev --local --listen4318 | 두 서비스 감지/API200/영어 첫 화면/맛집5언어 상세 직접 진입,브라우저 오류0 |
| 빌드 HTTP 함수 직접 smoke | 종료0,VERCEL 플래그 없이도 읽기 전용,API200,config/DB/.env/비API 경로404,스냅샷 SHA 불변 |
| dist standalone start smoke | 종료0,API/홈/검색/맛집 직접 진입200,config/DB404. HTML Accept의 /.env는 파일 대신 홈 index와 동일한 HTML200임을 본문 비교 |
| 웹 dist 파일 검사 | 8파일,config/DB/.env 포함0 |

최종 로그는 var/imports/vercel-20261123/{lint,typecheck,tests,providers,localization,build,e2e}.log와 {browser-smoke,function-smoke,dist-smoke,public-artifact}.json에 있다. 원본 DB1044행 읽기와 쓰기 거부는 통합 검사에 포함된다. npm run start로 임시4319에서 실행한 뒤 같은 dist 명령을 자동 smoke로 검증했으며 해당 임시 프로세스는 종료했다. 기존3001/4320과 임시 공개 터널은 이번 변경으로 재시작하지 않았다.

### 실패·수정 및 검증 한계

Vercel CLI66.6.0 네이티브 설치는 Windows VLT 심볼릭 링크 EPERM으로 실패했다. OS 권한 설정은 바꾸지 않았다. 기존64.2.0 JS로 진단한 뒤 Git 제외 var/tools/vercel-cli에 공식 @vercel/cli-support@66.6.0을 테스트용으로 설치했다. Windows 플랫폼 제한 때문에 해당 임시 도구 설치에만 force를 사용했고 프로젝트 의존성/lockfile에는 추가하지 않았다. 공식 schema 자체의 draft 표기와 numeric exclusiveMinimum 불일치로 독립 AJV6 검증이 실패했으므로 이를 통과로 기록하지 않는다. 실제 최신 CLI가 설정을 파싱하고 두 서비스를 실행했다.

초기 app.ts는 named 앱 팩토리여서 CLI가 HTTP 처리기를 찾지 못했다. 팩토리를 보존한 별도 파일과 실제 HTTP 진입점으로 분리했다. 초기 HTTP 처리의 Fastify 준비 전 hooks 오류는 app.ready 이후 전달로 수정했다. 최종 전체 검사를 다시 통과했다. 문서/진단 스크립트 변수 및 모듈 실행 형식 오류는 스크립트를 수정했다. 최초 standalone smoke는 HTML Accept 누락과 /.env의 SPA HTML 응답을404로 가정하여 실패했으며,브라우저 헤더와 본문 비교로 검사 기대를 바로잡았다. 환경 파일 내용 노출로 판정하지 않는다. SQLite 실험/Rollup 주석 경고는 비차단이며 최종 빌드는 종료0이다.

중요: vercel dev --local64/66은 이 저장소에서 config/catalog·data/snapshots·docs 원본 파일을 정적 HTTP200으로 응답했다. 경로 rewrite/Vite fs 제한만으로 로컬 CLI 동작을 차단하지 못했다. 이 검사 서버를 외부 터널에 연결하지 않았고 검증 후 종료했다. 웹 dist에는 해당 파일이 없고 API 함수 자체는404이나,아직 클라우드 Preview 빌드의 파일 포함/라우팅을 검사하지 않았다. 사용자 확인 후 Preview에서 비공개 경로를 재검증하기 전 정식 공개 성공으로 보고하지 않는다.

### 실제·대역·최종 확인 대기

로컬 최신 Vercel CLI/빌드 함수/읽기 전용 공개 스냅샷 응답은 실제다. E2E와 CLI 브라우저의 외부 이미지/예약은 대역이며 실제 예약·결제·반복 제휴 클릭은 없다. 신규 공공 API 수집이나 유료 호출도 없다. 저장된 시연 이미지를 직접 열어 영어 특가 카드·조건·쿠폰 배치를 확인했다.

사용자 제공 안내3번이 서비스 이름·공개 범위·바인딩의 최종 확인을 요청했다. 따라서 web/server 두 이름,/ 및 /api 공개,내부 전용 서비스 없음,바인딩0개를 확인받기 전에는 commit/push/Vercel 프로젝트 연결/환경변수 업로드/배포하지 않는다. 최종 설정 전체와 검토 항목은 docs/vercel-deployment-2026-11-24.md를 따른다.

후속 사용자 지시: 최종 구성 제시 후 push 승인을 받았다. 검증 완료 변경을 DallaBusan/main에 커밋·푸시한다. 이 승인을 Vercel 클라우드 배포/Preview 검증 완료로 해석하지 않는다.


## 2026-11-24 INVALID_RUNTIME 수정

클라우드 오류: Service server has invalid runtime nodejs24.x. 이전 설정에서 Node 함수 산출물의 런타임 버전 문자열을 Services runtime에 직접 넣은 것이 원인이다. 이전 로컬 성공은 클라우드 검증까지 증명하지 못했다.

변경: vercel.json의 services.server.runtime 삭제,Fastify 자동 감지 유지. apps/server/package.json에 루트/.node-version과 같은 engines.node=>=24.14.1 <25를 추가하고 npm.cmd install --package-lock-only --ignore-scripts --offline --no-audit --no-fund(종료0)로 lockfile의 해당 workspace 엔진 메타데이터3줄만 갱신했다. 의존성 버전은 바꾸지 않았다. tests/integration/vercel.test.ts에서 runtime 생략과 서버 Node24/lock 일치 회귀를 확인한다. AGENTS.md와 Vercel 검토 문서의 잘못된 예제도 수정했다.

| 명령/확인 | 결과 |
| --- | --- |
| npm.cmd run lint | 종료0 |
| npm.cmd run typecheck | 종료0 |
| npm.cmd run test -- --run | 종료0,29파일375개 |
| npm.cmd run check:providers | 종료0,101소스 |
| npm.cmd run build | 종료0,173모듈 |
| npm.cmd run test:e2e -- tests/e2e/foundation.spec.ts tests/e2e/public-guides.spec.ts | 종료0,모바일/태블릿/PC36개 |
| 최신 공식 CLI66.6.0 JS vercel dev --local --listen4318 --yes | 종료0,자동 감지 API health/offers/홈/맛집 직접 진입 모두200,작업 후 프로세스 트리 종료 |
| NODE_ENV=test,빌드된 HTTP 함수 smoke | 종료0,API200/비공개 파일404/공개 DB SHA 불변 |
| git diff --check | 공백 오류 없음 |

CLI 실제 실행 근거는 var/imports/vercel-20261123/runtime-fix-cli.{log,json},빌드 HTTP 함수 근거는 같은 폴더 function-smoke.json이다. E2E는 npm run start의 dist를 사용하며 외부 사진/예약은 대역이다. 화면 코드는 변경하지 않아 관련36개만 재검증했고 이전 전체162개 결과와 구분한다. E2E 자동 시연 캡처는 test-results의 catalog-home.png에 있다. 데이터/번역 원본을 바꾸지 않아 수집/현지화 갱신은 재실행하지 않았다. 신규 상품 수집/추가/제외0,기존 공개 상품402/관광지220/음식점514 유지. .env와 DB는 변경하지 않았다.

클라우드 재배포 성공은 아직 미확인이다. 사용자의 push 승인 범위에서 수정 커밋을 같은 DallaBusan/main으로 반영한다. Vercel에서 최신 커밋을 배포한 후 클라우드 빌드/함수 번들과 비공개 경로를 추가 확인해야 한다. 이전 기록의 로컬 CLI 원본 파일 서빙 한계는 이 수정으로 해결했다고 주장하지 않는다.

근거: https://vercel.com/docs/services/config-reference#runtime 및 https://vercel.com/docs/functions/runtimes/node-js/node-js-versions#version-overrides-in-packagejson.


## 2026-11-24 실제 API500 조사 및 수정 진행

사용자 공개 URL https://dallabusan.vercel.app의 HTML200,health/offers/promotions/food API500 FUNCTION_INVOCATION_FAILED를 직접 확인했다. GitHub 상태는 성공이었고 Vercel Overview도 Ready였으나 함수 오류율100%였다. 로그인된 Logs에서 /var/task/app.js의 SyntaxError: Cannot use import statement outside a module을 읽었다. 원인은 빌더가 일반 dist/app.js를 독립 함수 루트로 선택하는 모듈/파일 배치였다. 서비스의 outputDirectory=.와 원본 TypeScript 빌더,저장소 기준 includeFiles로 수정했다. 아래 검증 결과를 추가하며 클라우드 복구 여부와 로컬 패키징 결과를 구분한다.


### 공식 함수 패키징 재현과 회귀 검사

공식 @vercel/backends27.0.0(격리 설치 CLI66.6.0 제공)의 실제 build를 기존 깨끗한 설치 복사본에서 실행하고 NodejsLambda 파일을 독립 임시 디렉터리에 추출했다. 수정 전 handler=app.js,892파일의 패키지는 실행 종료1(ERR_REQUIRE_CYCLE_MODULE)로 실패했다. 클라우드 로그의 SyntaxError와 로컬 예외 이름은 다르며 모듈/루트 배치 실패라는 증거로 구분한다. 수정 후 handler=apps/server/src/app.mjs,825파일의 패키지는 실행 종료0이고 상품402/프로모션3/음식점514 및 health가200이었다. offers.json/promotions.json/공개 SQLite가 함수에 포함된 것도 확인했다. 원본 tsc dist가 남아 있는 상태에서도 outputDirectory=.로 해당 산출물의 자동 선택을 막았다.

실험에서 설치는 앞서 검증한 clean npm ci 결과를 사용하고 builder의 installCommand만 빈 값으로 두어 반복 설치를 생략했다. 빌드 명령/실제 패키징은 실행했다. 수정 전후 모두 Node24 --no-experimental-detect-module 조건으로 독립 패키지를 검사했다. 이는 Windows 검사이며 실제 Linux 클라우드 결과는 별도다. 진단 스크립트/결과는 Git 제외 var/imports/vercel-20261123/backend-packaging.{mjs,json}다.

| 명령 | 결과 |
| --- | --- |
| npm.cmd run lint | 종료0 |
| npm.cmd run typecheck | 종료0 |
| npm.cmd run test -- --run | 종료0,29파일375개 |
| npm.cmd run check:providers | 종료0,101소스 |
| npm.cmd run build | 종료0,173모듈 |
| npm.cmd run test:e2e -- tests/e2e/foundation.spec.ts tests/e2e/promotions.spec.ts | 종료0,모바일/태블릿/PC27개 |

E2E는 npm run start의 dist와 외부 사진/예약 대역을 사용한다. 공식 함수 빌더 smoke는 별도 실제 패키지 실행이다. 검사 스크립트 첫 진단/브라우저 창 위치 오류는 재선택 후 정상 로그 화면을 읽어 복구했다. .env/DB/원본 카탈로그/번역/의존성/lockfile은 변경하지 않았다. 신규 포털 수집/상품 추가·제외0,기존 공개 상품402/관광지220/음식점514 유지. 내부 결제/AI/일정 기능은 추가하지 않았다.

사용자의 기존 push 승인 범위에서 동일 main으로 반영하고 공개 URL의 상품·프로모션 API 및 화면을 추가 확인한다. 클라우드 복구 결과는 아래 후속 기록과 최종 보고를 따르며 아직 확인하기 전 성공으로 쓰지 않는다.


### 후속 클라우드 예외: API의 불필요한 정적 의존성

6115ad8 자동 배포 완료 후 실제 API는 여전히500이었다. 최신 Vercel Logs는 이전 app.js 구문 오류 대신 ERR_REQUIRE_ESM: @fastify/static이 content-disposition/dist/index.js를 require할 수 없다는 오류를 보였다. 해당 라이브러리는 독립 로컬 웹 서버에서만 필요하므로 app-factory의 최상위 import를 제거하고 webRoot가 있는 플러그인 초기화 경로에서만 동적 import한다. API 전용 런타임에서 정적 모듈이 로드되면 실패하는 회귀 검사를 추가했다. 이 후속 변경의 검증과 실제 클라우드 결과를 아래에 기록한다.


후속 최종 검증:

- 공식 @vercel/backends의 실제 함수 패키지에 --no-experimental-require-module을 적용해 수정 전 @fastify/static→content-disposition의 ERR_REQUIRE_ESM을 동일하게 재현했다. 수정 후 같은 제한에서 health200/상품402/프로모션3/맛집514를 반환하고 종료0이었다. NODE_ENV=production도 동일 결과다. 근거: var/imports/vercel-20261123/backend-static-packaging.{mjs,json}. 앞선 ESM 진입점 재현은 backend-packaging.json으로 별도 보존한다.
- 최초 편집은 CRLF 정적 import 치환이 남아 typecheck가 실패했다. 개행에 무관하게 해당 import를 제거한 뒤 전체 검사를 다시 실행했다. 검사 비활성화는 없다.
- npm.cmd run lint / typecheck / check:providers / build 모두 종료0,경계101소스,web173모듈. npm.cmd run test -- --run은30파일376개,종료0. 신규 tests/integration/api-runtime.test.ts는 정적 모듈 로드를 예외로 만들어 API 독립성과 응답 DTO를 검증한다.
- npm.cmd run test:e2e -- tests/e2e/foundation.spec.ts tests/e2e/promotions.spec.ts tests/e2e/public-guides.spec.ts는 종료0,모바일/태블릿/PC45개. 외부 사진/예약은 대역이다. 별도 dist start smoke의 /,/food/70,/recommended,/places/gamcheon,/search는 모두200,종료0.

최종 소스의 클라우드 재배포/실제 화면 검증은 다음 후속 기록으로 구분한다.


### 실제 Vercel 공개 사이트 복구 확인

코드 커밋84288e4의 자동 배포 완료 후 https://dallabusan.vercel.app에서 실제 HTTP/브라우저 검증을 수행했다. health200,상품 API total402,프로모션3,음식점 total514가 모두200이었다. /config/catalog/offers.json,/data/snapshots/trip-fit.sqlite,/.env는404였다. 설정 .이나 서버 전용 데이터가 웹 정적 응답으로 공개되지 않음을 해당 경로에서 확인했다.

실제 공개 화면에서 상품 카드24개/프로모션 카드3개,신규 영어 진입,5개 언어 선택 후 카드 유지,브라우저 pageerror0을 확인했다. 외부 제공처 사진만 대역이며 상품/프로모션 API는 실제 배포 응답이다. 예약 클릭/결제는 하지 않았다. var/imports/vercel-20261123/live-recovery.json에 결과를 보존했다. [공개 쿠폰 화면](screenshots/vercel-live-promotions-2026-11-24.png)과 [공개 상품 화면](screenshots/vercel-live-products-2026-11-24.png)을 직접 열어 읽을 수 있는 카드/조건 표시를 확인했다. 상품 캡처의 단색 사진은 대역으로 실제 사진 확보 증거가 아니다.

이전6115ad8의 배포 Ready/실제 API500과 최종84288e4의 실제200 복구를 구분한다. CLI 캐시 경고/설치 스크립트 경고를 API 실패 원인으로 단정하거나 경고를 숨기지 않았다. 실제 원인은 함수 패키징의 ES 모듈 진입점과 API에 불필요했던 정적 의존성의 ESM require였다. 최종 검증 기록/시연 이미지만 별도 문서 커밋으로 반영하며 앱 코드는 바꾸지 않는다.


## 2026-11-24 코스40개 기획·팝업 시안

최신 요청으로 가족/데이트/맛집/dallaBusan 각10개,총40개 편집 초안과 docs/courses-plan.md를 작성했다. 기존 내부17개 테마·승인 상태·공공 DB·운영 카탈로그·앱 코드·.env·의존성/lockfile은 변경하지 않았다. 계획은 권역·메인/디저트 후보 ID·주차/아이 검수·실제 경로 제약·공개 보류·소스 근거·단계별 Proof를 포함한다. 신규 공개0/현장 검증0/최적화 완료0이다.

내장 image_gen으로 영어 팝업 v1을 생성한 후 사용자 지시로 음식 패널의 커피/디저트를 제거한 v2를 생성했다. 최신 시안은 docs/design/course-popup-v2-2026-11-24.png이며 v1과 prompt 이력도 보존한다. 전체 시안의 음식만 있는 패널/영문/하단2버튼을 도구 반환 이미지로 확인했다. 합성 홍보 시안이며 실제 점포/명소 실사진·수상/발행 완료의 증거가 아니다.

실제 웹 검색은 공식 관광 안내·미쉐린 목록/상세에 한정한 읽기 작업이며 예약/결제/제휴 클릭/번역 API/부산 공공 API 신규수집은 없다. 블루리본·웨이팅·아이 시설·실제 주차 입구/경로는 확인되지 않아 계획상 보류했다. Git 일반 상태 조회는 읽기 제한으로 실패했으나 권한을 높인 재조회에서 기존51ee258/깨끗한 상태를 확인했다. 문서·이미지 변경만이므로 lint/typecheck/test/build/E2E/dist smoke/배포는 이번 단계에 실행하지 않는다. 문서 구조·40개 ID·참조 파일 검사는 아래 후속 결과를 따른다.

문서 구조 검사 종료0: FA/DA/FO/CU 각10개·합계40개·고유ID40개,본문의 음식점 ID26개 모두 국문 원본에 존재. 최신PNG1122×1402/2,191,093bytes와 v1/v2/프롬프트 파일 존재를 확인했다. 상대 문서 링크 검사 종료0. git status/diff --check 종료0(기존 CRLF 정규화 안내만 있음),변경은 docs/proof.md 및 신규 docs/courses-plan.md·docs/design/뿐이다. 빌드/테스트/배포는 문서·이미지 작업 범위에 따라 생략했다.


## 2026-11-24 Google 소유권 파일·GTM/GA4 실제 연결

사용자 제공 googlebf1f839e8f4debc5.html을 apps/web/public에 바이트 그대로 복사했다. SHA-256은9b3004ccc393953af2ead461a28a5c84cdc282d23c7d3e59c94fdf61dde003a1이다. 초기 공개404를 확인하고 파일만 분리한 f17fc9a를 push한 뒤 실제 URL200/원문일치/리디렉션없음을 확인했다. Search Console 계정의 최종 확인 버튼까지 대신 완료했다고 주장하지 않는다. 파일을 계속 보존한다.

추가 요청으로 사용자의 Google Analytics 화면에서 기존 dallaBusan 스트림 URL과 G-2G1XYHDY7Y를 확인했다. GTM-5FJR79NS의 Google Analytics 태그1개/Initialization - All Pages를 준비했다. 새 템플릿이 자동으로 만든 사용자 제공 데이터 허용/자동 감지는 사용자가 직접 꺼서 저장했다. Windows computer-use는 해당 개인정보 설정을 직접 바꾸지 않았다. 계정 링크 추가 안함으로 추가 읽기 권한을 부여하지 않았고 신규 계정/API 비밀번호/로그인을 만들지 않았다.

GTM 버전2(dallaBusan GA4 launch 2026-11-24) 게시를 실제 화면에서 확인했다. apps/web/index.html의 공식 최신 로더를 공통 head에1회 설치하고22bb93e를 push했다. web build 종료0,원본/산출물 로더1개·실행 가능한 dataLayer 초기화·직접 GA4 config 중복0을 확인했다. 실제 공개 사이트의 첫 접속과 /search 내부 이동 각각 page_view1회/HTTP204/측정ID일치,브라우저 pageerror0이었다. 제품 사진만 대역이고 Google 측정은 실제다. dashboard 집계가 끝났다는 의미는 아니다. 민감한 요청/cookie/client 식별자는 기록하지 않았다. 근거 docs/google-analytics-setup.md와 var/imports/google-analytics-20261124/live-check.json.

## 2026-11-24 코스 아이디어 허브·수정 이미지 팝업 구현

최신 구현 요청에 따라 기존 코스 제외 범위를 대체해 /courses 목록·상세와 /api/courses 목록·상세를 구현했다. 가족/데이트/맛집/dallaBusan 각10개,총40개는 **editorial-idea 미리보기**다. routeCheck=pending/fieldValidation=not-performed를 유지하며 승인 일정0/운영자 승인0/현장 검증0/동선 최적화 완료0이다. 기존 내부17개 템플릿과 추천 플래그는 바꾸지 않았다. 미쉐린/블루리본 배지·아이 메뉴/접근성·웨이팅/이동시간·주차 입구를 확인 없이 확정하지 않았다. FO10의 미선정 디저트와 그 외 일반 휴식/식사 안내는 구체 장소를 만들지 않고 미완성 안내로 남긴다.

주요 파일:

- packages/domain/src/courses.ts 및 barrel: HTTP/DB/React와 독립된 최소 DTO.
- config/catalog/courses.json:40개 ID/5개 언어 제목·안내,정확한 원본 장소 namespace/ID와 SHA-256.
- apps/server/src/config/courses.ts,services/courses.ts,routes/courses.ts,runtime.ts:원문 지문·공개 대상·중복 ID 확인,언어별 기존 명소/맛집 서비스 결합,불일치 정류점을 생략하지 않고 코스 전체 보류.
- apps/web/src/courses/CoursesPage.tsx,i18n/courses.ts,App.tsx,public-guides.ts,global.css:상단 Attraction search와 Find restaurants 사이 Busan Courses,목록/분류/상세/언어 URL,공공 원문·자동 번역 고지·접힌 한국어 이름·출처 사진/실패 대체,가족 주변 주차·장소 상세의 기존 메뉴/운영/관련 상품 연결.
- 기존 Travel inspiration을 /courses/inspiration으로 통합하고 /recommended의 기존 주소/쿼리를 보존해 전환했다. 홈/관광지 검색의 추천 명소2개는 코스 허브로 이동했다. 기존 추천여행 원문/필터/상세/API namespace는 유지한다.
- apps/web/src/campaigns/RecommendationDialog.tsx,popupStorage.ts,public/campaigns/course-popup-v2.png:사용자가 음식만 남기도록 수정한 v2를 그대로 복사하고 콜라주 영역만 CSS로 표시한다. 시안의 인쇄 수량/버튼은 가리고 실제5개 언어 HTML/4개 분류 링크/하단2버튼으로 구현했다.
- vercel.json:기존 두 서비스/라우팅/바인딩0개를 유지하고 web SPA의 /courses/:path*만 추가했다.
- tests/unit/popup-storage.test.ts,integration/courses.test.ts,e2e/courses-popup.spec.ts 및 기존 회귀 fixture/이동 경로 검사. 기존 카탈로그 테스트는 명시적인 돌아온 탭 상태를 사용하고 신규 첫 방문/팝업 검사는 별도로 실제 동작을 검증한다. 테스트 제거/skip은 없다.

Close/Escape/분류 이동은 해당 탭 세션에서 억제한다. 하루 안 보기는 기기 현지 달력 날짜 자정 기준이며 새 탭/새로고침에도 유지하고 다음 날짜의 새 로드에서 다시 표시한다. 팝업 전용 키만 쓰며 찜·장바구니는 보존한다. 저장 getter/setter 차단 시에도 닫고 하루 저장 성공으로 표시하지 않는다. native dialog,명시 초기 Close 초점·초점 복귀·배경 스크롤 잠금·44px/360px를 적용했다. API실패/0개이면 홈 팝업을 표시하지 않는다.

검증 및 수정:

| 명령/검사 | 결과 |
| --- | --- |
| npm.cmd run lint | 최종 종료0 |
| npm.cmd run typecheck | 최종 종료0 |
| npm.cmd run test -- --run |32파일384개,최종 종료0 |
| npm.cmd run check:providers |109소스,종료0 |
| npm.cmd run build | domain→server→web,종료0/web178모듈 |
| npm.cmd run data:localization:check |5개 언어 상품402/관광지220/맛집514,issues0/종료0 |
| Vercel 공식 @vercel/backends 패키징 |830파일/코스JSON포함/독립 .mjs 함수 실행 종료0 |
| dist 웹/경로 smoke | /courses,상세,inspiration,기존 추천상세,Google확인파일200;설정/.env/DB경로404 |

공식 함수는 이전에 검증한 깨끗한 설치 디렉터리에 최종 domain/server 소스와 코스 설정을 복사해 빌드했다. 의존성/lockfile을 바꾸지 않아 npm ci를 이번에 다시 실행했다고 주장하지 않는다. 함수 산출물을 새 독립 디렉터리에 물리화하고 --no-experimental-detect-module/--no-experimental-require-module 제한으로 health200/상품402/프로모션3/맛집514/영문·일문 코스40/번체 상세fa04를 검증했다. 기존 ESM/정적 플러그인 분리와 readOnlySnapshot을 유지한다. 근거 var/imports/courses-20261124/package-check.{mjs,json}. E2E는 별도의 npm run start dist 서버와 외부 사진/예약·GTM 대역을 사용한다.

처음 domain LocaleSchema import 경로와 이종 Map 추론 타입 오류를 수정했다. legacy URL 전환은 effect에서 직접 setState하지 않도록 수정했다. 숨겨진 dialog의 React autoFocus만으로 초점이 잡히지 않아 showModal 후 명시 focus로 수정했다. 원문 이름 접기를 추가하면서 주차 접기 테스트가 다른 summary를 선택한 문제는 중복 주차 접기를 없애고 전용 주차 컨트롤로 검증하도록 고쳤다. API 정적 의존성 회귀의 콜드 모듈 import가5초 테스트 제한에 포함되던 문제는 vi.mock 호이스팅을 유지한 정적 import로 옮겨 해결했다. 검사 제한시간을 늘리거나 경계 검사를 끄지 않았다. Zod PURE 주석/SQLite experimental 안내는 빌드 실패가 아니며 숨기지 않았다.

신규 포털 수집/상품 추가·제외0. 원본 공공 JSON/DB/번역/음식점 제외·사진 정책/.env/의존성/lockfile은 변경하지 않았다. 로컬 코스 미리보기40개와 실제 현장 검수40개를 혼동하지 않는다. 최종 전체 E2E/시연 캡처/클라우드 결과는 아래 후속 기록으로 구분한다.

최종 전체 npm.cmd run test:e2e는 **183 passed / 종료0 / 3.5분**이었다.3개 화면 크기에서 첫 방문·하루 억제의 자정 경계·새 탭·새로고침·저장 차단·Escape/초점·분류/방문 순서/장소 연결·주차·오류 재시도·기존 추천여행 이동과 상품/찜/장바구니/통화를 검증했다. 기존 전체180개 통과/주차3개 실패 상태는 위 수정 후 전부 재실행해 해소했다.

[모바일 팝업](screenshots/course-popup-mobile-2026-11-24.png),[PC 팝업](screenshots/course-popup-desktop-2026-11-24.png),[모바일 코스](screenshots/courses-mobile-2026-11-24.png),[PC 코스](screenshots/courses-desktop-2026-11-24.png)를 보존했다. 팝업의 음식만 있는 최신 합성 패널·실제2버튼·모바일 가로 넘침 없음을 직접 열어 확인했다. 코스 사진의 단색은 E2E 대역이며 실제 장소 사진의 신규 확보 증거가 아니다.

Google 파일/태그는 앞선 분리 커밋으로 실제 배포를 확인했으며 코스 구현은 검증 완료 소스를 이어서 push한다. 최종 클라우드 코스 응답/SPA/팝업 결과는 아래 후속 기록을 따른다.


### 실제 공개 배포 확인:548f815

dallabusan/main에548f815를 push하고 https://dallabusan.vercel.app에서 실제 검증했다. /api/courses는en/ko/ja/zh-CN/zh-TW 모두200·total40·각분류10이다. /courses,/courses/fa04,/courses/inspiration과Google확인파일은200이며 config/catalog/courses.json,.env,DB경로는404였다.

실제 배포 브라우저의 새 영어 진입에서 v2 이미지 팝업/하단2버튼,하루 안 보기 후 새로고침 억제,상단 코스 메뉴 이동/40개,가족 필터10개와 URL 새로고침,fa01 상세3개 순서 노드,주변 주차 안내 펼침,360px 가로 넘침없음·pageerror0을 확인했다. API는 실제 공개 응답이며 상품 사진/제휴사/이 반복 검증의GTM은 대역이다. 앞선 Google Analytics 단발 실제 전송 검증과 구분한다. 근거 var/imports/courses-20261124/live-check.json.

Google 파일f17fc9a/GTM코드22bb93e/코스548f815를 순서대로 분리 배포했다. 앱 코드의 검증/실제 배포를 마쳤으며 이 후속 커밋은 공개 검증 기록만 추가한다. 원본 데이터/제휴 승인/운영자·현장 검수 상태는 올리지 않았다.


## 2026-11-24 관광지·추천여행 독립 페이지 복구

사용자가 기존 관광지 정보 페이지가 사라졌다고 지적했다. 원본 관광지220개/상세/API는 남아 있었지만 코스 추가 시 Travel inspiration 메뉴를 제거하고 /recommended를 코스 내부로 전환했으며 홈·검색의 명소 배너까지 옮긴 것이 원인이었다. 기존 정보 페이지 보존이라는 요구를 잘못 해석한 구현과 이를 기대한 검사도 함께 수정했다.

- App.tsx: 상단 Home → Attraction search → Busan Courses → Find restaurants → Travel inspiration → Saved6개 메뉴를 제공한다. 기존 /search·/places/:slug와 /recommended·/recommended/:id를 독립적으로 복구하고 코스는 검색/맛집 사이에 추가한다.
- CoursesPage.tsx와 i18n/public-guides.ts: 코스 안에 추천여행/명소를 합친 구성을 제거하고 추천여행의 내부 목록/상세/뒤로가기 링크를 원래 /recommended로 복구했다. 이미 공유된 /courses/inspiration[/:id]는 쿼리와 언어를 보존해 /recommended로 호환 연결한다.
- global.css: 좁은 화면에서6개 메뉴를 숨기는 가로 스크롤 대신 줄바꿈을 적용했다. 홈·관광지 검색의 명소 추천 배너2개를 원래 위치로 복구했다. 기존220개 명소/공공 원문·상세·관련 상품 관계,40개 코스와 팝업은 보존한다.
- navigation-preservation.spec.ts:5개 언어와3개 화면 크기에서6개 메뉴 동시 노출,검색→명소 정보/관련 상품,독립 추천여행 목록·상세·새로고침·뒤로가기,코스40개 공존을 검사한다. 기존 courses-popup/destinations/public-guides 검사도 페이지가 사라진 상태를 기대하지 않게 교정했다.
- AGENTS/intent/spec/plan/catalog-plan/courses-plan의 잘못된 통합 지시를 수정했다. 과거 proof는 이력으로 보존하며 이 절이 최종 복구 상태다.

| 검증 | 결과 |
| --- | --- |
| npm.cmd run lint | 최종 종료0 |
| npm.cmd run typecheck | 최종 종료0 |
| npm.cmd run test -- --run |32파일384개,종료0 |
| npm.cmd run check:providers |109소스,종료0 |
| npm.cmd run build | domain→server→web,178모듈,종료0 |
| 관련 E2E7파일 |123개,모바일/태블릿/PC·5언어,종료0/2.6분 |
| dist serveWeb smoke | /search,/places/gamcheon,/recommended,/recommended/58,/courses,/courses/inspiration/58 모두200 |
| dist 실제 스냅샷 API | 관광지220/영문 추천여행238/코스40,모두200 |

최초 신규 회귀 검사의 DOM타입이 HTMLElement|SVGElement여서 href 속성 접근이 typecheck에 실패했다. getAttribute와 기준 URL로 처리해 최종 통과했다. 타입 단언/검사 해제/제한시간 증가는 없다. [모바일 복구 화면](screenshots/restored-attractions-mobile-2026-11-24.png)과 [PC 복구 화면](screenshots/restored-attractions-desktop-2026-11-24.png)을 직접 열어6개 메뉴와 관광지 배너를 확인했다. 외부 이미지/제휴 이동/GTM은 대역이며 로컬 번들 사진은 그대로 사용한다.

신규 포털 수집/상품 추가·제외0. 원본 카탈로그/DB/번역/제휴 정책/.env/의존성/lockfile/Google확인파일·GTM은 변경하지 않았다. 서버/domain/Vercel 설정 변경이 없어 이번에 공식 API 함수 재패키징·공공데이터 재수집·번역 재생성을 반복하지 않았다. 전체 E2E189개 중 변경과 관련된123개를 실행했으며 나머지66개는 이번 미실행이다. 공개 배포 후 실제 URL과 메뉴를 아래 후속 기록으로 확인한다.


### 실제 공개 사이트 복구 확인:841ab3f

841ab3f를 dallabusan/main에 push한 후 https://dallabusan.vercel.app의 실제 API/브라우저로 검증했다.360px/1280px 모두6개 메뉴(/,/search,/courses,/food,/recommended,/saved)가 동시에 온전히 보였고 검색의 관광지6개·추천 배너2개,독립 /recommended 목록12개/상세/새로고침,코스40개,감천문화마을 상세,기존 /courses/inspiration/58?locale=ja의 /recommended/58 호환 연결을 확인했다. 가로 넘침없음/pageerror0/검증 종료0이다.

상품 이미지/제휴사/GTM은 대역이며 관광지·추천여행·코스 API는 실제 공개 응답이다. 근거 var/imports/restored-navigation-20261124/live-check.json. 최종 메뉴/페이지 복구를 공개 사이트에서 확인했으며 이 후속 커밋은 검증 기록만 추가한다.


## 2026-11-24 코스40개 상세 보완·Leaflet 도로 지도

### 변경

- config/catalog/courses.json v2: 네 카테고리 각10개,총40개. 명시적 원본100개/장소 표시125회. 미선정 안내 노드0. 메인 식사+디저트/가족 관광·식사·휴식 등 실제 공개 장소를 연결하고 5개 언어 소개·확인사항/장소별 권장 체류를 추가했다.
- packages/domain/src/courses.ts, 서버 config/courses·course-routes/services/courses·course-routing/runtime: 좌표/메뉴·설명·시간·휴무·사진·원문 수집일과 스냅샷 경로 DTO. 목록에는 geometry/상세 설명을 보내지 않는다.
- config/catalog/course-routes.json, scripts/refresh-course-routes.ts·check-course-routes.ts, package.json: 고정 무료 OSRM 수집/오프라인 재검증. 키/의존성/lockfile 변경 없음.
- web CoursesPage/CourseMap/courses.css/config/course-map/i18n/course-map: 도보·차량 구분, 번호 마커/선택/전체 경로/구간 길찾기·출처/타일 오류 재시도/지도 모듈 실패 때 목록 유지/사진 실패 안내. 지도 청크는 상세 진입 때 지연 로딩한다.
- tests/unit/course-routing.test.ts, tests/integration/courses.test.ts, tests/e2e/course-map.spec.ts 및 기존 코스 팝업 검사 수정. AGENTS/intent/spec/plan/catalog-plan/courses-plan과 별도 course-map-review 문서에 최신 범위·운영을 반영했다.
- 관광지 검색·관광지 상세·맛집·추천여행·6개 메뉴·홈/검색 월간 배너·팝업·찜/장바구니를 유지한다. 기존 내부17개 테마 파일/원본/검수 상태는 수정하지 않았다.

### 명령·결과

| 검증 | 종료/결과 |
| --- | --- |
| npm run lint | 0 |
| npm run typecheck | 0, web/server/domain/tools strict |
| npm run check:providers | 0,114개 소스 |
| npm run test -- --run | 0,33파일387개 |
| npm run build | 0,domain→server→web |
| npm run data:courses:check | 0,40코스/40도로경로/100원본/미정0/외부호출0 |
| npm run data:localization:check | 0,5개 언어 각각 상품402/관광지220/맛집514,issues0 |
| npm run test:e2e | 0,전체198개(360/768/1280px) |
| npm run test:e2e -- tests/e2e/course-map.spec.ts tests/e2e/courses-popup.spec.ts | 0,최종 원문 날짜·사진 실패·번호 개선 후30개 재검증 |
| node var/imports/course-maps-20261124/dist-smoke.mjs | 0,10개 HTML/검증파일200,5언어×40개 상세/각125개 장소·124개 사진/모든 경로·수집일 확인 |
| node var/imports/course-maps-20261124/package-check.mjs | 0,실제 Vercel backend builder 산출물833파일을 독립 임시 폴더에서 실행; health/상품402/프로모션3/맛집514/영·일40코스/번체 상세200 및 도로 경로 확인 |

전체198개 회귀 후 최종 변경은 번호 방향/팝업 닫기·사진 실패/원문 날짜 표시이며 영향 범위30개와 전체 단위·타입/린트/경계/빌드/데이터 검사를 재수행했다. 빌드의 Zod pure 주석 및507KB 메인 청크 경고는 비차단이다. 지도157KB(gzip46KB)는 별도 지연 청크다. 기존 Node SQLite 실험/색상 환경 경고도 오류로 숨기지 않았다.

### 실제 수집·대역·실패 수정

- 실제 FOSSGIS OSRM 40개 최초 요청(1.5초 간격), CU01 차량 스냅300m 초과1건을 거절했다. 좌표를 옮기지 않고 도보 모드로1회 재수집해40개 전부 확보했다. 검사 명령은 이후 외부 요청0,운영 API도 라우팅을 호출하지 않는다.
- 첫 build에서 React 클래스 override 및 react-leaflet 미사용 barrel 선언의 비공개 core 경로 오류가 발생했다. override와 공개 subpath imports로 해결했다. 검사 비활성화/skipLibCheck/타입 단언으로 덮지 않았다.
- 최초 dist smoke는 HTML 페이지 요청에 Accept:text/html을 넣지 않아/search404가 발생했다. 실제 브라우저 헤더를 추가해 재검증 후10개200을 확인했다. 앱 라우팅을 완화하지 않았다. 실패 정리 과정의 Windows Node 종료 assertion은 자식 종료를 명시적으로 기다리도록 검증 스크립트를 수정한 뒤 사라졌다.
- 브라우저의 OSM 타일/외부 이미지/외부 링크/GTM은 대역이다. 실제 타일을 headless로 반복 탐색하지 않고 지도 마커/geometry/선택/실패/재시도·누락 중간좌표 비연결·가로 넘침 없음·콘솔 오류0을 검증했다. source 사진을 새로 현장 검증/실시간 디코딩했다고 주장하지 않는다.
- 기존 깨끗한 npm ci 결과의 의존성을 재사용한 Vercel 재빌드이며, 새 npm ci를 했다고 보고하지 않는다. lockfile/의존성이 바뀌지 않았다. API 함수는 공개 snapshot 읽기 전용을 유지하고 static 플러그인 최상위 로딩 없이 --no-experimental-require-module 조건으로 실행했다.
- 사진 미제공: DA10 food:1627 레망파티쓰리1곳. 다른 지점/기본 이미지를 실사진처럼 붙이지 않았다.
- 현장 입구/사유지·해안 통제/기상·대기줄·어린이 메뉴·알레르기·주차 진입은 미검수다. 수상 배지/현지인 전용/짧은 웨이팅/실시간 교통/전역 최적화를 주장하지 않는다. editorial-idea/routeCheck=pending/fieldValidation=not-performed 및 내부17개 pending 플래그는 유지한다.

### 시연 캡처·근거

- docs/design/course-maps-2026-11-24/mobile.png 및 desktop.png: 최종360/1280px 지도 화면. 타일/외부 사진 대역임을 명시한다.
- 로컬 실행 근거: var/imports/course-maps-20261124/dist-smoke.json,package-check.json. 임시 도구/산출물은 Git 제외한다.
- 서비스 이용 정책·40개 순서/거리·운영 명령·한계는 docs/course-map-review-2026-11-24.md 참조.
- 공개 배포의 반영 여부는 push 후 별도 기록한다. 이번 변경은 GTM/Google 태그 설정을 수정하지 않았다.


### 공개 반영 확인 — 9079072

- `git push dallabusan HEAD:main` 종료0. 대상 https://github.com/daeeon8728/DallaBusan, 구현 커밋9079072.
- 첫45초 API 폴링 때는 이전 배포가 응답했다. 이후 새 지도 화면과 DTO가 반영된 것을 실제 공개 주소에서 확인했다. Ready 상태만으로 성공 판정하지 않았다.
- https://dallabusan.vercel.app/courses/fa01?locale=en : 360/1280px 각각 번호 마커3/도로 경로1/메뉴6/전체40코스/가로 넘침 없음/콘솔 오류0. 전체 경로 보기 버튼도 동작했다.
- `/search?locale=en`의 월간 명소2개와 `/recommended?locale=en`의 별도 목록12개를 유지했다. 최초 배너 검증은 비동기 응답 전에 개수를 읽어 실패했고 로딩 완료를 기다리도록 검증 스크립트만 수정했다. 앱 데이터/라우팅 변경은 없었다.
- 공개 API 200: 상품402,프로모션3,관광지220,맛집514,일본어 코스40. 신규 채널 승인/전체 OTA 재고 수집/실시간 교통 확인으로 해석하지 않는다.
- 공개 브라우저 검증의 OSM 타일/외부 이미지/GTM도 대역이다. 실제 경로 수집41회와 실제 공개 API 응답을 분리한다. 로컬 근거 `var/imports/course-maps-20261124/live-check.json`,live-360.png,live-1280.png.
- Google CMS 설치 문의: 이 프로젝트는 React이며 CMS 설치 경로를 사용하지 않는다. 이번 코스 변경은 기존 GTM/GA4 태그를 추가·중복 설치하지 않았다. 앞서 page_view 전송 응답204는 확인했지만 GA4 대시보드 집계/경고 해제까지 확인했다고 보고하지 않는다.


## 2026-11-24 AdSense 수동 광고 준비·기존 사이트 연결

### 계정에서 실제 수행한 설정

사용자가 열어둔 로그인 Chrome AdSense의 dallabusan.vercel.app을 확인했다. 최초 사이트 상태는 검토 필요/소유권 연결 미완료/ads.txt 찾을 수 없음이었다. 자동 광고·자동 최적화를 모두 사용 안 함으로 저장하고 사이트 기준 목록으로 재확인했다. 수동 디스플레이 반응형 단위 `DallaBusan - Detail Bottom - Responsive`(7687721544)를1개 발급하고 목록/코드로 확인했다. 계정에서 발급된 공개 publisher 식별자는 ca-pub-9707649247569634이며 비밀 API 키가 아니다. 지급·계정 권한·비밀번호·개인정보 선택/광고 CMP 설정은 변경하지 않았다.

### 파일과 동작

- web index.html의 공식 google-adsense-account 메타1개와 public/ads.txt를 추가했다. 기존 GTM/Google 검증 파일은 유지하며 AdSense JS를 전역 head에 추가하지 않았다.
- web config/advertising.ts·advertising/policy.ts·DetailAdvertisement.tsx·advertising.css를 추가하고 관광지/맛집/코스 상세 끝에 수동 단위1개씩 연결했다. 홈/상품 목록/추천여행/찜/장바구니/지도/예약 버튼 위에는 추가하지 않았다. 본문 폭과 기존 매거진 레이아웃을 유지한다.
- enabled=false이며 실제 사이트 승인·동의/CMP 검토 게이트가 완료되기 전에는 광고 script/요청/빈 칸을 만들지 않는다. 단위 발급/소유권 확인/심사 접수는 광고 게재 승인/수익 발생과 다르다.
- 승인 이후 경로는 lazy visible slot/양수 폭/공통 script1회/SPA 취소/실패/광고 미제공 처리/5개 언어 광고 표시를 준비했다. 현재 검증된 실행 상태는 **비활성화**이며 실광고·활성화 후 CMP/입찰/표시까지 검사한 것으로 쓰지 않는다.
- tests/unit/advertising.test.ts·tests/e2e/advertising.spec.ts, AGENTS/spec/plan과 docs/adsense-setup-2026-11-24.md에 상태·운영/공식 근거를 추가했다. .env·lockfile·버전·의존성·공공/제휴 원본은 변경하지 않았다.

### 검증 결과와 수정

| 명령 | 결과 |
| --- | --- |
| npm run lint | 종료0 |
| npm run typecheck | 종료0,strict 전체 |
| npm run check:providers | 종료0,117개 소스 |
| npm run test -- --run | 종료0,34파일390개 |
| npm run build | 종료0,domain→server→web |
| npm run test:e2e -- tests/e2e/advertising.spec.ts tests/e2e/destinations.spec.ts tests/e2e/public-guides.spec.ts tests/e2e/courses-popup.spec.ts tests/e2e/course-map.spec.ts tests/e2e/navigation-preservation.spec.ts | 최초90통과/3실패: ads.txt의 Windows CRLF와 기대 LF 비교 차이 |
| npm run test:e2e -- tests/e2e/advertising.spec.ts | 수정 후 종료0,6개 통과(360/768/1280px) |
| node var/imports/adsense-20261124/dist-smoke.mjs | 종료0,5개 HTML/ads.txt HTTP200,메타1개/광고 script0,text/plain/정확한 seller행 확인 |
| git diff --check | 종료0 |

초기 TypeScript 오류는 빈 배열이 never[]로 추론된 광고 큐였다. 명시적 Array<Record<string,never>>로 해결했으며 any/비활성화/타입 단언으로 덮지 않았다. ads.txt 브라우저 검사는 줄바꿈을 제외한 정확한 seller행을 비교하도록 수정했다. 제품 파일의 내용을 임의로 바꾸거나 검증을 제거하지 않았다. 이후 해당6개 모두 통과했으며 기존90개 회귀는 앱 코드 수정 없이 통과 상태다. 기존 Zod 주석/메인 청크 크기/Node SQLite·색상 경고는 비차단으로 기록한다.

E2E는 외부 이미지·OSM 타일·GTM/외부 링크 대역을 사용한다. 광고 script·doubleclick 요청0,대기 중 빈 슬롯0,기존6메뉴/너비·관광지·맛집·코스·지도·팝업을 확인했다. 실제 광고를 클릭/반복 로딩하지 않았다. 실제 계정 UI 설정/발급 결과와 대역 브라우저 검사를 구분한다. 실제 Vercel API 함수 코드는 변경하지 않아 함수 패키지 재검증은 생략했으며 기존 읽기 전용 서버·배포 라우팅을 유지한다.

공개 배포/소유권 확인/심사 요청 결과는 이어서 기록한다. 아직 Google Ready 승인·실제 광고 노출·여행 광고만 노출·광고 수익을 완료로 보고하지 않는다.


### AdSense 공개 배포·소유권 확인·심사 접수

- 구현51c9f7a를 `git push dallabusan HEAD:main` 종료0으로 배포했다. 공개/ 및/ads.txt HTTP200,계정 메타1개,ads.txt text/plain과 정확한 seller행,광고 script0을 확인했다. 첫40초 폴링 때는 이전 배포여서 pending으로 종료했고 후속 실제 응답에서 반영을 확인했다.
- 실제 로그인 AdSense에서 배포된 메타 태그 방식으로 소유권 검사를 수행해 **사이트가 확인되었습니다** 팝업을 확인했다. 다음 화면에는 새 계약/약관 동의 없이 Google의 사이트 정책 검토 설명과 검토 요청 버튼만 있었다. 기존 등록 사이트의 검토를 요청했고 **준비 중 / 광고 게재 가능 여부 검토 중 / 리뷰가 요청됨**을 확인했다. 신규 계정/정산계좌/약관 동의는 하지 않았다.
- Google UI의 심사 기간 안내는 보통 며칠,최대2~4주이며 승인/수익 완료로 보고하지 않는다. 계정 ads.txt 목록의 재수집 완료는 확인하지 않았다. 파일 공개200과 Google의 상태 갱신을 구분한다.
- config 승인 상태를 getting-ready로 갱신하고 enabled=false와 privacyReviewStatus=pending을 유지한다. 실제 Ready/운영자 동의 설정 검토 전에는 활성화하지 않는다. 사후 코드 변경은 이 비활성 상태 메타데이터1개뿐이며 빌드/광고 단위·타입 검사를 이어서 기록한다.
- 실계정 화면은 다른 개인 탭/계정정보를 포함할 수 있어 공개 Git에 캡처하지 않는다. UI 관찰 결과를 위에 기록하며 사이트 레이아웃/파일·요청 검사는 대역 E2E/HTTP 근거로 분리한다.

- 심사 접수 메타데이터 갱신 후 최종 lint/typecheck/광고 단위3개/npm run build 모두 종료0. 빌드 산출물 해시는 이전 비활성 상태와 동일하며 광고 실행 게이트를 켜지 않았다. 이 상태 기록 변경 뒤 브라우저93개 전체를 반복하지 않았고, 승인 상태별 차단 단위 검사를 재수행했다.
- 이번 작업의 신규 제휴상품/포털 수집0,기존 원본/공개 제외/가격·찜·장바구니 데이터를 변경하지 않았다. 활성 광고·CMP 계정 설정·실제 광고 수익 검증은 미실행(심사 및 운영자 동의 검토 미완료). 구현/검증 준비와 외부 심사 대기를 구분한다.


## 2026-11-24 상품 상세창 확대·바깥 닫기·관련 상품

요청: 작은 상품 창을 확대하고 스크롤 후에도 X/바깥 여백 클릭으로 닫으며, 하단에 관련 상품을 표시한다. 구현·운영 기준은 [검토 문서](offer-dialog-review-2026-11-24.md)에 기록했다.

변경 파일: packages/domain/src/offers.ts(최대6개 관련 DTO), apps/server/src/services/offers.ts(현재 공개 상품 선정), services/destinations.ts(검수 명소 관계), routes/offers.ts(관련 조회 API), apps/web/src/Offer.tsx(단일 지속 dialog·포인터/초점·새 상세 조회·관련 카드), offer-dialog.css/main.tsx(최대1120px·모바일·고정 닫기·스크롤), i18n/offer-dialog.ts(5개 언어), tests/integration/offers.test.ts와 tests/e2e/offer-dialog.spec.ts, 기존 cart/exchange E2E의 상세 본문 한정, AGENTS.md/catalog-plan.md/검토 문서/본 기록/시연 캡처.

| 검증 명령 | 종료/관찰 결과 |
| --- | --- |
| npm run lint | 0, 최종 UI 수정 후 재실행0 |
| npm run typecheck | 0, server/web/domain/tools strict |
| npm run test -- --run | 0, 34파일393개 통과 |
| npm run check:providers | 0, 118개 소스 경계 통과 |
| npm run build | 0, domain→server→web, 최종 UI 수정 후 재빌드0 |
| npm run test:e2e -- tests/e2e/offer-dialog.spec.ts | 0, 3개 화면12개 통과 |
| npm run test:e2e | 0, 최종 빌드의 전체216개 통과, 4.5분 |
| node var/imports/offer-dialog-20261124/dist-smoke.mjs | 0, dist start의7개 페이지200·5개 언어 관련 API 각6개·catalog402 |
| node var/imports/offer-dialog-20261124/package-check.mjs | 0, 실제 Vercel 빌더의 독립 함수833파일, require(ESM) 제한 플래그로 실행, 관련5개 언어 각6개와 각 항목 최신 상세 DTO 동일 검증 |
| git diff --check | 0, 기존 CRLF→LF 안내만 존재 |

실패 검사/무시한 오류 없음. 초기 CSS import 순서가 전역의 기존560px 규칙보다 뒤에 오도록 수정한 후 실제 너비를 브라우저로 검증했다. 단위 테스트 이후의 최종 제품 변경은 영문 장식 문구1줄 제거이며, 최종 lint/build/전체216개 E2E를 재실행했다. Vite의 기존 Zod 주석·500KB 청크 안내 및 Node SQLite/색상 경고는 비차단이며 검사를 비활성화하지 않았다.

브라우저에서360/768/1280px, 상세 확대·고정44px X·끝까지 스크롤·바깥 포인터 시작/끝으로 닫기·본문 클릭/밖으로 드래그는 유지·Escape·초점/배경 스크롤 복구·동일 창 관련 전환·로딩/오류에서도 닫기·관련 오류 재시도·5개 언어·가로 넘침 없음 확인. 기존 cart/가격 검사는 관련 카드의 별도 버튼/가격과 구분해 .dialog-body/.dialog-price만 지정했다.

시연 캡처: [PC 상세](design/offer-dialog-2026-11-24/desktop-product-details.png), [PC 하단](design/offer-dialog-2026-11-24/desktop-related-products.png), [모바일 상세](design/offer-dialog-2026-11-24/mobile-product-details.png), [모바일 하단](design/offer-dialog-2026-11-24/mobile-related-products.png). 외부 사진은 실제 상품 사진을 대체하지 않고 **브라우저 테스트에서만 단색 이미지 대역**이며 개인정보/실계정 화면이 아니다.

실제/대역 구분: 실제 로컬 서버·Vercel 빌더/함수 산출물·기존 검수 공개 스냅샷을 사용했다. E2E의 외부 이미지/GTM/링크는 대역, NODE_ENV=test의 환율은 테스트 대역이다. 실제 제휴 클릭/예약/결제/광고 노출·유료 API·공공 데이터 재수집은 미실행(범위 아님). 이번 신규 포털 수집/제휴 발급0, 공개402/메인398/명소220/맛집514/코스40 및 기존 비공개 정책·상품 가격·저장/장바구니 자료는 변경하지 않았다. 깨끗한 의존성 재설치는 lockfile/의존성 변경이 없어 생략했으며 이전 검증 설치본에서 현재 소스를 실제 함수로 다시 패키징했다.

공개 배포 및 실사이트 최종 결과는 이어서 기록한다.


### 상품 상세창 공개 배포 확인

구현51b8d77을 git push dallabusan HEAD:main 종료0으로 반영했다. 실제 https://dallabusan.vercel.app 의 /api/offers/b-74132/related는5개 언어 각각200/6개를 반환했다. 실제 배포 브라우저360/1280px에서 상세창 너비344/1120px, 관련 상품6개, 끝 스크롤에도 닫기 버튼 표시, 바깥 여백 클릭 닫기, 동일 창 관련 상품 전환·현재 상세 API의 제목/예약 href 동일, 전환 후 스크롤0, Escape·원래 버튼 초점 복구,6메뉴 유지, 브라우저 pageerror0을 확인했다. live-check.mjs 종료0이며 결과/대역 캡처는 var/imports/offer-dialog-20261124에 로컬 보관한다. 이 실사이트 확인에서도 외부 이미지/GTM은 대역,환율 요청은 차단,실제 제휴 링크 클릭0이다. 공개 배포 동작 확인과 외부 예약/실사진 서버 상태 검증을 구분한다.

사후 변경은 본 검증 기록뿐이므로 제품 빌드/216개 회귀를 반복하지 않았다.


## 2026-11-24 관련 관광지·유사 체험과 숙소 분리, 사용자 제공 지도/배너

최신 요청: 같은 관광지/유사 체험 위주의 관련 상품, 주변 숙소 별도 영역. 진행 중 사용자가 공식 지도와 다이내믹 배너 코드를 추가 제공하고, 지도 위치를 ‘상품 상세 숙소 영역 버튼’으로 명시 선택했다. 두 도구 모두 수동 버튼에서만 불러오도록 구현했다. 현재 선정·위젯 경계/발급 설정은 [후속 검토](related-offers-review-2026-11-24.md)를 따른다.

변경: server config/offers.ts·offer-recommendations.ts와 catalog/offer-recommendations.json(34유형217개 ID·원문 지문), services/offers.ts·destinations.ts/related route(같은 명소→명시 유형, 체험/숙소 분리·숙소 그룹 중복 방지), domain/offers.ts·stay-map.ts/index, web/Offer.tsx·StayMap.tsx·StayBanner.tsx·offer-dialog.css·i18n/offer-dialog.ts, server config/routes/stay-map.ts·stay-banner.ts/runtime 및 각 catalog JSON(발급 값·공개 URL/언어·통화·날짜/모션), 관련 단위/E2E·문서/캡처. 새 업체별 리터럴은 config/catalog 및 서버 config 경계에만 둔다. .env/lockfile/의존성/원본 offers.json·공공 DB는 변경하지 않았다.

| 명령 | 종료/결과 |
| --- | --- |
| npm run lint | 0, 최종 문구 수정 후 재실행0 |
| npm run typecheck | 0, server/web/domain/tools strict |
| npm run test -- --run | 0, 최종36파일401개 통과 |
| npm run check:providers | 0,126개 소스 경계 통과 |
| npm run build | 0, domain→server→web, 최종 문구 수정 후 재빌드0 |
| npm run test:e2e -- tests/e2e/offer-dialog.spec.ts | 0, 지도/숙소 분리 단계18개 통과 |
| npm run test:e2e | 0, 지도 단계222개/배너 포함228개 전체 통과(최종3.1분) |
| npm run test:e2e -- tests/e2e/offer-dialog.spec.ts tests/e2e/stay-banner.spec.ts | 0, 최종 안내 문구 수정 후24개 통과 |
| node var/imports/related-relevance-20261124/dist-smoke.mjs | 0, 최종 dist start7개 페이지·5개 언어 관련 API 모두200,카탈로그402 |
| node var/imports/related-relevance-20261124/package-check.mjs | 0, 실제 Vercel 독립 함수842파일, require(ESM) 제한 실행으로5개 언어 관련 결과와 최신 DTO 동일/숙소 분리·지도/배너 endpoint200 확인 |

초기 strict 검사에서 중첩 함수 안의 base undefined 가능성을 잡았다. 상위에서 검증한 baseGroup을 캡처하도록 수정했고 any/단언/검사 해제를 쓰지 않았다. git diff --check는 새 E2E 끝의 중복 빈 줄을 지적해 제거한 뒤 재검사한다. 브라우저/단위 검사를 무시하거나 실패를 성공으로 보고하지 않았다. 기존 Vite Zod 주석·500KB 청크 및 Node SQLite/색상 안내는 비차단이다. 전체228개 이후 제품 변경은 지도 반경 단위를 확인 없이 표시하지 않도록5개 언어 안내에서 수치 표현만 제거한 것이며, 최종 lint/build/관련24개와 dist smoke를 다시 확인했다.

확인: 같은 관광지 우선·링크 없는 유형만의 카테고리 보완 금지·반지와 향수/열차와 테마파크 분리·원문 변경 시 유형 연결 중단·5개 언어 DTO·실제 숙소 그룹/제공처 우선순위·제외/빈 목록,360/768/1280px의 체험·숙소 별도 카드와 해당 상세 전환, 지도/배너 버튼 전 외부 iframe0·수동 생성/닫기·에러 재시도,5개 언어/통화·날짜 미래 전환·모션 감소·모바일300px 배너 축소·가로 넘침 없음·고정 닫기/배경 클릭/초점 복구. 기존 찜/장바구니/관광지/맛집/코스/프로모션·AdSense 비활성 유지도 전체 회귀로 확인했다.

캡처: [PC 체험](design/related-offers-2026-11-24/desktop-experiences.png),[PC 숙소](design/related-offers-2026-11-24/desktop-area-stays.png),[모바일 숙소](design/related-offers-2026-11-24/mobile-area-stays.png),[모바일 배너](design/related-offers-2026-11-24/mobile-banner.png). E2E의 사진/iframe/GTM은 **대역**이며 단색 사진·Partner banner mock을 실제 상품 자료로 쓰지 않는다.

실연동/미실행: 공식 초기화 JS와 실제 지도/배너 HTML 각1회 GET200·프레임 차단 헤더 없음 확인, 결과는 var/imports/related-relevance-20261124/vendor-http.json에 로컬 보관했다. 실제 위젯 숙소 결과와 도메인/채널 승인은 이 HTML 응답만으로 확정하지 않는다. 실제 예약/결제/광고 클릭·신규 채널 등록·계약 동의·공공 API 재수집은 미실행(범위 아님). 새 포털 수집/정적 제휴상품 발급0,공개402/메인398/명소220/맛집514/코스40 그대로이며 외부 동적 숙소 결과를 내부 상품/장바구니에 적재하지 않는다. 깨끗한 재설치는 의존성/lock 변경이 없어 생략하고 기존 검증 설치본의 현재 소스로 함수를 다시 만들었다.

공개 배포와 실사이트 확인 결과는 이어서 기록한다.


### 공개 배포·실제 위젯·초기 프로토콜 보완

53e4e71 푸시 종료0. 공개5개 언어의 관련 상품 API는 체험6/주변 권역 숙소6으로 분리했고 각 언어 KRW/USD/JPY/CNY/TWD 지도·배너 설정을 반환했다.360/1280px 실사이트에서 독립 목록·두 버튼 전 iframe0·각 버튼 후 iframe생성·고정X/배경 닫기·Escape·초점/6메뉴·가로 넘침 없음·pageerror0을 확인했다. live-check.json은 외부 iframe/사진/GTM 대역이며 실제 예약 클릭0이다. 초기 검사 도구의 로컬/클라우드 번들 해시 동일 가정과 외부 script에 HTML을 주던 대역을 수정했다. 제품 오류나 배포 실패로 판단하지 않았고 실제 기능/번들 내용을 검사해 통과했다.

실제 지도는 지정 날짜/인원 검색 UI와 Leaflet·Mapbox/OSM 지도·이미지7개가 렌더링되고 pageerror0이다. 처음 body visibility 검사 실패는 절대 배치된 지도 때문에 body 높이가0인 테스트 기준 문제였다. attached DOM과 실제 시각 확인으로 구분했다. 첫 실제 배너는 일반 예약 문구/이미지까지만 표시됐다. 공식 초기화 JS에 iframe load 후 reloadSetting/edit-width 메시지가 있음을 확인해, 서버 DTO의 검증된 초기 메시지를 정확한 origin과 iframe 이름에만 보내도록 보완했다. 수신 메시지로 DOM/URL/크기를 변경하는 처리는 추가하지 않았다. 실제 외부 위젯 검사는 분석 요청을 차단하고 호텔/예약 클릭 없이 제한 횟수로 진행했으며 대역 E2E와 구분한다.

초기 메시지 보완 후 lint/typecheck/401개 단위·통합/check:providers(126소스)/npm run build 모두 종료0,3개 화면의 관련24개 E2E도 종료0.5개 언어에서 자식 프레임이 받은 실제 message envelope의 origin/이름/순서·내용을 검증했다. 모션 감소는 URL과 isAutoPlay 메시지 양쪽에 반영된다. 전체228개는 보완 전 통과 이력이며, 이 격리된 초기 메시지 변경 뒤에는 관련24개를 재검증했다. Vercel 함수도 현재 소스로 다시 패키징해 지도/배너/관련 API를 독립 실행했다. 최종 공개 배너 표시 결과는 이어서 기록한다.


### 최종 배포7e9efc3 및 외부 표시 결과

- git push dallabusan HEAD:main 종료0. 공개 API의 initialMessages2개와 실제 번들 내용을 확인한 후 실사이트 검사를 재수행했다.5개 언어 각각 관련 체험6/주변 권역 숙소6·해당 통화의 지도/배너 설정200,360/1280px에서 버튼 전 iframe0·각 버튼 후 표시·닫고 재진입 시0·배경/Escape/초점 복구·가로 넘침 없음·6메뉴·pageerror0, live-check.mjs 종료0이다. 사진/iframe/GTM은 이 검사에서 대역이다.
- 실제 외부 배너를 보완된 사이트에서 제한적으로 다시 열어 초기화 후 DOM을 확인했다. body300px/이미지1/pageerror0이며 현재 **FIND YOUR NEXT HOTEL / Book now 일반 예약 배너**를 반환한다. 호텔별 사진·가격이 순환하는 카드와 특별 할인을 확인했다고 보고하지 않는다. 초기화 URL·발급 설정·정확한 origin의 프로토콜 전달은 별도 단위/E2E로 확인했다. 이 결과만으로 제공처의 채널/도메인 승인·재고 응답 설정을 확정하거나 토큰/CID를 임의 교체하지 않는다. 최종 로컬 관찰은 vendor-final-banner.json/png에 보관했다.
- 실제 지도는 앞선 검사에서 부산 지도·날짜/인원 검색 UI·기여 표기가 시각적으로 표시됐다. 호텔 핀/가격·검색 후 전체 재고와 실제 예약은 검증하지 않았다. 외부 분석 요청은 차단,호텔·예약 링크 클릭0이며 실제 광고 클릭/유료 API 사용도0이다. 실제 위젯 표시는 대역 회귀 통과와 구분한다.
- 이후 변경은 이 문서 기록뿐이다. 제품 소스는 단위401개/관련24개/빌드 및 독립 Vercel 함수842파일 검증 상태를 유지하며 전체228개 통과 이력과 보완 뒤 검사 범위를 위에서 구분했다. git diff --check의 중복 빈 줄은 제거 후 통과했다.


## 2026-11-24 로그인 제휴 도구 조사·발급 및 여행 예약 도구 페이지

최신 사용자 요청의 지정값(아고다 사이트1980997,KKday CID28288,트립닷컴 프로필 Others)을 확인했다. 로그인4개 포털에서 적용 가능한 도구를 조사하고 기존 계정의 공개 임베드만 발급했다. 개인정보·정산/은행·보안·계약·새 계정/신규 채널은 변경하지 않았다. 연구 화면의 개인 정보/계정 스크린샷은 공개 Git에 넣지 않는다. 상세는 [도구 검토](affiliate-tools-review-2026-11-24.md)에 기록했다.

실제 포털 발급8개: 사이트1980997의 숙소 검색창1/지도1,기존 사이트의 English 부산 호텔 검색창1, CID28288/부산/6개 카드의5개 언어 광고5개다. KKday의5개 언어 미리보기에서 언어·통화와 실제 상품 링크 cid28288을 확인했다. 제공처 선택에는 한국 공통 서비스/교통도 섞여 있어 화면에 범위를 안내한다. 클룩은 등록된Instagram AID의 별도 웹사이트 허용 근거를 확인하지 못해 신규 위젯 pending/disabled,공개 목록 제외/상세404다. 계정 이름/사용자명/개인 주소를 외부 페이지나 프로젝트의 운영자명으로 복사하지 않았다. 기존 개별 상품 링크는 이번 도구 발급과 별도 원본으로 유지한다.

변경 파일: config/catalog/travel-tools.json(실제 발급 URL/언어/출처/허용 호스트·경로/추적값),stay-map.json(새 공식 refKey/crt/CID),server config/routes/travel-tools.ts와 runtime.ts,domain/travel-tools.ts/index,web TravelTools.tsx/i18n/travel-tools.ts/travel-tools.css/App/main,기존 StayMap/StayBanner의 중복 접근성 ID 방지,useId;vercel.json(/travel-tools SPA 경로);단위·E2E/AGENTS/spec/catalog-plan/검토/본 기록/시연 캡처.

| 검증 | 종료·결과 |
| --- | --- |
| npm run lint | 0 |
| npm run typecheck | 0,server/web/domain/tools strict |
| npm run test -- --run | 0,37파일405개 |
| npm run check:providers | 0,131개 소스 경계 |
| npm run build | 0,domain→server→web |
| npm run test:e2e | 0,최종237개(3.2분) |
| node var/imports/affiliate-tools-20261124/package-check.mjs | 0,실제 Vercel 독립 함수846파일에 새 설정/코드 포함,require(ESM) 제한 실행에서 도구 목록/3개 상세와 기존 상품·프로모션·맛집·코스/관련 API200 |

초기 새 E2E의3개 실패는 뒤로 이동 후 도구 페이지에 계속 머물 것으로 기대한 잘못된 방문 기록 검사였다. 실제로 홈으로 돌아가는 것이 맞으며, 홈 URL/페이지 확인과 앞으로 이동 시 언어·도구 복원을 검증하도록 수정했다. 검증을 빼거나 제품의 정상 뒤로 이동을 바꾸지 않았다. 이후 전체237개 통과했다. 기존 Zod 주석/500KB 청크·Node SQLite/색상 안내는 비차단이다.

검증 범위: 기존6메뉴/관광지·코스·맛집·추천여행/찜·장바구니·프로모션 유지,홈/푸터 진입·직접 URL/새로고침/뒤로/앞으로·언어 유지,5개 언어 메타데이터와 실제 발급 프레임 선택·영어 fallback고지,열기 전 외부 iframe0·닫기/오류/재시도,허용URL/발급 추적·중복 추적/다른 호스트/비공개 refer 차단·비활성 제공처/신규 ID 설정만으로 동작,정확한 iframe origin/source와 높이 제한·위조/과대 크기 메시지 차단,360/768/1280px 가로 넘침 없음·공식 카드 높이·고정 검색창 비율 축소.

시연: [PC](design/travel-tools-2026-11-24/desktop.png),[모바일](design/travel-tools-2026-11-24/mobile.png). 이 캡처의 사진/외부 iframe/GTM과 브라우저 테스트는 대역이며 ‘Partner tool mock’을 실제 상품으로 적재하지 않는다. 포털의 실제 생성/미리보기 결과와 대역 검증을 구분한다. 실제 예약/결제·광고 클릭·유료 API·새 키 생성/채널 제출·개인 메시지 발송0이다.

기존 공개 상품402/메인398/명소220/맛집514/코스40 및 원본 JSON/DB/번역·.env/lockfile/의존성은 유지했다. 새 내부 제휴상품 추가0,외부 위젯의 상품·가격·후기/예약 수는 판매처가 렌더링하며 내부 카탈로그/장바구니와 합치지 않는다. 의존성 변경이 없어 깨끗한 재설치는 생략하고 기존 검증 설치본의 현재 소스로 실제 함수를 다시 패키징했다. dist start와 공개 배포 결과는 이어서 기록한다.


### 최종 공개 배포·실제 제공처 표시

- 제품 커밋 c3dc6d8을 dallabusan/main으로 push하여 종료0. 공개 /travel-tools와 실제 배포 번들에서 새 페이지를 확인했다. dist-smoke.mjs 종료0: 기존7개 및 새 페이지200,5개 언어 도구3개/상세200,보류 도구404,기존 공개 상품402 유지.
- 공개 live-check.mjs 최종 종료0:5개 언어 API200/3개 도구,KKday 언어·USD/KRW/JPY/CNY/TWD 일치,지도 CID1980997,클룩 신규 도구404.360/1280px에서 홈 진입/기존6메뉴·열기 전 iframe0·버튼 후 생성/닫기·언어 변경/새로고침 유지·안전한 새 창 rel·가로 넘침 없음·pageerror0을 확인했다. 이 UI 회귀의 외부 iframe/이미지/GTM은 대역이다.
- 실제 외부 프레임은 분석 요청을 차단한 별도 검사에서 각 새 도구를 제한적으로 열었다. 아고다 검색창은 날짜/객실·인원/검색 폼이 렌더링됐다. KKday는 실제 사진과6개 상품 링크에 CID28288이 표시됐다. 일부 전국 공통 쇼핑/교통 상품이 포함돼 부산 전용 전체 재고라고 주장하지 않는다.
- 트립닷컴은 headless 검사에서 보안 인증 화면을 반환했다. 이를 풀거나 우회하지 않았다. 이어서 사용자가 연결한 일반 브라우저에서 배포 페이지의 같은 도구를 열어 Busan·11월25~26일·1박·객실/인원·Search 폼을 실제 확인했다. 이 결과는 일반 브라우저의 현재 표시 확인이며 모든 방문자에게 인증이 없음을 보장하지 않는다.
- 클룩의 인스타그램 등록 AID가 별도 웹사이트 위젯에 허용된다는 근거는 확인되지 않았다. 신규 도구는 계속 pending/disabled이며 운영자의 웹사이트 등록/AID 또는 담당자 확인이 필요하다. 기존 상품 링크를 일괄 삭제하거나 계정/채널을 대신 제출하지 않았다.
- 최초 공개 검사 한 번은 목록을 찾지 못했으나 당시 응답 상태가 기록되지 않아 원인을 단정하지 않는다. 이후5개 언어 직접 응답과 전체 공개 검사를 다시 실행해 모두 통과했다. 로컬/클라우드 파일 해시 동일성 대신 실제 기능·배포 번들 내용으로 확인했다.
- 실제 상품/호텔 검색 제출·예약·결제·광고 클릭0. 공개 캡처는 기존 대역 시연이며 포털 개인정보 화면/실제 외부 광고 캡처는 Git에 추가하지 않았다. 로컬 증거는 var/imports/affiliate-tools-20261124/live-check.json·real-widgets.json에 보관한다. 이후 변경은 문서뿐이므로 제품 빌드405개 단위/통합·237개 E2E를 반복하지 않았다.


## 2026-11-25 코스 한눈 요약·친구10개·숙소 좌우 비교

최신 요청: 코스가 한눈에 들어오도록 보완,숙소 검색을 화면 반씩 나눠 비교,친구끼리 코스10개 추가. [설계·코스별 검토](courses-upgrade-2026-11-25.md)를 따른다.

변경: domain/courses.ts의 friends 계약·counts,server config/routes/services/courses.ts의 fr ID/필터·집계,config/catalog/courses.json의 source-pinned 친구10개/5개 언어 소개·팁 및 course-routes.json의 새 도로 경로10개,수집/check CLI50개,web courses/CoursesPage.tsx·courses.css·i18n/courses.ts·course-overview.ts의 간결한 커버/4개 수치·번호 요약/키보드 초점·지도 선택/PC 고정지도/접이식 원문·메뉴/운영 미리보기/목록 번호와 도보·차량 URL필터/숙소 연결,TravelTools.tsx·travel-tools.css·i18n/travel-tools.ts의 숙소 두 열·명시적 함께 열기/개별 닫기·티켓 별도 영역/검색 프레임 우선,관련 단위·E2E 및 AGENTS/spec/catalog-plan/본 기록/시연.

| 검증 | 종료/관찰 결과 |
| --- | --- |
| npm run data:courses:routes:refresh | 0,추가 입력10회만1.5초 간격 호출,50개 road-route/참고0 |
| npm run data:courses:check | 0,50코스/50경로·100원본지문·미선정노드0·외부호출0 |
| npm run lint | 0,최종 프레임 배치/문구 반영 후 재검사 |
| npm run typecheck | 0,strict server/web/domain/tools |
| npm run test -- --run | 0,37파일406개;최종 추가 확인은 아래 기록 |
| npm run check:providers | 0,132소스 |
| npm run build | 0,최종domain→server→web |
| node var/imports/courses-upgrade-20261125/package-check.mjs | 0,실제 Vercel 독립 함수846파일·require(ESM) 제한 실행,전체50개/친구 상세·기존 API200 |
| node var/imports/courses-upgrade-20261125/dist-smoke.mjs | 0,최종dist8개 페이지200·5개 언어 친구10개/전체50개/모든 친구 상세와 경로200·공개 상품402·기존관련API/3도구·클룩 신규404 |
| node var/imports/courses-upgrade-20261125/capture.mjs | 0,독립 임시 서버360/1280px 대역 시연·가로 넘침 없음·종료 시 서버 닫기 |

기존40개 코스 객체/40개 도로 경로와100개 원본 지문을 HEAD와 구조 비교해 모두 동일함을 확인했다. 기존 내부17개 테마·pending/not-performed 플래그·공공 DB/사진·번역 원본·제휴 URL/발급 CID·.env·lockfile·의존성은 보존했다.50개는 편집 제안이고 최적화/현장 승인/현재 영업·짧은 웨이팅·수상·아동 적합성을 보장하지 않는다. 이동 모델과 체류 제안을 분리하고 당감밀면1108의 영어 설명 원문 빈 문자열은 메뉴·주소로 보완해 표시하며 임의 설명을 만들지 않았다.

실패와 수정: 첫406개 검사 중 새 검사가 모든 장소의 설명이 채워졌다고 잘못 가정해1개 실패했다. 실제 공공 원문을 확인하고 누락 그대로/기존 메뉴 제공을 검사하도록 수정해406개 통과했다. 첫 전체 E2E는240개 통과/3개 실패였으며 새 레이아웃에서 가족 안내가 먼저 나와 기존 ‘첫 번째 경고’ 가정이 깨진 동일 원인이었다. 실제 편집 미검수 경고 문구를 직접 확인하도록 변경했고 경고/가족 안내를 삭제하지 않았다. 최종 전체 결과는 이어서 기록한다.

초기 문서 편집 도구는 CRLF를 전제해 적용 전 중단돼 줄바꿈 정규화 후 적용했다. 캡처 도구 첫 실행은 이미 종료된 E2E 서버4317에 접속해 거절됐고 독립 임시 서버4327을 띄우는 방식으로 수정했다. 둘 다 제품 오류로 숨기거나 성공으로 처리하지 않았다. 기존 Zod 주석/500KB 번들·Node SQLite 안내는 비차단이다.

시연: [PC 방문 순서](design/courses-upgrade-2026-11-25/overview-1280.png),[PC 카드와 지도](design/courses-upgrade-2026-11-25/route-1280.png),[모바일 방문 순서](design/courses-upgrade-2026-11-25/overview-360.png),[PC 숙소 비교](design/courses-upgrade-2026-11-25/stays-1280.png),[모바일 숙소 비교](design/courses-upgrade-2026-11-25/stays-360.png). 사진/OSM타일/외부 iframe/GTM은 **대역**이며 실제 제공처 검색 결과/호텔 재고나 새 사진 확보 증거가 아니다. 실제 무료 라우팅10회는 별도 수집이며 타일 prefetch·실제 예약/검색 제출·결제/광고 클릭·신규계약/채널 생성0이다. 기존 공개 상품402/메인398·명소220·맛집514,신규 정적 상품0,공개 코스50을 유지한다. 숙소의 조건/결과 자동 동기화와 새 비공개 API연동은 구현하지 않았다. 의존성 변경이 없어 재설치는 생략했으며 현재 소스로 Vercel 함수를 다시 빌드했다.


### 최종 회귀 결과

최종 전체 npm run test:e2e 종료0,243개 모두 통과(3.4분). 최종 단위/통합도 다시 실행해37파일406개 종료0,check:providers132소스 종료0이다. 기존 네비게이션/공공 검색·맛집·추천여행/팝업·하루 안 보기/찜·장바구니·환율/관련 상품/수동 위젯을 포함한다. 친구10개/도보6개·차량4개 필터·URL/새로고침,번호 선택/초점/지도 연동·접힌 설명 펼치기,PC 고정 지도와 작은 화면 적층,두 숙소 프레임의 수동 동시 열기/개별 닫기·필터/언어 전환 정리·외부 선로딩0을 확인했다. 마지막 diff 공백 검사에서 프레임 이전 빈 줄의 공백을 제거했고 재검사0이다. 이후 제품 동작 변경은 없으며 공개 배포 결과는 이어서 기록한다.


### 실사이트 지도 이탈 시 애니메이션 오류 보완

539c275 push 종료0 후 공개 목록50개/친구10개와 새 번들을 확인했다. 최초 공개 상세 검사에서fr04가 한 번 실패했으나 당시 응답 상태가 저장되지 않아 원인을 단정하지 않는다. 이후 직접 조회200/도로 경로와5개 언어50건 상세를 확인했다. 이어 빠른 장소 선택→숙소 페이지 전환의 실제 배포 검사에서 Leaflet의 _leaflet_pos 읽기 오류를 포착했다. 대역 전체243개 통과만으로 공개 페이지 무오류를 확정하지 않았다. fitBounds의 animate:false와 MapContainer의 zoom/fade/marker zoom 애니메이션 비활성화로 뷰포트 전환 콜백을 없애고,5종 코스에서 선택 직후 이탈을 반복하며 pageerror를 수집하는 회귀를 추가한다. 최종 재검증/재배포 결과는 이어서 기록한다.

지도 안정화 뒤 lint/typecheck/check:providers132소스/npm run build 모두 종료0,단위·통합37파일406개 재실행 종료0이다. npm run test:e2e -- tests/e2e/course-map.spec.ts 종료0,모바일/태블릿/PC15개(34.6초) 통과. 새 회귀는 화면별5개 코스에서 번호 선택 직후 숙소 페이지로 이동하고 두 검색창을 열며 pageerror0을 요구한다. 전체243개는 애니메이션 보완 전 통과 이력이고 격리된 지도 옵션 변경 뒤에는 관련15개를 재검증했다. 이후 공개 사이트의 최종 결과를 이어서 기록한다.


### 최종 공개 사이트 확인

d04c2c0 push 종료0 후 공개 main/index-BHLtSIIB.js와 CourseMap-Bilb10wU.js에서 안정화 옵션 zoomAnimation/fadeAnimation/markerZoomAnimation:false를 확인했다. live-check.mjs 최종 종료0:5개 언어 각각 목록200/전체50개/친구10개,친구 전체50건 상세200/도로 경로/구간 수 일치.360/1280px에서 친구 목록→번호 선택/선택 카드→숙소 비교 이동→클릭 전 iframe0/함께 열기2/함께 닫기0,가로 넘침 없음/pageerror0을 확인했다. 외부 iframe/사진·타일/분석은 이 공개 UI 검사에서도 대역이며 실제 제공처 검색·예약·광고 클릭0이다. 독립 로컬 회귀15개와 공개 동작 모두 지도 이탈 오류 없이 통과했다. 최종 공개 검증 자료는 var/imports/courses-upgrade-20261125/live-check.json에 로컬 보관한다. 제품 코드 이후 변경은 본 검증 기록뿐이므로 빌드/회귀를 반복하지 않는다.


## 2026-11-25 공통 숙소 검색 조건·차별화 제안

최신 요청: 날짜·인원을 한 번 입력해 양쪽 숙소 검색에 적용하고 검증,사이트만의 기능 검토. [구현/근거](shared-stay-search-2026-11-25.md),[차별화 제안](differentiation-2026-11-25.md)을 따른다. 차별화 문서의 현장 카드·숙소 권역·출발 전 체크는 **제안/미구현**이며 이번 제품 구현은 공통 숙소 검색이다.

확인한 발급 위젯에는 날짜·인원 외부 변경 계약이 없어,실제 검증된 제휴 검색 링크 방식으로 공통 입력을 제공했다. 기존 위젯은 별도 조건의 보조 펼침 영역에 유지한다. 내부 호텔 재고/가격 비교·iframe 조작·새 비공개 API 계약/키·계정·채널 제출·예약·결제를 추가하지 않았다.

실제 근거: 활성 사이트1980997의 공식 위젯 predefinedUrl/UrlBuilder와 기존 등록 사이트의 새 호텔/부산/English 발급 식별D21538974를 확인했다. 두 실제 판매처에서2026-12-10~13/성인4·객실2·아동1명7세의 필드 표시 및 나이7·발급 추적값·요청USD 보존을 확인했다. 공개 검색 페이지에서 인원 선택/검색을 수행했으며 호텔/예약/결제/광고 버튼 클릭0이다. 아고다 공개 CID1980997,트립닷컴 AID10925986/SID332880325/trip_sub3 D21538974는 config 경계에서만 관리한다. 브라우저의 개인 이름·쿠키/세션 식별값/원본 개인 URL은 공개 자료에 복제하지 않는다. 한 제공처는 이전 한국어 설정을 유지했으므로 판매처 언어/통화 재확인 안내를 제공한다.

변경: domain/stay-search.ts/index의 순수 조건/DTO·날짜 검증,config/catalog/stay-search.json과 server config/stay-search.ts의 승인·추적/호스트·경로·case alias/중복·필드 매핑/제한 정책·공통 validateLink,server routes/stay-search.ts/runtime의 no-store GET/POST(2KiB,외부호출0),web SharedStaySearch.tsx/i18n/stay-search.ts/shared-stay-search.css·TravelTools.tsx의 공통 폼/좌우 링크·보조 위젯,App.tsx의 언어 변경 때 페이지 전체 재생성 제거·지도/배너의 개별 언어 key,관련 통합/E2E·문서/시연.

| 검증 | 종료/결과 |
| --- | --- |
| npm run lint | 0,최종 렌더링/소스 규칙 |
| npm run typecheck | 0,strict server/web/domain/tools |
| npm run test -- --run | 최종0,38파일411개(9.28초) |
| npm run check:providers | 0,137개 소스 |
| npm run build | 0,domain→server→web |
| npm run test:e2e | 첫 전체246통과/새 검사9실패,아래 수정 내용 참조 |
| npm run test:e2e -- tests/e2e/shared-stay-search.spec.ts tests/e2e/travel-tools.spec.ts tests/e2e/course-map.spec.ts | 수정 후0,모바일/태블릿/PC36개(56.3초) |
| node var/imports/stay-sync-20261125/package-check.mjs | 0,실제 Vercel 독립 함수850파일·require(ESM) 제한 실행,새 GET/POST2개 결과·기존API200 |
| node var/imports/stay-sync-20261125/dist-smoke.mjs | 최종0,8개 기존/도구 페이지·5개 언어 공통POST/통화2개 링크·기존 상품/관련/코스/도구API 정상 |
| node var/imports/stay-sync-20261125/capture.mjs | 최종0,360/1280px 링크2개·언어 변경 입력 유지·가로 넘침 없음/pageerror0 |

검증 범위: 두 판매처의 날짜·성인·객실·아동 수/나이·5개 통화 동일 전달,1~30박/365일·실재 날짜·과거/역전/과다 인원·아동 나이 누락/0/17/범위·객실 최소 성인·추적값/호스트/경로·대소문자 중복·동적 파라미터 충돌·미승인/제한 제공처 차단,설정만으로 provider 변경,strict payload/no-store/사용자 URL·추적값 주입 거부. 공통 입력/실패 보존·조건 변경 이전 링크 차단·다섯 언어 전환 입력/통화·요청 취소/늦은 응답·외부 판매처 선로딩0·새 창 rel·두 열/세로 카드·기존 위젯 명시 열기·코스 지도 빠른 이탈을 확인했다.

실패와 수정: 렌더링 중 ref를 읽던 새 UI를 lint가 막아 요청 제어용 ref와 화면 상태를 분리했다. 첫 새 E2E9개는 select의 정확한 label 텍스트 조회가 실제 접근성 이름과 맞지 않아 대기했다. combobox 역할/이름으로 조작하도록 수정하고 검사를 제거하지 않았다. 별도 시연에서 언어 전환 입력 초기화를 실제 발견해 기존 TravelToolsPage의 locale key를 제거하고 공통 폼 생명주기를 유지했다. 외부 위젯/지도·배너는 개별 key/언어 요청 취소로 정리한다. 이후 관련36개를 다시 통과했다. 전체246개 통과는 보완 전 이력이며 보완 뒤에는 변경된 공통/기존 도구·코스 이동36개를 재검증했다.

첫 시연의 언어 입력 유지 검사는 실제 실패를 기록하고 수정 후 재실행했다. 단위/통합을 E2E와 동시에 실행할 때 기존 api-runtime 검사1건이5초 제한을 초과했고,제한을 늘리지 않고 별도 실행해411개 통과를 확인했다. 기존 Zod 주석·500KB 청크·Node SQLite/색상 안내는 비차단이다.

시연: [PC 공통 검색](design/shared-stay-search-2026-11-25/search-1280.png),[모바일 공통 검색](design/shared-stay-search-2026-11-25/search-360.png). 실제 앱 폼·생성된 링크이며 외부 분석/이미지/iframe은 대역이다. 외부 숙소 결과·가격·호텔 재고를 내부에 적재한 캡처가 아니다. 실제 제공처 UI 확인과 자동 대역을 구분한다.

공공 원본/DB·50코스/내부17테마·제휴 상품402/메인398·명소220·맛집514·기존 사진/번역·.env/의존성/lockfile은 보존했다. 신규 정적 상품0,새 API 비밀키0이다. 클룩 신규 위젯 pending/disabled도 유지한다. 의존성 변경이 없어 재설치는 생략하고 현재 소스로 실제 함수를 다시 패키징했다. 공개 배포/최종 결과는 이어서 기록한다.
