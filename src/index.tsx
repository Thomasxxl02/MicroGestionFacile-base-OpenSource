import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'sonner';
import App from './App';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Register service worker for offline mode
try {
  registerSW({ immediate: true });
} catch (error) {
  console.warn('[INDEX] PWA registration failed:', error);
  // Continue without PWA
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Could not find root element to mount to');
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <Toaster position="top-right" richColors closeButton />
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
