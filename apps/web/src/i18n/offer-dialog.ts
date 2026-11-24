import type {Locale} from '@trip-fit/domain';
const COPY={
 en:{heading:'Product details',related:'More options to explore',note:'Based on reviewed place links or the same category and trip area. Check each itinerary and booking conditions with the provider.',place:'Same place guide',category:'Similar category & trip area',empty:'No related options are currently available.',failed:'Related options could not be loaded.'},
 ko:{heading:'상품 상세',related:'함께 살펴볼 상품',note:'검수된 명소 연결 또는 같은 분류·여행 범위를 기준으로 표시합니다. 각 상품의 방문지와 예약 조건은 판매처에서 확인하세요.',place:'같은 명소 안내에 연결',category:'비슷한 분류·여행 범위',empty:'현재 함께 표시할 관련 상품이 없습니다.',failed:'관련 상품을 불러오지 못했습니다.'},
 ja:{heading:'商品詳細',related:'こちらのプランもチェック',note:'確認済みのスポット情報への関連付け、または同じカテゴリー・旅行エリアに基づいています。訪問先と予約条件は販売元で確認してください。',place:'同じスポット情報に関連',category:'同じカテゴリー・旅行エリア',empty:'現在、関連するプランはありません。',failed:'関連プランを読み込めませんでした。'},
 'zh-CN':{heading:'商品详情',related:'更多值得探索的选择',note:'根据已核对的景点关联或相同类别与旅行范围展示。请向销售平台确认各商品的行程和预订条件。',place:'关联同一景点指南',category:'相似类别与旅行范围',empty:'目前暂无相关商品。',failed:'无法加载相关商品。'},
 'zh-TW':{heading:'商品詳情',related:'更多值得探索的選擇',note:'依已核對的景點關聯，或相同類別與旅行範圍顯示。請向銷售平台確認各商品的行程與預訂條件。',place:'關聯同一景點指南',category:'相似類別與旅行範圍',empty:'目前暫無相關商品。',failed:'無法載入相關商品。'},
};
export function getOfferDialogCopy(locale:Locale){return COPY[locale];}
