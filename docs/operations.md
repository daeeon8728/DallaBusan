# 부산 제휴 상품 카탈로그 운영

## 현재 실행과 데이터 경계

2026-11-10부터 AI·예산·일정 대신 익명 읽기 전용 상품 사이트를 운영 범위로 삼는다. npm run build 후 npm run start로 빌드 산출물을 실행한다. production 모드의 카탈로그 시작은 허용한다. 이전 일정 계정 서비스의 인증 전제 차단과 현재 상품 사이트를 혼동하지 않는다. 현재 인증 우회·개인 데이터 쓰기·내부 결제 API는 없다.

GET /api/offers?locale=ko 에서 catalogTotal 303을 확인한다. 초기 페이지는 24개다. category/provider/scope/q/page/limit으로 검색하며 잘못된 쿼리는 400이다. GET /api/offers/:id 는 없는 상품을 404로 반환한다. 응답에는 원본 검수 설정·API 키가 없으며 Cache-Control: no-store를 적용한다.

루트 .env를 서버 전용으로 읽는다. 상품 표시에는 키가 필요하지 않으며 기존 키를 덮어쓰지 않는다. 현재는 제휴 상품 API 자동 동기화·가격/재고 갱신·관리자 UI가 없다. 서버 시작 시 config/catalog/offers.json을 읽으므로 파일 변경 후 재시작이 필요하다.

## 수동 상품 갱신

1. 공식 포털/export/계약을 확인한 소스로 원본을 확보한다. 기존 config/catalog/provider-*-source 파일 및 별도 packages/attractions 원본을 참조하고 확인 날짜를 남긴다. 비밀키·계정 정보는 파일에 넣지 않는다.
2. 외부 ID와 providerId로 중복을 확인한다. 부산 내/부산 출발/부산 도착/지역 복합 범위와 카테고리를 검수한다. 무관한 지역·배송 상품·지난 기간·위치 불명확 항목은 공개 카탈로그에서 제외하고 exclusions.json에 이유를 남긴다. 현재 원본 393 / 제외 90 / 공개 303이다.
3. 실제 발급 링크·공식 export 또는 검증한 승인 템플릿만 사용한다. config/catalog/offers.json의 providers에 정확한 호스트·경로·필수 추적 값·중첩 목적지 정책을 관리한다. 사이트 상호/도메인/추적 값은 config 경계 밖에 쓰지 않는다. providerId별 핵심 로직 분기는 금지한다.
4. 각 offers 항목의 sourceUrl, externalId, titleLocale, checkedOn, linkEvidence를 기록한다. checkedOn은 실제 확인일이다. 가격은 원통화 decimal 문자열과 함께 기록하고 미확인은 null로 둔다. 관찰하지 않은 가격의 날짜만 새로 바꾸지 않는다.
5. 확인된 유효 종료일은 expiresOn에 기록한다. null은 무기한 판매 보장이 아니라 미확인이다. Asia/Seoul 날짜 기준 만료 항목은 목록/상세에서 제외한다. 수량·예약 가능일·최종 옵션은 판매처 재확인을 안내한다.
6. 공식 광고 도구의 해당 상품 이미지 또는 사용권이 확인된 대표 이미지만 사용한다. product/destination 구분과 credit을 기록한다. 대표 사진은 상품 실사진으로 표시하지 않는다. review-assets/credits.json과 UI 출처/라이선스를 유지한다.
7. lint/typecheck/test/check:providers/build/E2E와 빌드 산출물 smoke를 수행하고 proof에 결과·변경 수·제외 이유를 기록한다. E2E는 실제 제휴 이동을 반복하지 않는다.

미승인/비활성 provider는 공개하지 않는다. 잘못된 링크 설정은 시작 시 검증 오류로 거부하며 임의 URL로 대체하지 않는다. 최근 성공 데이터를 유지하는 UI 동작과 별개로 서버의 잘못된 설정을 조용히 숨기지 않는다. 되돌리려면 직전 검증된 카탈로그 파일을 복구하고 재시작한다.

## 공개 배포 전 남은 확인

현재 approvalStatus는 기존 채널 링크 이용 근거이고 websiteApproval은 별도 미확인 상태다. 네 곳 모두 새 Trip Fit 사이트의 사용 허용 범위를 확인한 뒤 공개 배포한다. 로컬 미리보기는 공개 배포가 아니다.

