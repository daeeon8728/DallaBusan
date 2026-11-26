export const MAP_LINK_ENDPOINTS=Object.freeze({search:'https://www.google.com/maps/search/',directions:'https://www.google.com/maps/dir/',embed:'https://www.google.com/maps/embed/v1/place'});
export function loadMapLinkConfig(source:Readonly<Record<string,string|undefined>>=process.env){const value=source.GOOGLE_MAPS_EMBED_API_KEY?.trim()??'';return{embedKey:/^[A-Za-z0-9_-]{30,100}$/.test(value)?value:null};}
export type MapLinkConfig=ReturnType<typeof loadMapLinkConfig>;
