<<<<<<< HEAD
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Main entry point - Parking User/Driver Portal only
 */

=======
>>>>>>> 344a747c9562c30e6e5b6d29f6b2b91e3e69baf3
import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
