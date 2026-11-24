# Trip Fit 에이전트 지시서

## 현재 범위

작업 전에 docs/intent.md → docs/spec.md → docs/plan.md와 docs/catalog-plan.md, package.json·lockfile·git 상태를 확인한다. 최신 사용자 지시(2026-11-10)가 우선한다: **AI·예산·일정 생성 대신 부산 제휴 상품 소개 사이트**를 구현한다. 기존 계산 엔진 4단계는 착수 전 중단됐다. 과거 1~3단계 공공 API/DB와 proof 이력은 보존한다.

React/TypeScript strict, 사진 중심 매거진 UI, 모바일/PC, 5개 UI 언어를 유지한다. 로그인·일정·지도·AI·예산·내부 결제·관리자·위젯은 새 요청 전 구현하지 않는다. 현재 사이트는 익명 읽기 전용 상품 카탈로그다. 2026-11-12 사용자 요청으로 맛집(/food)·추천여행(/recommended) 공공정보 탭을 추가했다. 공공 안내를 실시간 영업·자동 예약 상품으로 해석하지 않는다. 2026-11-14 요청으로 공영주차장 전체 수집/정규화 CLI를 구현했다. 별도 주차 페이지·공개 API·코스 추천은 없다.

## 실행과 검증

루트 .env를 dev/start에서 읽는다. Windows npm.ps1 오류 시 npm.cmd를 사용한다. .node-version·engines와 lockfile을 유지하고 npm ci로 재현 설치한다.

| 명령 | 목적 |
| --- | --- |
| npm run dev | web 5173, server 3001 |
| npm run lint | 소스 검사 |
| npm run typecheck | strict 타입 검사 |
| npm run test -- --run | 단위/통합 테스트 |
| npm run check:providers | 업체·설정 경계 검사 |
| npm run build | domain → server → web |
| npm run test:e2e | 대역/테스트 서버의 브라우저 검사 |
| npm run start | dist 산출물 실행 |
| npm run db:restore | 검증된 공공 DB 백업을 새 파일로만 복원; 기존 DB 덮어쓰기 금지 |
| npm run db:migrate / db:seed | 기존 공공 명소 DB 명령 |
| npm run data:import -- --locale=ko | .env 키를 사용하는 부산 API 수집 |
| npm run data:refresh | .env 키로 5개 언어 원본과 운영시간·교통·사진 등 갱신; 실패 시 공개 스냅샷 유지 |
| npm run data:food:refresh / data:recommended:refresh | 서버 전용 키로 해당 서비스의 5개 언어 전체 수집·검증·원자 발행. 재시작 후 반영 |
| npm run data:parking-directory:refresh / data:parking-directory:check | 공식 공개 표준 주차자료 전체 수집 후 부산 선별·원자 게시 / 오프라인 재계산 검증 |
| npm run data:parking:refresh / data:parking:check | 공영주차장 전체 수집·기관+번호 정규화·원자 저장 / 원본 재계산을 포함한 오프라인 검증 |
| npm run data:themes:export-attractions | 기존 명소 DB를 읽기 전용으로 추출, DB 변경 없음 |
| npm run data:themes:build / data:themes:check | 원문·명시 매핑의 코스 자료 원자 생성 / 의존성과 결과 재계산 검사; 외부 API 호출 없음 |
| npm run data:publish | 원본 ID·제목·좌표/검수 관계 검증 후 전체 명소 검색 스냅샷 갱신 |

구현 후 lint/typecheck/test/check:providers/build와 변경에 맞는 E2E, dist start smoke를 수행한다. 실패를 수정한 뒤 통과할 때까지 재검증한다. 오류를 숨기거나 검사를 비활성화하지 않는다. 문서만 변경할 때는 구조/참조를 검증하며 빌드는 생략한다.

## 코드와 데이터 경계

