import type {Locale} from '@trip-fit/domain';
const COPY={
 en:{overview:'Your day, at a glance',hint:'Choose a stop to jump to its card. The map uses the same numbers.',visit:'Time at places',travel:'Estimated transfers',about:'More about this stop',start:'Start',finish:'Finish',meal:'Food & drink',place:'Explore',route:'Route overview',stay:'Find a stay for this trip',stayNote:'Compare partner hotel searches in a separate page. Dates and guests are set with each partner.'},
 ko:{overview:'한눈에 보는 하루 코스',hint:'장소를 누르면 해당 카드로 이동합니다. 지도의 번호와 함께 확인하세요.',visit:'장소 체류 제안',travel:'이동 예상',about:'장소 설명·운영·출처 자세히',start:'시작',finish:'마지막',meal:'식사·음료',place:'둘러보기',route:'코스 요약',stay:'이 여행의 숙소 찾기',stayNote:'별도 페이지에서 판매처별 숙소 검색을 비교하세요. 날짜·인원은 각 판매처에서 설정합니다.'},
 ja:{overview:'一目でわかる一日のコース',hint:'スポットを選ぶとカードへ移動します。地図の番号と合わせて確認できます。',visit:'滞在時間の提案',travel:'移動の推定',about:'説明・営業・出典の詳細',start:'出発',finish:'最後',meal:'食事・ドリンク',place:'散策',route:'コース概要',stay:'この旅行の宿泊施設を探す',stayNote:'別ページで提携先の宿泊検索を比較できます。日付・人数は各提携先で設定してください。'},
 'zh-CN':{overview:'一天路线一目了然',hint:'选择地点可跳转到对应卡片，编号与地图一致。',visit:'建议停留时间',travel:'预计移动时间',about:'地点介绍、营业与来源详情',start:'起点',finish:'终点',meal:'餐饮',place:'游览',route:'路线概览',stay:'为这次旅行找住宿',stayNote:'在单独页面比较合作平台住宿搜索，日期与人数请在各平台设置。'},
 'zh-TW':{overview:'一天路線一目瞭然',hint:'選擇地點可跳到對應卡片，編號與地圖一致。',visit:'建議停留時間',travel:'預估移動時間',about:'地點介紹、營業與來源詳情',start:'起點',finish:'終點',meal:'餐飲',place:'遊覽',route:'路線概覽',stay:'為這次旅行找住宿',stayNote:'在獨立頁面比較合作平台住宿搜尋，日期與人數請在各平台設定。'},
};
export function getCourseOverviewCopy(locale:Locale){return COPY[locale];}
