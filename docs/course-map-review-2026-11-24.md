# 코스 상세 보완·도로 지도 구현 검토 (2026-11-24)

## 범위와 상태

최신 요청에 따라 공개 코스 40개와 내장 지도를 보완했다. 기존 관광지 검색·상세, 맛집, 추천여행, 홈/검색 추천 명소, 팝업은 유지한다. 기존 내부 17개 테마 자료와 승인 플래그는 수정하지 않는다.

- 4개 카테고리 각 10개, 서비스 네임스페이스를 구분한 원본 100개를 명시 연결한다. 이름 유사도로 매칭하지 않는다.
- 미선정 식사·디저트·일반 안내 노드를 실제 공개 장소로 대체한다. FO10은 안목 식사 → 홍옥당 디저트 → 광안리로 채웠다. 짧은 맛집 코스는 불필요한 우회를 추가하지 않고 식사+디저트 2곳을 유지한다.
- 모든 코스에 5개 언어 소개·방문 전 확인사항, 장소별 사진/출처·원문 메뉴·운영시간·휴무·권장 체류시간을 제공한다. 누락 정보는 미제공으로 표시하며 원문 번역 상태를 유지한다.
- 가족 코스의 각 장소에서 기존 공영/표준 주차 안내를 확인한다. 주차장 입구·빈자리·어린이 메뉴·알레르기 적합성을 확인 완료로 표시하지 않는다.
- 미쉐린/블루리본 수상 배지, 현지인 전용·짧은 웨이팅·접근성 보장은 추가하지 않았다. 별도 지점/연도/출처 검증이 필요하다.

## 지도·경로 설계와 비용

React-Leaflet 5 / Leaflet 1.9.4를 지연 로딩하고 OSM 표준 타일을 사용한다. 설치된 고정 의존성을 재사용해 lockfile과 Node 버전은 변경하지 않았다. React-Leaflet 전체 barrel에 있는 미사용 LayersControl/SVGOverlay의 비공개 core 경로 타입 오류는 공개 subpath import로 피하며 skipLibCheck를 켜지 않는다.

도로 경로는 FOSSGIS OSRM 무료 도보/차량 그래프로 CLI에서 수집한다. 서버 요청이나 방문자 브라우저에서 라우팅 API를 호출하지 않는다. 1.5초 간격·25초 제한·고정 호스트·User-Agent·동일 입력 캐시를 사용한다. 기본 40개 요청 후 해안공원의 도보 재검증 1회, 총 41회로 40개 경로를 확보했다. `/routed-foot/route/v1/driving`의 profile 문자열은 서버 API 형식이며 실제 선택 그래프는 routed-foot다.

- 좌표는 공개 원본의 대표 지점이다. 입구를 임의 이동하지 않는다. 중복 언어 좌표가 충돌하면 기존 앵커 규칙에 따라 보류한다.
- 최초 CU01 차량 계산은 공원 좌표의 도로 스냅 거리 300m 초과로 거절했다. 원본을 수정하지 않고 도보 모드로 재수집해 3.042km 경로를 확보했다.
- 모드·순서·서비스 ID·좌표 SHA-256이 달라지면 저장 경로를 사용하지 않는다. 모든 지점의 근접 통과, waypoint/leg 수, 응답 코드, 스냅 거리, 좌표 범위, 총거리/구간 합계를 검증한다.
- 유효 경로는 실선, 경로 없음은 점선 참고 연결이다. 누락된 중간 좌표를 건너뛰어 앞뒤를 잇지 않는다. 경로 없을 때 거리·시간을 만들어 내지 않는다.
- 수집일과 구간별/전체 도로 추정값을 표시한다. 실시간 교통·정체·횡단 대기·주차·대기줄·케이블카는 포함하지 않는다. 체류시간은 편집 제안이며 합계도 이동과 분리한다.
- 순서는 지역 단위 편집 검토 결과이며 전역 최적/현장 확인 일정이 아니다. routeCheck=pending, fieldValidation=not-performed, editorial-idea는 유지한다.
- 번호 마커/장소 선택/전체 경로 보기, 구간별 외부 Google Maps 길찾기, 타일 실패/재시도, 지도 모듈 실패 시 장소 목록 유지, 지도 출처와 오류 제보 링크를 제공한다.
- OSM 타일은 브라우저 기본 캐시를 사용하며 오프라인 다운로드·미리 수집·캐시 우회·headless 실타일 탐색을 하지 않는다. E2E 타일/이미지는 대역이며 실제 경로 수집과 구분한다. 운영 트래픽이 정책을 넘으면 타일 설정을 별도 제공처로 교체한다.
- 목록은 geometry/구간/상세 설명을 제외한 summary DTO, 상세는 해당 코스의 전체 DTO다. 지도 청크는 상세 진입 때만 요청한다.

