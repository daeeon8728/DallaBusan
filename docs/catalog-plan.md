# 부산 제휴 상품 카탈로그 실행 계획

2026-11-10 사용자 변경 지시: AI·예산·일정 생성 대신 부산 관련 패키지·투어·티켓·체험·숙소를 실제 제휴 링크로 소개하는 사이트를 만든다. 기존 계산 엔진 4단계는 착수 전에 중단됐으며 코드가 없다. 과거 1~3단계 기록과 공공 API/DB는 보존한다.

## 파일과 작업 순서

1. 로그인된 4개 포털에서 실제 링크/공식 export 확보. API 규격이나 추적 값을 추측하지 않는다.
2. config/catalog에 원본 스냅샷·중립 provider 레지스트리·검수된 상품/링크·제외 사유를 관리한다.
3. domain/offers 스키마, 서버 config 로더와 공통 링크 검증·조회 서비스를 구현한다.
4. React 사진 중심 홈페이지, 검색/카테고리/판매처 필터, 페이지 이동, 상품 상세와 외부 예약 이동을 구현한다. 5개 UI 언어·360px 이상 반응형을 유지한다.
5. 호스트/추적/중첩 목적지/미승인·만료 상품·추가 provider·빈 결과·실패 재시도·언어 대체·키보드/모바일을 검증한다.
6. lint/typecheck/test/check:providers/build/E2E와 dist start smoke, proof 기록으로 마무리한다.

## 범위와 위험

- 사이트 방문자는 로그인하지 않는다. 예약·결제·변경/취소는 판매처에서 처리한다. 개인정보를 수집하는 폼·계정·내부 결제·관리자·위젯·지도는 현재 범위가 아니다.
- .env의 기존 키는 보존하고 프런트에 넣지 않는다. 실제 API 어댑터가 없는 제공처에 키가 있다고 연결된 것으로 표시하지 않는다.
- 가격은 관찰한 원통화 참고가이며 객실/1인/전체 옵션 가격을 확정하지 않는다. 환산·예산 계산·실시간 재고 보장은 없다.
- UI는 표시명/URL을 서버 DTO에서 받는다. PROVIDER_A 등의 registry와 서버 설정만 실제 업체 도메인·추적 규격을 안다.
- 클룩 공식 CSV 29건, 마이리얼트립 투어/티켓 중복 제거 258건 및 부산 관련 패키지 3건, 트립닷컴 관찰 detail 84건 및 유료 명소 9건, 아고다 개별 숙소 10건을 원본으로 기록한다. 검수 후 공개 수는 별도로 집계한다.
- 부산 출발/도착 및 부산·경남 복합 상품은 부산 내 상품과 구분한다. 무관한 해외 추천/배송 상품과 지난 기간 상품은 제외한다. 애매한 위치는 검토 대기다.
- 아고다 전세계 공식 숙소 파일 약 467MB는 2개 전송 방식에서 서버가 중간 종료했다. 전체 숙소 수집을 완료한 것으로 표시하지 않고 공식 부산 전체 보기 링크를 제공한다.
- 포털의 기존 채널로 발급한 링크다. 새 Trip Fit 웹사이트의 채널/홍보 허용 범위는 각 제휴사 확인 후 공개 배포한다. 로컬 구현을 웹사이트 승인 완료로 표시하지 않는다.
- 공식 광고 도구가 제공한 이미지만 해당 상품에 사용한다. 그 외는 출처/사용권이 확인된 부산 대표 이미지를 명시적으로 구분해 사용한다. 공개 사이트 사진을 임의 복제하지 않는다.
- '전체 상품'은 검수된 로컬 카탈로그 전체다. 모든 OTA의 전세계/영구 전체 재고 수집을 주장하지 않는다.

## 완료 상태 — 2026-11-10

