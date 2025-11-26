import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { UserProvider } from '@/contexts/UserContext';
import { MediaEngineProvider } from '@/contexts/MediaEngineContext';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <UserProvider>
      <MediaEngineProvider>
        <App />
      </MediaEngineProvider>
    </UserProvider>
  </React.StrictMode>
);