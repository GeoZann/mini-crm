import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { NotificationProvider } from './context/NotificationContext.jsx' // <--- ΝΕΟ

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* Βάζουμε τον Provider να αγκαλιάζει το App */}
    <NotificationProvider>
      <App />
    </NotificationProvider>
  </React.StrictMode>,
)