# 예약 전 이용 조건 안내와 코스 분류 복원 (2026-11-26)

## 사용자 요청과 순서

기존 작업을 먼저 dallabusan 원격의 main에 커밋345625e로 푸시했다. 이어서 외국인이 예약 옵션을 판단할 수 있는 상품 조건 안내를 구현한다. 추가 요청으로 홈/코스 페이지의 First-Timer·No Car·Couples·1-Day Trip 별도 분류 줄을 제거하고 기존 Family/Date/Friends/Food/dallaBusan 다섯 카테고리로 통합한다. 원본50개와 추가100개를 동일한 공개 코스 목록·상세에 제공한다. 코드 검증 후 별도 승인 없이 같은 원격으로 후속 푸시하는 요청이다. origin 원격은 사용하지 않는다.

## 현재 코스 수와 화면

| 기존 분류 | 기존 | 추가 | 합계 |
| --- | --- | --- | --- |
| Family | 10 | 32 | 42 |
| Date | 10 | 34 | 44 |
| Friends | 10 | 10 | 20 |
| Food | 10 | 13 | 23 |
| dallaBusan | 10 | 11 | 21 |
| 합계 | 50 | 100 | 150 |

분류는 편집 아이디어다. 가족 분류를 아동 안전·접근성 검증으로 표시하지 않는다. 카페/디저트 탐방은 Food에 포함하며 매 코스에 식당을 강제하지 않는다. 홈은 기존 카테고리만 표시하고 선택하면 기존3개·추가3개를 함께 노출한다. 전체 보기/카테고리 링크는150개 목록과 해당 상세로 연결한다. 기존 코스의 ID/순서/사진·원본 관계와50개 도로 경로는 유지한다. 추가100개는 기존 조합 라이브러리의 같은 ID이며 복사 상품처럼 새 ID를 만들지 않는다. 신규 상세에서 지도/원문/관련 상품과 편집기 연결을 제공한다. 긴 코스는 편집기의 긴 코스 탭으로 진입한다.

`/build-your-day`의174개는 원본50+신규100에 기존 단축 선택지24를 더한 수다. 이를 공개 코스150개와 중복 합산하지 않는다. 단거리80/장기20·출처 지문·최대 직선 연결 합계4km 규칙을 보존한다. 추가100개의 점선 지도는 방문 순서 참고선이며 도로나 대중교통 최적 경로가 아니다. No Car는 차량/도보 정보, Couples는 Date 분류, 하루 여부는 체류 제안으로 표현한다. 기존 persona API 매개변수는 과거 호환 계약으로만 남기고 UI의 추가 필터나 숨은 분류로 사용하지 않는다.

## 예약 안내 계약

`/api/offers/:id/booking-guide?locale=...`는 공개 상품의 조건만 읽기 전용/no-store로 제공한다. 상품 상세의 “Check language & entry rules” 버튼으로 안내에 이동한다. 진행 언어·외국인 참가·아동·집결/교환·취소/환불·추가 비용·해외카드7개 항목을5개 언어로 제공한다. 각 상태는 판매처 기재/source-listed, 확인 필요/check-required, 안내 상충/conflicting, 미확인/unknown이다. 이는 결제/참가 적합성 점수나 모든 국적 대상 보장이 아니다.

별도 config/catalog/booking-guides.json의 상품/provider/external ID·원본 제목/언어·scope/category·원문 URL·발급 링크 SHA-256과 현재 공개 상품을 대조한다. 근거 URL은 해당 상품의 정확한 원문 URL 및 registry 허용 호스트여야 한다. 날짜 검토창은 최대31일이며 현재8개는2026-11-26에 원문을 검토했다. 일반 재검토 기한은12월9일, 기간 한정 패키지는12월6일이다. 페이지 열람 자료는 캐시된 원문일 수도 있으므로 실시간 약관/재고 확인이라고 표시하지 않는다.

