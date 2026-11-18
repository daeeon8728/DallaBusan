export const parkingTestRow={mgntNum:'TEST_01',pkNam:'검증용 주차장',guNm:'부산광역시 검증기관',doroAddr:'검증 주소',jibunAddr:'검증 주소 원문',pkCnt:'77',xCdnt:'35.093',yCdnt:'129.011',
  svcSrtTe:'09:00',svcEndTe:'18:00',satSrtTe:'00:00',satEndTe:'00:00',hldSrtTe:'-',hldEndTe:'-',oprDay:'평일',feeInfo:'-',tenMin:'0',pkBascTime:'10',pkAddTime:'10',feeAdd:'0',ftDay:'0',ftMon:'0',currava:'-',fnlDt:'08/24/2009',spclNote:'검증용 원문'};
export function parkingEnvelope(rows:unknown,totalCount=1,pageNo=1,numOfRows=2,code='00'){
  return {response:{header:{resultCode:code,resultMsg:'TEST'},body:{totalCount:String(totalCount),pageNo:String(pageNo),numOfRows:String(numOfRows),items:{item:rows}}}};
}
