import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';

export default function Navbar({ setAuth }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token'); // Πετάμε το πάσο!
    setAuth(false); // Ενημερώνουμε την εφαρμογή
    navigate('/login'); // Πάμε στη σελίδα login
  };

  return (
    <AppBar position="static" sx={{ mb: 4 }}>
      <Toolbar>
        <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
          Mini CRM
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Button color="inherit" component={Link} to="/">Αρχικη (Πελατες)</Button>
          <Button color="inherit" component={Link} to="/add" sx={{ bgcolor: 'rgba(255,255,255,0.1)' }}>Προσθηκη Πελατη</Button>
          
          {/* ΝΕΟ: Κουμπί για τις Εργασίες (Tasks) */}
          <Button color="inherit" component={Link} to="/tasks" sx={{ bgcolor: 'rgba(255,255,255,0.1)' }}>Εργασιες</Button>
          
          {/* ΝΕΟ: Κουμπί για Διαχείριση Χρηστών */}
          <Button color="inherit" component={Link} to="/users" sx={{ bgcolor: 'rgba(255,255,255,0.1)' }}>Νεος Χρηστης</Button>
          
          {/* Κουμπί Αποσύνδεσης (Logout) */}
          <Button color="error" variant="contained" onClick={handleLogout} sx={{ ml: 2 }}>
            Αποσυνδεση
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
}