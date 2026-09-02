import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App.jsx';
import { ErrorBoundary } from './components/common/ErrorBoundary.jsx';

import './styles/tokens.css';
import './styles/themes.css';
import './styles/base.css';
import './styles/print.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
