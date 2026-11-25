# 공통 숙소 검색 조건 (2026-11-25)

## 목표와 확인 결과

날짜·인원을 한 번만 입력해 두 판매처를 같은 조건으로 열도록 한다. 현재 발급된 외부 검색 위젯은 외부 날짜/인원 수정 인터페이스가 확인되지 않았다. 제공처 내부 DOM을 변조하거나 임의 postMessage 명령으로 동기화하지 않는다. 공통 폼→두 판매처 결과 링크 방식으로 구현하며 결과는 각 판매처 새 탭이다. 내부에 호텔 실재고나 동일 상품 최저가를 통합한 것으로 표시하지 않는다.

## 실제 근거

- 기존 활성 사이트1980997의 공식 검색 위젯 HTML에 있는 predefinedUrl과 공식 squareCalendar.min.js의 UrlBuilder를 확인했다. 날짜 checkin/checkout·Rooms·NumberofAdults·NumberofChildren를 사용한다. 실제 판매처 UI에서 아동 나이 childages를 확인하고 발급 CID 링크에서도 유지되는 것을 확인했다.
- 기존 등록 사이트의 공식 호텔/부산 도시/English 링크를 새로 생성했다. AID10925986/SID332880325/trip_sub3 D21538974가 실제 생성 결과다. 도시253과 영어 화면의 Busan 표기를 대조했다. 날짜 checkin/checkout,성인 adult,객실 crn,아동 children/ages,통화 curr를 실제 공개 검색 UI와 연결해 확인했다.
- 두 실제 제공처에서2026-12-10~13/성인4/객실2/아동1명7세를 확인했다. 각 링크의 제휴 식별값과 나이7/요청USD도 유지됐다. 실제 숙소 선택·예약·결제·광고 클릭을 하지 않았다. 계정 개인 이름/쿠키·브라우저 식별값/원본 세션 URL은 설정이나 공개 문서에 복제하지 않는다.
- 판매처가 브라우저의 이전 언어 설정을 유지할 수 있다. 직접 확인 시 한 제공처는 hl=en에도 한국어가 표시됐으므로 언어·통화와 최종 예약 조건 재확인을 안내한다.5개 언어는 우리 UI 및 언어별 요청 통화 계약이며 모든 판매처의 쿠키 우선순위를 통제한다는 뜻이 아니다.

## 계약·파일

- domain/stay-search.ts: 순수 날짜/인원 계약,진짜 달력 날짜,UTC 일수,1~30박·365일,성인1~8/객실1~4/최소1성인씩/아동 나이0~17 최대4.
- config/catalog/stay-search.json: 발급된 기본 URL·중립providerId·추적값·동적 필드 매핑·출처/확인일. 기존 카탈로그/위젯의 다른 CID를 덮어쓰지 않는다.
- server config/stay-search.ts: 정확한 호스트/경로/HTTPS·userinfo/port/hash 금지,대소문자 별칭 포함 중복 query·정적/동적 충돌·제휴값 검증. 공통 validateLink를 새로 발급된 도구 전용 범위로 호출한다. 제공처 open 정책/승인/활성을 우회하지 않는다. 업체별 분기는 없다.
- GET /api/stay-search?locale=en: 날짜 기본값·통화·최소 공개 제공처만 반환한다.
- POST /api/stay-search: strict locale/criteria JSON(2KiB),no-store,외부 호출 없이 최소 링크 DTO만 반환한다. URL/CID/제공처 덮어쓰기를 받지 않는다.
- web SharedStaySearch.tsx·i18n/stay-search.ts·shared-stay-search.css,TravelTools.tsx: 하나의 폼과 좌우 카드,작은 화면은 세로 배치. 기존 개별 위젯은 별도 조건임을 표시하고 접어 둔다.

## 조작·상태

공통 입력→두 판매처에 적용→같은 조건 요약→원하는 판매처 새 탭 검색이다. 양쪽 새 탭을 자동으로 열지 않는다. 아동 나이는 비워 둔 채0세로 가정하지 않는다. 입력이 바뀌면 기존 링크를 숨기며 재적용한다. 실패하면 입력/마지막 성공 자료는 보존하고 예약 이동은 차단한다. AbortController/요청 순번과 응답 locale/criteria/identity 대조로 오래된 결과를 막는다. 언어 변경에도 입력은 유지하고 통화가 달라져 재적용하게 한다. 필터 이동에도 폼 상태를 유지한다.

검색 조건/결과 링크는 페이지 메모리에서만 유지하며 우리 사이트 주소/localStorage/DB에 저장하지 않는다. 검색 이동 시 판매처 URL에 필요한 조건을 전달한다. 앱 코드에서 날짜·나이를 담는 분석 이벤트를 추가하지 않으며, 기존 분석 도구의 자동 외부 링크 수집 범위는 운영자 검토 대상이다. 제출한 조건은 링크를 생성하기 위해 서버에서 처리한다. 새 키·API 계약·수집 DB·내부 결제는 없다.

## 검증 순서

1. 날짜 실재성·과거/미래/30박 경계·객실/아동 나이·빈 아동 나이·5개 통화/추적값 동일성을 단위·통합 검사한다.
2. 미승인/제한 제공처,추적값·호스트·경로·파라미터 충돌,새 provider 설정만으로 확장을 검사한다.
3.5개 언어 UI·모바일/PC·조건 변경 링크 폐기·실패 입력 보존/재시도·늦은 응답 무시·외부 선로딩0을 브라우저 대역으로 검사한다. 기존 위젯은 보조 영역을 명시 열어 회귀 검사한다.
4. lint/typecheck/test/check:providers/build·E2E·dist start·실제 Vercel 함수 패키지 및 공개 API/화면을 확인한다. 실연동과 대역 결과는 proof에 분리 기록한다.

## 공식 참고

- [공식 숙소 검색 위젯](https://partners.agoda.com/Tools/Sherpa)
- [공식 제휴 링크 생성](https://kr.trip.com/partners/tools/deeplink/create)
- [공식 Affiliate Lite API 문서의 랜딩 URL 예](https://partners.agoda.com/Content/Documents/AffiliateLiteApi/Affiliate_Lite_API_V2.0.pdf): 과거 문서이므로 현재 실제 UI 대조를 함께 수행했다. API 연결 근거로 사용하지 않는다.

검증 결과는 [proof.md](proof.md)의 최신 절을 따른다.