- TypeScript strict, unknown부터 스키마 검증. any·타입 단언으로 검사를 덮지 않는다.
- domain은 React·DB·HTTP·환경 변수에 의존하지 않는 순수 계약으로 유지한다.
- React 컴포넌트/타입 PascalCase, 함수/변수 camelCase, 상수/환경 변수 UPPER_SNAKE_CASE.
- 출처·관찰일·통화·원금액·사진 권리·링크 발급 근거를 기록한다. 실제 상품/가격/후기/재고를 만들어 넣지 않는다.
- 개발 fixture를 운영 상품으로 사용하지 않는다. 상품/판매 옵션은 providerId/externalId로 구분한다.
- 미번역 제목과 부산 출발/도착/지역 복합 범위를 표시한다. 가격 없음은 0원이 아니다. 참고가에 인원·박수·환율을 임의 적용하지 않는다.
- 외부 원문은 텍스트로 렌더링한다. 이미지 실패 대체·키보드/44px·요청 취소/오래된 응답 차단·입력/마지막 성공 목록 유지와 재시도를 제공한다.

## 제휴사 변수화

- PROVIDER_A/B/C/D 같은 중립 ID와 registry/공통 능력을 사용한다. 업체 상호·도메인·전체 예약 URL·파트너/추적 값은 **config/catalog 및 서버 config 경계**에서만 관리한다. 컴포넌트·서비스·domain에 업체별 리터럴이나 ID별 분기를 넣지 않는다.
- 실제 발급 URL은 승인 데이터 파일에 보관할 수 있다. 공개 URL에 원래 포함된 추적 ID와 API 비밀키를 구분한다. 비밀 값은 서버 환경 변수로만 관리한다.
- 설정은 enabled/approvalStatus·정확한 allowedHosts·pathPrefixes·추적/중첩 목적지 규칙·표시명을 관리한다. 기존 채널 발급과 신규 사이트 승인은 분리한다.
- UI는 서버가 검증한 최소 공개 DTO로 렌더링한다. 설정 전체·키·계정·서명 비밀값을 프런트/로그/응답에 넣지 않는다.
- 미승인·미매핑·호스트/추적 불일치는 fail closed다. 사용자/AI의 URL로 리디렉트하지 않는다. 승인 전 상품/도메인/추적 규격을 추측하지 않는다.
- 외부 링크는 sponsored noopener noreferrer, 제휴 표기·외부 새 창·가격/날짜/옵션 재확인을 제공한다.
- 상품/사진은 공식 광고 도구나 확인된 허용 소스에서 확보한다. 다른 출처의 사진은 임의로 상품 실사진처럼 사용하지 않는다.
- 설정만 바꾸고 provider를 추가해도 핵심 소스 수정 없이 동작하는지 테스트한다. 단순 문자열 검사로 구조 검증을 대신하지 않는다.

## 자격증명과 안전

루트 .env의 기존 값은 보존하고 필요한 항목만 추가한다. .env.example에는 빈 값과 설명만 둔다. 서비스/컴포넌트는 process.env를 직접 읽지 않으며 서버 config만 읽는다. 키에 VITE_ 접두어를 붙이지 않는다. 미구현 API는 키가 있어도 연결된 것으로 표시하지 않는다.

실제 제휴 클릭/예약·유료 API·외부 이미지를 E2E에서 반복하지 않는다. 기본 대역을 사용하고 별도 실연동 결과를 구분한다. API 키 재발급·계약 동의·신규 계정/채널 제출·예약·결제를 작업 범위로 추정하지 않는다. 사용자 파일과 기존 DB를 임의 삭제하지 않는다.

## 완료 보고

docs/proof.md에 변경 파일·명령/종료 결과·실패 원인과 수정·미실행 항목/이유·실제/대역/미설정 상태·포털 수집과 공개 상품의 수·제외 사유·시연 캡처를 기록한다. 모든 OTA의 전체 재고 확보나 신규 사이트 채널 승인·공개 배포를 확인 없이 완료로 쓰지 않는다. 현재 순서는 docs/catalog-plan.md를 따른다.


## 내부 테마 코스 자료 규칙 (2026-11-15)

