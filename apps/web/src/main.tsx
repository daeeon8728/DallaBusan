import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.js';
import { ExchangeProvider } from './currency/ExchangeProvider.js';
import {SiteSettingsProvider} from './admin/SiteSettings.js';
import './styles/global.css';
import './offer-dialog.css';

const root = document.getElementById('root');
if (!root) throw new Error('Application root is missing.');
createRoot(root).render(<StrictMode><SiteSettingsProvider><ExchangeProvider><App /></ExchangeProvider></SiteSettingsProvider></StrictMode>);

import './travel-tools.css';
