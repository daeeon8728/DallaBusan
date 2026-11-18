# 테마여행 코스 연결·원문 순서 검수 결과

자료 선별·원문 대조: 2026-11-14. 최종 검증: 2026-11-15 (Asia/Seoul). 이 문서의 검수는 assistant-source-evidence 방식의 저장된 원문·ID·좌표 대조다. 사람의 승인이나 실제 보행·운전·휴무 검증을 뜻하지 않는다. 새 페이지/공개 API/추천 기능은 없다.

## 자료 범위

- 테마여행 402개 원본 ID 그룹 / 1,191개 언어 레코드. 이 중 16개 원본 그룹에서 17개 전체 또는 부분 템플릿을 선별했다. 나머지 386개 그룹은 not-curated다. 전체 402개 코스를 검수 완료했다고 표시하지 않는다.
- 관광명소는 기존 SQLite의 1,044개 언어 레코드를 읽기 전용으로 추출했다. 공개 관광지 검색 파일에 없는 원본 좌표를 재사용하며 DB는 수정하지 않는다.
- 장소 매핑은 44건이다. 관광명소·맛집의 숫자 ID가 같아도 서비스가 다르면 별개다. 외국어 전용 ID도 제목 유사도로 합치지 않는다.
- 모든 템플릿은 humanApproval=pending, fieldValidation=not-performed, recommendationEnabled=false다.

## 집계

| 항목 | 수 |
| --- | ---: |
| sourceGroups | 402 |
| sourceLanguageRecords | 1191 |
| templates | 17 |
| sourceConfirmedOrder | 15 |
| sourceCheckedTemplates | 1 |
| needsReview | 16 |
| sourceCheckedSegments | 8 |
| checkedAttractionSteps | 35 |
| checkedFoodSteps | 2 |
| checkedFoodOptions | 19 |
| nearbyFoodOptions | 17 |
| sourceMentionedFoodOptions | 2 |
| notCuratedSources | 386 |
| unresolvedSteps | 43 |
| humanApproved | 0 |

checkedAttractionSteps/checkedFoodSteps는 템플릿 내 연결 발생 횟수다. 고유 물리 장소 수가 아니다. sourceConfirmedOrder는 원문상의 순서만 뜻한다. sourceCheckedTemplates=1은 해운대해수욕장→동백섬의 두 장소 부분 구간이며 완성된 여행 일정 1개를 의미하지 않는다. 8개 연속 구간에도 미검증 장소를 건너뛴 연결은 없다.

## 선별 템플릿별 결과

| 템플릿 / 원본 ID | 순서 | 연결 상태 | 확인된 연속 구간 | 맛집 후보(통과/전체) |
| --- | --- | --- | ---: | ---: |
| 부산에서 즐기는 K-POP, 「B-POP」 ‘로컬’ 코스 · 원문 지정 하위 구간 / 2710 | source-confirmed | needs-review | 0 | 0/0 |
| 부산에서 즐기는 K-POP, 「B-POP」 ‘로컬’ 코스 · 원문 지정 하위 구간 / 2710 | source-confirmed | needs-review | 1 | 2/3 |
| 부산에서 즐기는 K-POP, 「B-POP」 ‘낭만’ 코스 / 2713 | source-confirmed | needs-review | 1 | 2/2 |
| 부산에서 즐기는 K-POP, 「B-POP」 ‘힐링’ 코스 / 2725 | source-confirmed | needs-review | 1 | 0/0 |
| 부산에서 즐기는 K-POP, 「B-POP」 ‘예술’ 코스 / 2734 | source-confirmed | needs-review | 1 | 4/4 |
| 도시철도 1호선 타고 누비는 부산 / 491 | source-confirmed | needs-review | 2 | 4/4 |
| 동해선 투어 / 490 | source-confirmed | needs-review | 0 | 0/0 |
| 슬로(slow)부산을 만난다. 기장 해안 산책로 유명 스폿 따라잡기 / 352 | source-confirmed | needs-review | 0 | 0/0 |
| 동래야 놀자! 동래역사여행 / 408 | source-confirmed | needs-review | 0 | 0/0 |
| 낙동강에서 바다까지, 부산의 가을을 따라 / 2835 | source-confirmed | needs-review | 1 | 1/1 |
| [서부산 로컬 코스] 걸어서 시간 여행, 구포 감성 골목 투어 / 2824 | source-confirmed | needs-review | 0 | 0/0 |
| [서부산 웰니스·체험 코스] 파도와 바람이 전하는 위로, 다대포 웰니스 투어 / 2833 | source-confirmed | needs-review | 0 | 0/0 |
| [서부산 생태·문화 코스] 자연과 예술이 숨 쉬는 섬, 을숙도 에코-아트 투어 / 2836 | source-confirmed | needs-review | 0 | 0/0 |
| [서부산 노을·야경 코스] 붉은 노을에서 빛의 향연까지, 서부산 나이트 투어 / 2842 | source-confirmed | needs-review | 0 | 1/1 |
| 남포동과 나누는 이야기 / 2558 | needs-review | needs-review | 0 | 2/2 |
| 나 홀로 떠나는 광안리 여행 / 1200 | needs-review | needs-review | 0 | 2/2 |
| 해운대해수욕장 → 동백섬 · 원문 명시 연속 구간 / 284 | source-confirmed | source-checked | 1 | 1/1 |