아고다 전체 파일은 두 번 전송 중 종료됐다. var/imports의 부분 ZIP을 입력으로 사용하지 않는다. 현재 숙소 10개와 부산 전체 보기 링크만 검증됐다. MyRealTrip 개발 문서는 점검 중이어서 상품 API 규격을 확정하지 않았다. 가격/재고 주기 갱신·운영 담당·사진 및 번역 권리·백업/배포 정책은 확정이 필요하다.

## 기존 부산 명소 API 운영

아래는 보존한 3단계 기능의 운영 안내다. 상품 카탈로그의 원본/공개 승인과 별도다. 기존 명소 DB의 비활성 provider seed를 현재 config/catalog의 실제 제휴 상품 설정과 혼동하지 않는다.
이전 3단계의 로컬 명소 수집·검수 기능은 유지한다.

## 실행

루트 .env에 사용자가 발급받은 ATTRACTION_SERVICE_KEY를 입력한다. 키는 서버에서만 읽으며 파일을 커밋하지 않는다. 다른 자격증명 값은 보존한다. .env.example에는 실제 키를 넣지 않는다.

```sh
npm run db:migrate
npm run db:seed
npm run data:import -- --locale=ko
npm run data:import -- --locale=en
npm run data:import -- --locale=ja
npm run data:import -- --locale=zh-CN
npm run data:import -- --locale=zh-TW
npm run dev
```

PowerShell 실행 정책 문제 시 npm.cmd를 사용한다. data:import는 locale 인수 1개만 허용한다. 실행 결과 complete는 수집 완료이며 검수 완료가 아니다. partial/failed는 종료 코드 1이다. 실패 원인을 해결하고 같은 명령으로 재시도한다. 정상 캐시는 재사용되고 같은 원본은 중복 생성되지 않는다.

DATABASE_PATH의 상대 경로는 서버를 어느 workspace에서 실행해도 저장소 루트를 기준으로 해석한다. 기본은 var/trip-fit.sqlite다. E2E는 :memory: DB를 사용해 사용자 DB를 수정하지 않는다. 서버 시작은 기존 마이그레이션 체크섬을 검사하고 새 마이그레이션을 적용한다.

## 캐시·갱신

ATTRACTION_TIMEOUT_MS=10000, ATTRACTION_CACHE_TTL_MS=3600000, ATTRACTION_MAX_PAGES=20이 기본값이다. 페이지 크기는 100건이다. 키와 전체 요청 URL을 로그에 남기지 않는다. 외부 호출 한도·실패 규칙은 api-contracts.md를 따른다.

TTL 내에는 재수집 명령도 캐시를 사용한다. 최신 원본이 필요하면 TTL 이후 재수집한다. 브라우저의 장소 조회는 외부 요청을 발생시키지 않는다. 별도 승인 없이 캐시 테이블을 직접 삭제하거나 대량 반복 수집하지 않는다.

마지막 성공 데이터는 수집 실패로 지워지지 않는다. locale별 원본은 분리되며 부분 수집을 전체 최신 스냅샷으로 해석하지 않는다. 삭제된 명소의 자동 정리와 주기 갱신은 아직 없으므로 출시 전 운영 절차를 정한다.

## 사람의 검수

1. 원본 ID·언어·출처·수집 일시·좌표·본문·휴무와 사진 원본을 확인한다. 미번역 제목 경고를 먼저 처리한다.
2. 카테고리·권역·체류 시간·좌표 및 비용 근거를 검수한 로컬 seed를 준비한다. 가격이 없으면 null을 유지한다.
3. 사진은 실제 라이선스·저작자·출처 확인 후 Translation.image에 넣는다. 원본 API 사진 URL만으로 사용권을 만들지 않는다.
4. 다국어가 같은 장소인지 확인한 경우에만 config/attraction-mappings.json에 locale/sourceId/placeId/reviewedAt을 추가한다. 대상 canonical 장소를 먼저 seed한다. 이름 기반 자동 병합은 금지한다.
5. 검수된 필드의 fieldSources와 검수 시각을 기록한다. API 갱신 후 보호 여부를 확인한다. 기본 seed는 unverified 및 test fixture를 거부한다.