17개 선별 템플릿의 원문 순서·서비스별 ID 연결을 구현했다. 공개 페이지/API/추천 엔진은 추가하지 않는다. 상세 근거는 docs/theme-route-review-2026-11-14.md다. assistant-source-evidence를 사람·현장 승인으로 표시하지 않는다. 모든 템플릿의 humanApproval=pending, fieldValidation=not-performed, recommendationEnabled=false를 유지한다. 별칭은 명시적 검토 목록과 원문 인용을 함께 요구하며 이름 유사도로 연결하지 않는다. 원문·장소 fingerprint가 바뀌면 보류하고 원본을 재검토한다. 미해결 노드를 건너뛰어 경로를 합치지 않는다. 맛집 후보는 방문 순서 밖에 두며 직선거리를 이동시간으로 만들지 않는다. 원본 수집·추출·빌드는 동시에 실행하지 않는다.

## 2026-11-18 찜하기·주차 안내 확장

최신 요청으로 /saved와 기기 localStorage 찜을 허용한다. 관광지/맛집/상품 ID·이름·저장 시각만 보관하고 예약 URL/가격/비밀을 캐시하지 않는다. 만료/미공개 항목은 저장에서 자동 삭제하지 않되 예약 링크를 노출하지 않는다. 저장 실패는 성공으로 표시하지 않으며 손상 데이터는 명시적 초기화 전 보존한다. 공식 표준 주차 디렉터리를 기존 검색·관광지/맛집 상세에 연결한다. 미등록 시설까지 전수 확보/실시간 빈자리/현재 운영을 보장하지 않는다. 모든 요금0을 무료로 추정하지 않는다. 코스 추천/내장 지도는 재개하지 않는다.

## 상품 장바구니 규칙 (2026-11-18)

최신 요청으로 /cart와 상품 참고 합계만 허용한다. 최소가 필드가 없는 현재 데이터를 실제 최저가로 표시하지 않는다. 통화별 정확한 십진수 합계, 명시적 수량1~99, 미확인/만료/정체성 불일치 제외를 유지한다. 가격/URL을 localStorage에 저장하거나 서로 다른 통화를 더하지 않는다. providerId/externalId를 원본 DTO와 대조하고 이전 링크로 예약시키지 않는다. 내부 결제·환산·여행 예산/일정 엔진은 재개하지 않는다. 장바구니와 찜 초기화는 각 저장 키에만 적용한다.


## 2026-11-19 표시 통화 환산

최신 사용자 요청으로 언어 기본 통화(KRW/USD/JPY/CNY/TWD)의 상품 표시 환산과 장바구니 참고 합계를 허용한다. 이전의 환산 금지는 이 표시 기능에 한해 대체한다. 원가격/관찰일을 바꾸거나 실제 환전/내부 결제/예산·일정 엔진을 재개하지 않는다. Frankfurter 고정 keyless API는 서버 config 경계에 두며 브라우저는 /api/exchange-rates만 조회한다. 단일 캐시·응답 검증·출처/제공일·오래된 캐시 표시·원통화 복구/재시도를 유지한다. 단가 half-up 반올림 후 수량을 곱하며 BigInt로 합산한다. 환율 실패 시 통화를 재명명하거나 임의 환율/다른 통화 합계를 만들지 않는다. 가격/환율/URL을 localStorage에 저장하지 않는다. 검증은 대역이 기본이며 실제 환율 실연동만 별도 구분한다.


## 2026-11-19 콘텐츠 다국어 보완