1~6 작업을 로컬 구현·검증까지 완료했다. 원본 393건 중 90건 제외, 공개 303건(PROVIDER_A 79 / B 29 / C 185 / D 10)이다. 단위·통합 100개, E2E 18개, lint/typecheck/check:providers/build와 dist production start smoke를 통과했다. 실제 파일·실패 수정·화면·남은 운영 제한은 [proof.md](proof.md) 마지막 절을 따른다. 신규 사이트 채널 승인·공개 배포·상품 API 자동 갱신·전체 숙소 파일 수집은 완료로 포함하지 않는다.

## 2026-11-11 검색·명소 확장 작업 순서

1. 기존 공공 API 수집본과 실제 제휴 상품을 확인하고 명소·상품 관계/주소/사진 근거를 검수한다.
2. domain 명소 DTO → 서버 config/catalog/destinations.json 스냅샷 로더 → 공통 조회/관계 서비스 → 읽기 전용 API 순서로 구현한다.
3. 상품 카드/dialog를 공용 UI로 분리하고 /search URL 상태·배너·/places/:slug 다국어 상세를 연결한다.
4. 만료 월·누락 번역·비활성/만료 링크·잘못된 관계·API 오류·직접 진입/새로고침·뒤로/앞으로·언어 전환·예약 이동을 검증한다.
5. lint/typecheck/test/check:providers/build/E2E, 빌드 산출물 start smoke와 화면 캡처를 proof에 기록한다.

생성/수정 파일: packages/domain/src/destinations.ts 및 index, apps/server/src/{config,services,routes}/destinations.ts, app.ts/index.ts, config/catalog/destinations.json, apps/web/src/{App,Offer,Destinations}.tsx, i18n/guide.ts, styles/global.css, tests/integration/destinations.test.ts, tests/e2e/destinations.spec.ts, 관련 문서/캡처.

상품 총수는 기존 303개를 유지한다. 현재 상품 10개를 2개 명소와 연결하며 새 상품이나 추적 규격을 만들어 추가하지 않는다. 명소 스냅샷/월별 큐레이션은 수동 검수 갱신이며 수집 명령 실행만으로 공개 내용을 자동 갱신하지 않는다.

확장 구현 완료: 검색·명소 API/화면과 검수된 관계 10개를 연결했다. 단위·통합 111개, E2E 30개, build 및 dist production start smoke를 통과했다. 최종 증거와 실패 수정은 proof 마지막 절에 기록한다.

## 전체 수집본 연결 확장 (2026-11-11)

작업 순서: 원본 전체/상품 대조 → 명시적 관계·별칭 검수 → ADDR1 실제 계약 확인/수집 → 안전한 data:publish → 페이지 검색 API/명소 연관 상품 검색 → 전체 검색 UI·정확한 미확인 상태 → 단위/통합·E2E·빌드·산출물 확인.

파일: services/publish-destinations.ts, scripts/publish-destinations.ts, config/catalog/{destination-relations,destination-coverage,destinations}.json, domain/destinations.ts, 서버 명소 config/service/routes 및 offers service/routes/app, AttractionService parse.ts, web Destinations.tsx/App.tsx/i18n/guide.ts/styles, package.json/AGENTS/문서/검증.

전체 원본 ID 그룹 220개와 언어 레코드 1,044개, 상품 연결 관광정보 25개·상품 117개·관계 190개다. 국문 주소 213건을 실제 API로 갱신했다. 제휴 상품 총수 303개/실제 URL/가격 관찰일은 유지하고 투어로 확인한 4건의 분류만 바로잡았다. 모든 관광정보에 예약 상품이나 사진이 확보됐다고 표시하지 않는다.

## 2026-11-12 음식점·테마여행 확장 순서와 완료