관리자 UI·검수 자동 승인·제휴 상품 자동 매칭은 구현하지 않았다. normal seed와 tests/fixtures는 분리한다. 기존 DB seed의 provider는 비활성이다. 현재 상품 사이트의 config/catalog 설정은 별도다.

## 확인

빌드 후 npm run start에서 /api/catalog/status와 /api/places?locale=en&limit=1을 확인한다. configured는 키 입력 여부, lastImport는 마지막 수집 결과다. 목록의 stale·translationFallback·reviewStatus를 확인한다. 사진 미승인 값과 자동 일정 불가 상태를 숨기지 않는다.

검증 명령·결과와 실연동 건수는 proof.md에 기록한다. SQLite 파일·백업·.env는 Git에 넣지 않는다. Node 24의 node:sqlite 실험적 상태, 단일 프로세스 동기 접근, 백업·복구·다중 인스턴스 운영은 배포 전에 검토한다.


## 명소·월별 배너 갱신 — 2026-11-11

config/catalog/destinations.json에 명소 slug, sourceId가 명시된 5개 언어 소개 발췌/원본 수집일, 검수일, 주소 공식 출처, 사용권이 확인된 사진, 관련 offerId/관계/근거를 관리한다. 이 파일은 미검수 attraction_records와 별도인 공개용 검수 스냅샷이다. data:import 실행만으로 이 파일을 바꾸지 않는다.

month(YYYY-MM)와 featuredSlugs를 검수해 변경한다. Asia/Seoul 현재 월과 다르면 featured는 빈 배열이며 일반 가이드로 표시한다. 월 숫자만 바꿔 오래된 내용을 새로 검수한 것처럼 표시하지 않는다. 새로운 명소/숙소는 주소·방문 포함 여부·권역 근거를 검수하고 단순 이름 검색으로 자동 연결하지 않는다.

현재 감천문화마을 투어 3/티켓 1/체험 2/숙소 1, 광안리 체험 2/티켓 1이다. 감천 숙소는 남포동 권역이며 도보 인접을 보장하지 않는다. 광안리 숙소는 검수된 매핑이 없어 빈 상태를 표시한다. 상품은 기존 303개를 재사용한다.

갱신 후 전체 검증과 재시작을 수행한다. /search?locale=en, /places/gamcheon?locale=en 직접 진입·새로고침, 월 만료·누락 번역·만료 상품·재시도를 확인한다. 신규 자동 스케줄러/관리자/지도는 추가하지 않았다.

## 전체 관광정보 갱신 절차 (2026-11-11, 최신)

이 절이 앞선 '최초 명소 2개' 운영 기록보다 우선한다.

1. 루트 .env 키로 npm run data:import -- --locale=ko를 실행한다. 다른 언어 갱신도 기존 5개 locale 명령을 사용한다. 실패하면 마지막 성공 원본을 유지한다.
2. config/catalog/destination-relations.json의 명시적 sourceId/offerId·별칭·관계·원본 증빙을 검수한다. 신규 상품이 생겨도 이름 매칭으로 자동 예약 관계를 확정하지 않는다. 전포공구길↔전리단길 별칭은 부산시 공식 관광정보/시보에서 확인했다.
3. npm run data:publish를 실행한다. 명소 원본 DB는 읽기 전용으로 열고, 원본 ID·제목·좌표가 언어별로 일치하는지 검증한다. 빈 원본·중복 locale·모호한 ID·미확인 설정은 실패한다. 실패 시 기존 공개 스냅샷을 덮어쓰지 않는다.
4. 검증 후 임시 파일→rename으로 config/catalog/destinations.json을 교체하고 destination-coverage.json에 언어/그룹/관계/누락 상태를 기록한다. 임시 pending 파일은 Git에서 제외한다. 기존 .env/SQLite/운영 seed를 지우지 않는다.
5. lint/typecheck/test/check:providers/build/E2E 후 서버를 재시작한다. /search?q=범어사 및 /search?q=Gamcheon&category=stay, /places/busan-402 등을 확인한다.

현재 220개 원본 그룹/1,044개 언어 레코드, 25개 그룹·117개 상품·190개 관계다. 원본 ID가 다른 유사 관광 글을 병합하지 않는다. 전체 고유 물리 명소 수로 홍보하지 않는다. API 원문 소개는 검수일 null이며 사진 준비 중·미확인 주소/번역을 명시한다. 주변 권역 숙소는 도보 인접/거리/이동 시간을 보장하지 않는다.

