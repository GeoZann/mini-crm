import { useState, useContext} from 'react';
import axios from 'axios';
import { Paper, Typography, Box, TextField, Button } from '@mui/material';
import { NotificationContext } from '../context/NotificationContext';

// Το { onCustomerAdded } είναι το Prop που παίρνει από τον "Γονιό" (το App.jsx)
export default function CustomerForm({ onCustomerAdded }) {
  const { showNotification } = useContext(NotificationContext);
  
  const [newFirstName, setNewFirstName] = useState('');
  const [newLastName, setNewLastName] = useState('');
  const [newEmail, setNewEmail] = useState('');

  const handleAddCustomer = async (e) => {
    e.preventDefault();
    if (!newFirstName || !newLastName) {
      showNotification("Παρακαλώ συμπληρώστε Όνομα και Επώνυμο.", "warning");
      return;
    }
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
      
      // Καλούμε τη συνάρτηση του Γονιού για να ξαναφέρει τα δεδομένα!
      onCustomerAdded();
      showNotification("Ο πελάτης αποθηκεύτηκε με επιτυχία!", "success"); 
    } catch (error) {
      console.error("Σφάλμα:", error);
      showNotification("Αποτυχία αποθήκευσης.", "error");
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 3, mb: 4, bgcolor: '#f8f9fa' }}>
      <Typography variant="h6" gutterBottom color="text.secondary">
        Προσθήκη Νέου Πελάτη
      </Typography>
      <Box component="form" onSubmit={handleAddCustomer} sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField label="Όνομα" variant="outlined" size="small" value={newFirstName} onChange={(e) => setNewFirstName(e.target.value)} />
        <TextField label="Επώνυμο" variant="outlined" size="small" value={newLastName} onChange={(e) => setNewLastName(e.target.value)} />
        <TextField label="Email" type="email" variant="outlined" size="small" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
        <Button type="submit" variant="contained" color="success">Αποθήκευση</Button>
      </Box>
    </Paper>
  );
}