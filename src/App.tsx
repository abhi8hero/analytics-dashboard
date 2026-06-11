import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import { routes } from './routes';
import { SiteProvider } from '@/context/SiteContext';

const App: React.FC = () => {
  return (
    <Router>
      <SiteProvider>
        <Routes>
          {routes.map((route, index) => (
            <Route key={index} path={route.path} element={route.element} />
          ))}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster />
      </SiteProvider>
    </Router>
  );
};

export default App;
