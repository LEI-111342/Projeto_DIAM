import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';

// 1. Importar o CSS do Bootstrap
import 'bootstrap/dist/css/bootstrap.min.css';

// 2. Importar o Router para navegação
import { BrowserRouter } from 'react-router-dom';

// 3. Importar o Provider global de utilizador (Semana 11)
import UserProvider from './components/UserProvider.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      {/* O UserProvider envolve a App para dar acesso global ao estado do utilizador */}
      <UserProvider>
        <App />
      </UserProvider>
    </BrowserRouter>
  </React.StrictMode>,
);