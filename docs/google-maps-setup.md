# Google Maps 내보내기와 내장 지도

2026-11-26 사용자 요청. 코스 상세와 조합 페이지의 **현재 방문 순서**를 Google Maps로 내보낸다.

## 키 없이 바로 사용하는 기능

`/api/map-links`는 공개 관광지/맛집의 namespace·ID를 재조회하고 서버의 검수된 대표 좌표로 Google Maps URLs를 생성한다. 외부 API 호출·길찾기 과금·위치 권한·실시간 GPS는 사용하지 않는다. 사용자 입력 URL로 리디렉트하지 않는다.

- 1곳이면 개별 장소 열기.
- 2~5곳은 출발지·도착지·경유지 최대 3개로 전달.
- 6~12곳은 `1–5`, `5–9`, `9–12`처럼 경계 장소를 공유해 모든 정차지를 보존한다. 각 구간을 따로 열며 Google 계정에 일정을 자동 저장하는 기능은 아니다.
- 대중교통은 경유지 지원 차이를 피하기 위해 이웃 장소 한 구간씩 제공한다.
- 현재 UI는 대중교통 구간별 링크를 제공한다. 추천/도보/차량 URL 생성은 이전 API 호환 계약에만 남아 있다. 실제 경로·운행·도착시간은 Google Maps에서 확인한다.
- 중간 좌표가 하나라도 미확인이면 전체 경로/구간 링크를 만들지 않고 모든 개별 장소 확인 링크를 제공한다. 미해결 장소를 건너 이어 붙이지 않는다.
- 고정 HTTPS Google 호스트, `api=1`, URLSearchParams, 2048자 이하, 새 탭/noopener noreferrer를 적용한다. URL에는 예약 URL·가격·API 비밀·저장 일정을 포함하지 않는다.
- 조회 변경/언어 전환/편집 시 오래된 링크를 즉시 숨기고 요청 취소·실패 재시도를 제공한다. 기존 localStorage에는 지도 URL/키/좌표를 저장하지 않는다.

## 사이트 안의 지도 교체

`GOOGLE_MAPS_EMBED_API_KEY`를 설정하고 재시작/재배포하면 기존 지도 위치에 Google Maps가 우선 표시된다. 선택한 장소의 핀을 표시하고 번호 버튼으로 방문 장소를 바꾼다. 경로 내보내기는 별도 Google Maps 앱/웹에서 열린다. 원래 Leaflet 지도는 ‘순서 참고 지도 보기’로 열 수 있다. 키 미설정 또는 링크 준비 실패 시 기존 지도와 재시도를 유지한다. 모든 정차지의 Google 도로 경로를 내부에 그렸다고 표시하지 않는다.

Maps Embed API는 공식 안내상 사용료가 없지만 **API 키와 결제 활성화된 Cloud 프로젝트 설정**이 필요하다. 유료 Maps JavaScript/Routes/Places API를 이 기능을 위해 호출하지 않는다. 한국은 Google Maps Platform 표에서 도보·차량 길찾기가 미지원으로 표시된다. 이 표는 소비자 Google Maps 앱 기능 전체를 뜻하지 않는다. 내장 지도는 장소 표시용이며 외부 경로 결과는 해당 서비스에서 확인한다.

## 발급 절차

1. [Maps Embed API 콘솔](https://console.cloud.google.com/apis/library/maps-embed-backend.googleapis.com)을 열어 운영자 계정으로 로그인하고 프로젝트를 선택한다.
2. Google 안내에 따라 결제 계정과 API 사용 설정을 운영자가 확인한다. 에이전트는 카드 등록·약관 동의·새 자격증명 생성을 임의로 제출하지 않는다.
3. **Maps Embed API 전용 키**를 발급한다. 앱 제한은 Websites(HTTP referrers), API 제한은 Maps Embed API만 선택한다.
4. 공개 사이트 `https://dallabusan.vercel.app/*`와 실제 AWS HTTPS 도메인을 등록한다. 로컬 시연이 필요하면 사용하는 `http://127.0.0.1:3001/*`, `http://127.0.0.1:5173/*`만 추가한다. 운영 키에 임의 wildcard 도메인을 허용하지 않는다.
5. 루트 `.env`의 `GOOGLE_MAPS_EMBED_API_KEY=`에 입력한다. Vercel은 프로젝트 환경 변수에 따로 입력하고 재배포해야 한다. 로컬 `.env`는 Vercel로 업로드하지 않는다.

이 값은 **브라우저 내장 지도용 제한 키**여서 발급된 iframe URL에서 방문자에게 보인다. 서버 전용 관광 API 키·제휴 서명 비밀과 구분한다. `VITE_` 변수나 소스에 하드코딩하지 않고 서버 config가 유효한 지도 URL만 만든다. referrerPolicy=strict-origin-when-cross-origin으로 사이트 Origin만 전송한다. 원시 설정·다른 키를 응답하지 않는다.

초기 구현은 빈 키로 keyless 내보내기를 제공했다. 이후 실제 키 적용·한국 경로 결과는 아래 실연동 기록을 따른다. E2E는 실제 Google 요청을 대역 처리한다.

## 공식 근거

- [Maps URLs: 키 불필요, 2048자, 모바일 경유지 3개](https://developers.google.com/maps/documentation/urls/get-started)
- [Embed API 사용료](https://developers.google.com/maps/documentation/embed/usage-and-billing)
- [Embed API 키·결제 프로젝트 설정](https://developers.google.com/maps/documentation/embed/get-api-key)
- [Embed iframe과 referrer 제한](https://developers.google.com/maps/documentation/embed/embedding-map)
- [국가별 API 지원 범위](https://developers.google.com/maps/coverage)


## 2026-11-26 실제 키 적용 확인

운영자가 .env에 키를 추가한 후 로컬 서버를 재시작했다. 실제 Google Embed에서 롯데월드 인근 지도와 선택 핀이 표시됨을 확인했다. 소비자 Google Maps에서도 부산 운전·도보가 비활성화되고3개 정차지 전체 경로 계산이 실패했다. 동일 출발지→식당의 대중교통 단일 구간에서는 버스 경로가 실제 조회됐다. 이 결과는 해당 구간·확인 시점의 관찰이며 모든 부산 구간/시간대의 운행을 보장하지 않는다.

현재 공개 UI는 대중교통 구간별 내보내기를 기본으로 사용하고, 정차지별 ‘다음 장소 길찾기’도 transit로 전달한다. 과거 recommended/walking/driving API 옵션은 호환을 위해 URL 생성 계약에 남지만 UI에서 지원되는 길찾기로 제시하지 않는다. 도로 예상 이동시간은 기존 OSRM 자료이며 Google 대중교통 소요시간으로 재명명하지 않는다. Maps JavaScript API를 추가 활성화해도 한국의 Google 도보·차량 길찾기 지원이 생기는 것은 아니다. 별도 JS 다중 마커/순서선 지도는 실제 내비게이션 계산과 다른 기능이다.

NODE_ENV=test 런타임은 운영자의 실제 지도 키를 무시한다. 테스트용 지도 키는 createRuntimeApp의 mapLinkConfig로만 명시 주입한다. 실제 키를 E2E 요청에 반복 사용하지 않는다. Vercel은 로컬 .env를 읽지 않으므로 해당 프로젝트 환경 변수 설정 및 재배포 여부를 별도로 확인해야 한다.