## 원문 근거와 보류 사유

### 부산에서 즐기는 K-POP, 「B-POP」 ‘로컬’ 코스 · 원문 지정 하위 구간 (bpop-local-north)

- 출처: https://www.data.go.kr/data/15063506/openapi.do / ID 2710 / ko / source-declared-subroute
- 원문 순서 근거: declared-sequence

> 만덕 레고마을 → 석불사

- 1. 만덕 레고마을 → 미연결 / unresolved-place
- 2. 석불사 → attraction:433 / 원본 ID·이름·좌표 일치

- 전체 보류 코드: step-0:unresolved-place

- 공식 원문에 선언된 방문 순서를 대조한 자료다. 실제 경로·시간표·영업·현장 접근성은 검증하지 않았다.
- 미연결 장소를 임의로 메우거나 단절 구간을 건너 연결하지 않는다. 맛집 옵션은 원문 방문 순서와 별개다.

### 부산에서 즐기는 K-POP, 「B-POP」 ‘로컬’ 코스 · 원문 지정 하위 구간 (bpop-local-west)

- 출처: https://www.data.go.kr/data/15063506/openapi.do / ID 2710 / ko / source-declared-subroute
- 원문 순서 근거: declared-sequence

> 다대포해수욕장 → 감천문화마을 → 영도 흰여울마을

- 1. 다대포해수욕장 → attraction:366 / 원본 ID·이름·좌표 일치
- 2. 감천문화마을 → attraction:365 / 원본 ID·이름·좌표 일치
- 3. 영도 흰여울마을 → attraction:255 / alias-evidence-invalid

- 전체 보류 코드: step-2:alias-evidence-invalid
- 맛집 food-1117 / nearby-coordinate-option / source-checked / 436m 직선거리 / 자료 기준 통과
- 맛집 food-961 / nearby-coordinate-option / source-checked / 871m 직선거리 / 자료 기준 통과
- 맛집 food-920 / nearby-coordinate-option / needs-review / 직선거리 미적용·미확인 / nearby-coordinate-evidence-missing

- 공식 원문에 선언된 방문 순서를 대조한 자료다. 실제 경로·시간표·영업·현장 접근성은 검증하지 않았다.
- 미연결 장소를 임의로 메우거나 단절 구간을 건너 연결하지 않는다. 맛집 옵션은 원문 방문 순서와 별개다.

### 부산에서 즐기는 K-POP, 「B-POP」 ‘낭만’ 코스 (bpop-romance)

- 출처: https://www.data.go.kr/data/15063506/openapi.do / ID 2713 / ko / full-source
- 원문 순서 근거: declared-sequence

