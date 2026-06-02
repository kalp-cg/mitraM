import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Global fetch override to automatically prepend VITE_API_URL and rewrite relative paths in JSON response.
const apiBase = import.meta.env.VITE_API_URL;
if (apiBase) {
  const originalFetch = window.fetch;
  window.fetch = async function (input, init) {
    let finalInput = input;
    if (typeof input === 'string' && input.startsWith('/api/')) {
      finalInput = `${apiBase.replace(/\/$/, '')}${input}`;
    } else if (input instanceof URL && input.pathname.startsWith('/api/')) {
      finalInput = new URL(`${apiBase.replace(/\/$/, '')}${input.pathname}${input.search}`);
    } else if (input && typeof input === 'object' && 'url' in input && typeof input.url === 'string' && input.url.startsWith('/api/')) {
      finalInput = new Request(`${apiBase.replace(/\/$/, '')}${input.url}`, input as RequestInit);
    }
    
    const response = await originalFetch(finalInput, init);
    
    if (response.ok) {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        try {
          const clone = response.clone();
          const data = await clone.json();
          
          const rewriteUrls = (obj: any): any => {
            if (!obj) return obj;
            if (typeof obj === 'string' && obj.startsWith('/api/')) {
              return `${apiBase.replace(/\/$/, '')}${obj}`;
            }
            if (Array.isArray(obj)) {
              return obj.map(rewriteUrls);
            }
            if (typeof obj === 'object') {
              for (const key in obj) {
                obj[key] = rewriteUrls(obj[key]);
              }
            }
            return obj;
          };
          
          const rewrittenData = rewriteUrls(data);
          return new Response(JSON.stringify(rewrittenData), {
            status: response.status,
            statusText: response.statusText,
            headers: response.headers,
          });
        } catch (e) {
          return response;
        }
      }
    }
    
    return response;
  };
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