상품·관광지·음식점은 원본 ID를 유지하고5개 언어 정적 번역을 제공한다. config/catalog/content-translations.json의 정확한 원문/언어 SHA-256만 적용하고 machine-unreviewed를 사람/공식 승인으로 올리지 않는다. 외국어 원문과 자동 번역 고지·접힌 현지 이름을 구분하며 원문 파일·내부 테마 fingerprint를 임의로 덮어쓰지 않는다. 새 원본 수집/발행·번역 수정 후 npm run data:localization:check를 실행한다. 현재 범위는 상품302/관광지220/음식점538의 표시다. 추천여행은 기존 외국어 원문에 섞인 조각만 보완했으며 언어 누락 전체를 번역했다고 주장하지 않는다. 운영 요청에서 비공식 번역 엔드포인트나 유료 AI를 호출하지 않는다. 상세는 docs/localization-review-2026-11-19.md를 따른다.


## 2026-11-19 사진 없는 중복 음식점 제외

최신 요청으로 config/catalog/food-visibility.json의 명시 검수24개 사진 없는 중복 ID만 공개 제외한다. source538/public514,사진 있는491/사진 없는 독립23을 유지한다. 원본 공공 JSON/DB/테마 근거는 삭제하지 않는다. 이름만으로 병합하거나 사진 없는 항목을 전부 제외하지 않는다. 검수 fingerprint·사진 상태 변경 시 재검수하고 data:localization:check를 통과시킨다. 제외 ID의 상세404와 한국어 fallback 차단,다국어 일관성,추천여행 namespace 분리,기존 찜 보존을 검증한다. 주소/좌표 충돌을 임의 교정하지 않는다. 상세는 docs/food-dedup-review-2026-11-19.md다.


## 2026-11-23 제휴 링크 우선순위

provider.displayPriority와 bookingPolicy,featuredGroups를 사용한다. 메인만 검수된 같은 숙소의 현재 유효 대표를 고르며 임의 제목 유사도 병합을 하지 않는다. 원본 ID·가격·날짜·URL을 다른 판매처 값으로 바꾸지 않는다. 제한된 제공처는 bookingEligibility의 한국인 가이드/외국인 참가/통역/해외카드 근거·원본 ID·허용 출처·유효기간이 모두 맞을 때만 노출한다. 현재 미검증185개 공개 제외,117개 링크/메인113개다. 실제 검증0개에 배지를 임의 부여하지 않는다. 원본과 기존 찜/장바구니를 지우지 말고 공개404와 예약 URL/금액 차단을 유지한다. 상세 예약은 최신 API 성공 후에만 표시한다. docs/affiliate-presentation-review-2026-11-23.md를 따른다.


## 2026-11-23 신규 제휴 카탈로그

PROVIDER_E는 config/catalog/provider-e-source.json의 공식5개 언어/6개 부산 범주와 등록 CID 발급 근거를 사용한다.290개 중285개 공개·5개 보류,전체402/메인398이다. 순위35로 기존3사 순서를 유지한다. localizedHrefs는 실제 관찰된 원어 URL만 허용하고 원본 ID·CID를 검증한다. 원어 미제공은 bookingLocale로 안내하며 가이드 언어/국적 자격으로 해석하지 않는다. 정적 번역은 localizedTitleSourceHash(원문 언어+제목 SHA-256)가 바뀌면 재검수한다. 영문 등 공식 페이지에 남은 한국어도 검수한다. 사진은 같은 원본 상품의 공식 카드/상세만 사용하며 지연 로딩 누락을 다른 상품 사진으로 메우지 않는다. 누락·범위 불명확 상품과 상담용 페이지는 임의 발행하지 않는다. docs/provider-e-catalog-review-2026-11-23.md를 따른다.

## 2026-11-23 누락·깨진 맛집 사진 보완

config/catalog/food-photo-overrides.json의 명시 검수 5개 연결(사진 누락 4개/깨짐 1개)만 적용한다. 원본 food.json/DB/중복 제외 정책/번역·테마 지문은 보존한다. 공개 맛집514/사진 있음495/미확보19이며 기존 중복24개는 복원하지 않는다. 대상·사진 제공 원본의 전체 언어 지문/사진 URL/제공 ID가 바뀌면 재검수한다. 이름 유사도나 근접 좌표로 자동 연결하지 않고 다른 지점/공통 기본 이미지를 실사진으로 쓰지 않는다. 같은 숫자 추천여행 ID에 적용하지 않는다. 미확보 목록과 전화·주소 표기 차이는 docs/photo-review-2026-11-23.md, 실제 이미지 디코딩 결과는 docs/photo-audit-2026-11-23.json을 따른다. 사진 실연동은 별도 검수이며 E2E는 외부 이미지 대역을 유지한다.