> 부산시민공원 → 서면 전포카페거리 → 황령산 전망대 → 오륙도 → 광안리해수욕장

- 1. 부산시민공원 → attraction:354 / 원본 ID·이름·좌표 일치
- 2. 서면 전포카페거리 → 미연결 / unresolved-place
- 3. 황령산 전망대 → 미연결 / unresolved-place
- 4. 오륙도 → attraction:278 / 원본 ID·이름·좌표 일치
- 5. 광안리해수욕장 → attraction:377 / 원본 ID·이름·좌표 일치

- 전체 보류 코드: step-1:unresolved-place, step-2:unresolved-place
- 맛집 food-1571 / nearby-coordinate-option / source-checked / 500m 직선거리 / 자료 기준 통과
- 맛집 food-1519 / nearby-coordinate-option / source-checked / 269m 직선거리 / 자료 기준 통과

- 공식 원문에 선언된 방문 순서를 대조한 자료다. 실제 경로·시간표·영업·현장 접근성은 검증하지 않았다.
- 미연결 장소를 임의로 메우거나 단절 구간을 건너 연결하지 않는다. 맛집 옵션은 원문 방문 순서와 별개다.

### 부산에서 즐기는 K-POP, 「B-POP」 ‘힐링’ 코스 (bpop-healing)

- 출처: https://www.data.go.kr/data/15063506/openapi.do / ID 2725 / ko / full-source
- 원문 순서 근거: declared-sequence

> 회동수원지 → 금정산 → 범어사 → 온천천 → 서동미로시장

- 1. 회동수원지 → attraction:2612 / 원본 ID·이름·좌표 일치
- 2. 금정산 → attraction:396 / 원본 ID·이름·좌표 일치
- 3. 범어사 → attraction:402 / 원본 ID·이름·좌표 일치
- 4. 온천천 → 미연결 / unresolved-place
- 5. 서동미로시장 → 미연결 / unresolved-place

- 전체 보류 코드: step-3:unresolved-place, step-4:unresolved-place

- 공식 원문에 선언된 방문 순서를 대조한 자료다. 실제 경로·시간표·영업·현장 접근성은 검증하지 않았다.
- 미연결 장소를 임의로 메우거나 단절 구간을 건너 연결하지 않는다. 맛집 옵션은 원문 방문 순서와 별개다.

### 부산에서 즐기는 K-POP, 「B-POP」 ‘예술’ 코스 (bpop-art)

- 출처: https://www.data.go.kr/data/15063506/openapi.do / ID 2734 / ko / full-source
- 원문 순서 근거: declared-sequence

> F1963 → 시립미술관 → 영화의거리 → 동백섬 → 블루라인파크

- 1. F1963 → attraction:372 / 원본 ID·이름·좌표 일치
- 2. 시립미술관 → attraction:289 / 원본 ID·이름·좌표 일치
- 3. 영화의거리 → attraction:361 / 원본 ID·이름·좌표 일치
- 4. 동백섬 → attraction:2274 / 원본 ID·이름·좌표 일치
- 5. 블루라인파크 → 미연결 / unresolved-place

- 전체 보류 코드: step-4:unresolved-place
- 맛집 food-1589 / nearby-coordinate-option / source-checked / 95m 직선거리 / 자료 기준 통과
- 맛집 food-1841 / nearby-coordinate-option / source-checked / 413m 직선거리 / 자료 기준 통과
- 맛집 food-2334 / nearby-coordinate-option / source-checked / 160m 직선거리 / 자료 기준 통과
- 맛집 food-1593 / nearby-coordinate-option / source-checked / 275m 직선거리 / 자료 기준 통과

- 공식 원문에 선언된 방문 순서를 대조한 자료다. 실제 경로·시간표·영업·현장 접근성은 검증하지 않았다.
- 미연결 장소를 임의로 메우거나 단절 구간을 건너 연결하지 않는다. 맛집 옵션은 원문 방문 순서와 별개다.

### 도시철도 1호선 타고 누비는 부산 (metro-line-one)

