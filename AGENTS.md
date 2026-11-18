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
