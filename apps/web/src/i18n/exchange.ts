import type { Locale } from '@trip-fit/domain';
const COPY = {
  ko: { estimated: '환산 참고가', original: '원래 가격', date: '환율 기준일', pending: '환율 확인 중 · 원통화 표시', failed: '환율을 불러오지 못해 원통화로 표시합니다.', retry: '환율 다시 확인', note: '환산 참고가이며 실제 결제 통화·금액은 판매처에서 확인해 주세요.', stale: '최근 성공한 환율 사용', source: '환율 출처', total: '환산 참고 합계', basis: '상품별 환산 단가를 반올림한 뒤 수량을 곱해 합산합니다.' },
  en: { estimated: 'Estimated conversion', original: 'Original price', date: 'Rate dates', pending: 'Loading rates · original currency shown', failed: 'Rates unavailable. Original currencies are shown.', retry: 'Retry exchange rates', note: 'Estimates only. Confirm payment currency and final prices with the provider.', stale: 'Using last available rates', source: 'Rate source', total: 'Estimated converted subtotal', basis: 'Converted unit prices are rounded before multiplying quantities and adding.' },
  ja: { estimated: '換算参考価格', original: '元の価格', date: '為替基準日', pending: '為替を確認中・元の通貨で表示', failed: '為替を取得できないため元の通貨で表示しています。', retry: '為替を再確認', note: '換算は目安です。決済通貨・最終価格は販売元で確認してください。', stale: '直近に取得した為替を使用', source: '為替情報元', total: '換算参考合計', basis: '換算単価を四捨五入してから数量を掛けて合算します。' },
  'zh-CN': { estimated: '估算换算价', original: '原价', date: '汇率日期', pending: '正在查询汇率·显示原币种', failed: '无法获取汇率，现显示原币种。', retry: '重试汇率', note: '仅供参考，付款币种和最终金额请向销售平台确认。', stale: '使用最近成功获取的汇率', source: '汇率来源', total: '估算换算合计', basis: '先将换算单价四舍五入，再乘以数量并相加。' },
  'zh-TW': { estimated: '估算換算價', original: '原價', date: '匯率日期', pending: '正在查詢匯率·顯示原幣別', failed: '無法取得匯率，目前顯示原幣別。', retry: '重試匯率', note: '僅供參考，付款幣別和最終金額請向銷售平台確認。', stale: '使用最近成功取得的匯率', source: '匯率來源', total: '估算換算合計', basis: '先將換算單價四捨五入，再乘以數量並相加。' },
} satisfies Record<Locale, Record<string, string>>;
export function getExchangeCopy(locale: Locale) { return COPY[locale]; }
