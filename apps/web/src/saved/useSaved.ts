import { useSyncExternalStore } from 'react';
import { createSavedStore,SAVED_KEY } from './store.js';
export const savedStore=createSavedStore(()=>window.localStorage);
window.addEventListener('storage',event=>{if(event.key===SAVED_KEY||event.key===null)savedStore.refresh();});
export function useSaved(){return useSyncExternalStore(savedStore.subscribe,savedStore.getSnapshot);}
