# 100개 추가 코스와 실시간 편집 검토 (2026-11-26)

## 결과와 화면

별도 `/build-your-day`의 조합 라이브러리에 편집 아이디어 100개를 추가한다. 기존 원본50·단축24를 보존하여 총174개 선택지이며, 탭은 Short courses104 / 5h+ courses20 / Original courses50 / Places & restaurants200이다. 기존 `/courses` 목록과 원본 상세의 도로 경로50개는 유지한다. 새100개는 조합 화면에서 장소별 체크박스와 Preview on map으로 확인한다. 홈·코스 목록/상세의 Build my day 진입을 사용한다.

추가100개 중80개는 짧은 지역 코스,20개는 제안 체류시간 합계300분 이상의 긴 코스다. 제안 체류시간은 이동·식사·휴식·대기를 포함하지 않는다. 테마는 문화28/해안21/카페17/쇼핑·책방10/자연10/동네산책10/스포츠4다. 순서만 뒤집거나 식당만 빼서 새 코스라고 세지 않는다. 장소 재사용은 가능하지만, 기존 선택지와 신규100개 사이에서 일반 식당을 제외한 무순서 장소 집합까지 대조해 같은 전체 구성을 제외한다.

식당은 기본 선택에서 제외한다. 기존 코스의 식당도 Include restaurant stops를 켜거나 카드에서 직접 체크할 수 있다. 카페·디저트는 별도 역할이며 일반 식당 제외와 함께 사라지지 않는다. 신규100개에 일반 식당을 강제로 넣지 않았다. Places & restaurants에서 필요할 때 직접 추가한다.

## 조작과 지도

1. 짧은/긴/원본 코스 또는 장소를 선택하고 테마·권역·검색으로 좁힌다.
2. 코스 카드의 장소 체크박스를 바꾸거나 Preview on map을 누르면 저장 전 미리보기 지도에 즉시 반영된다. 미리보기는 저장된 My day와 구분하며 자동 저장하지 않는다.
3. Add to my day로 선택한 장소만 추가한다. 중복 장소는 한 번만 유지하고 최대12개 초과 시 추가 전체를 보류한다.
4. 저장 목록에서 순서 이동·삭제·같은 위치의 장소 교체가 가능하다. 교체는 해당 장소를 기준으로 주변 후보를 찾는다. 식당만 일괄 제거하는 버튼은 카페·디저트와 미공개 ID를 지우지 않는다.
5. PC는 편집 목록 상단의 고정 영역 지도와 선택 라이브러리를 나란히 놓는다. 모바일은 한 열이며 하단 이동 버튼으로 지도/내 코스로 돌아간다. 미리보기·체크·추가·교체·삭제·정렬에 맞춰 지도 마커와 방문 순서 참고선이 갱신된다.
6. 하단 상품은 현재 지도에 표시한 미리보기 또는 저장 목록의 검수된 장소 관계를 따른다. 미리보기 상품은 저장 전임을 표시한다. 숙소는 실제 마지막 선택 장소와의 검수된 stay 관계만 별도 표시한다. 최신 상품 상세·제휴 링크 검증과 기존 표시 통화 환산을 재사용한다.

새 조합 지도는 점선으로 방문 순서만 연결한다. 실제 도로/도보 경로·최단 경로·이동시간이 아니다. 연결선 표시를 끌 수 있고 좌표 없는 중간 장소를 건너 연결하지 않는다. 기존50개 원본의 실제 저장 OSRM 경로는 기존 상세에서만 계속 제공한다. 새 경로 API 호출이나 타일 선다운로드는 하지 않았다. 대표 좌표를 입구로 이동시키지 않는다.

## 출처와 거리 기준

`config/catalog/course-expansion.json`의167개 출처 연결은 기존 관광지/음식점 공개 원본의 서비스별 ID와 전체 원문 SHA-256을 고정한다. 기존100개와 신규 원본이 합쳐진 공개 선택 장소는200곳이다. 원본 파일·DB·사진·번역 지문·공개 제외 정책은 보존한다. 새 연결의 원문이 변경되거나 공개 자격·좌표가 없으면 그 원본을 사용하는 새 코스 전체를 보류한다. 개별 장소는 기존 서비스에서 현재 자격을 다시 확인한다.

짧은 코스는 순서대로 연결한 **직선거리의 합계4km 이하**, 제안 체류300분 미만이다. 현 자료의 최대 합계는 약3.0133km다. 카드에서 장소를 빼면 표시 참고 거리도 그 선택 순서로 다시 계산한다. 강·언덕·철도·유료시설 입장 경로를 고려한 실제 이동거리는 아니다. 지하철역5정거장 이내라고 검증하지 않았으므로 그렇게 표시하지 않는다. 긴 코스20개는 최소315분의 편집 체류 제안이다.

