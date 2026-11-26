import{z}from'zod';import{resolve}from'node:path';import{fileURLToPath}from'node:url';
export function loadAdminConfig(readOnly=false,source:Readonly<Record<string,string|undefined>>=process.env){
 const origins=(source.ADMIN_ALLOWED_ORIGINS??'').split(',').map(s=>s.trim()).filter(Boolean);const validOrigins=origins.length>0&&origins.every(s=>{try{const u=new URL(s);return s===u.origin&&(u.protocol==='https:'||u.protocol==='http:'&&['localhost','127.0.0.1','[::1]'].includes(u.hostname));}catch{return false;}});
 const passwordHash=source.ADMIN_PASSWORD_HASH??'',secret=source.ADMIN_SESSION_SECRET??'';const enabled=source.ADMIN_ENABLED==='true'&&!readOnly&&source.VERCEL!=='1'&&validOrigins&&/^scrypt:[a-f0-9]{32}:[a-f0-9]{128}$/.test(passwordHash)&&/^[a-f0-9]{64,128}$/.test(secret);
 return Object.freeze({enabled,passwordHash,secret,origins:validOrigins?origins:[],directory:resolve(fileURLToPath(new URL('../../../../',import.meta.url)),source.ADMIN_STORAGE_DIR||'var/admin'),imageHosts:(source.ADMIN_IMAGE_HOSTS??'').split(',').map(s=>s.trim()).filter(s=>z.hostname().safeParse(s).success)});
}
export type AdminConfig=ReturnType<typeof loadAdminConfig>;
