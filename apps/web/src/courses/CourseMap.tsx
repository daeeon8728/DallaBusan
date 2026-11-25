import {useCallback,useEffect,useMemo,useState} from 'react';
import {divIcon,latLngBounds} from 'leaflet';
import {MapContainer} from 'react-leaflet/MapContainer';
import {EnglishBasemap} from './EnglishBasemap.js';
import {getHomeCourseCopy} from '../i18n/home-courses.js';
import {Marker} from 'react-leaflet/Marker';
import {Polyline} from 'react-leaflet/Polyline';
import {Popup} from 'react-leaflet/Popup';
import {useMap} from 'react-leaflet/hooks';
import type {Course,Locale} from '@trip-fit/domain';
import {COURSE_MAP} from '../config/course-map.js';
import {getCourseMapCopy} from '../i18n/course-map.js';
import 'leaflet/dist/leaflet.css';
function View({course,selected,reset}:{course:Course;selected:number|null;reset:number}){
 const map=useMap();
 useEffect(()=>{const points=course.steps.flatMap(s=>s.coordinates?[[s.coordinates.lat,s.coordinates.lng] as [number,number]]:[]);map.closePopup();if(points.length)map.fitBounds(latLngBounds(points),{padding:[38,38],maxZoom:15,animate:false});},[course,map,reset]);
 useEffect(()=>{const point=selected===null?null:course.steps[selected]?.coordinates;if(point)map.setView([point.lat,point.lng],15,{animate:false});},[selected,course,map]);
 return null;
}
export default function CourseMap({course,locale,selected,onSelect,pointsOnly=false}:{pointsOnly?:boolean;course:Course;locale:Locale;selected:number|null;onSelect:(index:number)=>void}){
 const c=getCourseMapCopy(locale),[reset,setReset]=useState(0),[tileAttempt,setTileAttempt]=useState(0),[failed,setFailed]=useState(false);
 const icons=useMemo(()=>course.steps.map((_,i)=>divIcon({className:'course-map-pin'+(selected===i?' is-active':''),html:'<span><b>'+String(i+1)+'</b></span>',iconSize:[36,36],iconAnchor:[18,36]})),[course,selected]);
 const fail=useCallback(()=>setFailed(true),[]);
 // Missing middle points split reference paths; they never join across an unresolved stop.
 const segments=useMemo(()=>{const result:[number,number][][]=[];let segment:[number,number][]=[];for(const step of course.steps){if(step.coordinates)segment.push([step.coordinates.lat,step.coordinates.lng]);else{if(segment.length>1)result.push(segment);segment=[];}}if(segment.length>1)result.push(segment);return result;},[course]);
 return <section className="course-map-section" aria-label={c.map} data-testid="course-map" data-map-labels="en"><div className="course-map-toolbar"><h2>{c.map}</h2><button onClick={()=>{onSelect(-1);setReset(n=>n+1);}}>{c.fit}</button></div>
 {failed&&<div role="status" className="map-status">{c.tiles}<button onClick={()=>{setFailed(false);setTileAttempt(n=>n+1);}}>{c.retry}</button></div>}
 <MapContainer center={[35.16,129.06]} zoom={11} minZoom={2} maxZoom={19} zoomAnimation={false} fadeAnimation={false} markerZoomAnimation={false} scrollWheelZoom={false} className="course-map-canvas"><View course={course} selected={selected} reset={reset}/><EnglishBasemap key={tileAttempt} onFailure={fail}/>
 {!pointsOnly&&(course.route.status==='road-route'?<Polyline positions={course.route.geometry.map(p=>[p.lat,p.lng])} pathOptions={{color:'#126a88',weight:5,opacity:0.9}}/>:segments.map((segment,i)=><Polyline key={i} positions={segment} pathOptions={{color:'#9c784a',dashArray:'7 9',weight:3}}/>))}
 {course.steps.map((step,i)=>step.coordinates&&<Marker key={step.kind+':'+step.id+':'+i} position={[step.coordinates.lat,step.coordinates.lng]} icon={icons[i]} title={String(i+1)+'. '+step.name} eventHandlers={{click:()=>onSelect(i)}}><Popup>{i+1}. {step.name}</Popup></Marker>)}</MapContainer>
 <p className="guide-note">{getHomeCourseCopy(locale).mapLanguage}</p><p className="guide-note">{c.notice}</p><p className="course-map-credit">{!pointsOnly&&course.route.status==='road-route'&&<a href={course.route.sourceUrl} target="_blank" rel="noopener noreferrer">{c.credit}</a>} · <a href={COURSE_MAP.fixMap} target="_blank" rel="noopener noreferrer">{c.fix}</a></p></section>;
}
