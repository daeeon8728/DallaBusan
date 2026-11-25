import {useEffect} from 'react';
import {useMap} from 'react-leaflet/hooks';
import {maplibreGL} from '@maplibre/maplibre-gl-leaflet';
import {setWorkerUrl,type StyleSpecification,type LayerSpecification} from 'maplibre-gl';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import {COURSE_MAP} from '../config/course-map.js';
import {englishNameField} from '../config/english-map.js';
import 'maplibre-gl/dist/maplibre-gl.css';
setWorkerUrl(workerUrl);
function englishMapStyle(style:StyleSpecification):StyleSpecification {
 return {...style,layers:style.layers.map((layer):LayerSpecification=>{
  if(layer.type!=='symbol')return layer;
  const field=englishNameField(layer.layout?.['text-field']);
  return field?{...layer,layout:{...layer.layout,'text-field':field}}:layer;
 })};
}
export function EnglishBasemap({onFailure}:{onFailure:()=>void}){
 const map=useMap();
 useEffect(()=>{
  let active=true;
  const fail=()=>{if(active)onFailure();};
  try{
   const layer=maplibreGL({style:COURSE_MAP.style,transformStyle:(_previous,next)=>englishMapStyle(next),interactive:false,fadeDuration:0,renderWorldCopies:false}).addTo(map);
   const gl=layer.getMaplibreMap();gl.on('error',fail);
   return ()=>{active=false;gl.off('error',fail);if(map.hasLayer(layer))map.removeLayer(layer);};
  }catch{fail();}
  return ()=>{active=false;};
 },[map,onFailure]);
 return null;
}
