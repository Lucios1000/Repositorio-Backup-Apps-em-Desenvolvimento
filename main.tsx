import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error?: any }>{
  state: { hasError: boolean; error?: any };
  props: { children: React.ReactNode };
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }
  componentDidCatch(error: any, info: any) {
    console.error('App error boundary caught:', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 16 }}>
          <h1 style={{ color: '#f87171', fontWeight: 900 }}>Erro ao carregar a aplicação</h1>
          <pre style={{ whiteSpace: 'pre-wrap', color: '#fca5a5', fontFamily: 'monospace', fontSize: 12 }}>
            {String(this.state.error)}
          </pre>
        </div>
      );
    }
    return this.props.children as any;
  }
}

const rootEl = document.getElementById('root');
if (!rootEl) {
  const msg = 'Elemento #root não encontrado no DOM';
  console.error(msg);
  const el = document.createElement('div');
  el.textContent = msg;
  document.body.appendChild(el);
} else {
  console.info('Montando aplicação TKX...');
  ReactDOM.createRoot(rootEl).render(
    <React.StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.StrictMode>
  );
}