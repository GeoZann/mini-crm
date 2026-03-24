import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { Container } from '@mui/material';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { NotificationContext } from './context/NotificationContext';
import Navbar from './components/Navbar';
import CustomerForm from './components/CustomerForm';
import CustomerSearch from './components/CustomerSearch';
import CustomerTable from './components/CustomerTable';
import Login from './components/Login';
import Tasks from './components/Tasks';
import UserManagement from './components/UserManagement';  

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));
  
  const [customers, setCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const { showNotification } = useContext(NotificationContext);

  const fetchCustomers = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/customers', {
        params: { name: searchTerm },
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const flatData = response.data.flat();
      setCustomers(flatData);
      setHasSearched(true);
    } catch (error) {
      console.error("Σφάλμα:", error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        localStorage.removeItem('token');
        setIsAuthenticated(false);
      } else {
        showNotification("Σφάλμα κατά την ανάκτηση των πελατών.", "error");
      }
    }
  };

  const handleDeleteCustomer = async (id) => {
    if (!window.confirm("Είστε σίγουροι ότι θέλετε να διαγράψετε αυτόν τον πελάτη;")) {
      return; 
    }
    try {
      await axios.delete(`http://localhost:3000/api/customers/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      showNotification("Ο πελάτης διαγράφηκε με επιτυχία!", "success");
      fetchCustomers(); 
    } catch (error) {
      console.error("Σφάλμα στη διαγραφή:", error);
      showNotification("Σφάλμα στη διαγραφή!", "error");
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchCustomers();
    }
  }, [isAuthenticated]);

  return (
    <Router>
      {/* Δείχνουμε το Navbar ΜΟΝΟ αν ο χρήστης είναι συνδεδεμένος */}
      {isAuthenticated && <Navbar setAuth={setIsAuthenticated} />}

      <Container maxWidth="lg" sx={{ mb: 5 }}>
        <Routes>
          
          {/* Σελίδα Login */}
          <Route path="/login" element={
            !isAuthenticated ? <Login setAuth={setIsAuthenticated} /> : <Navigate to="/" />
          } />

          {/* Προστατευμένη Σελίδα: Αρχική (Πελάτες) */}
          <Route path="/" element={
            isAuthenticated ? (
              <>
                <CustomerSearch searchTerm={searchTerm} onSearchChange={setSearchTerm} onSearchSubmit={fetchCustomers} />
                <CustomerTable customers={customers} hasSearched={hasSearched} onDelete={handleDeleteCustomer} />
              </>
            ) : <Navigate to="/login" />
          } />

          {/* Προστατευμένη Σελίδα: Προσθήκη Πελάτη */}
          <Route path="/add" element={
            isAuthenticated ? <CustomerForm onCustomerAdded={fetchCustomers} /> : <Navigate to="/login" />
          } />

          {/* === ΝΕΑ Προστατευμένη Σελίδα: Εργασίες (Tasks) === */}
          <Route path="/tasks" element={
            isAuthenticated ? <Tasks /> : <Navigate to="/login" />
          } />

          {/* === ΝΕΑ Προστατευμένη Σελίδα: Διαχείριση Χρηστών === */}
          <Route path="/users" element={
            isAuthenticated ? <UserManagement /> : <Navigate to="/login" />
          } />

        </Routes>
      </Container>
    </Router>
  );
}

export default App;