- 출처: https://www.data.go.kr/data/15063506/openapi.do / ID 491 / ko / full-source
- 원문 순서 근거: declared-sequence

> 범어사(범어사역) - 부산시민공원(부전역) - 서면일대(서면역) - 40계단(중앙역) - 용두산공원(남포역) - 감천문화마을(토성역) - 다대포해수욕장(다대포해수욕장역)

- 1. 범어사(범어사역) → attraction:402 / 원본 ID·이름·좌표 일치
- 2. 부산시민공원(부전역) → attraction:354 / 원본 ID·이름·좌표 일치
- 3. 서면일대(서면역) → 미연결 / unresolved-place
- 4. 40계단(중앙역) → attraction:364 / grouped-place-needs-specific-coordinate
- 5. 용두산공원(남포역) → attraction:368 / 원본 ID·이름·좌표 일치
- 6. 감천문화마을(토성역) → attraction:365 / 원본 ID·이름·좌표 일치
- 7. 다대포해수욕장(다대포해수욕장역) → attraction:366 / 원본 ID·이름·좌표 일치

- 전체 보류 코드: step-2:unresolved-place, step-3:grouped-place-needs-specific-coordinate
- 맛집 food-1571 / nearby-coordinate-option / source-checked / 500m 직선거리 / 자료 기준 통과
- 맛집 food-1570 / nearby-coordinate-option / source-checked / 242m 직선거리 / 자료 기준 통과
- 맛집 food-961 / nearby-coordinate-option / source-checked / 871m 직선거리 / 자료 기준 통과
- 맛집 food-1117 / nearby-coordinate-option / source-checked / 436m 직선거리 / 자료 기준 통과

- 공식 원문에 선언된 방문 순서를 대조한 자료다. 실제 경로·시간표·영업·현장 접근성은 검증하지 않았다.
- 미연결 장소를 임의로 메우거나 단절 구간을 건너 연결하지 않는다. 맛집 옵션은 원문 방문 순서와 별개다.

### 동해선 투어 (donghae-rail)

- 출처: https://www.data.go.kr/data/15063506/openapi.do / ID 490 / ko / full-source
- 원문 순서 근거: declared-sequence

> 부전시장(부전역) - 온천천 카페거리(안락역) - 송정해수욕장(송정역) - 죽성성당(기장역) - 일광해수욕장(일광역)

- 1. 부전시장(부전역) → 미연결 / unresolved-place
- 2. 온천천 카페거리(안락역) → 미연결 / unresolved-place
- 3. 송정해수욕장(송정역) → attraction:280 / grouped-place-needs-specific-coordinate
- 4. 죽성성당(기장역) → attraction:259 / 원본 ID·이름·좌표 일치
- 5. 일광해수욕장(일광역) → 미연결 / unresolved-place

- 전체 보류 코드: step-0:unresolved-place, step-1:unresolved-place, step-2:grouped-place-needs-specific-coordinate, step-4:unresolved-place

- 공식 원문에 선언된 방문 순서를 대조한 자료다. 실제 경로·시간표·영업·현장 접근성은 검증하지 않았다.
- 미연결 장소를 임의로 메우거나 단절 구간을 건너 연결하지 않는다. 맛집 옵션은 원문 방문 순서와 별개다.

### 슬로(slow)부산을 만난다. 기장 해안 산책로 유명 스폿 따라잡기 (gijang-coast)

- 출처: https://www.data.go.kr/data/15063506/openapi.do / ID 352 / ko / full-source
- 원문 순서 근거: declared-sequence

> 공수마을 – 해동용궁사 – 국립수산과학관 – 아난티코브 –오랑대공원 - 연화리 - 대변항

- 1. 공수마을 → 미연결 / unresolved-place
- 2. 해동용궁사 → attraction:261 / 원본 ID·이름·좌표 일치
- 3. 국립수산과학관 → 미연결 / unresolved-place
- 4. 아난티코브 → 미연결 / unresolved-place
- 5. 오랑대공원 → attraction:290 / 원본 ID·이름·좌표 일치
- 6. 연화리 → 미연결 / unresolved-place
- 7. 대변항 → 미연결 / unresolved-place

