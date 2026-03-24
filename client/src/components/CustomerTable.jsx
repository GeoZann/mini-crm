import { useMemo, useState } from 'react';
import { TableContainer, Table, TableHead, TableRow, TableCell, TableBody, Paper, Typography, Button, Box, Chip, Dialog, DialogTitle, DialogContent, DialogActions, TextField, List, ListItem, ListItemText, Divider } from '@mui/material';
import axios from 'axios';

// Δέχεται 2 Props: Τη λίστα πελατών και το αν έχει γίνει αναζήτηση
export default function CustomerTable({ customers, hasSearched, onDelete }) {

  const stats = useMemo(() => {
    const total = customers.length;
    const withEmail = customers.filter(cust => (cust.email && cust.email.trim() !== '') || (cust.Email && cust.Email.trim() !== '')).length;
    const withoutEmail = total - withEmail;
    return { total, withEmail, withoutEmail };
  }, [customers]);
  // --- STATE ΓΙΑ ΤΙΣ ΣΗΜΕΙΩΣΕΙΣ ---
  const [openNotes, setOpenNotes] = useState(false); // Ανοιχτό/Κλειστό παράθυρο
  const [selectedCustomer, setSelectedCustomer] = useState(null); // Ποιον πελάτη πατήσαμε;
  const [notes, setNotes] = useState([]); // Η λίστα με τις σημειώσεις του
  const [newNote, setNewNote] = useState(''); // Το κείμενο της νέας σημείωσης

  // --- ΣΥΝΑΡΤΗΣΕΙΣ ---
  // 1. Άνοιγμα παραθύρου και φόρτωση ιστορικού
  const handleOpenNotes = async (customer) => {
    setSelectedCustomer(customer);
    setOpenNotes(true);
    fetchNotes(customer.id || customer.ID);
  };

  // 2. Φόρτωση σημειώσεων από το Backend
  const fetchNotes = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:3000/api/customers/${id}/notes`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Προσαρμογή των δεδομένων όπως τα επιστρέφει ο SQL
      setNotes(response.data.flat ? response.data.flat() : response.data);
    } catch (error) {
      console.error("Σφάλμα φόρτωσης σημειώσεων:", error);
    }
  };

  // 3. Αποθήκευση νέας σημείωσης
  const handleAddNote = async () => {
    if (!newNote.trim()) return; // Δεν αποθηκεύουμε κενές σημειώσεις!
    
    try {
      const token = localStorage.getItem('token');
      const custId = selectedCustomer.id || selectedCustomer.ID;
      
      await axios.post(`http://localhost:3000/api/customers/${custId}/notes`, 
        { noteText: newNote },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setNewNote(''); // Καθαρίζουμε το πεδίο
      fetchNotes(custId); // Ξαναφορτώνουμε τις σημειώσεις για να φανεί η καινούργια!
    } catch (error) {
      console.error("Σφάλμα προσθήκης:", error);
    }
  };

  // 4. Κλείσιμο παραθύρου
  const handleCloseNotes = () => {
    setOpenNotes(false);
    setSelectedCustomer(null);
    setNotes([]);
    setNewNote('');
  };
  return (
    <>
      <Box sx={{ mb: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <Chip label={`Σύνολο Πελατών: ${stats.total}`} color="primary" />
        <Chip label={`Με Email: ${stats.withEmail}`} color="success" />
        <Chip label={`Χωρίς Email: ${stats.withoutEmail}`} color="warning" />
      </Box>
      <TableContainer component={Paper} elevation={3}>
        <Table sx={{ minWidth: 650 }}>
          <TableHead sx={{ bgcolor: '#f1f1f1' }}>
            <TableRow>
              <TableCell><strong>ID</strong></TableCell>
              <TableCell><strong>Όνομα</strong></TableCell>
              <TableCell><strong>Επώνυμο</strong></TableCell>
              <TableCell><strong>Email</strong></TableCell>
              <TableCell><strong>Ενέργειες</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {customers.map((cust, index) => (
              <TableRow key={cust.id || cust.ID || index} hover>
                <TableCell>{cust.id || cust.ID}</TableCell>
                <TableCell>{cust.firstName || cust.FirstName}</TableCell>
                <TableCell>{cust.lastName || cust.LastName}</TableCell>
                <TableCell>{cust.email || cust.Email}</TableCell>
                <TableCell sx={{ display: 'flex', gap: 1 }}>
                  <Button variant="outlined" color="primary" onClick={() => handleOpenNotes(cust)}>
                    Σημειωσεις
                  </Button>
                  <Button variant="contained" color="error" onClick={() => onDelete(cust.id || cust.ID)}>
                    Διαγραφή
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {hasSearched && customers.length === 0 && (
        <Typography variant="body1" align="center" color="text.secondary" sx={{ mt: 3 }}>
          Δεν βρέθηκαν πελάτες.
        </Typography>
      )}
      {/* === ΤΟ ΑΝΑΔΥΟΜΕΝΟ ΠΑΡΑΘΥΡΟ (MODAL) ΣΗΜΕΙΩΣΕΩΝ === */}
      <Dialog open={openNotes} onClose={handleCloseNotes} fullWidth maxWidth="sm">
        <DialogTitle>
          Ιστορικό Επικοινωνίας: {selectedCustomer?.firstName || selectedCustomer?.FirstName} {selectedCustomer?.lastName || selectedCustomer?.LastName}
        </DialogTitle>
        
        <DialogContent dividers>
          {/* Λίστα με τις παλιές σημειώσεις */}
          <List sx={{ mb: 2, maxHeight: 300, overflow: 'auto' }}>
            {notes.length === 0 ? (
              <Typography color="text.secondary">Δεν υπάρχει ιστορικό για αυτόν τον πελάτη.</Typography>
            ) : (
              notes.map((note, index) => (
                <div key={index}>
                  <ListItem alignItems="flex-start">
                    <ListItemText
                      primary={note.NoteText || note.noteText}
                      secondary={new Date(note.CreatedAt || note.createdAt).toLocaleString('el-GR')}
                    />
                  </ListItem>
                  <Divider component="li" />
                </div>
              ))
            )}
          </List>

          {/* Πεδίο για νέα σημείωση */}
          <TextField
            label="Νέα Σημείωση..."
            multiline
            rows={3}
            fullWidth
            variant="outlined"
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
          />
        </DialogContent>
        
        <DialogActions>
          <Button onClick={handleCloseNotes} color="inherit">Κλείσιμο</Button>
          <Button onClick={handleAddNote} variant="contained" color="primary">Προσθήκη Σημείωσης</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}