import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import {AdminPage} from './AdminPage.js';
import './admin.css';
const root=document.getElementById('root');
if(!root)throw new Error('관리자 화면을 불러올 수 없습니다.');
createRoot(root).render(<StrictMode><AdminPage/></StrictMode>);