쇼핑은 원본에 있는 남포 지하상가·광안시장·F1963/서점/디자인 시설 등을 사용했다. 현대모터스튜디오는 디자인 시설이며 현대아울렛으로 바꾸지 않는다. 사직야구장 코스는 경기일·시작시간·관람권을 직접 확인하도록 표시한다. 드라이브인 영화는 차량 코스로 표시한다. 공연·전시·케이블카 등은 행사·휴관·기상·유료 입장을 확인하도록 안내한다. 인기·현지인 전용·실시간 영업·빈자리·무대기·경기 개최를 임의 보장하지 않는다.

새 데이터는 `editorial-idea` 및 `assistant-source-evidence`다. 사람/현장/운영 승인이나 추천 엔진으로 승격하지 않는다. 내부17개 테마의 pending/not-performed/recommendationEnabled=false를 유지한다. 5개 언어 제목과 짧은 별칭은 원문 ID를 바꾸지 않는 편집 표시다.

## 저장과 검증 경계

전용 localStorage 키 `dallabusan.course-builder.v1`에 version, kind/id 및 선택적 fromModule ID, savedAt만 저장한다. fromModule은 해당 코스의 제안 체류시간을 카탈로그에서 재해석하기 위한 ID다. 시간 수치·가격·예약 URL·환율·좌표는 캐시하지 않는다. 이전 kind/id 저장본도 그대로 읽는다. 출처 모듈이 사라지면 시간을 미확인으로 표시한다. 손상 데이터 보존·명시 초기화·다른 탭 충돌·저장 실패/재시도·기존 찜/장바구니 보존 정책을 유지한다.

`npm run data:builder:check`는 외부 호출 없이 5개 언어174/200·100개 신규80/20·기존74 보존·출처 지문·정확한 체류 합계·중복·단거리 한도를 검사한다. `npm run data:courses:check`는 기존 도로 경로50개를 별도로 검사한다. 단위/통합과 모바일/태블릿/PC E2E는 저장·미리보기·체크박스·지도 갱신·교체·식당 선택·가격·기존 페이지 회귀를 검사한다. 외부 지도/사진/환율/분석은 대역이며 실제 예약/결제·새 도로 라우팅은 실행하지 않는다. 최종 명령 결과와 시연은 docs/proof.md에 기록한다.

## 추가 코스 목록

아래 시간은 이동을 제외한 제안 체류시간이다. 전체 원문 근거와 다국어는 설정 JSON에 보관한다.