현재 원본 자료를 검색용으로 내보내는 CLI까지 구현했으며 정기 자동 수집/게시 스케줄러는 없다. 운영 API 쿼터·정보 검수·새 사이트 채널 승인·가격/재고 자동 갱신·사진 권리 확인은 별도다.

## 2026-11-12 관광지 검색·번역·사진 갱신

현재 검색 메뉴명은 **관광지 검색**이다. 명소 이름 검색 → 공공 관광정보 상세 → 검수된 관련 상품 → 외부 제휴 예약 흐름을 유지한다. API 원본 1,044개 언어 레코드를 220개 source-ID 그룹으로 게시하며, 물리적으로 서로 다른 명소 220곳을 의미하지 않는다. 연결 검수된 그룹은 25개 / 관계 190개 / 고유 상품 117개다. 전체 공개 제휴 상품은 303개다.

- 상세 정보는 원본 사진·주소·휴무뿐 아니라 전체 소개, 운영시간, 시설 이용요금 원문, 교통, 문의처와 검증된 HTTPS 홈페이지를 사용한다. 시설 요금은 상품 판매가나 예산 계산에 사용하지 않는다. 실시간 영업 여부를 추론하지 않는다.
- `config/catalog/offer-translations.json`에 303개 원제목과 en/ja/zh-CN/zh-TW 편집 번역을 보관한다. 원제목이 바뀌면 해당 번역을 사용하지 않는다. API `locale`에 맞춰 상품 제목을 반환하고 원제목·언어·번역 상태를 함께 준다. 원래 영문인 3개는 영어에서 original 상태이며 누락 번역은 명시적으로 fallback이다. 외부 예약 페이지의 언어·서비스 제공 언어까지 번역되는 것은 아니다.
- 공식 제공 상품 사진 29개를 유지한다. 그 외는 실제 목적지/주변 지역 사진 또는 명시적인 활동 예시를 사용한다. 상품 사진, 목적지 사진, 활동 예시를 구분한다. 특정 공급자의 객실·장비·전시 내부 사진이라고 추정하지 않는다. 외부 사진이 실패하면 중립 대체 화면을 표시한다.
- 사진 근거는 `config/catalog/media-rights.json`, `media-evidence.json`에 있다. 부산 서비스의 최신 data.go.kr 원본 이용허락범위를 확인했다. 과거 부산 미러의 다른 안내와 구분하며, source ID에 해당하는 API 사진만 사용한다. Commons 사진은 원작자·개별 라이선스·원본 링크를 보관한다.

갱신 순서:

```powershell
npm.cmd run data:refresh
npm.cmd run data:publish
npm.cmd run lint
npm.cmd run typecheck
npm.cmd run test -- --run
npm.cmd run check:providers
npm.cmd run build
npm.cmd run test:e2e
```

수집에는 루트 `.env`의 부산 API 키가 필요하다. 번역은 저장된 편집 데이터이므로 별도 번역 API 키가 필요 없다. 정기 자동 수집 스케줄러는 아직 없다. 원본 수집 성공과 공개 스냅샷 게시 성공을 별도로 확인한다. 데이터만 변경해도 실행 중인 서버는 재시작해야 한다.

## 2026-11-12 맛집·추천여행 및 최신 미리보기

