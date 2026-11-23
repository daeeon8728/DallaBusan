import { useSyncExternalStore } from 'react';
import { createCartStore,CART_KEY } from './store.js';
export const cartStore=createCartStore(()=>window.localStorage);
window.addEventListener('storage',event=>{if(event.key===CART_KEY||event.key===null)cartStore.refresh();});
export function useCart(){return useSyncExternalStore(cartStore.subscribe,cartStore.getSnapshot);}