- 전체 보류 코드: step-0:unresolved-place, step-2:unresolved-place, step-3:unresolved-place, step-5:unresolved-place, step-6:unresolved-place

- 공식 원문에 선언된 방문 순서를 대조한 자료다. 실제 경로·시간표·영업·현장 접근성은 검증하지 않았다.
- 미연결 장소를 임의로 메우거나 단절 구간을 건너 연결하지 않는다. 맛집 옵션은 원문 방문 순서와 별개다.

### 동래야 놀자! 동래역사여행 (dongnae-history)

- 출처: https://www.data.go.kr/data/15063506/openapi.do / ID 408 / ko / full-source
- 원문 순서 근거: declared-sequence

> 동래읍성임진왜란역사관 - 동래부동헌 - 동래향교 - 복천동 고분군 - 복천박물관 - 동래읍성역사관 - 장영실 과학동산 - 북문 - 북장대 - 인생문 - 충렬사

- 1. 동래읍성임진왜란역사관 → 미연결 / unresolved-place
- 2. 동래부동헌 → 미연결 / unresolved-place
- 3. 동래향교 → attraction:439 / grouped-place-needs-specific-coordinate
- 4. 복천동 고분군 → attraction:419 / grouped-place-needs-specific-coordinate
- 5. 복천박물관 → attraction:419 / grouped-place-needs-specific-coordinate
- 6. 동래읍성역사관 → 미연결 / unresolved-place
- 7. 장영실 과학동산 → 미연결 / unresolved-place
- 8. 북문 → 미연결 / unresolved-place
- 9. 북장대 → 미연결 / unresolved-place
- 10. 인생문 → 미연결 / unresolved-place
- 11. 충렬사 → 미연결 / unresolved-place

- 전체 보류 코드: repeated-place-needs-review, step-0:unresolved-place, step-1:unresolved-place, step-2:grouped-place-needs-specific-coordinate, step-3:grouped-place-needs-specific-coordinate, step-4:grouped-place-needs-specific-coordinate, step-5:unresolved-place, step-6:unresolved-place, step-7:unresolved-place, step-8:unresolved-place, step-9:unresolved-place, step-10:unresolved-place

- 공식 원문에 선언된 방문 순서를 대조한 자료다. 실제 경로·시간표·영업·현장 접근성은 검증하지 않았다.
- 미연결 장소를 임의로 메우거나 단절 구간을 건너 연결하지 않는다. 맛집 옵션은 원문 방문 순서와 별개다.

### 낙동강에서 바다까지, 부산의 가을을 따라 (west-river-autumn)

- 출처: https://www.data.go.kr/data/15063506/openapi.do / ID 2835 / ko / full-source
- 원문 순서 근거: declared-sequence

> 화명생태공원 → 대저생태공원 → 삼락생태공원 → 을숙도생태공원 → 다대포해수욕장

- 1. 화명생태공원 → attraction:1434 / 원본 ID·이름·좌표 일치
- 2. 대저생태공원 → attraction:1673 / 원본 ID·이름·좌표 일치
- 3. 삼락생태공원 → attraction:325 / 원본 ID·이름·좌표 일치
- 4. 을숙도생태공원 → 미연결 / unresolved-place
- 5. 다대포해수욕장 → attraction:366 / 원본 ID·이름·좌표 일치

- 전체 보류 코드: step-3:unresolved-place
- 맛집 food-1117 / nearby-coordinate-option / source-checked / 436m 직선거리 / 자료 기준 통과

- 공식 원문에 선언된 방문 순서를 대조한 자료다. 실제 경로·시간표·영업·현장 접근성은 검증하지 않았다.
- 미연결 장소를 임의로 메우거나 단절 구간을 건너 연결하지 않는다. 맛집 옵션은 원문 방문 순서와 별개다.

