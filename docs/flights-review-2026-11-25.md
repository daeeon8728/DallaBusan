# 부산행 항공권 도구 검토 (2026-11-25)

## 구현 결정

사용자가 항공권 추가와 DallaBusan 저장소 push를 명시적으로 요청했다. 홈의 코스 우선 흐름은 유지하고 보조 링크 → /travel-tools?section=flights의 별도 항공권 탭 → 공식 외부 검색창 → 판매처 예약/결제로 연결한다. 내부 항공 가격/재고/API 검색·발권·결제는 구현하지 않는다.

## 실제 발급 근거

로그인된 기존 제휴 플랫폼의 검색창 생성 기능에서 기존 등록 채널을 그대로 선택했다. 상품 종류 항공권, 언어 English, 출발지 미선택/도착지 Busan으로 저장했다. 생성 목록에서 항공권 항목과 실제 도구 ID S21548718, 사이트 ID332880325를 확인했다. 공식 발급 iframe 주소는 config/catalog/travel-tools.json에 원문 그대로 보관한다.

- 발급 출처: https://kr.trip.com/partners/tools/searchbox
- 제공처: 기존 PROVIDER_A 설정과 같은 발급 AID10925986/SID332880325
- 호스트/경로: https://www.trip.com/partners/ad/S21548718
- 원본 크기320×320, protocol=none, contentLocale=en, currency=null
- 실제 도구 화면에서 Round-trip/One-way, City or airport, Busan, 날짜, Economy 및 성인/아동/유아 선택과 Search 버튼을 확인했다.
- 발급 당시 예시 날짜는2026-11-26~27이었다. 공식 날짜 입력은 일반 텍스트 편집이 허용되지 않아 지우거나 URL을 임의 변경하지 않았다. UI에 예시 날짜이며 본인의 여행일을 직접 선택하라고5개 언어로 안내한다.
- 기존 계정에서 도구가 발급됨을 확인한 것이며 모든 항공편/국가/카드의 수익 인정이나 수수료율을 보장하지 않는다. 새 계약/계정/채널 제출·항공편 예약/결제는 하지 않았다.

## 데이터·UI 경계

브랜드/호스트/전체 iframe URL/파트너 및 추적 값은 config/catalog와 기존 서버 설정에만 둔다. domain의 도구 종류에 flights를 추가하고 UI는 중립 ID와 kind로 렌더링한다. API 목록은 URL을 제공하지 않고, 도구 열기를 누를 때만 최소 프레임 DTO를 조회한다. 최초 진입·언어 변경에 외부 프레임을 자동 생성하지 않는다.

5개 UI 언어를 제공하며 외부 검색창은 실제 발급된 영어 버전이라는 안내를 표시한다. 화폐를 임의로 지정하거나 한국어/일본어 위젯을 발급했다고 표시하지 않는다. 여행 날짜·출발 공항·인원·수하물·운임/환불 조건·통화는 판매처에서 확인한다. 희망 여행 조건을 내부 저장/분석 이벤트로 새로 수집하지 않는다.

외부 iframe은 기존 sandbox·referrerPolicy와 수동 열기/닫기를 재사용한다. 승인/호스트/경로/추적 값 불일치는 공개하지 않는다. iframe이 보이지 않을 때는 발급 도구를 새 탭으로 여는 대안을 제공한다. 링크는 sponsored noopener noreferrer다.

공통 숙소 폼의 날짜·객실·아동 나이는 항공 검색에 적용하지 않는다. 숙소/항공/체험 탭을 구분하고 항공 탭 주소는 새로고침·언어 변경에 보존한다. 기존 숙소 양쪽 검색, 지도/배너, 보류 중인 제공처 도구는 유지한다.

## 검증

- config/계약: 실제 발급 URL 보존,5개 언어 제목/영어 contentLocale,미승인·추적/중복/호스트/경로 변경 차단,설정만으로 제공처 변경.
- 브라우저: 홈→항공 탭,클릭 전 외부 문서 요청0,정확한 iframe·수동 닫기/새 창,5개 언어/오류 재시도/모바일·태블릿·PC와 기존 숙소 입력 보존.
- 실제 계정/발급 화면 확인과 대역 E2E를 구분한다. 실제 항공 검색 결과로 이동하거나 예약/결제/광고 클릭을 반복하지 않는다.
- 전체 품질·실제 Vercel 함수 패키지·dist smoke·GitHub push/공개 반영 결과는 docs/proof.md의 후속 절에 기록한다.

## 변경 파일

packages/domain/src/travel-tools.ts,config/catalog/travel-tools.json,apps/web/src/TravelTools.tsx·App.tsx·i18n/flights.ts·travel-tools.css,tests/integration/flights.test.ts·travel-tools.test.ts,tests/e2e/flights.spec.ts·travel-tools.spec.ts. 서버는 기존 검증/route를 재사용한다. API 키와 새 의존성은 추가하지 않는다.