제품 원문/정체성/호스트 불일치·미래 검토일·검토 만료는 근거/요약을 내보내지 않고 전 항목을 미확인으로 복구한다. 이미 연 상세도 기한 만료/백그라운드 복귀 시 오래된 요약을 숨긴다. 실패/재시도/상품·언어 변경의 오래된 응답을 차단한다. 미공개/제한 업체는 기존 OfferService 자격에 따라404이며 새 안내가 공개 자격을 우회하지 않는다. 결제 API·개인정보 수집·계약/채널 제출·실제 결제는 추가하지 않는다. 가격·URL·찜/장바구니 저장 정책을 바꾸지 않는다.

예약 페이지 언어는 진행 언어·국적별 참가·통역·해외카드 결제 근거와 별개다. 모든 미확인 항목에 확인할 질문을 제공한다. 전체402개를 상세 검수했다고 주장하지 않는다. 상세 조건 파일은8개/21개 항목이며 나머지는 미확인이다. 실제 해외카드 결제 검증은0건이다. 요약은 편집 번역이고 원문 근거와 선택한 옵션의 판매처 약관이 우선한다.

## 확인한 원문과 한계

| 상품 ID | 확인한 내용 | 원문 |
| --- | --- | --- |
| b-74132 | 영어/중국어/일본어 표시, 스태프 미팅 | https://www.klook.com/ko/activity/74132-busan-oneday-tour-busan |
| b-148741 | 영어/중국어 표시, 스태프 미팅 | https://www.klook.com/ko/activity/148741-sunset-haeundae-sky-capsule-busan-night-view-tour |
| b-75094 | 상품 연령 안내·주소·기간 한정 옵션의 사용/교환 전 환불 조건 | https://www.klook.com/ko/activity/75094-lotte-world-busan |
| b-91702 | 지정장소 미팅·기재 주소; 실제 승선 부두는 바우처 확인 필요 | https://www.klook.com/ko/activity/91702-busan-yacht |
| a-52607026 | 가이드 옵션 언어, KTX 부산역 출구 구분, 취소 마감 표시, 중식 개인 부담 | https://kr.trip.com/things-to-do/detail/52607026/ |
| e-138477 | 외국인 대상 패스 소개·실물 수령 여권·교환 방식·교통 충전/우선 입장 제외 | https://www.kkday.com/zh-tw/product/138477-visit-busan-pass-discount-free-attractions |
| e-111594 | 문자 QR/한국 번호 예시·영아 증빙·주소/당일 사용 제한·취소 안내 상충 | https://www.kkday.com/ko/product/111594 |
| e-105514 | 가이드 없음·일반 아동 구분; 실제 옵션/증빙 조건 별도 | https://www.kkday.com/zh-tw/product/105514-busan-x-the-sky-observatory-ticket-haeundae |

송도 케이블카의 같은 페이지에 취소 불가와 미사용 티켓 전액 환불이 함께 적혀 있어 임의 선택하지 않고 상충으로 표시한다. 한국 번호 예시는 해외 번호 사용 불가의 확정 근거가 아니므로 판매처 확인을 요청한다. 추천 상품/이용 후기의 문구를 현재 상품의 조건으로 가져오지 않는다. 숙소나 미검토 상품에 투어 조건을 복사하지 않는다.

## 파일과 검증

신규 domain booking-guide.ts, 서버 config/services/routes의 booking-guides.ts, 설정 booking-guides.json, 웹 booking/BookingGuide.tsx·CSS·i18n, offline check CLI와 통합/E2E를 추가했다. runtime·상품 상세와 코스 서비스·홈/목록·추가100개 분류·편집 연결을 수정했다. 기존 source 파일·사진·DB·키·lockfile은 보존한다. lint/typecheck/test/check:providers/build, data:booking-guides:check·data:builder:check·data:courses:check와 모바일/태블릿/PC E2E 및 독립 dist smoke를 수행한다. 실제/대역 결과와 캡처는 proof.md에 기록한다.
