import {useEffect,useRef,useState} from 'react';
import type {Locale} from '@trip-fit/domain';
import {ADVERTISING} from '../config/advertising.js';
import {mayServeAdvertising} from './policy.js';
import './advertising.css';
const LABEL:Record<Locale,string>={en:'Advertisement',ko:'광고',ja:'広告','zh-CN':'广告','zh-TW':'廣告'};
declare global {interface Window {adsbygoogle?:{push:(request:Record<string,never>)=>unknown}}}
let scriptPromise:Promise<void>|null=null;
function loadScript(){
 if(scriptPromise)return scriptPromise;
 scriptPromise=new Promise<void>((resolve,reject)=>{
  const script=document.createElement('script');script.async=true;script.crossOrigin='anonymous';script.src=ADVERTISING.scriptUrl;script.dataset.dallabusanAdLoader='true';
  const timeout=window.setTimeout(()=>fail(),15000);
  function fail(){window.clearTimeout(timeout);script.remove();scriptPromise=null;reject(new Error('Advertising unavailable'));}
  script.addEventListener('load',()=>{window.clearTimeout(timeout);resolve();},{once:true});
  script.addEventListener('error',fail,{once:true});document.head.append(script);
 });
 return scriptPromise;
}
function ActiveAdvertisement({locale}:{locale:Locale}){
 const ref=useRef<HTMLModElement>(null);const[failed,setFailed]=useState(false);
 useEffect(()=>{
  const element=ref.current;if(!element)return;
  let cancelled=false,requested=false,visible=typeof IntersectionObserver==='undefined';
  const start=()=>{
   if(cancelled||requested||!visible||element.clientWidth===0)return;
   requested=true;
   void loadScript().then(()=>{
    if(cancelled||!element.isConnected)return;
    const initialQueue:Array<Record<string,never>>=[];
    const queue=window.adsbygoogle??initialQueue;
    window.adsbygoogle=queue;queue.push({});
   }).catch(()=>{if(!cancelled)setFailed(true);});
  };
  const intersection=typeof IntersectionObserver==='undefined'?null:new IntersectionObserver(entries=>{visible=entries.some(entry=>entry.isIntersecting);start();});
  const resize=typeof ResizeObserver==='undefined'?null:new ResizeObserver(start);
  intersection?.observe(element);resize?.observe(element);start();
  return()=>{cancelled=true;intersection?.disconnect();resize?.disconnect();};
 },[]);
 if(failed)return null;
 return <aside className="detail-advertisement" aria-label={LABEL[locale]} data-testid="detail-advertisement"><span className="advertisement-label">{LABEL[locale]}</span><ins ref={ref} className="adsbygoogle" style={{display:'block'}} data-ad-client={ADVERTISING.publisherId} data-ad-slot={ADVERTISING.detailSlot} data-ad-format="auto" data-full-width-responsive="true"/></aside>;
}
export function DetailAdvertisement({locale,identity}:{locale:Locale;identity:string}){
 // Review/CMP work is completed before either script execution or blank ad space.
 if(!mayServeAdvertising(ADVERTISING))return null;
 return <ActiveAdvertisement key={identity} locale={locale}/>;
}
