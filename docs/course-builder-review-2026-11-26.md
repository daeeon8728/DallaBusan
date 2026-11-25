> 2026-11-26 후속 확장: 현재는 신규100개와 실시간 편집 지도까지 제공한다. 최신 수량·조작·참고선/저장 규칙은 [100개 코스 검토](course-expansion-review-2026-11-26.md)를 우선한다. 아래는 최초74개 구현 이력이다.

# 나만의 부산 코스 조합 검토 (2026-11-26)

## 현재 제공하는 흐름

홈·코스 목록·코스 상세·푸터의 Build my day에서 별도 /build-your-day 페이지로 이동한다. 기존 상단 6개 메뉴는 그대로 유지한다. Short courses 24개, Original courses 50개, Places & restaurants 100곳을 탐색할 수 있다. 원본 코스 페이지의 기존 50개 수는 변경하지 않았다. 짧은 코스는 이 조합 페이지에서 추가한 선택지다.

짧은 코스 또는 개별 관광지/식당 추가 → 중복 장소 한 번만 반영 → 위/아래 이동 또는 삭제 → 기기 자동 저장 → 선택한 장소별 관련 상품 확인 순서다. PC는 선택지와 편집 목록을 좌우로 배치하고 편집 목록을 고정한다. 모바일은 내 코스와 선택지를 한 열로 표시하며 하단 My day 버튼으로 편집 위치에 돌아간다. 메뉴·이름으로 검색하고 식당/관광지 필터를 사용할 수 있다. 언어를 바꿔도 선택과 순서는 유지한다.

현재는 한 개의 조합을 최대12개 고유 장소로 보관한다. 전체 코스 추가 시 한도를 넘으면 그 추가를 통째로 보류한다. 체류시간만 합산하고 이동·대기·휴식은 제외한다. 8시간을 넘으면 장소를 줄이거나 다른 날로 나누도록 안내한다. 예산/결제 합계를 만들지 않는다.

## 짧은 선택지의 근거

config/catalog/course-modules.json은 기존 source-pinned 코스의 순서와 체류시간 지문을 고정한다. 공개 자격을 통과한 원본에서 연속한 두 장소만 사용한다. 생성/조회 시 walking 모드, 두 좌표 존재, 체류 합계180분 이하, 두 장소 간 직선거리2km 이하를 검사했다. 24개의 장소 쌍은 중복되지 않는다. 기존 원본 ID/좌표/DB/사진/번역/공개 제외 정책과 내부17개 템플릿은 변경하지 않았다.

이들은 editorial-idea이며 사람/현장 승인으로 승격하지 않는다. 2km는 도보거리가 아니며 경사·입구·횡단·영업 여부를 보장하지 않는다. 마지막 장소 근처 필터는 그 장소와 다음 코스 첫 장소의 직선거리3km 이내를 보여주고 가까운 순으로 정렬한다. 이것을 이동시간이나 최적 경로로 표시하지 않는다.

| 추가 선택지 ID | 원본 코스 | 재사용 장소 순서 |
| --- | --- | --- |
| short-fa04-1 | Haeundae Ocean Day | destination:busan-373 → food:2899 |
| short-fa05-1 | Songdo Sky & Sea | destination:busan-286 → destination:busan-1422 |
| short-fa08-1 | Forest & Bakery Break | destination:busan-344 → food:1507 |
| short-fa10-1 | Songjeong Beach & Family Bites | destination:busan-280 → food:1477 |
| short-da01-1 | Gwangalli Golden Hour | food:212 → destination:busan-285 |
| short-da02-1 | Haeundae Art & Dalmaji Tea | destination:busan-373 → destination:busan-2753 |
| short-da03-1 | Marine City Dessert Walk | destination:busan-2121 → destination:busan-2274 |
| short-da04-1 | Huinnyeoul Slow Afternoon | destination:busan-255 → food:920 |
| short-da05-1 | Songdo Above the Sea | food:960 → destination:busan-286 |
| short-da06-1 | Dadaepo Sunset Together | destination:busan-287 → destination:busan-1718 |
| short-da07-1 | Art & Riverside Date | destination:busan-372 → food:1589 |
| short-da09-1 | Seomyeon Art & Cake | destination:busan-1653 → food:1447 |
| short-da10-1 | Riverside & Pastries | destination:busan-2566 → food:1264 |
| short-fo01-1 | Seomyeon Noodles & Coffee | food:1817 → destination:busan-1329 |
| short-fo02-1 | Yongho Soup & Sweet Red Beans | food:1511 → food:1459 |
| short-fo03-1 | Oncheonjang Comfort Food | food:2884 → destination:busan-397 |
| short-fo04-1 | Dalmaji Broth & Tea | food:1609 → destination:busan-2753 |
| short-fo06-1 | Yeonsan Neighborhood Bites | food:1515 → food:926 |
| short-fo07-1 | University Quarter Bites | food:1506 → food:1452 |
| short-fo10-1 | Namcheon Soup & Sweet Red Beans | food:1921 → food:959 |
| short-cu01-1 | Songdo Beyond the Cable Car | destination:busan-286 → destination:busan-833 |
| short-cu02-1 | Slow Dadaepo | destination:busan-2157 → destination:busan-1718 |
| short-cu04-1 | Mangmi Everyday Art | destination:busan-301 → destination:busan-372 |
| short-cu05-1 | Choryang Hillside Stories | destination:busan-266 → destination:busan-2594 |

