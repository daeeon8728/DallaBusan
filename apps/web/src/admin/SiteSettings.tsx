import {useEffect,useState,type ReactNode} from 'react';
import {DEFAULT_SITE_SETTINGS,SiteSettingsSchema} from '@trip-fit/domain';
import {SiteSettingsContext,useSiteSettings} from './SiteSettingsContext.js';
export function SiteSettingsProvider({children}:{children:ReactNode}){
 const [settings,setSettings]=useState(DEFAULT_SITE_SETTINGS);
 useEffect(()=>{const controller=new AbortController();void fetch('/api/site-settings',{signal:controller.signal}).then(async r=>{if(!r.ok)throw Error('Settings unavailable');const input:unknown=await r.json();const parsed=SiteSettingsSchema.safeParse(input);if(parsed.success&&!controller.signal.aborted)setSettings(parsed.data);}).catch(()=>{});return()=>controller.abort();},[]);
 return <SiteSettingsContext.Provider value={settings}>{children}</SiteSettingsContext.Provider>;
}
export function HomeLayout({active,children}:{active:boolean;children:ReactNode}){
 const settings=useSiteSettings();
 if(!active)return <>{children}</>;
 // Only schema-enumerated section IDs and numeric order values enter this stylesheet.
 const rules=settings.sections.map((s,i)=>`.managed-home>[data-home-section="${s.id}"]{order:${i};${s.visible?'':'display:none!important;'}}`).join('');
 return <div className="managed-home"><style>{'.managed-home{display:flex;flex-direction:column}.managed-home>section{min-width:0;order:6}.managed-home>.section-wrap{width:100%}.managed-home>.hero,.managed-home>.editorial{width:calc(100% - 44px)}'+rules}</style>{children}</div>;
}
