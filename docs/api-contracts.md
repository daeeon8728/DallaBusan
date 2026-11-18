# 상품 API와 외부 연동 계약

## 현재 상품 조회 계약 — 2026-11-10

현재 사이트는 부산 제휴 상품 카탈로그다. AI·예산·일정 생성은 제외한다. 상품은 검수한 config/catalog/offers.json 스냅샷이며 OTA 상품 API 자동 동기화는 구현하지 않았다. 실제 링크 확보 및 API별 상태는 [api-readiness.md](api-readiness.md)를 따른다.

| 항목 | 계약 |
| --- | --- |
| GET /api/offers | 검색 결과와 필터/판매처/카테고리 수, 전체 보기 링크, 확인일, 공개 문의 이메일 |
| GET /api/offers/:id | 검증된 공개 상품 DTO. 미존재/만료는 404 |
| locale | ko 기본값, en, ja, zh-CN, zh-TW. UI 언어이며 상품 자동 번역을 의미하지 않음 |
| q | trim 후 최대 100자, NFKC 정규화·대소문자 무시 제목 검색 |
| category | ticket / tour / yacht / package / activity / spa / snap / transport / stay / food |
| provider | 중립 providerId. 미지정은 전체 |
| scope | busan / from-busan / to-busan / regional |
| page / limit | page 1~1000 기본 1, limit 1~48 기본 24 |
| 오류 | 잘못된/허용되지 않은 query는 400, 미존재 상세는 404 |
| 응답 캐시 | no-store. 외부 상품 API 요청을 발생시키지 않음 |

목록 응답은 items / total / page / pages / catalogTotal / providers / categories / directories / checkedOn / contactEmail이다. total은 현재 필터의 수, catalogTotal과 categories는 전체 공개 카탈로그 기준이다. 빈 결과는 pages=0이며 페이지 범위 밖 요청도 빈 배열이다.

상품 DTO는 id / externalId / title / titleLocale / category / scope / provider(id, displayName) / href / referencePrice / image / checkedOn / expiresOn / linkEvidence다. referencePrice는 null 또는 amount(decimal 문자열), currency, observedOn이다. 가격 미확인을 0으로 바꾸지 않는다. image.kind는 product 또는 destination이며 credit을 포함한다. priority·sourceUrl·전체 설정·websiteApproval·키/계정은 공개 DTO에 넣지 않는다.

### 링크 검증

서버 config 스키마와 공통 registry에서 HTTPS·자격증명/비표준 포트 없음·정확한 호스트·경로 경계·각 필수 추적 파라미터 1회와 값 일치·중첩 목적지의 HTTPS/호스트·원본 증빙 호스트를 검사한다. href hash는 허용하지 않는다. 잘못된 설정은 시작 실패이며 미승인/비활성 provider와 만료 상품은 노출하지 않는다. 내부 리디렉트·사용자 임의 URL 입력 엔드포인트는 없다. 링크 이동 시 sponsored noopener noreferrer와 외부 예약/가격 재확인 안내를 제공한다.

approvalStatus는 기존 채널 근거이고 신규 웹사이트 승인 여부는 websiteApproval로 별도 관리한다. 현 unverified 상태의 로컬 검증은 공개 배포 허가를 뜻하지 않는다.

### 이전 계약과의 관계

아래 AttractionService는 보존한 3단계 계약이다. 명소 수집 DB는 현재 상품 스냅샷과 별도이며 미검수 장소를 자동으로 상품·사진으로 만들지 않는다. 과거 일정/인증 후속 단계 설명은 현재 범위가 아니다. 최신 요구와 계획은 [spec.md](spec.md), [catalog-plan.md](catalog-plan.md)를 따른다.
## 부산 AttractionService

