import { useState, useContext } from 'react';
import axios from 'axios';
import { Container, Typography, Button, Box, TextField, Card, CardContent, Alert } from '@mui/material';
import { NotificationContext } from '../context/NotificationContext';

export default function UserManagement() {
  const { showNotification } = useContext(NotificationContext);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreateUser = async () => {
    // Επικύρωση πεδίων
    if (!username.trim()) {
      showNotification("Συμπληρώστε το όνομα χρήστη", "warning");
      return;
    }

    if (!password) {
      showNotification("Συμπληρώστε τον κωδικό πρόσβασης", "warning");
      return;
    }

    if (password !== confirmPassword) {
      showNotification("Οι κωδικοί δεν ταιριάζουν", "warning");
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:3000/api/users', 
        { username, password }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      showNotification("Ο χρήστης δημιουργήθηκε επιτυχώς!", "success");
      setUsername('');
      setPassword('');
      setConfirmPassword('');
    } catch (error) {
      if (error.response?.status === 400) {
        showNotification("Ο χρήστης υπάρχει ήδη!", "error");
      } else {
        showNotification("Σφάλμα δημιουργίας χρήστη", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start', minHeight: '100vh', pt: 8 }}>
      <Box sx={{ width: '100%' }}>
        <Typography variant="h4" sx={{ mb: 4, fontWeight: 'bold', textAlign: 'center' }}>
          Δημιουργία Νέου Χρήστη
        </Typography>

        <Card sx={{ maxWidth: 500, mx: 'auto' }}>
        <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Alert severity="info">
            Δημιουργήστε ένα νέο λογαριασμό χρήστη για την εφαρμογή
          </Alert>

          <TextField
            label="Όνομα Χρήστη *"
            fullWidth
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Π.χ., giorgos_p"
            disabled={loading}
          />

          <TextField
            label="Κωδικός Πρόσβασης *"
            type="password"
            fullWidth
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />

          <TextField
            label="Επιβεβαίωση Κωδικού *"
            type="password"
            fullWidth
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={loading}
          />

          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              color="primary"
              size="large"
              onClick={handleCreateUser}
              disabled={loading}
              sx={{ flex: 1 }}
            >
              {loading ? 'Δημιουργία...' : 'Δημιουργία Χρήστη'}
            </Button>
          </Box>
        </CardContent>
      </Card>
      </Box>
    </Container>
  );
}