### [서부산 로컬 코스] 걸어서 시간 여행, 구포 감성 골목 투어 (gupo-local)

- 출처: https://www.data.go.kr/data/15063506/openapi.do / ID 2824 / ko / full-source
- 원문 순서 근거: declared-sequence

> * 코스 경로: 구포만세거리 ➔ 문화예술플랫폼 ➔ 구포국수체험관 ➔ 구포시장

- 1. 구포만세거리 → 미연결 / unresolved-place
- 2. 문화예술플랫폼 → 미연결 / unresolved-place
- 3. 구포국수체험관 → 미연결 / unresolved-place
- 4. 구포시장 → 미연결 / unresolved-place

- 전체 보류 코드: step-0:unresolved-place, step-1:unresolved-place, step-2:unresolved-place, step-3:unresolved-place

- 공식 원문에 선언된 방문 순서를 대조한 자료다. 실제 경로·시간표·영업·현장 접근성은 검증하지 않았다.
- 미연결 장소를 임의로 메우거나 단절 구간을 건너 연결하지 않는다. 맛집 옵션은 원문 방문 순서와 별개다.

### [서부산 웰니스·체험 코스] 파도와 바람이 전하는 위로, 다대포 웰니스 투어 (dadaepo-wellness)

- 출처: https://www.data.go.kr/data/15063506/openapi.do / ID 2833 / ko / full-source
- 원문 순서 근거: declared-sequence

> * 코스 경로: 다대포해양레포츠센터 ➔ 다대포해변 놀핏 웰니스 프로그램 ➔ 다대포 바다누리길

- 1. 다대포해양레포츠센터 → 미연결 / unresolved-place
- 2. 다대포해변 놀핏 웰니스 프로그램 → 미연결 / unresolved-place
- 3. 다대포 바다누리길 → attraction:2157 / 원본 ID·이름·좌표 일치

- 전체 보류 코드: step-0:unresolved-place, step-1:unresolved-place

- 공식 원문에 선언된 방문 순서를 대조한 자료다. 실제 경로·시간표·영업·현장 접근성은 검증하지 않았다.
- 미연결 장소를 임의로 메우거나 단절 구간을 건너 연결하지 않는다. 맛집 옵션은 원문 방문 순서와 별개다.

### [서부산 생태·문화 코스] 자연과 예술이 숨 쉬는 섬, 을숙도 에코-아트 투어 (eulsukdo-eco-art)

- 출처: https://www.data.go.kr/data/15063506/openapi.do / ID 2836 / ko / full-source
- 원문 순서 근거: declared-sequence

> * 코스 경로: 부산현대미술관(부산비엔날레) ➔ 을숙도생태공원 ➔ 낙동강하구에코센터

- 1. 부산현대미술관(부산비엔날레) → attraction:1671 / 원본 ID·이름·좌표 일치
- 2. 을숙도생태공원 → 미연결 / unresolved-place
- 3. 낙동강하구에코센터 → 미연결 / unresolved-place

- 전체 보류 코드: step-1:unresolved-place, step-2:unresolved-place

- 공식 원문에 선언된 방문 순서를 대조한 자료다. 실제 경로·시간표·영업·현장 접근성은 검증하지 않았다.
- 미연결 장소를 임의로 메우거나 단절 구간을 건너 연결하지 않는다. 맛집 옵션은 원문 방문 순서와 별개다.

### [서부산 노을·야경 코스] 붉은 노을에서 빛의 향연까지, 서부산 나이트 투어 (west-sunset)

- 출처: https://www.data.go.kr/data/15063506/openapi.do / ID 2842 / ko / full-source
- 원문 순서 근거: declared-sequence

> * 코스 경로: 장림포구 부네치아 ➔ 다대포 고우니생태길 ➔ 다대포해수욕장 ➔ 꿈의 낙조분수

- 1. 장림포구 부네치아 → attraction:333 / 원본 ID·이름·좌표 일치
- 2. 다대포 고우니생태길 → 미연결 / unresolved-place
- 3. 다대포해수욕장 → attraction:366 / 원본 ID·이름·좌표 일치
- 4. 꿈의 낙조분수 → 미연결 / unresolved-place

