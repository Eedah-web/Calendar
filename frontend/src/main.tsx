import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { App } from 'antd';
import './index.css';
import CalendarPage from './CalendarPage';
import DayPage from './DayPage';
import ArchivePage from './ArchivePage';
import AuthGate from './AuthGate';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App>
      <AuthGate>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<CalendarPage />} />
            <Route path="/day/:date" element={<DayPage />} />
            <Route path="/archive" element={<ArchivePage />} />
          </Routes>
        </BrowserRouter>
      </AuthGate>
    </App>
  </StrictMode>,
);
