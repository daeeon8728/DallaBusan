import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
const webRoot=fileURLToPath(new URL('.',import.meta.url));
export default defineConfig({
  root:webRoot,
  plugins:[react()],
  server:{
    host:'127.0.0.1',port:5173,strictPort:true,
    // Used only by npm run dev. Vercel routes public /api requests to its API service.
    proxy:{'/api':'http://127.0.0.1:3001'},
    fs:{allow:[webRoot,fileURLToPath(new URL('../../packages/domain',import.meta.url)),fileURLToPath(new URL('../../node_modules',import.meta.url))],deny:['.env','.env.*','*.{crt,pem}','**/.git/**','**/config/catalog/**','**/data/snapshots/**','**/var/**']},
  },
});
