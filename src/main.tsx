import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ErrorBoundary } from './shared/components/ErrorBoundary';
import { setupDependencyInjection } from './core/di/setup';
import './core/i18n';

// Boot IoC Container before React mounts
setupDependencyInjection();

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { scope: '/' })
      .then(registration => {
        console.log('TITANIC OS ServiceWorker registration successful with scope: ', registration.scope);
      })
      .catch(err => {
        console.log('TITANIC OS ServiceWorker registration failed: ', err);
      });
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
