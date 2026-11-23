import { createRuntimeApp } from './runtime.js';
import { loadServerConfig } from './config/env.js';
async function main() {
  const config=loadServerConfig();
  const app=await createRuntimeApp({serveWeb:process.argv.includes('--serve-web')});
  const stop=async()=>{await app.close();};
  process.once('SIGINT',()=>{void stop();});
  process.once('SIGTERM',()=>{void stop();});
  try {await app.listen({host:config.HOST,port:config.PORT});}
  catch(error){await app.close();throw error;}
}
main().catch((error:unknown)=>{console.error(error instanceof Error?error.message:'Server startup failed.');process.exitCode=1;});
