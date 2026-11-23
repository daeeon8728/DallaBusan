import type { Locale,PublicOffer } from '@trip-fit/domain';
const COPY={ko:'한국어 사이트 예약 (해외카드 가능)',en:'Book on Korean site (international cards accepted)',ja:'韓国語サイトで予約（海外カード対応）','zh-CN':'韩文网站预订（支持境外银行卡）','zh-TW':'韓文網站預訂（支援海外信用卡）'} satisfies Record<Locale,string>;
export function BookingNotice({offer,locale}:{offer:PublicOffer;locale:Locale}){return offer.bookingNotice?<span className="booking-notice" data-testid="booking-notice">{COPY[locale]}</span>:null;}