공식 안내: [공공데이터포털](https://www.data.go.kr/data/15063481/openapi.do), [부산 데이터 포털](https://data.busan.go.kr/bdip/opendata/detail.do?publicdatapk=15063481). 안내 웹페이지 조회 오류와 API 호출 성공 여부는 별도로 판단한다.

| locale | 고정 엔드포인트 | 실제 수집 레코드 |
| --- | --- | ---: |
| ko | getAttractionKr | 213 |
| en | getAttractionEn | 207 |
| ja | getAttractionJa | 208 |
| zh-CN | getAttractionZhs | 208 |
| zh-TW | getAttractionZht | 208 |

- HTTPS 고정 호스트·서비스 경로만 호출한다. locale 또는 사용자 URL로 목적지를 조합하지 않는다.
- 실제 검증한 키 파라미터는 **ServiceKey**다. resultType=json, pageNo, numOfRows를 포함한다. 원본 ID 필터는 UC_SEQ다.
- 루트 .env의 ATTRACTION_SERVICE_KEY를 서버 config에서 읽는다. 원문 키를 URLSearchParams로 인코딩하며, 발급 화면의 인코딩된 키를 입력했다면 어댑터에서 한 번 디코딩한 후 직렬화한다. 전체 URL·키·upstream 예외 원문은 출력하지 않는다. 리디렉션은 거부한다.
- 실제 응답은 Content-Type이 text/plain;charset=UTF-8이지만 JSON 본문이다. 엔드포인트명 속성 아래 header.code=00, item, pageNo, numOfRows, totalCount를 검증한다. HTTP 200도 업무/인증 오류, XML, 비정상 JSON이면 실패다.
- item의 배열·단건·빈 값은 정규화한다. ID/제목이 무효인 행은 거부 건수로 집계하고 수집을 partial로 종료한다. 빈/중복 페이지, totalCount 변경, 잘못된 페이지 번호, 페이지 상한도 완료로 표시하지 않는다.
- MAIN_TITLE은 영문 응답에서도 한국어 원문인 것을 확인했다. 카드 제목은 TITLE을 우선하며 누락 시 MAIN_TITLE을 사용하고 missing-localized-title을 기록한다. 설명의 언어 품질을 자동으로 검수 완료 처리하지 않는다.
- LAT/LNG는 빈 문자열·boolean·NaN·뒤바뀐 좌표를 0으로 보정하지 않는다. 위도 34.8~35.5, 경도 128.7~129.4의 보수적 경계 밖은 null이다. 이는 부산 행정구역 판정이 아니며 최종 권역은 사람이 검수한다.
- ITEMCNTNTS와 HLDY_INFO는 원문 문자열을 유지한다. 휴무 문자열을 구조화 영업시간으로 해석하지 않으며 HTML 실행을 허용하지 않는다. UI는 반드시 텍스트로 렌더링한다.
- MAIN_IMG_NORMAL은 자격증명 없는 HTTPS URL만 검수용 원본에 보관한다. 사용권·저작자 확인 전 Translation.image는 null이다. 원본 URL 수집은 사진 재사용 허가가 아니다.

## 한도·캐시·실패

| 항목 | 기본값/동작 |
| --- | --- |
| 페이지 크기 | 100건 |
| locale별 최대 페이지 | 20, 환경 설정 허용 1~100 |
| 개별 요청 제한 | 10초, 환경 설정 최대 30초 |
| 일시적 네트워크/타임아웃/5xx 재시도 | 최대 1회, 페이지당 최대 2회 요청 |
| 인증·스키마 오류/429 | 자동 재시도 없음. 429 Retry-After 보존 |
| 본문 크기 | 2,000,000 byte 상한, 스트리밍 중에도 검사 |
| 페이지 캐시 | SQLite 영속, 기본 1시간 |
| 캐시 키 | locale·pageNo·numOfRows·UC_SEQ 필터 |
| 오래된 캐시와 갱신 실패 | stale 및 실패 코드 보존, 새 수집 성공으로 저장하지 않음 |
| 취소 | 호출자 AbortSignal 지원. 취소된 응답을 캐시에 반영하지 않음 |
| 부분 실패 | 이미 저장한 성공 페이지 유지, 종료 코드 1과 partial/failed 요약 |
| 완전 수집 | 종료 코드 0. 데이터 검수·출시 승인과는 별도 |

현재 일반 브라우저 요청이 외부 API를 호출하지 않는다. 서버 운영자가 data:import로 수집하고 조회 API는 DB만 읽는다. 백그라운드 자동 갱신·스케줄러는 구현하지 않았다. 수집에서 사라진 원본의 자동 삭제/비활성화도 미구현이며 기존 성공 데이터와 조회 시각을 유지한다.

## 식별·검수·병합

- 원본은 attraction_records의 locale/source_id와 fetched_at, 검수용 payload로 저장한다.
- 다국어 ID 동일성은 전체 검증되지 않았다. 같은 UC_SEQ나 이름만으로 합치지 않고 busan-api:locale:sourceId로 분리한다. 총 1,044건은 **언어별 레코드 합계**이며 고유 명소 수가 아니다.
- config/attraction-mappings.json의 검수 일시가 있는 매핑만 기존 canonical placeId에 연결한다. 대상 장소가 없거나 같은 locale의 매핑이 모호하면 실패한다.
- 새 장소는 unverified, regionId=unreviewed, 체류 시간 미정이다. 자동 일정 후보로 표시하지 않는다. 후속 계산 엔진도 검수·영업/시간/비용 요건을 별도로 확인해야 한다.
- API는 좌표·제목·설명·휴무 원문을 갱신한다. 로컬 카테고리·권역·체류 시간·사진·상품 매핑은 임의 변경하지 않는다.
- Place/Translation의 fieldSources와 provenance에 따라 검수 필드를 보호한다. 검수된 API 출처도 보호하며 API 갱신으로 검수 메타데이터를 낮추지 않는다. 무효 새 좌표나 빈 설명/휴무는 마지막 성공값을 지우지 않는다.
- 한 페이지의 원본·장소·번역 저장은 트랜잭션이다. 매핑 오류 시 해당 페이지를 rollback한다. 이전 페이지는 유지한다.

## 서버 조회 계약

- GET /api/places?locale=ko&page=1&limit=20&q=검색어: DB에서 읽는다. 5개 locale, page 1~1000, limit 1~50, 검색어 최대 100자만 허용하며 잘못된 입력은 400이다.
- 요청 언어를 우선 정렬하고 미보유 번역은 ko/en 순서로 대체한다. requestedLocale, locale, translationFallback, stale, reviewStatus, 원문 휴무·출처를 제공한다. 제목 자체가 미번역인 경우도 대체 표시한다.
- locale별 미검수 레코드가 분리돼 있으므로 목록 total은 canonical 고유 명소 수가 아니다. 후속 UI는 검수 매핑 없이 같은 물리 장소라고 묶거나 고유 장소 수로 홍보하면 안 된다.
- 사진은 검수된 Translation.image만 반환한다. 원본의 미승인 이미지 URL·서버 설정·API 키는 반환하지 않는다.
- GET /api/catalog/status: configured/unconfigured와 마지막 수집 요약이다. configured는 키 존재를 의미하며 현재 외부 API의 가용성 보장이 아니다. 페이지별 캐시에는 마지막 성공 시각이 있다.
- 두 조회 API는 no-store다. DB 읽기 오류는 고정된 503 메시지다. 외부 호출·수집을 실행하는 공개 HTTP 엔드포인트는 없다.
- /api/health의 stage=1은 기존 기반 구성 응답 계약을 유지한다. 현재 구현 단계는 proof.md를 따른다.

## 남은 외부 계약

제휴 상품 API·Google/Apple 실인증·환율·RouteProvider·AI 제공처는 이번 단계에서 구현/검증하지 않았다. 제휴 포털 확인 사실은 api-readiness.md와 분리한다. API 사용 조건·사진/번역 사용권·운영 호출량·초기 권역 검수·DB 백업/배포 정책은 운영 담당자 확인이 필요하다.


## 명소 가이드 공개 API — 2026-11-11

- GET /api/destinations?locale=ko → month(Asia/Seoul 현재 월), featured(설정한 월과 일치할 때만), items(검수된 명소 전체).
- GET /api/destinations/:slug?locale=ko → destination 및 related 배열. 없는 명소는 404, 잘못된 slug/locale 또는 미지정 추가 query는 400이다. locale은 기존 5개 언어 허용 목록만 사용한다.
- destination은 slug/name/description/locale/requestedLocale/translationFallback/address/holidayInfo/sourceUrl/addressSourceUrl/sourceRetrievedAt/reviewedOn/image를 포함한다.
- related는 relationship(tour/ticket/experience/stay), areaLabel, 기존 PublicOffer DTO다. 서버 OfferService에서 비활성·미승인·만료 상품이 배제되므로 가이드 경유로 검증을 우회하지 않는다.
- 원본 sourceId·증빙 URL·전체 registry는 공개 DTO에 포함하지 않는다. 소개문은 실제 공공 API의 텍스트 발췌이며 HTML을 실행하지 않는다. 주소는 별도 공식 출처를 검수했다.
- 응답은 no-store이며 외부 공공/제휴 API를 호출하지 않는다. 운영용 검수 스냅샷은 config/catalog/destinations.json이다. 기존 미검수 /api/places를 그대로 명소 추천 화면에 노출하지 않는다.

## 전체 검색·공개 스냅샷 계약 (2026-11-11, 최신)

GET /api/destinations는 locale 외에 q(trim 최대 100자), page(1~1000 기본 1), limit(1~48 기본 12), linked(all 또는 linked 기본 all)를 받는다. 응답은 기존 month/featured/items와 total(검색 결과 수)/catalogTotal(전체 원본 그룹)/linkedTotal(현재 연결 상품 보유 그룹)/page/pages다. featured는 검색 결과와 독립적인 월별 추천이며 최대 두 개를 배너에 표시한다.

destination DTO에는 district, reviewStatus(curated/source), relatedOfferCount가 추가된다. address·reviewedOn·image는 null일 수 있다. API 원문 자료를 방문 가능한 상태나 검수된 사진으로 자동 승인하지 않는다. 누락 번역·미번역 제목은 translationFallback으로 표시한다. 빈 결과는 items=[]/pages=0, 범위 밖 페이지는 빈 배열이다.

GET /api/offers?q=...는 상품 제목 검색 결과와, 명소 이름/검수 별칭에 매칭된 **기존 활성 상품 ID**의 합집합을 반환한다. 소개문에 우연히 등장한 명소 단어만으로 상품을 확장하지 않는다. category/provider/scope 필터·정렬·페이지·만료/승인·링크 검증을 그대로 적용한다. 명소별 상세 API와 상품 DTO의 비밀/내부 설정 비공개 경계는 유지한다.

ADDR1은 선택 문자열을 trim해 addressRaw로 저장하며 없으면 null이다. 기존 캐시/DB payload에 필드가 없으면 null 기본값으로 읽는다. 실제 국문 응답 필드를 확인한 뒤 3페이지/213건을 다시 수집했다. 다른 locale의 이전 payload를 주소 0 또는 가짜 번역으로 채우지 않는다.

## 2026-11-12 카탈로그 표시 계약 추가

- 검색 메뉴: 관광지 검색, 영어 Attraction search, 일본어 観光スポット検索, 중국어 간체 景点搜索, 번체 景點搜尋.
- GET /api/offers 및 /api/offers/:id?locale=...: title/titleLocale는 표시용 현지화 제목, originalTitle/originalTitleLocale는 판매처 원문, localizationStatus는 original/translated/fallback이다. 기존 제휴 href는 그대로 검증하며 번역으로 예약 조건·가격·서비스 언어를 변경하지 않는다. 검색은 저장된 모든 언어 제목과 원문을 지원한다.
- 상품 image.kind: product/destination/illustration. sourceUrl/licenseUrl은 공개 사진 출처·이용허락 링크이고, 상품 evidence용 내부 sourceUrl과 구분한다. 내부 업체 설정·계정·키는 반환하지 않는다.
- 관광명소 image는 실제 source-ID 사진을 지원한다. sourceUrl/licenseUrl과 출처를 표시한다. addressLocale는 실제 주소 원문의 언어다.
- GET /api/destinations/:slug?locale=...: content는 HTML을 제거한 전체 소개, visitInfo는 hours/fees/transport/contact/homepage다. 미제공 값은 null이며 홈페이지는 안전한 HTTPS URL만 제공한다. fees는 시설 안내 원문으로 상품 가격 집계에 사용하지 않는다.
- 선택 언어의 원본이 없으면 기존 명시적 언어 대체 정책을 유지한다. 시간·휴무 원문에서 현재 영업/매진 상태를 자동 판정하지 않는다.

## 2026-11-14 공영주차장 준비 계약

서버 config/parking.ts의 PARKING_API_SOURCE는 BusanPblcPrkngInfoService/ 및 getPblcPrkngInfo를 고정 관리한다. env.ts의 loadParkingApiConfig는 .env의 PARKING_SERVICE_KEY를 서버 전용으로 읽는다. 공개 DTO·주차장 API 라우트·자동 호출은 아직 없다. RecommendedService는 기존 config/guides.ts와 RECOMMENDED_SERVICE_KEY 설정을 그대로 사용한다. 두 서비스의 다른 응답 외피·좌표/주소·요금/잔여면의 미확인 규칙은 [계획서](tourism-parking-plan.md)를 따른다.