## 지도와 상품

새 조합의 지도는 선택 순서의 번호 마커만 표시한다. 기존 도로 경로를 다른 순서의 장소에 붙이거나 미확인 구간을 연결하는 선을 그리지 않는다. 원본 코스의 도로 경로는 Original course & map 링크에서 확인할 수 있다. 원본 대표 좌표를 입구로 바꾸지 않는다. 전체 지도 보기·선택 마커·영문 배경·저작자 표시·실패 재시도와 애니메이션 비활성화를 유지했다.

하단 상품은 선택한 관광지의 명시 검수 관계만 방문 순서대로 묶는다. 장소마다 최대3개이며 기존 OfferService의 공개 자격/만료/링크 검증/제공처 순위/검수 동일 상품 그룹을 재사용한다. 식당 이름이나 거리만으로 예약 상품을 추측하지 않는다. 숙소는 실제 마지막 선택 장소가 관광지이고 그 장소의 stay 관계가 있을 때만 별도 최대3개를 표시한다. 마지막 저장 ID가 미공개라면 앞 장소의 숙소로 대신하지 않는다.

상품 선택 시 기존 최신 상세 조회를 거쳐서만 예약 링크를 제공한다. 외부 target=_blank 및 rel=sponsored noopener noreferrer, 5개 표시 통화 환산과 원가격/관찰일·제휴 표시·옵션 확인을 유지한다. 투어 운영사의 일정이 사용자의 수동 조합과 다를 수 있음을 안내한다.

## 저장·실패·보안

전용 키 dallabusan.course-builder.v1에 version, 장소 kind/id 배열, savedAt만 저장한다. URL·가격·환율·좌표·개인정보는 저장하지 않는다. ID는 서비스 namespace와 함께 비교한다. 미공개/누락 장소는 ID를 보존하고 사용자가 직접 제거할 때까지 목록에 남긴다. 그 장소에 상품·지도 좌표를 만들어 넣지 않는다. 일부 소요시간이 미확인일 때 정확한 전체 체류시간으로 표시하지 않는다.

저장 실패 시 초안을 메모리에 유지하고 저장되지 않았음을 표시하며 재시도를 제공한다. 손상/크기초과 데이터는 원본을 보존하며 명시 초기화 전 덮어쓰지 않는다. 다른 탭이 저장본을 변경했으면 충돌을 표시하고 초안으로 덮어쓰지 않는다. 저장본 재불러오기/초기화는 사용자가 확인 버튼으로 선택한다. 초기화는 이 저장 키만 제거하며 찜/장바구니는 보존한다.

API는 GET /api/course-builder?locale 및 /api/course-builder/offers?locale&places를 제공한다. 두 응답은 no-store다. 쿼리·최대12개·중복·namespace·현재 공개 whitelist를 검증한다. API/DB 수집·쓰기·외부 라우팅·유료 AI 호출은 없다. 제휴 상호/URL/추적 값은 기존 서버 설정 경계에서만 읽는다. Vercel의 기존 config/catalog/** 포함 규칙이 새 JSON도 포함한다.

## 파일과 검증

- 도메인: packages/domain/src/course-builder.ts, index.ts.
- 설정: config/catalog/course-modules.json, apps/server/src/config/course-builder.ts.
- 읽기 전용 서버: services/course-builder.ts, routes/course-builder.ts, runtime.ts.
- UI: apps/web/src/builder/BuilderPage.tsx, BuilderLink.tsx, builder.css, store.ts, useBuilder.ts 및 i18n/course-builder.ts.
- 진입과 지도: App.tsx, HomeCourses.tsx, courses/CoursesPage.tsx, courses/CourseMap.tsx. 지도는 pointsOnly 옵션의 기본값false로 기존 동작을 보존했다.
- 검증: tests/unit/course-builder-store.test.ts, tests/integration/course-builder.test.ts, tests/e2e/course-builder.spec.ts. 기존 api-runtime.test.ts의 프로모션 샘플은 검수 당시 날짜로 Date만 고정했다. 실제 만료 정책이나 현재 프로모션 파일은 바꾸지 않았다.

명령·결과·실패 수정 이력은 [proof.md](proof.md)에 기록한다. [PC 조합](design/course-builder-2026-11-26/desktop-builder.png), [모바일 조합](design/course-builder-2026-11-26/mobile-builder.png), [PC 상품](design/course-builder-2026-11-26/desktop-products.png), [모바일 상품](design/course-builder-2026-11-26/mobile-products.png), [독립 dist 결과](design/course-builder-2026-11-26/smoke.json)를 보관했다. 사진·타일·환율·외부 분석은 대역이며 실제 예약 클릭은0이다. 배포 검증과 전체 부산의 모든 장소 확보, 새 조합의 도로 경로 자동 계산·최적화·실시간 영업·현장 검수는 이번 작업에 포함하지 않는다.
