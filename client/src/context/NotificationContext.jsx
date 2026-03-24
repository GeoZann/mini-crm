import { createContext, useState } from 'react';
import { Snackbar, Alert } from '@mui/material';

// 1. Δημιουργούμε το "Συννεφάκι"
export const NotificationContext = createContext();

// 2. Φτιάχνουμε τον "Παροχέα" (Αυτός που θα αγκαλιάσει την εφαρμογή μας)
export function NotificationProvider({ children }) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [severity, setSeverity] = useState('success'); // Μπορεί να είναι success, error, info, warning

  // Αυτή τη συνάρτηση θα καλούν τα υπόλοιπα components!
  const showNotification = (msg, type = 'success') => {
    setMessage(msg);
    setSeverity(type);
    setOpen(true);
  };

  const handleClose = (event, reason) => {
    if (reason === 'clickaway') return;
    setOpen(false);
  };

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      
      {/* Το οπτικό κομμάτι του μηνύματος (Snackbar) υπάρχει ΜΟΝΟ εδώ, αλλά ελέγχεται από παντού! */}
      <Snackbar open={open} autoHideDuration={4000} onClose={handleClose} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert onClose={handleClose} severity={severity} sx={{ width: '100%' }} variant="filled">
          {message}
        </Alert>
      </Snackbar>
    </NotificationContext.Provider>
  );
}