- 전체 보류 코드: step-1:unresolved-place, step-3:unresolved-place
- 맛집 food-1117 / nearby-coordinate-option / source-checked / 436m 직선거리 / 자료 기준 통과

- 공식 원문에 선언된 방문 순서를 대조한 자료다. 실제 경로·시간표·영업·현장 접근성은 검증하지 않았다.
- 미연결 장소를 임의로 메우거나 단절 구간을 건너 연결하지 않는다. 맛집 옵션은 원문 방문 순서와 별개다.

### 남포동과 나누는 이야기 (nampo-stories)

- 출처: https://www.data.go.kr/data/15063506/openapi.do / ID 2558 / ko / full-source
- 원문 순서 근거: presentation-only

> 부산의 원도심, 남포동은 과거와 현재가 함께 숨 쉬는 곳이다. 거리를 걷다 보면 오래된 기억과 지금의 풍경이 자연스럽게 어우러진다. 이번 여정에서는 남포동의 네 가지 특별한 명소를 따라가며, 그 안에 담긴 이야기를 하나씩 펼쳐본다.
> 
> 헌책이 들려주는 이야기 - 보수동 책방골목
>  
> 한국전쟁 이후 보수동 일대에 헌책 노점이 하나둘 생겨나면서 시작된 보수동 책방골목은 세월 속에 부산의 대표 문화 공간으로 자리 잡았다. 당시 천막 교실에서 공부하던 학생들과 책이 귀하던 시대의 지식인들은 이곳에서 헌책을 사고팔며 학업과 삶을 이어갔다.
> 
> 1960~70년대에는 70여 개 점포가 모여 ‘문화의 골목’이라 불릴 만큼 성황을 이루었고, 헌책을 통해 배움과 교류가 이어지던 남포동의 상징적인 공간이었다. 지금은 대형 중고서점과

- 1. 보수동 책방골목 → attraction:272 / 원본 ID·이름·좌표 일치
- 2. 부산타워 → attraction:550 / 원본 ID·이름·좌표 일치
- 3. 부산근현대역사관 → 미연결 / unresolved-place
- 4. 이재모피자 → food:1570 / 원본 ID·이름·좌표 일치

- 전체 보류 코드: order-not-explicitly-declared, step-2:unresolved-place
- 맛집 food-1570 / source-mentioned / source-checked / 직선거리 미적용·미확인 / 자료 기준 통과
- 맛집 food-103 / nearby-coordinate-option / source-checked / 123m 직선거리 / 자료 기준 통과

- 소개의 배열/서술만으로 방문 순서를 확정하지 않아 순서 검토 대기다.
- 상호가 겹치는 다른 원본 ID를 병합하지 않았고 음식점 방문 시점은 배치하지 않았다.

### 나 홀로 떠나는 광안리 여행 (gwangalli-solo)

- 출처: https://www.data.go.kr/data/15063506/openapi.do / ID 1200 / ko / full-source
- 원문 순서 근거: narrative-unconfirmed

> 대한민국에서 광안리를 모르는 사람은 거의 없을 겁니다. 해운대와 함께 부산을 대표하는 여행지로 손꼽히는 곳이죠. 바다를 가로지는 광안대교는 부산의 랜드마크로 국내는 물론 해외에서도 관심이 뜨겁습니다.
> 
> 그런 광안리를 제대로 여행하는 방법을 준비했습니다. 나 홀로 즐기는 광안리! 어떤 이야기가 숨어 있을지 지금 함께 떠나보시죠!﻿
> 나 홀로 공간-호텔1
> 나 홀로 떠나는 여행이기에 더욱 깐깐하게 숙소를 고를 수밖에 없다. 안전하고 쾌적한 공간이어야 하는 건 기본. 편의시설도 잘 갖추고 가격도 합리적이면 좋겠다. 창밖으로 바다 풍경까지 볼 수 있다면 금상첨화다. 광안리해수욕장 해변에 자리한 호텔1의 캡슐호텔이라면 이런 까다로운 조건을 모두 만족시키고도 남는다.
> 
> 새하얀 커튼을 열고 방으로 들어가면 커다란 창밖으로 

