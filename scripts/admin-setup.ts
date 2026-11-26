import {readFile,writeFile,mkdir,chmod} from 'node:fs/promises';
import {resolve} from 'node:path';
import {randomBytes} from 'node:crypto';
import {parseEnv} from 'node:util';
import {hashAdminPassword} from '../apps/server/src/admin/security.js';

const root=process.cwd(),filename=resolve(root,'.env');
let original='';try{original=await readFile(filename,'utf8');}catch(e){if(!(e instanceof Error&&'code'in e&&e.code==='ENOENT'))throw e;}
const values=parseEnv(original);
if(values.ADMIN_PASSWORD_HASH?.trim()){
 console.log('관리자 인증은 이미 설정되어 있습니다. 기존 비밀번호와 환경 변수는 변경하지 않았습니다.');
}else{
 const directory=resolve(root,values.ADMIN_STORAGE_DIR||'var/admin');await mkdir(directory,{recursive:true,mode:0o700});
 const password=randomBytes(24).toString('base64url'),passwordFile=resolve(directory,'initial-password.txt');
 await writeFile(passwordFile,'dallaBusan 관리자 초기 비밀번호\n'+password+'\n\n접속: http://127.0.0.1:5173/admin.html (개발) 또는 http://127.0.0.1:3001/admin (빌드 실행)\n이 파일은 개인 보관하며 Git이나 공개 배포 파일에 넣지 마세요.\n',{flag:'wx',mode:0o600});
 const settings:Record<string,string>={ADMIN_ENABLED:'true',ADMIN_PASSWORD_HASH:await hashAdminPassword(password),ADMIN_SESSION_SECRET:randomBytes(32).toString('hex'),ADMIN_ALLOWED_ORIGINS:'http://127.0.0.1:5173,http://localhost:5173,http://127.0.0.1:3001,http://localhost:3001',ADMIN_STORAGE_DIR:'var/admin',ADMIN_IMAGE_HOSTS:''};
 let next=original;for(const [key,value]of Object.entries(settings)){if(values[key]?.trim())continue;const line=key+'='+value,pattern=new RegExp('^'+key+'=.*$','m');next=pattern.test(next)?next.replace(pattern,line):next.replace(/\s*$/,'')+'\n'+line+'\n';}
 await writeFile(filename,next,{mode:0o600});try{await chmod(filename,0o600);}catch{/* Windows may not support POSIX permission bits. */}
 console.log('관리자 인증을 설정했습니다. 기존 API 키와 원본 DB는 보존했습니다.');
 console.log('초기 비밀번호 파일: '+passwordFile);console.log('서버를 재시작한 뒤 /admin.html 에서 로그인하세요. AWS에서는 ADMIN_ALLOWED_ORIGINS를 실제 HTTPS 주소로 지정하세요.');
}
