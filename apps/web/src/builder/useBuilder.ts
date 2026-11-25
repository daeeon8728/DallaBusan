import{useSyncExternalStore}from'react';import{createBuilderStore,BUILDER_KEY}from'./store.js';
export const builderStore=createBuilderStore(()=>window.localStorage);
window.addEventListener('storage',event=>{if(event.key===BUILDER_KEY||event.key===null)builderStore.refresh();});
export const useBuilder=()=>useSyncExternalStore(builderStore.subscribe,builderStore.getSnapshot);