- 1. 동경밥상 → food:1558 / 원본 ID·이름·좌표 일치
- 2. 광안리해수욕장 → attraction:377 / 원본 ID·이름·좌표 일치
- 3. 민락항 → 미연결 / unresolved-place
- 4. 민락수변공원 → attraction:285 / 원본 ID·이름·좌표 일치
- 5. 수영교 → 미연결 / unresolved-place

- 전체 보류 코드: order-not-explicitly-declared, step-2:unresolved-place, step-4:unresolved-place
- 맛집 food-1558 / source-mentioned / source-checked / 직선거리 미적용·미확인 / 자료 기준 통과
- 맛집 food-1519 / nearby-coordinate-option / source-checked / 269m 직선거리 / 자료 기준 통과

- 소개의 배열/서술만으로 방문 순서를 확정하지 않아 순서 검토 대기다.
- 상호가 겹치는 다른 원본 ID를 병합하지 않았고 음식점 방문 시점은 배치하지 않았다.

### 해운대해수욕장 → 동백섬 · 원문 명시 연속 구간 (haeundae-dongbaek-source-edge)

- 출처: https://www.data.go.kr/data/15063506/openapi.do / ID 284 / ko / source-declared-subroute
- 원문 순서 근거: narrative-edge

> 해운대해수욕장에서 탁 트인 바다를 바라보며 사색에 잠겨 걷다 보면 백사장 끝자락에 아담하게 자리하고 있는 동백섬에 다다르게 된다. 원래는 섬이었던 이곳은 오랜 세월 퇴적작용으로 육지와 연결되었지만 부산 사람들에겐 여전히 동백섬으로 불리고 있다.

- 1. 해운대해수욕장 → attraction:373 / 원본 ID·이름·좌표 일치
- 2. 동백섬 → attraction:2274 / 원본 ID·이름·좌표 일치

- 전체 보류 코드: 없음; 사람·현장 승인은 별도 대기
- 맛집 food-1593 / nearby-coordinate-option / source-checked / 275m 직선거리 / 자료 기준 통과

- 본문 첫 문장이 출발지에서 두 번째 장소에 다다르는 방향을 명시한 구간만 사용한다. 전체 원문 코스 또는 세부 시설 전체가 연결된 것은 아니다.
- 별칭 해운대해수욕장은 관광명소 원본 TITLE의 해운대해수욕장과 확인했으며 원본 ID373을 그대로 유지한다.

## 재검토 절차

1. 공공 원본을 갱신한다. 관광명소 DB 추출은 npm.cmd run data:themes:export-attractions로 수행한다. 키가 필요한 원본 갱신과 키 없는 코스 빌드를 구분한다.
2. 변경된 원문·장소를 직접 대조하고 route-place-mappings.json의 명시적 ID·예상 이름·semantic fingerprint·별칭 근거와 theme-route-templates.json의 순서 인용을 검토한다. 해시를 자동 갱신해 검토 상태를 우회하지 않는다.
3. npm.cmd run data:themes:build → npm.cmd run data:themes:check. 변경된 자료는 보류되고, 현재 의존성과 다른 저장 결과는 읽기 검증에서 거부된다. 발행 실패는 이전 파일을 보존한다.
4. 사람의 승인·현장 경로/입구·휴무·운영시간·이동수단 검증은 추후 진행한다. 주차 후보 및 공개 추천·UI 연결은 이번 구현 범위가 아니다.

흰여울마을 별칭, 박물관 본관/별관, 향교·고분군 등 묶음 원본, 독립 레코드가 없는 장소는 미해결로 유지한다. 직선거리는 보행거리/시간을 보장하지 않으며 맛집 후보는 방문 순서에 자동 삽입하지 않는다.
