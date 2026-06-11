import './i18n'
import './styles/global.scss'

import App from './App'
import { Provider } from 'react-redux'
import { StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { store } from './store/index'

import 'leaflet/dist/leaflet.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <Suspense fallback={null}>
        <App />
      </Suspense>
    </Provider>
  </StrictMode>,
)