| ID | 코스 | 테마 | 제안 체류 | 원본 장소 순서 |
| --- | --- | --- | --- | --- |
| edit-001 | 계단에서 영화까지 | culture | 135분 | destination:busan-364 → destination:busan-267 → destination:busan-367 |
| edit-002 | 근현대사와 책방의 오후 | culture | 195분 | destination:busan-1881 → destination:busan-272 → destination:busan-2284 |
| edit-003 | 타워 전망과 지하상가 | shopping | 150분 | destination:busan-368 → destination:busan-550 → destination:busan-2491 |
| edit-004 | 책방과 드립커피, 석당 컬렉션 | cafe | 165분 | destination:busan-272 → food:1838 → destination:busan-274 |
| edit-005 | 해안시장과 부산 빵 산책 | shopping | 145분 | destination:busan-2588 → food:1613 → destination:busan-2491 |
| edit-006 | 작은 전시와 구도심 커피 | culture | 130분 | destination:busan-268 → destination:busan-2210 → food:1467 |
| edit-007 | 피란수도와 사진의 기억 | culture | 175분 | destination:busan-273 → destination:busan-274 → destination:busan-299 |
| edit-008 | 감천 골목과 어린왕자의 집 | neighborhood | 175분 | destination:gamcheon → destination:busan-288 → destination:busan-2678 |
| edit-009 | 색채마을에서 바다 전망으로 | coast | 160분 | destination:gamcheon → destination:busan-299 → destination:busan-298 |
| edit-010 | 날씨를 읽고 도시를 내려다보기 | neighborhood | 110분 | destination:busan-302 → destination:busan-2105 → destination:busan-2106 |
| edit-011 | 흰여울 책방과 산사의 여백 | shopping | 160분 | destination:busan-255 → destination:busan-2140 → destination:busan-1776 |
| edit-012 | 조선소 예술과 영도다리 너머 | culture | 130분 | destination:busan-256 → destination:busan-369 → destination:busan-1776 |
| edit-013 | 봉산마을과 언덕 위 전망 | neighborhood | 130분 | destination:busan-1179 → destination:busan-2218 → destination:busan-1776 |
| edit-014 | 바다의 역사와 피아크 커피 | cafe | 180분 | destination:busan-257 → destination:busan-2153 → food:1445 |
| edit-015 | 숲 산책 뒤 자동차극장 | nature | 210분 | destination:busan-258 → destination:busan-1440 |
| edit-016 | 항구 예술에서 흰여울까지 | neighborhood | 135분 | destination:busan-256 → destination:busan-255 |
| edit-017 | 영도다리와 해돋이 전망대 | coast | 65분 | destination:busan-369 → destination:busan-2218 |
| edit-018 | 커피 한 잔과 봉래산 풍경 | cafe | 135분 | food:1445 → destination:busan-359 |
| edit-019 | 해변에서 케이블카와 구름다리 | coast | 160분 | destination:busan-286 → destination:busan-1422 → destination:busan-833 |
| edit-020 | 구름다리와 암남 숲길 | nature | 130분 | destination:busan-833 → destination:busan-326 |
| edit-021 | 송도에서 누리바라기 전망까지 | coast | 90분 | destination:busan-286 → destination:busan-298 |
| edit-022 | 암남 숲과 바다 위 풍경 | nature | 165분 | destination:busan-326 → destination:busan-833 → destination:busan-1422 |
| edit-023 | 송도 바다와 충무동 시장 | shopping | 145분 | destination:busan-286 → destination:busan-2588 → destination:busan-2491 |
| edit-024 | 바다 위 캐빈과 항구 전망 | coast | 95분 | destination:busan-1422 → destination:busan-298 |
| edit-025 | 홍티의 예술과 노을 풍경 | culture | 155분 | destination:busan-2173 → destination:busan-287 → destination:busan-2157 |
| edit-026 | 다대포 모래와 바다누리길 | coast | 135분 | destination:busan-366 → destination:busan-2157 |
| edit-027 | 작은 예술 공간과 해변공원 | culture | 120분 | destination:busan-2173 → destination:busan-1718 |
| edit-028 | 색채 항구에서 홍티 예술로 | neighborhood | 120분 | destination:busan-333 → destination:busan-2173 |
| edit-029 | 상해거리에서 오래된 병원까지 | culture | 125분 | destination:busan-415 → destination:busan-266 → destination:busan-2079 |
| edit-030 | 산복도로의 사진과 이야기 | neighborhood | 160분 | destination:busan-2594 → destination:busan-2202 → destination:busan-2102 |
| edit-031 | 오래된 집과 커피의 역사 | cafe | 165분 | destination:busan-1866 → destination:busan-264 → destination:busan-1696 |
| edit-032 | 갤러리와 스카이웨이 전망 | culture | 120분 | destination:busan-2200 → destination:busan-1868 → destination:busan-2288 |
| edit-033 | 여행라운지에서 제1부두까지 | coast | 135분 | destination:busan-1900 → destination:busan-2187 → destination:busan-2081 |
| edit-034 | 책과 모형으로 읽는 북항 | culture | 165분 | destination:busan-2086 → destination:busan-2082 → destination:busan-2081 |
| edit-035 | 공구길과 커피박물관, 로스터리 | cafe | 140분 | destination:busan-1329 → destination:busan-508 → food:1819 |
| edit-036 | 미술과 상상, 수학의 하루 조각 | culture | 195분 | destination:busan-1653 → destination:busan-1185 → destination:busan-2077 |
| edit-037 | 광장과 공원의 도시 산책 | nature | 165분 | destination:busan-343 → destination:busan-354 → destination:busan-2155 |
| edit-038 | 국악 체험과 열린 광장 | culture | 120분 | destination:busan-2067 → destination:busan-343 |
| edit-039 | 전포 로스터리 세 가지 취향 | cafe | 120분 | food:1819 → food:2386 → food:1636 |
| edit-040 | 신발 이야기와 이중섭의 골목 | neighborhood | 135분 | destination:busan-813 → destination:busan-418 → destination:busan-358 |
| edit-041 | F1963의 책과 자동차 디자인 | shopping | 135분 | destination:busan-372 → destination:busan-1322 |
| edit-042 | 옛 성터와 동네 시장 | shopping | 105분 | destination:busan-301 → destination:busan-1305 |
| edit-043 | 미디어와 영화, 강변의 휴식 | culture | 170분 | destination:busan-308 → destination:busan-421 → destination:busan-362 |
| edit-044 | 벡스코와 영화의 전당 건축 | culture | 135분 | destination:busan-420 → destination:busan-421 |
| edit-045 | 영화의 거리와 디저트, APEC 풍경 | cafe | 140분 | destination:busan-361 → food:1628 → destination:busan-2121 |
| edit-046 | 도모헌의 정원과 광안리 바다 | coast | 120분 | destination:busan-2145 → destination:gwangalli |
| edit-047 | 광안리 바다와 음악 감상 | culture | 135분 | destination:gwangalli → destination:busan-2166 |
| edit-048 | 수변공원과 광안종합시장 | shopping | 120분 | destination:busan-285 → destination:busan-1305 |
| edit-049 | 도모헌과 남천 베이커리 | cafe | 105분 | destination:busan-2145 → food:1633 |
| edit-050 | 수영의 역사에서 강변 공원으로 | nature | 105분 | destination:busan-301 → destination:busan-362 |
| edit-051 | 해운대에서 동백섬, 누리마루 | coast | 165분 | destination:busan-373 → destination:busan-2274 → destination:busan-2121 |
| edit-052 | 달맞이 미술과 아세안 문화 | culture | 150분 | destination:busan-2753 → destination:busan-1862 |
| edit-053 | 청사포 풍경과 달맞이 미술 | coast | 120분 | destination:busan-348 → destination:busan-2753 |
| edit-054 | 해변과 마린시티 영화 산책 | coast | 120분 | destination:busan-373 → destination:busan-361 |
| edit-055 | 아세안 문화에서 구덕포 해안으로 | culture | 135분 | destination:busan-1862 → destination:busan-2095 |
| edit-056 | 송정에서 청사포 해안 풍경 | coast | 120분 | destination:busan-280 → destination:busan-348 |
| edit-057 | 구덕포와 청사포의 두 바다 | coast | 120분 | destination:busan-2095 → destination:busan-348 |
| edit-058 | 송정 해변과 아세안 문화 | culture | 135분 | destination:busan-280 → destination:busan-1862 |
| edit-059 | 용궁사와 수산과학, 바다 서점 | shopping | 180분 | destination:busan-261 → destination:busan-291 → destination:busan-281 |
| edit-060 | 과학관과 음악을 듣는 카페 | cafe | 150분 | destination:busan-340 → destination:busan-2119 |
| edit-061 | 오랑대 바다와 해광사 | coast | 105분 | destination:busan-290 → destination:busan-2220 |
| edit-062 | 이터널저니와 라운지의 오후 | cafe | 120분 | destination:busan-281 → food:1581 |
| edit-063 | 오시리아 해안에서 오랑대까지 | nature | 120분 | destination:busan-2172 → destination:busan-290 |
| edit-064 | 임랑과 박태준 기념관, 웨이브온 | cafe | 165분 | destination:busan-262 → destination:busan-1709 → food:174 |
| edit-065 | 죽성과 일광의 해안 풍경 | coast | 105분 | destination:busan-259 → destination:busan-265 |
| edit-066 | 기억을 담은 해안공원 두 곳 | coast | 120분 | destination:busan-1709 → destination:busan-757 |
| edit-067 | 장안사에서 대룡 예술마을로 | nature | 135분 | destination:busan-425 → destination:busan-450 |
| edit-068 | 읍성과 고분, 충렬사의 기억 | culture | 180분 | destination:busan-409 → destination:busan-419 → destination:busan-501 |
| edit-069 | 기차역과 독립운동의 흔적 | culture | 145분 | destination:busan-2566 → destination:busan-296 → destination:busan-501 |
| edit-070 | 식물 이야기와 금강공원, 모모스 | cafe | 165분 | destination:busan-297 → destination:busan-397 → food:127 |
| edit-071 | 자연사와 갤러리, 동네 빵집 | cafe | 175분 | destination:busan-270 → destination:busan-2204 → food:1803 |
| edit-072 | 우장춘의 식물 이야기와 디저트 | cafe | 90분 | destination:busan-297 → food:2354 |
| edit-073 | 야구장과 파티쓰리의 경기날 | sports | 255분 | destination:busan-527 → food:2354 |
| edit-074 | 팬케이크 뒤 사직 경기 관람 | sports | 255분 | food:1462 → destination:busan-527 |
| edit-075 | 어린이대공원과 수원지 숲 | nature | 180분 | destination:busan-344 → destination:busan-430 → destination:busan-2240 |
| edit-076 | 삼광사의 풍경과 동네 베이커리 | cafe | 150분 | destination:busan-347 → destination:busan-1772 → food:2371 |
| edit-077 | 도서관과 생활사, 삼락의 쉼 | culture | 170분 | destination:busan-1031 → destination:busan-511 → destination:busan-325 |
| edit-078 | 강변에서 민속관과 작은 서점 | shopping | 165분 | destination:busan-1434 → destination:busan-315 → destination:busan-1890 |
| edit-079 | 대항 등대와 어촌의 풍경 | neighborhood | 105분 | destination:busan-2587 → destination:busan-1014 |
| edit-080 | 금빛노을브릿지와 문화예술플랫폼 | nature | 105분 | destination:busan-1676 → destination:busan-2085 |
| edit-081 | 남포 역사와 책방을 깊이 보는 날 | culture | 315분 | destination:busan-364 → destination:busan-267 → destination:busan-1881 → destination:busan-368 → destination:busan-272 |
| edit-082 | 감천에서 피란수도의 기억까지 | neighborhood | 360분 | destination:gamcheon → destination:busan-2678 → destination:busan-288 → destination:busan-299 → destination:busan-273 |
| edit-083 | 영도 항구와 언덕, 흰여울 하루 | neighborhood | 315분 | destination:busan-256 → destination:busan-369 → destination:busan-1179 → destination:busan-2218 → destination:busan-255 |
| edit-084 | 해양박물관에서 태종대까지 | culture | 390분 | destination:busan-257 → destination:busan-2153 → food:1445 → destination:busan-258 |
| edit-085 | 송도의 바다와 숲을 채우는 하루 | coast | 315분 | destination:busan-286 → destination:busan-1422 → destination:busan-833 → destination:busan-326 |
| edit-086 | 홍티 예술부터 다대포 해변까지 | coast | 360분 | destination:busan-2173 → destination:busan-287 → destination:busan-1718 → destination:busan-366 → destination:busan-2157 |
| edit-087 | 초량과 수정의 건축, 커피 이야기 | culture | 330분 | destination:busan-415 → destination:busan-266 → destination:busan-2594 → destination:busan-1866 → destination:busan-264 → destination:busan-1696 |
| edit-088 | 책과 도시 변화로 걷는 북항 하루 | coast | 315분 | destination:busan-2086 → destination:busan-2082 → destination:busan-2081 → destination:busan-2187 → destination:busan-1900 |
| edit-089 | 전포의 커피와 서면의 예술 하루 | cafe | 345분 | destination:busan-1329 → destination:busan-508 → food:1819 → destination:busan-1653 → destination:busan-1185 |
| edit-090 | 시민공원과 국악 체험의 긴 오후 | culture | 315분 | destination:busan-354 → destination:busan-2155 → destination:busan-2067 → destination:busan-343 |
| edit-091 | 망미의 디자인에서 수영의 일상까지 | shopping | 315분 | destination:busan-372 → destination:busan-1322 → destination:busan-301 → destination:busan-1305 → destination:busan-362 |
| edit-092 | 센텀의 건축과 미디어, 강변 하루 | culture | 330분 | destination:busan-420 → destination:busan-421 → destination:busan-308 → destination:busan-362 |
| edit-093 | 해운대와 동백섬, 마린시티 하루 | coast | 330분 | destination:busan-373 → destination:busan-2274 → destination:busan-2121 → destination:busan-361 → food:1628 |
| edit-094 | 달맞이 전시부터 송정 바다까지 | culture | 330분 | destination:busan-2753 → destination:busan-1862 → destination:busan-2095 → destination:busan-280 |
| edit-095 | 용궁사와 서점, 해안길을 잇는 날 | coast | 360분 | destination:busan-261 → destination:busan-291 → destination:busan-281 → destination:busan-2172 → destination:busan-290 |
| edit-096 | 과학과 테마파크, 음악의 하루 | sports | 420분 | destination:busan-340 → destination:busan-1310 → destination:busan-2119 |
| edit-097 | 임랑 해변과 기념관, 커피의 하루 | cafe | 315분 | destination:busan-262 → destination:busan-1709 → food:174 → destination:busan-757 |
| edit-098 | 성곽과 박물관으로 읽는 동래 | culture | 330분 | destination:busan-409 → destination:busan-419 → destination:busan-501 → destination:busan-2566 → destination:busan-296 |
| edit-099 | 디저트와 야구, 식물 이야기 하루 | sports | 345분 | food:2354 → destination:busan-527 → food:1462 → destination:busan-297 |
| edit-100 | 현대미술과 철새를 보는 낙동강 하루 | nature | 330분 | destination:busan-1671 → destination:busan-304 → destination:busan-2189 |
