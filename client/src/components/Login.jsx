import { useState, useContext } from 'react';
import axios from 'axios';
import { Container, Paper, Typography, Box, TextField, Button } from '@mui/material';
import { NotificationContext } from '../context/NotificationContext';

export default function Login({ setAuth }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { showNotification } = useContext(NotificationContext);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:3000/api/login', {
        username,
        password
      });
      
      // 1. Παίρνουμε το token που μας έστειλε ο Node.js
      const token = response.data.token;
      
      // 2. Το κρύβουμε στο "χρηματοκιβώτιο" του browser (localStorage)
      localStorage.setItem('token', token);
      
      // 3. Ενημερώνουμε την εφαρμογή ότι ο χρήστης μπήκε!
      setAuth(true);
      showNotification("Επιτυχής σύνδεση!", "success");
      

    } catch (error) {
      console.error("Σφάλμα σύνδεσης:", error);
      showNotification("Λάθος όνομα χρήστη ή κωδικός", "error");
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 10 }}>
      <Paper elevation={6} sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
        <Typography variant="h4" color="primary" gutterBottom sx={{ fontWeight: 'bold' }}>
          Είσοδος στο Mini CRM
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Παρακαλώ συνδεθείτε για να συνεχίσετε
        </Typography>
        
        <Box component="form" onSubmit={handleLogin} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <TextField 
            label="Όνομα Χρήστη" 
            variant="outlined" 
            value={username} 
            onChange={(e) => setUsername(e.target.value)} 
            required 
          />
          <TextField 
            label="Κωδικός" 
            type="password" 
            variant="outlined" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
          />
          <Button type="submit" variant="contained" size="large" sx={{ py: 1.5, fontSize: '1.1rem' }}>
            Συνδεση
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}