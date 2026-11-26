import {createContext,useContext} from 'react';
import {DEFAULT_SITE_SETTINGS} from '@trip-fit/domain';
export const SiteSettingsContext=createContext(DEFAULT_SITE_SETTINGS);
export const useSiteSettings=()=>useContext(SiteSettingsContext);