1. 두 공식 API의 실제 5개 언어 응답·공식 데이터셋 이용허락을 확인하고 서버 전용 키를 분리했다.
2. domain/guides 계약 → 서버 config/guides와 providers/guides 파서/크기 제한 HTTP → services/refresh-guides 전체 수집/원자 발행 → 로컬 조회 services/guides → 읽기 전용 routes/guides 순서로 구현했다.
3. 공용 취소/재시도 훅을 분리해 기존 관광지 동작을 유지하고, PublicGuides와 5개 언어 문구/독립 경로/반응형 스타일을 연결했다.
4. 실제 수집본 food.json(2,127개 언어 레코드), recommended.json(1,191개 언어 레코드)을 발행했다. 단위·통합 171개, 3개 화면 크기의 E2E 69개, lint/typecheck/check:providers/build를 통과했다. 산출물 점검·캡처·제한은 proof.md 마지막 절을 따른다.
5. 후속 갱신은 npm run data:food:refresh 또는 npm run data:recommended:refresh 후 서버를 재시작해 반영한다. 외부 API 실패 시 이전 파일을 유지하며 자동 스케줄러는 추가하지 않는다. 최신 서버 재개 요청으로 로컬 4320 서버와 외부 HTTPS 터널을 재실행했다. 임시 미리보기이며 상시 호스팅/신규 제휴 채널 승인 완료는 아니다.

## 2026-11-14 테마여행·공영주차장 향후 활용

최신 요청은 계획과 서버 설정 준비까지다. [tourism-parking-plan.md](tourism-parking-plan.md)의 작업 순서를 따른다. 기존 테마여행 연동을 재사용하고 공영주차장 endpoint/서버 키만 추가했다. 주차 독립 페이지·수집 파이프라인·코스 추천·AI·예산을 이번에 구현하지 않는다. 실제 1건씩 인증 확인과 전체 운영 연동을 구분한다.

## 2026-11-14 공영주차장 전체 수집·정규화 완료

최신 요청으로 parking 계약→안전한 HTTP/응답 파서→정규화→전체 수집→원본 보관/원자 저장→오프라인 재검증을 구현했다. 실제7페이지615행을 기관+관리번호 복합키로615개 보존했고, 격리0이다. 원본 필드와 품질 집계는 config/catalog/parking.json에 있다. data:parking:refresh/check로 수동 갱신·검증한다. 오래된 기준일과 미확인 요금/잔여면수를 현재 사실로 해석하지 않는다. 주차 페이지·공개 API·추천 엔진은 추가하지 않았다. 세부 상태는 tourism-parking-plan 및 proof 최신 절을 따른다.


## 2026-11-15 테마 코스 템플릿·장소 연결 구현

사용자 승인 범위는 화면 없이 내부 코스 자료를 구조화하고 원문 방문 순서를 검증하는 단계다. 상세 결과는 [검수 보고서](theme-route-review-2026-11-14.md), 계약·CLI는 [운영 절차](operations.md)의 최신 절을 따른다. 기존 공공 소개/상품 화면과 공개 API는 그대로 유지한다.

테마 원본402그룹/1,191언어 레코드 전체의 coverage를 기록하고, 16개 원본 그룹에서17개 템플릿을 선별했다. 원문 순서 확인15개, 장소까지 확인한 부분 템플릿1개, 검토 대기16개, 연속 구간8개다. 관광지 연결35회·맛집 방문 연결2회, 별도 맛집 후보19개(원문 언급2/직선1km 후보17)를 확인했다. 연결 횟수는 고유 물리 장소 수가 아니다. 미선별386그룹과 미해결43개 방문 노드를 숨기지 않는다.

모든 템플릿은 assistant-source-evidence의 원문 대조이며 humanApproval=pending, fieldValidation=not-performed, recommendationEnabled=false다. 원문·장소 fingerprint 변경 시 기존 승인을 재사용하지 않는다. 불명확한 별칭·복합 장소 좌표·본관/별관은 보류한다. 맛집 후보는 방문 순서에 삽입하지 않으며 직선거리를 이동시간으로 바꾸지 않는다. 사람·현장 검수, 주차 후보, 실제 길찾기, 자동 추천·UI는 후속 범위다.