## 2026-11-23 외국인 기본 언어·메인 프로모션

첫 UI 진입/잘못된 locale은 en이다. 유효한 명시 URL과 헤더 선택을 우선하고 홈/새로고침/뒤로가기도 URL로 보존한다. 최초 HTML도 영어다. 기존 공공 API의 default ko 계약은 전체 변경하지 않고 UI가 locale을 명시한다. 한국어 회귀 E2E는 locale=ko를 명시하고 영어 기본 진입은 별도 검증한다.

메인 특가·쿠폰은 config/catalog/promotions.json 검수 항목만 /api/promotions 최소 DTO로 제공한다. 공식 출처·기간·짧은 reviewExpiresAt·시장/신규회원/최소금액/상한/여행일을 기록하며 가격·장바구니에서 차감하지 않는다. 공통 validateLink로 추적·중첩 목적지를 검증하고 제한 제공처의 예약 자격을 우회하지 않는다. 만료/미승인/재검수 경과 자동 비공개와 클라이언트 만료/재시도/오래된 응답 차단을 유지한다. 로컬 API 재조회는 외부 행사 자동 수집이 아니다. 현재3건 확인/2사 보류이며 docs/promotion-review-2026-11-23.md와 JSON을 따른다. 모든 국가·옵션 적용을 보장하거나 과거/재배포 금지 코드를 추측해 쓰지 않는다.

## 2026-11-24 Vercel Services 배포 검토

