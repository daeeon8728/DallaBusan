// Isolated browser-test owner; never uses the operator's .env or admin database.
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {loadAdminConfig} from '../apps/server/src/config/admin.js';
import {hashAdminPassword} from '../apps/server/src/admin/security.js';
import {createRuntimeApp} from '../apps/server/src/runtime.js';
const directory=await mkdtemp(join(tmpdir(),'dallabusan-admin-browser-'));
const adminConfig=loadAdminConfig(false,{ADMIN_ENABLED:'true',ADMIN_STORAGE_DIR:directory,ADMIN_PASSWORD_HASH:await hashAdminPassword('browser-test-only-password'),ADMIN_SESSION_SECRET:'c'.repeat(64),ADMIN_ALLOWED_ORIGINS:'http://127.0.0.1:4320',ADMIN_IMAGE_HOSTS:'images.example.test'});
const app=await createRuntimeApp({serveWeb:true,adminConfig});
const stop=async()=>{await app.close();await rm(directory,{recursive:true,force:true});};
process.once('SIGINT',()=>{void stop();});process.once('SIGTERM',()=>{void stop();});
await app.listen({host:'127.0.0.1',port:4320});