- /food, /food/:id: 공식 음식점 정보·운영시간·대표메뉴. /recommended, /recommended/:id: 공식 테마여행 소개·운영/휴무·교통 안내. 각 5개 언어를 제공한다. API에 없는 값은 미등록 상태이며 실시간 영업 정보가 아니다.
- 갱신: npm.cmd run data:food:refresh / npm.cmd run data:recommended:refresh. 각각 .env의 FOOD_SERVICE_KEY / RECOMMENDED_SERVICE_KEY를 사용한다. 전 언어 수집/검증 성공 후 config/catalog/food.json / recommended.json을 원자 발행한다. 실패 시 이전 파일을 유지하며 재시작 후 반영한다. 미수집 서비스 API는 503이다.
- 공식 출처: [부산맛집정보](https://www.data.go.kr/data/15063472/openapi.do), [부산테마여행정보](https://www.data.go.kr/data/15063506/openapi.do). 두 공식 데이터셋의 이용허락범위 제한 없음과 실제 응답을 확인했다. API가 지정한 해당 콘텐츠 이미지만 사용한다.
- 최신 미리보기: https://newbie-spending-laundry-launched.trycloudflare.com/ . /food?locale=ko, /recommended?locale=ko와 API를 외부 HTTPS로 200 확인했다. 이전 consistently-permits-deaf-component 주소는 종료했다.
- 실행: 숨김 Node production 서버(127.0.0.1:4320), 별도 cloudflared 터널. .env는 유지하고 var/imports/server-preview.env로 포트·production·메모리 DB를 지정한다. 기존 SQLite는 수정하지 않는다. 서버/터널 로그는 var/public-guides-preview.*.log 및 var/public-guides-tunnel.*.log다. 이 주소는 PC·프로세스 종료 시 접속이 끊기고 재발급될 수 있다.
- 현재 상품은 저장 303개 중 공개 302개다. 제휴 JSON 백업에는 비활성 항목이 포함되며, public DTO의 승인·기간·링크 검증은 계속 적용한다. 새 음식점/테마 소개에 근거 없는 상품 매칭이나 예약 링크를 만들지 않았다.

## 2026-11-14 공영주차장 수집 운영

루트에서 npm.cmd run data:parking:refresh로 전체 페이지 수집/정규화/원자 저장, npm.cmd run data:parking:check로 API 호출 없는 원본·필드·품질 재검증을 수행한다. PARKING_SERVICE_KEY는 기존 .env에 있고 추가 옵션은 PARKING_PAGE_SIZE(기본100), PARKING_MAX_PAGES(기본100), PARKING_TIMEOUT_MS(기본15000)다. 빈 옵션은 기본값이다. 키/URL 오류 원문은 출력하지 않는다.

결과 config/catalog/parking.json은 서버 내부 자료이며 웹 공개 디렉터리가 아니다. 원본 응답 실행별 보관은 var/imports/parking/다. 파일에는 모든 원본 행이 records.originalFields 또는 quarantine.originalRow로 보존된다. 관리기관명+관리번호 복합키를 사용하며 sourceId만으로 서로 다른 기관의 장소를 합치지 않는다.

현재 자료는615행/615복합키이며 운영/요금 기준일이2009~2020년이다. 좌표 없는320행·지역 범위 밖1행, 요금 구분 전부 미확인, 잔여면수 숫자4행도 관측시각이 없어 모두 미검증이다. 임의로 무료/영업 중/주차 가능으로 표시하지 않는다. 새 수집시각과 원본 기준일을 혼동하지 않는다. 품질은 snapshot의 source.asOfDate 기준이며 소비 시 현재 날짜로 신선도를 다시 평가해야 한다.

실패 시 마지막 성공 파일은 유지된다. 빈 성공/전체 미식별 데이터도 교체하지 않는다. 동시에 여러 수집 명령을 실행하지 않는다. UI/공개 주차 API/자동 갱신·경로 추천은 없으며 기존 사이트 서버를 이 작업 때문에 재시작할 필요는 없다.


## 2026-11-15 내부 테마 코스 자료 운영

새 페이지·공개 API를 추가하지 않는다. config/catalog/theme-route-templates.json은 원문 인용·순서와 명시적 장소 mappingId, route-place-mappings.json은 서비스/ID/locale·예상 이름·fingerprint·검수 별칭을 보관한다. route-attraction-sources.json은 기존 DB의 읽기 전용 추출본이다. theme-routes.json은 파생 결과와402개 원본 그룹의 coverage다. 이 파일들은 정적 공개 디렉터리로 옮기지 않는다.

1. 관광명소 원본 DB를 갱신한 경우 npm.cmd run data:themes:export-attractions. .env의 기존 DB 경로만 서버 config로 읽고 기존 DB를 읽기 전용으로 연다. DB 생성·마이그레이션·seed는 하지 않는다.
2. 저장된 추천여행·맛집 원본과 명소 추출본을 대조하고 템플릿/매핑을 검토한다. 자동 이름 병합·해시 자동 재승인은 금지한다. 현재 검토는 assistant-source-evidence이며 사람의 승인이나 현장 검수 완료로 쓰지 않는다.
3. npm.cmd run data:themes:build 후 npm.cmd run data:themes:check. 두 명령은 외부 API/키 없이 로컬 자료만 사용한다. source/place 변경은 보류, 저장된 파생 결과 위변조/의존성 불일치는 거부한다. 임시 파일 fsync→rename 발행에 실패하면 이전 파일을 보존한다. 동시 작성/발행은 지원하지 않으므로 원본 수집과 이 명령을 직렬로 실행한다.
4. lint/typecheck/test/check:providers/build 및 기존 화면 E2E·산출물 smoke를 수행한다. 현재 서버에서 새 코스 자료를 읽지 않으므로 이 자료 변경만으로 미리보기 서버를 재시작하지 않는다.

[검수 보고서](theme-route-review-2026-11-14.md)에 각 원문·노드·보류 코드·맛집 후보를 기록했다. 모든 템플릿은 recommendationEnabled=false, humanApproval=pending, fieldValidation=not-performed다. 사람·현장 승인 기능은 아직 없으며 값을 임의로 변경해 공개하지 않는다. 위경도 없는 노드나 복합 장소 대표 좌표는 실제 방문 지점으로 채택하지 않는다. 1km는 선택된 맛집의 좌표 기반 직선 후보 기준이고 공식 도보 경로나 영업 보장이 아니다.


## 2026-11-18 기기별 찜하기·주차 공개자료

최신 사용자 요청으로 관광지·맛집·상품의 로그인 없는 찜을 추가한다. /saved에서 종류별 필터·삭제·새로고침 후 복원·다중 탭 동기화·현재 언어/공개 상태 재조회가 가능하다. localStorage에는 version1/중립 종류/ID/저장 당시 이름/시각만 저장하며 예약 URL·가격·계정/키는 저장하지 않는다. 최대200개, 화면당12개 조회로 제한한다. 저장 차단/공간 부족은 성공으로 표시하지 않고 손상 데이터는 동의 없는 초기화를 하지 않는다.

공식 전국 표준 주차 자료18,994행 전체에서 부산653행을 선별해641건을 공개 디렉터리에 연결했다(유료603/자료상 무료37/요금 미확인1, 공영411/민영230). 중복 식별12행은 보류하고 원본은 유지한다. 모든 부산 실재 주차장/최신 영업/실시간 빈자리 확보를 의미하지 않는다. 자세한 범위·구별 집계·보류 사유는 [수집 보고서](parking-directory-2026-11-18.md)를 따른다.

주차 단독 페이지·지도/AI/코스 엔진은 추가하지 않는다. 기존 검색 페이지의 주차 검색/필터와 관광지·맛집 상세의 주변 주차 펼침 영역으로 제공한다. 직선1km 이내 최대3건이며 보행경로나 입구/주차 가능을 보장하지 않는다. 기존615행 주차 이력은 합산하지 않고 보존한다. 갱신 명령은 data:parking-directory:refresh/check이며 키 없이 공식 공개 다운로드를 사용한다.


## 2026-11-18 상품 장바구니·참고 합계

사용자 요청으로 언어 선택창 옆 장바구니 진입(/cart)과 상품 카드·상품 상세·찜한 상품의 담기 버튼을 추가한다. 로그인 없이 같은 브라우저/주소에서100개 상품을 보관하며 수량1~99와 삭제를 지원한다. 반복 담기는 중복 생성/수량 자동 증가 없이 처리한다. 저장 값은 상품 ID·중립 providerId·externalId·이름·수량·시각뿐이며 가격/통화/예약 URL을 저장하지 않는다. 찜 저장 키와 분리한다.

장바구니를 열거나 새로고침/명시적 다시 확인 시 기존 검증된 공개 상품 API에서 현재 언어·상품 정체성·가격을 조회한다. ID/provider/externalId가 달라지거나 미공개/만료/실패이면 예약 URL·금액을 합계에서 제외하고 항목은 보존한다. 조회는 동시6건으로 제한하며 이전 요청을 취소하고 늦은 응답을 차단한다.

현재 가격 계약에는 실시간 최저가·옵션별 최소가 근거가 없어 UI는 표시 가격 기준 참고 합계라고 안내한다. 등록된 원통화 참고가×사용자가 선택한 수량을 정확한 십진수(BigInt)로 합산하고 다른 통화는 나눠 표시한다. 원화 자동 환산·인원/박수 자동 곱셈·최종 결제·예산/AI 엔진을 추가하지 않는다. 가격 없는 상품은0원으로 계산하지 않고 미확인 개수를 별도 안내한다. 모르는 가격/확인 불가 항목이 있으면 부분 합계임을 표시한다. 모든 가격이 없으면 금액 합계를 만들지 않는다. 예약은 각각의 기존 외부 제휴 링크로 이동한다.


## 2026-11-19 언어별 표시 통화 환산 (최신 요청)

이 절은 이전의 표시 환산 제외 규칙에 우선한다. 상품 카드·상세·관광지 연관 상품·찜한 상품·장바구니는 ko→KRW, en→USD, ja→JPY, zh-CN→CNY, zh-TW→TWD로 표시한다. 영어/번체가 특정 국적을 확정하는 뜻은 아니며 각각 USD/대만 TWD를 기본값으로 선택했다. 원본 금액·통화·가격 관찰일·검증된 예약 URL은 변경하지 않는다. 환산가에 ≈와 원래 가격을 함께 표시하고 환율 제공일 범위·출처·참고가/외부 최종 확인 안내를 제공한다. 같은 통화는 환산 없이 원금액을 유지한다.

서버 고정 주소 https://api.frankfurter.dev/v2/rates?base=USD&quotes=KRW,JPY,CNY,TWD 를 사용한다. API 키가 필요 없으므로 .env 기존 값과 lockfile/의존성을 변경하지 않는다. USD 기준 4개 환율을 완전 검증하고 USD=1을 추가해 교차환산한다. 네트워크8초·응답16KiB 제한, 리디렉션 차단, 중복 요청 통합, 메모리1시간 캐시와 실패60초 재시도 제한을 적용한다. 미래/7일보다 오래된 환율·누락/중복·0/음수·형식 오류는 거부한다. 최근24시간 내 마지막 성공 캐시만 오래된 환율 사용 표기와 함께 재사용하며 환율 자체의7일 한계도 지킨다. 제공 통화마다 날짜가 다를 수 있어 하나의 오늘 환율로 오인시키지 않는다. /api/exchange-rates는 고정 읽기 전용 DTO이며 사용자 URL/임의 통화 요청을 받지 않는다.

환산은 BigInt 유리수 연산과 half-up으로 KRW/JPY0자리, USD/CNY/TWD2자리에서 상품 단가를 반올림한 다음 수량1~99를 곱해 정확한 십진수 합계를 만든다. 단가 반올림 후 합산이므로 원통화 총액을 한번에 환산한 값과 다를 수 있다. 공개 상품 가격 스키마는 유지하며 큰 환산 중간값의 합계만128자리 제한으로 처리한다. 가격 없음·미공개·ID 불일치 제외 규칙을 유지하고 localStorage에 금액/환율/URL을 저장하지 않는다. 환율 미확보/시간 초과 시 원통화와 실패 안내·재시도만 제공하며 서로 다른 원통화를 합치지 않는다. 이는 표시용 참고 환산이며 실제 환전·결제·여행 예산/AI/일정 엔진을 구현한 것이 아니다. 주차/음식점 원문 속 임의 가격 문장은 파싱/자동 환산하지 않는다.

작업 순서: domain 계약·정확한 환산→서버 고정 소스/캐시/검증 API→React 단일 환율 context/공통 Price→카드·상세·찜·장바구니→대역 단위/통합/E2E→실제 keyless API/배포 산출물 확인. 세부 검증 결과는 proof.md의 해당 날짜 절을 따른다.


## 2026-11-19 상품·관광지·맛집 다국어 보완

최신 요청으로 정적 원문 검증 번역 overlay와 판매처 설정의 언어별 표시명, 현재 언어의 상품 상세 재조회, 관광지 번역 이름 검색을 연결했다. 외국어 화면에서 상품302·관광지220·음식점 원본 ID538개를 해당 언어로 제공하며 자동 번역 안내·접힌 원문 이름을 제공한다. 원가격·링크·원본 스냅샷/DB와 내부 테마 원문 검수 상태는 유지한다. 운영 요청에서 외부 번역/유료 AI를 호출하지 않는다. 순서는 원인/언어별 전체 대조→source-pinned 번역 자료→공통 설정/서비스→UI 언어 갱신→data:localization:check→기존 전체 검사/E2E/실제 서버 확인이다. 세부 출처·누락 수·사진47건의 미제공 확인과 범위는 [다국어 검수 보고서](localization-review-2026-11-19.md)를 따른다. 원문 수집/발행 후 npm run data:localization:check를 실행해 오래된 번역이 원문 대체로 되돌아가지 않았는지 확인한다.

현재 다국어 미리보기(2026-11-19): https://wing-convenient-compound-checks.trycloudflare.com . 이전 fin-precisely-lexmark-dynamic 주소는 만료됐다. 숨김 production4320과 HTTP/2 임시 터널이며 PC/프로세스 종료·서비스 만료 시 주소가 바뀔 수 있다.


## 2026-11-19 사진 없는 음식점 중복 제거

최신 사용자 요청으로 이름·주소·연락처/좌표/원문 근거를 명시 대조한 사진 없는 중복24개 ID를 공개 목록/상세에서 제외한다. 원본538개는 유지하며 공개 음식점은5개 언어 모두514개다. 사진 있는491개와 사진 없는 독립23개를 유지한다. 사진 없음만으로 삭제하거나 동명 다른 지점을 합치지 않는다. 제외 상세는404이며 찜 기록을 임의 삭제하지 않는다. 원본 identity fingerprint가 바뀌면 재검수가 필요하다. 순서: 전체 후보 대조→명시 검수 ID/fingerprint 설정→목록/상세 필터→단위·다국어/E2E·빌드→서버 갱신/Proof. 상세24개와 주소 충돌 근거는 [검수 보고서](food-dedup-review-2026-11-19.md)를 따른다.


## 2026-11-23 제휴 우선순위와 조건부 한국어 예약

최신 요청으로 중립 provider 설정 순위(클룩→트립닷컴→아고다)를 적용한다. 메인만 확인된 동일 숙소4묶음에서 유효한 우선 링크1개를 대표로 노출하며 다른 옵션/투어를 이름만으로 합치지 않는다. 전체 공개 링크117/메인113이며 마이리얼트립185개는 한국인 가이드·외국인 참여·통역·해외카드 조건의 전체 근거가 없어 공개 제외한다. 실제 URL/원가격/관찰일/원본 기록은 보존한다. 조건별 출처와 일자·원본 ID가 검증된 경우에만 한국어 사이트 예약(해외카드 가능) 배지를 이미지 오른쪽 위에 표시한다. 현재 실제 검증 항목0개다. 순서는 원본/근거 대조→설정과 계약→공통 순위/선택/차단→메인·5개 언어 배지→회귀 검증/빌드/서버 확인이다. [검수 보고서](affiliate-presentation-review-2026-11-23.md)를 따른다.


## 2026-11-23 KKday 부산 카탈로그 확장

사용자 요청으로 중립 PROVIDER_E와 등록 채널의 검증된 추적 템플릿을 사용해285개 상품을 추가했다.5개 언어·6개 공식 부산 범주에서290개 고유 ID를 대조하고 지역/범위 불명확·상담용5개를 보류했다. 현재 공개402/메인398이다. 원본 사진·가격·ID와 언어별 실제 예약 URL을 보존하며,없는 원어 페이지는 원본 언어 안내와 함께 유지한다. 원문 언어/제목 SHA-256 고정·CID/상품 ID 검증을 적용한다. 기존 미검증 제공처 제외/찜/장바구니/환율/음식점/내부 코스 자료 규칙은 유지한다. 상세 범위·수집·제외 근거는 [검수 보고서](provider-e-catalog-review-2026-11-23.md)를 따른다.

## 2026-11-24 Vercel Services

배포용 함수는 기존 공공 DB 백업을 읽기 전용으로 사용하고 로컬 수집/복원·쓰기 CLI를 실행하지 않는다. 공개 화면/카탈로그 API와 언어·제휴 규칙은 보존한다. Services/바인딩/환경변수·실제 로컬 검증과 Preview 확인 범위는 [배포 검토](vercel-deployment-2026-11-24.md)를 따른다. 사용자 요청에 따라 구성 확인 전 push/deploy는 보류한다.
