import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import App from './App';
import './index.css';

/**
 * Application Entry Point
 *
 * Wrapping order (outer to inner):
 * 1. BrowserRouter   — provides routing context to the whole app
 * 2. AuthProvider    — provides user/auth state to the whole app
 * 3. App             — renders routes
 */
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);
