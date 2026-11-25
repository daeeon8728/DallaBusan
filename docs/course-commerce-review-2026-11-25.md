# 코스 탐색과 상품 비교 (2026-11-25)

## 화면과 탐색

홈 상단에 All / First-Timer / No Car / Couples / 1-Day Trip 버튼을 제공한다. 한국어·영어·일본어·중국어 간체·번체 문구는 course-commerce i18n 모듈에 둔다. 홈의 기본 미리보기는 fa02 / fa04 / da01 / da05 네 코스다. 필터 선택 시 일치하는 코스 최대 6개와 전체 일치 건수, 전체 결과 진입을 제공한다. All은 필터를 해제하고 대표 미리보기로 돌아온다. /courses의 persona 쿼리는 기존 category / mode와 AND로 결합되며 새로고침으로 보존된다.

기존 50개 코스·6개 상단 메뉴·관광지 검색·추천여행·팝업을 보존한다. 코스 상세 아래는 강조된 투어 선택지와 개별 티켓 선택지를 PC에서 나란히, 모바일에서 세로로 보여준다. 연결된 장소명·참고가·제공처·사진 출처·찜·장바구니를 기존 OfferCard로 제공한다. 투어 CTA는 최신 상품 상세 재조회 후 연결 장소를 방문하는 투어를 확인하도록 안내한다. 다른 관련 상품으로 전환하면 투어 전용 예약 문구를 이어 붙이지 않는다.

## 데이터 계약과 경계

| 필드 | 계약 |
| --- | --- |
| personaTag | first-timer / no-car / couples / day-trip 배열. All은 UI 필터 해제 상태다. |
| duration | 5개 언어 문자열. 편집 체류시간과 기존 도로 경로 모델 예상시간을 합쳐 올림한 시간부터 +1시간의 참고 범위다. 대기·휴식·교통 상황을 보장하지 않는다. |
| affiliateBundle | title / provider / badgeText / basePriceKRW / affiliateUrl / persuasionCopy와 연결 장소 및 원본 공개 offer DTO. 없으면 null. |
| affiliateItems | spotName / productTitle / provider / basePriceKRW / affiliateUrl에 kind(spot 또는 stay), destinationId, areaLabel, 원본 공개 offer DTO를 추가한다. |

courses.json에는 페르소나·다국어 시간·featured 메타데이터를 둔다. 실제 상품 연결의 근거·원본 SHA-256·코스 순서 지문·검토 유효기간은 course-commerce.json에 분리한다. 상세 API는 요청 시 상품 데이터를 결합하고 no-store로 응답한다. 목록 요약에서는 상품 URL/DTO와 경로 geometry를 보내지 않는다. 기존 /offers 응답의 items 계약도 보존한다.

provider는 중립 레지스트리 ID이며 표시명은 offer.provider.displayName이다. URL·가격을 코스 데이터나 React에 복제하여 운영하지 않는다. basePriceKRW는 원본 통화가 KRW일 때만 제공하며 그 외는 null이다. UI의 가격 계산에는 이 숫자를 사용하지 않고 원본 offer.referencePrice의 정확한 십진수와 기존 Price/ExchangeProvider를 사용한다. 언어 기본 KRW/USD/JPY/CNY/TWD 환산·실패 시 원통화 복구·기준일/출처·하단 환율 안내를 유지한다.

## 대표 연결과 출처

| 코스 | 주력 상품 ID | 연결 근거 장소 |
| --- | --- | --- |
| fa02 Temple & Ocean Discovery | e-131061 | 해동용궁사 busan-261 |
| fa04 Haeundae Ocean Day | b-74132 | 해운대 busan-373 |
| da01 Gwangalli Golden Hour | b-2278 | 광안리 gwangalli |
| da05 Songdo Above the Sea | b-2278 | 송도 케이블카 busan-1422 |

