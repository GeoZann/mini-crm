import { useState, useContext} from 'react';
import axios from 'axios';
import { Paper, Typography, Box, TextField, Button, CircularProgress, Alert } from '@mui/material';
import { NotificationContext } from '../context/NotificationContext';

// Email validation function
const isValidEmail = (email) => {
  if (!email) return true; // Email is optional
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export default function CustomerForm({ onCustomerAdded }) {
  const { showNotification } = useContext(NotificationContext);
  
  const [newFirstName, setNewFirstName] = useState('');
  const [newLastName, setNewLastName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState('');

  const handleEmailChange = (value) => {
    setNewEmail(value);
    if (value && !isValidEmail(value)) {
      setEmailError('Παρακαλώ εισάγετε ένα έγκυρο email');
    } else {
      setEmailError('');
    }
  };

  const handleAddCustomer = async (e) => {
    e.preventDefault();
    
    if (!newFirstName || !newLastName) {
      showNotification("Παρακαλώ συμπληρώστε Όνομα και Επώνυμο.", "warning");
      return;
    }

    if (newEmail && !isValidEmail(newEmail)) {
      showNotification("Παρακαλώ εισάγετε ένα έγκυρο email", "warning");
      return;
    }

    setLoading(true);
    try {
      await axios.post('http://localhost:3000/api/customers', 
        {
        firstName: newFirstName,
        lastName: newLastName,
        email: newEmail
        },
        {
          headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      setNewFirstName('');
      setNewLastName('');
      setNewEmail('');
      setEmailError('');
      
      onCustomerAdded();
      showNotification("Ο πελάτης αποθηκεύτηκε με επιτυχία!", "success"); 
    } catch (error) {
      console.error("Σφάλμα:", error);
      showNotification("Αποτυχία αποθήκευσης.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 3, mb: 4, bgcolor: '#f8f9fa' }}>
      <Typography variant="h6" gutterBottom color="text.secondary">
        Προσθήκη Νέου Πελάτη
      </Typography>
      {emailError && <Alert severity="error" sx={{ mb: 2 }}>{emailError}</Alert>}
      <Box component="form" onSubmit={handleAddCustomer} sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField 
          label="Όνομα" 
          variant="outlined" 
          size="small" 
          value={newFirstName} 
          onChange={(e) => setNewFirstName(e.target.value)}
          disabled={loading}
          required
        />
        <TextField 
          label="Επώνυμο" 
          variant="outlined" 
          size="small" 
          value={newLastName} 
          onChange={(e) => setNewLastName(e.target.value)}
          disabled={loading}
          required
        />
        <TextField 
          label="Email" 
          type="email" 
          variant="outlined" 
          size="small" 
          value={newEmail} 
          onChange={(e) => handleEmailChange(e.target.value)}
          disabled={loading}
          error={!!emailError}
          helperText={emailError}
        />
        <Button 
          type="submit" 
          variant="contained" 
          color="success"
          disabled={loading || !!emailError}
          sx={{ height: 40 }}
        >
          {loading ? <CircularProgress size={24} color="inherit" /> : "Αποθήκευση"}
        </Button>
      </Box>
    </Paper>
  );
}