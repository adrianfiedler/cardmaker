import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

// Gebündelte Schriften (kein externer Request -> Export funktioniert offline/zuverlässig)
import '@fontsource/playfair-display/400.css'
import '@fontsource/playfair-display/600.css'
import '@fontsource/playfair-display/700.css'
import '@fontsource/eb-garamond/400.css'
import '@fontsource/eb-garamond/400-italic.css'
import '@fontsource/eb-garamond/600.css'
import '@fontsource/pinyon-script/400.css'

import './styles.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