기존 공개 명소의 명시된 상품 관계를 재사용했다. 새 상품 발행이나 이름 유사도에 의한 자동 매칭은 없다. 4개 배치에 고유 주력 상품은 3개다. 2026-11-25 확인한 공식 페이지는 [일일 투어 상세](https://www.kkday.com/zh-tw/product/131061-busan-one-day-tour-south-korea), [해안 명소 일일 투어](https://www.klook.com/ko/activity/74132-busan-oneday-tour-busan/), [부산 야간 투어](https://www.klook.com/ko/activity/2278-night-tour-busan/)다. 날짜·옵션에 따라 입장권과 방문 장소가 달라지므로 운영사의 전체 일정과 선택한 옵션을 확인하도록 표시한다. 특히 야간 투어의 코스별 방문 범위를 예약 전에 확인해야 한다.

이 연결은 assistant-source-evidence이며 사람·현장 승인으로 승격하지 않는다. 현재 검토 만료는 2026-12-02다. 원본 제공처/상품 ID/제목/원문 URL/종류/범위 또는 코스 이동 모드/정차 순서/체류시간 지문이 바뀌면 연결을 보류한다. 만료·비공개·제공처 자격 미충족은 주력 추천에서 제외한다. 이를 갱신할 때에는 원문·옵션을 재확인해야 하며 날짜만 일괄 연장하지 않는다.

개별 옵션은 해당 코스의 명시된 명소 관계 중 tour를 제외한 현재 공개 상품이다. 고유 ID 중복을 제거하고 제공처 displayPriority와 기존 검수된 동일 상품/숙소 featuredGroups를 적용한 뒤 최대 6개다. 숙소는 마지막 정차지가 관광지이고 그 관광지에 검토된 stay 관계가 있을 때만 최대 3개를 별도 제공한다. 코스 중간 명소의 숙소를 종착지 숙소로 바꾸지 않는다. 현재 대표 4개 코스에는 검토된 종착지 숙소가 없어 빈 안내를 표시한다. 새 숙소·거리를 추측해 채우지 않았다.

## 목업과 제한

요청한 필드 형태를 갖춘 대표 예시 4개는 tests/fixtures/course-commerce-demo.json에만 둔다. test-only / bookable=false / DEMO 표기와 실제 예약으로 연결되지 않는 example.test URL을 사용한다. 운영 API나 프런트 빌드에서 읽지 않는다. 운영 화면에는 기존 실상품과 참고가만 사용하며 원금액·관찰일·사진·추적 코드를 변경하지 않는다.

All-in-One은 투어 선택지를 비교하는 UI 구분이다. 이 편집 코스의 모든 장소·이동·입장이 포함된 확정 패키지라는 뜻이 아니다. 무대기 입장·최저가·일정 일치·고수수료를 확인 없이 주장하지 않는다. Visit Busan Pass의 옵션별 혜택도 새로 추측하여 연결하지 않았다. No Car는 현재 walking 코스 33개를 탐색하는 편집 태그다. 대중교통 시간표/환승 경로나 유모차·휠체어 접근성을 검증한 기능이 아니다.

원본 좌표·OSRM 스냅샷·Leaflet 마커·정차지 선택은 변경하지 않았다. human/field pending 상태와 내부 17개 테마 템플릿의 비추천 상태를 유지한다. 실제 외부 예약 링크에는 target=_blank와 rel=sponsored noopener noreferrer를 유지하며 상세 조회 실패 시 예약 링크를 생성하지 않는다.

## 파일과 검증

- 도메인: packages/domain/src/course-commerce.ts, courses.ts, course-offers.ts, index.ts.
- 서버: config/courses.ts, course-commerce.ts, course-commerce-copy.ts, routes/courses.ts, services/courses.ts, services/offers.ts, runtime.ts.
- 공개 설정: config/catalog/courses.json, course-commerce.json.
- UI: HomeCourses.tsx, courses/CoursesPage.tsx, courses/CourseBookings.tsx, Offer.tsx, i18n/course-commerce.ts, home-courses.css.
- 검증: tests/integration/course-commerce.test.ts, tests/e2e/home-courses.spec.ts, tests/fixtures/course-commerce-demo.json.

명령과 실패 수정 이력은 [proof](proof.md)의 같은 날짜 코스 섹션에 기록한다. [PC 홈](design/course-commerce-2026-11-25/desktop-home.png), [모바일 홈](design/course-commerce-2026-11-25/mobile-home.png), [PC 비교](design/course-commerce-2026-11-25/desktop-commerce.png), [모바일 비교](design/course-commerce-2026-11-25/mobile-commerce.png), [독립 dist HTTP 결과](design/course-commerce-2026-11-25/smoke.json)를 보관한다. 시연 사진·환율·배경 타일은 대역이며 운영 사진/현재 가격의 재검수 증거가 아니다.