## 파일·운영 순서

1. `config/catalog/courses.json`의 명시 장소/체류시간/5개 언어 안내와 출처 지문을 검토한다.
2. 원본 공공 자료가 바뀌면 기존 공개/번역/사진 검수 절차를 먼저 수행한다. 지문 불일치를 임의 자동 승인하지 않는다.
3. `npm run data:courses:routes:refresh`로 변경 입력만 순차 수집한다. 실패 코스가 있으면 종료 1이며 해당 코스는 참고 경로다.
4. `npm run data:courses:check`로 외부 호출 없이 40개 코스/경로 연결을 검사한다.
5. lint/typecheck/test/check:providers/build와 지도/회귀 E2E, dist start 및 Vercel 함수 패키지 smoke를 수행한다. 실제 결과는 proof.md에 기록한다.

## 40개 공개 제안 순서와 수집 결과

아래 시간은 도로 그래프의 계산값이다. 교통/대기/체류를 포함하지 않으며 안전·진입 가능성을 확인한 값이 아니다.

| ID | 영문 제목 | 순서 (서비스:ID) | 모드 | 거리 km | 도로 예상 분 | 권장 체류 분 |
| --- | --- | --- | --- | --- | --- | --- |
| FA01 | Osiria Play Day | destination:busan-1310 → food:1804 → destination:busan-2172 | driving | 6.854 | 10 | 275 |
| FA02 | Temple & Ocean Discovery | destination:busan-261 → destination:busan-291 → food:1804 → destination:busan-2172 | driving | 7.220 | 13 | 215 |
| FA03 | Little Scientists | destination:busan-340 → food:1804 → destination:busan-290 | driving | 7.414 | 12 | 250 |
| FA04 | Haeundae Ocean Day | destination:busan-373 → food:2899 → destination:busan-2274 → food:1628 | walking | 3.257 | 43 | 205 |
| FA05 | Songdo Sky & Sea | destination:busan-286 → destination:busan-1422 → food:960 | walking | 1.607 | 21 | 180 |
| FA06 | Museum & Park Picnic | destination:busan-276 → food:204 → destination:busan-1731 → food:1459 | driving | 4.367 | 6 | 220 |
| FA07 | Eulsukdo Nature Day | destination:busan-1671 → destination:busan-304 → food:1118 | driving | 6.250 | 8 | 195 |
| FA08 | Forest & Bakery Break | destination:busan-344 → food:1507 → food:2371 | walking | 2.083 | 28 | 190 |
| FA09 | Beomeosa & Oncheonjang Day | destination:busan-2314 → destination:busan-402 → food:2884 → food:1816 | driving | 10.379 | 15 | 205 |
| FA10 | Songjeong Beach & Family Bites | destination:busan-280 → food:1477 → destination:busan-2095 → food:1460 | walking | 2.171 | 29 | 190 |
| DA01 | Gwangalli Golden Hour | food:212 → destination:busan-285 → destination:gwangalli | walking | 2.902 | 39 | 150 |
| DA02 | Haeundae Art & Dalmaji Tea | destination:busan-373 → destination:busan-2753 → food:1845 | walking | 3.337 | 45 | 155 |
| DA03 | Marine City Dessert Walk | destination:busan-2121 → destination:busan-2274 → food:1628 → destination:busan-361 | walking | 2.568 | 34 | 170 |
| DA04 | Huinnyeoul Slow Afternoon | destination:busan-255 → food:920 → destination:busan-2140 | walking | 0.934 | 12 | 155 |
| DA05 | Songdo Above the Sea | food:960 → destination:busan-286 → destination:busan-1422 | walking | 0.906 | 12 | 185 |
| DA06 | Dadaepo Sunset Together | destination:busan-287 → destination:busan-1718 → destination:busan-366 | walking | 1.835 | 24 | 135 |
| DA07 | Art & Riverside Date | destination:busan-372 → food:1589 → destination:busan-362 | walking | 2.326 | 31 | 180 |
| DA08 | Eulsukdo Art & Samnak Riverside | destination:busan-1671 → food:865 → destination:busan-325 | driving | 14.317 | 19 | 210 |
| DA09 | Seomyeon Art & Cake | destination:busan-1653 → food:1447 → destination:busan-1185 | walking | 1.974 | 26 | 155 |
| DA10 | Riverside & Pastries | destination:busan-2566 → food:1264 → food:1627 | walking | 1.782 | 24 | 140 |
| FO01 | Seomyeon Noodles & Coffee | food:1817 → destination:busan-1329 → food:1636 | walking | 1.445 | 19 | 145 |
| FO02 | Yongho Soup & Sweet Red Beans | food:1511 → food:1459 | walking | 1.635 | 22 | 105 |
| FO03 | Oncheonjang Comfort Food | food:2884 → destination:busan-397 → food:1816 | walking | 2.194 | 29 | 150 |
| FO04 | Dalmaji Broth & Tea | food:1609 → destination:busan-2753 → food:1845 | walking | 2.971 | 40 | 155 |
| FO05 | Yeongdo Soup & Bakery | food:1837 → destination:busan-256 → food:1445 | driving | 6.415 | 9 | 150 |
| FO06 | Yeonsan Neighborhood Bites | food:1515 → food:926 | walking | 1.217 | 16 | 105 |
| FO07 | University Quarter Bites | food:1506 → food:1452 | walking | 0.025 | 1 | 105 |
| FO08 | Gijang Noodles & Salt Bread | food:1221 → destination:busan-757 → food:1448 | driving | 9.293 | 12 | 145 |
| FO09 | Danggam to Choeup | food:1108 → destination:busan-354 → food:2371 | driving | 4.518 | 5 | 165 |
| FO10 | Namcheon Soup & Sweet Red Beans | food:1921 → food:959 → destination:gwangalli | walking | 1.294 | 17 | 150 |
| CU01 | Songdo Beyond the Cable Car | destination:busan-286 → destination:busan-833 → destination:busan-326 | walking | 3.042 | 41 | 150 |
| CU02 | Slow Dadaepo | destination:busan-2157 → destination:busan-1718 → destination:busan-366 | walking | 0.778 | 10 | 150 |
| CU03 | Jangnim Colors | destination:busan-333 → destination:busan-2173 → destination:busan-1718 | driving | 5.948 | 9 | 150 |
| CU04 | Mangmi Everyday Art | destination:busan-301 → destination:busan-372 → food:1589 | walking | 2.206 | 29 | 180 |
| CU05 | Choryang Hillside Stories | destination:busan-266 → destination:busan-2594 → food:245 | walking | 1.273 | 17 | 135 |
| CU06 | Yeongdo Harbor Stories | destination:busan-369 → destination:busan-256 → food:1905 → destination:busan-1179 | walking | 3.084 | 41 | 180 |
| CU07 | Yongho Coastal Details | destination:busan-2133 → destination:busan-278 → food:1459 | driving | 8.127 | 15 | 145 |
| CU08 | Hoedong Water & Woods | destination:busan-2206 → destination:busan-2612 → destination:busan-1798 | walking | 1.982 | 26 | 145 |
| CU09 | North Port Waterfront | destination:busan-2086 → destination:busan-2081 → food:1617 → destination:busan-415 | walking | 2.293 | 31 | 185 |
| CU10 | Gadeok Views & Daehang Harbour | destination:busan-832 → food:1458 → destination:busan-2587 | driving | 8.328 | 17 | 130 |