루트 vercel.json은 web(Vite)/server(Fastify) 두 서비스다. /api 및 /api/**는 server,나머지는 web이며 접두사를 제거하지 않는다. 현재 정적 브라우저→공개 API 구조에는 서버 간 호출/바인딩이 없다. 바인딩을 Vite 빌드나 브라우저 환경변수로 넣지 않는다. 요청 함수 app.ts는 runtime을 지연 생성하고 ready 후 전달하며 로컬 index.ts의 listen과 분리한다. HTTP 함수는 항상 readOnlySnapshot:true로 공개 백업을 읽고 migrate/mkdir/수집/쓰기를 하지 않는다. 로컬·CLI DB는 기존 규칙을 유지한다. .vercel와 임시 CLI 도구는 Git 제외다. 사용자가 서비스명·공개 경로·바인딩 최종 확인을 요청했으므로 확인 전 push/배포하지 않는다. vercel dev의 저장소 원본 파일 정적 서빙과 클라우드 배포 결과를 구분하고 개발 서버를 외부에 공개하지 않는다. docs/vercel-deployment-2026-11-24.md의 한계와 Preview 검증 절차를 따른다.

Services의 runtime에 nodejs24.x 같은 함수 산출물 버전 문자열을 넣지 않는다. Fastify는 자동 감지하며 Node24는 apps/server/package.json의 engines.node와 lockfile로 관리한다. 로컬 CLI 성공과 클라우드 구성 검증/배포 성공을 구분한다.

Vercel 서비스별 installCommand는 저장소 루트에서 npm ci --include=dev --workspaces --include-workspace-root를 실행한다. 루트 TypeScript와 workspace 개발 의존성을 포함하며 NODE_ENV=production에도 빌드 도구를 생략하지 않는다. 기존 node_modules만으로 배포 설치를 검증했다고 주장하지 말고 깨끗한 복사본에서 설치→서비스별 빌드를 확인한다. 전역 tsc/npx 최신 버전으로 누락을 숨기지 않는다.

API 서비스는 일반 tsc dist를 함수 루트로 자동 선택하지 않게 outputDirectory=.를 유지한다. 서비스 buildCommand는 domain build와 server typecheck이며 Vercel이 원본 모듈을 변환/추적한다. @vercel/backends의 includeFiles는 저장소 루트 기준이다. 로컬 HTTP smoke뿐 아니라 실제 빌더가 만든 함수 파일을 독립 디렉터리에서 실행하고 상품·프로모션 API를 검사한다. Ready 상태만으로 서비스 정상 동작을 판정하지 않는다.

API 함수가 사용하지 않는 정적 서버 플러그인을 최상위 import하지 않는다. @fastify/static은 webRoot가 있는 로컬 화면 서버의 초기화에서만 동적으로 불러온다. Vercel의 require(ESM) 제한은 --no-experimental-require-module로 별도 재현하며 로컬 Node 기본 동작만으로 판단하지 않는다.


## 2026-11-24 코스 아이디어 허브·첫 방문 팝업

최신 사용자 요청으로 /courses 목록·상세와 /api/courses를 추가한다. 가족/데이트/맛집/dallaBusan 각10개,총40개는 editorial-idea 미리보기이며 최적화/운영자·현장 검수가 끝난 일정이 아니다. 원본 ID/지문과 기존 공개 제외 정책을 검증하며 불일치 시 코스 전체를 보류한다. 기존 내부17개 테마의 pending/not-performed/recommendationEnabled=false는 보존한다.

상단 메뉴는 Home → Attraction search → Busan Courses → Find restaurants → Travel inspiration → Saved다. 코스는 기존 페이지에 추가한다. 관광지 검색(/search),관광지 상세(/places/:slug),추천여행(/recommended와상세)은 별도 메뉴/페이지로 유지하고 홈·검색의 관광지 추천 배너를 보존한다. 잘못 통합했던 /courses/inspiration 링크는 /recommended로 호환 연결한다. 가족의 주차/메뉴는 기존 출처 안내로 연결하며 아이 적합성/빈자리·입구/최적 동선 검증을 주장하지 않는다.

홈 팝업은 사용자 수정 v2 콜라주와 5개 언어 HTML을 사용한다. 하단2버튼만 두며 Close/Escape/카테고리 이동은 탭 세션,하루 안 보기는 기기 현지 날짜 자정까지 억제한다. 전용 저장 키만 쓰고 찜/장바구니는 보존한다. 저장 실패를 성공으로 표시하지 않으며 키보드/초점 복귀/360px를 검증한다. 상세 상태·미선정 장소/수상/동선 이월은 docs/courses-plan.md와 docs/proof.md를 따른다.

## 2026-11-24 코스 상세 보완·내장 지도

최신 사용자 요청으로 40개 공개 편집 코스에 React-Leaflet/OSM 지도와 OSRM 도보·차량 경로를 허용한다. 이전 내장 지도 미구현 범위는 이 기능에 한해 대체한다. AI·예산·실시간 교통·글로벌 최적화·현장 승인으로 확대하지 않는다. 원본 대표 좌표를 임의로 입구로 옮기지 않는다. 라우팅은 `data:courses:routes:refresh` CLI의 고정 keyless 서비스에서 1.5초 간격으로만 호출하며 HTTP 함수/브라우저는 저장 snapshot을 읽는다. `data:courses:check`를 실행한다. 모드·순서·ID·좌표 지문 변경 시 저장 경로를 사용하지 않고, 누락 중간 지점을 건너 연결하지 않는다. 타일 테스트는 대역이며 실제 OSM 타일 prefetch/오프라인 다운로드를 금지한다. 경로 수집일/출처·모델 예상 이동·편집 체류시간을 구분하고 human/field pending 상태를 유지한다. 메뉴/사진/운영시간은 기존 검수·언어·공개 제외 정책을 우회하지 않는다. 관광지 검색·추천여행·홈/검색 배너와 팝업은 보존한다. 상세는 docs/course-map-review-2026-11-24.md를 따른다.

## 2026-11-24 AdSense 수동 광고 준비

최신 사용자 요청으로 로그인된 기존 계정의 자동 광고/자동 최적화를 해제하고 상세 페이지 하단 수동 반응형 단위1개를 준비한다. 본문 너비/메뉴를 줄이지 않는다. 발급된 공개 publisher/slot/ads.txt만 사용하고 비밀키로 취급하지 않는다. 소유권 메타 태그/ads.txt 공개 확인과 Google Ready 승인을 구분한다. enabled·실제 승인·동의/CMP 검토 게이트가 모두 충족되기 전에는 JS/요청/빈 슬롯을 만들지 않는다. 실제 광고 클릭·반복 로딩·임의 개인정보 설정·신규 약관 동의는 금지한다. 계정 privacy 설정은 운영자가 검토한다. docs/adsense-setup-2026-11-24.md와 proof.md를 따른다.


## 2026-11-24 상품 상세창·관련 상품

최신 사용자 요청으로 상품 상세창 확대·고정 닫기·바깥 여백 클릭/Escape 닫기·하단 관련 상품을 제공한다. 관련 상품은 검수된 명소 관계 우선, 같은 category/scope 보완, 기존 공개 자격·제공처 우선순위·숙소 그룹 검수를 유지하며 최대6개다. 자기 자신/미공개/만료 제외와 빈 상태를 제공한다. 다른 상품 선택 시 중첩 창/이전 예약 URL 없이 현재 상세를 다시 조회한다. 배경 스크롤/초점을 복구하고 본문 드래그로 닫지 않는다. 5개 언어·찜/장바구니/표시 환산과 기존 페이지를 보존한다. 상세는 docs/offer-dialog-review-2026-11-24.md를 따른다.


## 2026-11-24 관련 체험·주변 권역 숙소·사용자 제공 위젯

최신 요청으로 관련 목록을 같은 명소 비숙소 우선·명시 편집 유형의 같은 scope 체험으로 제한하고, 숙소는 검수된 stay 권역만 별도 표시한다. 기존 category/scope 단독 보완은 폐기한다.34유형217개 상품의 원문 ID/지문 불일치는 관련 분류에서 제외한다. 각 목록 최대6개·현재 공개 자격·제공처 우선순위·검수 숙소 그룹 중복 방지를 유지한다. 사용자 제공 지도/다이내믹 배너는 숙소 영역의 수동 버튼에서만 외부 sandbox iframe으로 연다. 기존 상품과 지도/배너의 별도 발급 CID를 섞지 않는다. 배너는 할인 전용이 아니고, 부산 시청 중심 지도는 현재 명소의 근처 지도로 오인시키지 않는다.5개 언어·통화·모바일·모션 감소·오류 재시도를 검증한다. 임베드 공개 식별값과 비공개 API키를 구분하고 업체별 값은 서버 config/catalog 경계에만 둔다. 상세는 docs/related-offers-review-2026-11-24.md를 따른다.


## 2026-11-24 제휴 도구 허브

최신 요청으로 /travel-tools와 홈/푸터 진입을 허용한다. 상단6메뉴/기존 페이지는 보존한다. 실제 발급된 도구만 config/catalog/travel-tools.json과 서버 config에서 관리하고 메타데이터/현재 프레임 API를 구분한다. 새 숙소 검색창2개는 발급된 영어 버전임을 고지하고, CID28288의5개 언어 상품 광고는 각각의 실제 OID를 사용한다. 아고다 지도는 사용자 지정 사이트1980997의 새 발급 refKey/crt로 변경한다. 인스타그램 AID의 클룩 신규 웹사이트 위젯 사용은 미확인으로 pending/disabled이며 공개하지 않는다. 도구 클릭 전 외부 로드0,HTTPS 호스트/경로/추적값·정확한 iframe origin/source·높이 범위·모바일·외부 새 창·5개 언어를 검증한다. 비공개 API 연결/신규 계약·채널 생성으로 범위를 확대하지 않는다. 상세는 docs/affiliate-tools-review-2026-11-24.md를 따른다.
