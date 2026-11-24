import {AD_SCRIPT_BASE,type AdvertisingConfig} from '../config/advertising.js';
export function mayServeAdvertising(config:AdvertisingConfig){
  return config.enabled&&config.approvalStatus==='ready'&&config.privacyReviewStatus==='ready'
    &&config.scriptUrl===AD_SCRIPT_BASE+config.publisherId
    &&/^ca-pub-[0-9]{16}$/.test(config.publisherId)&&/^[0-9]{10}$/.test(config.detailSlot);
}
