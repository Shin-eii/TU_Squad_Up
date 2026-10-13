import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { ToastProvider } from './components/Toast.jsx';
import { ActivityProvider } from './store/ActivityContext.jsx';
import { AuthProvider } from './store/AuthContext.jsx';
import './styles.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ActivityProvider>
          <ToastProvider>
            <App />
          </ToastProvider>
        </ActivityProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