## 한계와 후속 검토

사진은 기존 장소별 공식 공공 출처 사진을 재사용하며 새 현장 촬영으로 해석하지 않는다. 매장 운영/메뉴/가격은 원문 스냅샷으로 현재 상황과 다를 수 있다. 음식점 1264는 원문 메뉴가 없어 미제공으로 남겼으며 설명에 없는 아동 메뉴를 만들지 않았다. 유모차·휠체어·해안 통제·기상·케이블카 왕복 탑승·주차 입구를 현장 검수해야 한다. 도보 경로와 차로의 물리적 연결은 현장 접근성/사유지 허가를 보증하지 않는다.

## 공식 기술 근거

- [FOSSGIS 라우팅 서비스·이용 정책](https://routing.openstreetmap.de/about.html)
- [OSRM Route API](https://project-osrm.org/docs/v5.24.0/api/)
- [OSM 타일 이용 정책](https://operations.osmfoundation.org/policies/tiles/)
- [React-Leaflet Map API](https://react-leaflet.js.org/docs/api-map/)
- [Google Maps URLs](https://developers.google.com/maps/documentation/urls/guide)

### 사진 미확보 목록

- DA10 / food:1627 레망파티쓰리: 공공 원본 사진 미제공. 다른 가게/공통 사진으로 대체하지 않았다. 장소 표시125회 중124회 사진 보유(원본100개 중1개 미제공), 모든 언어 동일. 새로 실제 이미지 디코딩 실연동을 수행했다는 뜻은 아니다.
