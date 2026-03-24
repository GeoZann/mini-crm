import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { Container, Typography, Button, Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem } from '@mui/material';
import { NotificationContext } from '../context/NotificationContext';

export default function Tasks() {
  const { showNotification } = useContext(NotificationContext);
  
  // States για τα δεδομένα
  const [tasks, setTasks] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [users, setUsers] = useState([]);
  
  // States για το Modal (Αναδυόμενο παράθυρο νέου Task)
  const [open, setOpen] = useState(false);
  const [newTask, setNewTask] = useState({ customerId: '', employeeId: '', description: '', endDate: '' });

  // Φόρτωση δεδομένων με το που ανοίγει η σελίδα
  useEffect(() => {
    fetchTasks();
    fetchDropdownData();
  }, []);

  const fetchTasks = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:3000/api/tasks', { headers: { Authorization: `Bearer ${token}` } });
      setTasks(res.data.flat ? res.data.flat() : res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchDropdownData = async () => {
    try {
      const token = localStorage.getItem('token');
      const resCust = await axios.get('http://localhost:3000/api/customers', { headers: { Authorization: `Bearer ${token}` } });
      const resUsers = await axios.get('http://localhost:3000/api/users', { headers: { Authorization: `Bearer ${token}` } });
      
      setCustomers(resCust.data.flat ? resCust.data.flat() : resCust.data);
      setUsers(resUsers.data.flat ? resUsers.data.flat() : resUsers.data);
    } catch (error) {
      console.error(error);
    }
  };

  // Αποθήκευση νέου Task
  const handleSaveTask = async () => {
    if (!newTask.customerId || !newTask.employeeId || !newTask.description) {
      showNotification("Συμπληρώστε τα υποχρεωτικά πεδία", "warning");
      return;
    }
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:3000/api/tasks', newTask, { headers: { Authorization: `Bearer ${token}` } });
      showNotification("Το Task δημιουργήθηκε!", "success");
      setOpen(false);
      setNewTask({ customerId: '', employeeId: '', description: '', endDate: '' });
      fetchTasks();
    } catch (error) {
      showNotification("Σφάλμα αποθήκευσης", "error");
    }
  };

  // Ολοκλήρωση Task
  const handleCompleteTask = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:3000/api/tasks/${id}/complete`, {}, { headers: { Authorization: `Bearer ${token}` } });
      showNotification("Το Task ολοκληρώθηκε!", "success");
      fetchTasks();
    } catch (error) {
      showNotification("Σφάλμα ολοκλήρωσης", "error");
    }
  };

  // Διαγραφή Task
  const handleDeleteTask = async (id) => {
    if (!window.confirm("Σίγουρα θέλετε να διαγράψετε αυτό το task;")) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:3000/api/tasks/${id}`, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      showNotification("Το Task διαγράφηκε!", "success");
      fetchTasks(); // Ξαναφορτώνουμε τη λίστα
    } catch (error) {
      showNotification("Σφάλμα διαγραφής", "error");
    }
  };

  // Λογική: Είναι καθυστερημένο;
  const getTaskStatus = (status, endDate) => {
    if (status === 'Ολοκληρωμένο') return <Chip label="Ολοκληρωμένο" color="success" size="small" />;
    
    // Αν δεν έχει ημερομηνία λήξης ή δεν έχει περάσει, είναι απλά Ενεργό
    if (!endDate || new Date(endDate) >= new Date()) {
      return <Chip label="Ενεργό" color="primary" size="small" />;
    }
    
    // Αν περάσαμε από τα παραπάνω, άρα έχει λήξει!
    return <Chip label="Καθυστερημένο" color="error" size="small" />;
  };

  return (
    <Container sx={{ mt: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Διαχείριση Εργασιών</Typography>
        <Button variant="contained" color="primary" onClick={() => setOpen(true)}>+ Νεο Task</Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead sx={{ bgcolor: '#f1f1f1' }}>
            <TableRow>
              <TableCell>Περιγραφή</TableCell>
              <TableCell>Πελάτης</TableCell>
              <TableCell>Ανατέθηκε Σε</TableCell>
              <TableCell>Λήξη</TableCell>
              <TableCell>Κατάσταση</TableCell>
              <TableCell>Ενέργειες</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tasks.map((task) => (
              <TableRow key={task.ID || task.id}>
                <TableCell>{task.Description || task.description}</TableCell>
                <TableCell>{task.CustomerName || task.customerName}</TableCell>
                <TableCell>{task.AssignedTo || task.assignedTo}</TableCell>
                <TableCell>
                  {(task.EndDate || task.endDate) ? new Date(task.EndDate || task.endDate).toLocaleDateString('el-GR') : '-'}
                </TableCell>
                <TableCell>{getTaskStatus(task.Status || task.status, task.EndDate || task.endDate)}</TableCell>
                <TableCell>
                  {(task.Status || task.status) !== 'Ολοκληρωμένο' && (
                    <Button size="small" variant="outlined" color="success" onClick={() => handleCompleteTask(task.ID || task.id)}>
                      Ολοκλήρωση
                    </Button>
                    )}
                    <Button sx={{ ml: 1 }} size="small" variant="contained"  color="error" onClick={() => handleDeleteTask(task.ID || task.id)}>
                    Διαγραφη
                    </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* MODAL ΝΕΟΥ TASK */}
      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Νέα Εργασία</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <TextField select label="Πελάτης *" value={newTask.customerId} onChange={(e) => setNewTask({...newTask, customerId: e.target.value})}>
            {customers.map(c => <MenuItem key={c.ID || c.id} value={c.ID || c.id}>{c.FirstName || c.firstName} {c.LastName || c.lastName}</MenuItem>)}
          </TextField>
          
          <TextField select label="Υπάλληλος *" value={newTask.userId} onChange={(e) => setNewTask({...newTask, userId: e.target.value})}>
            {users.map(u => <MenuItem key={u.ID || u.id} value={u.ID || u.id}>{u.Username || u.username}</MenuItem>)}
          </TextField>

          <TextField label="Περιγραφή Εργασίας *" multiline rows={3} value={newTask.description} onChange={(e) => setNewTask({...newTask, description: e.target.value})} />
          
          {/* Το InputLabelProps shrink κρατάει την ετικέτα ψηλά όταν είναι τύπου date */}
          <TextField label="Ημερομηνία Λήξης" type="date" InputLabelProps={{ shrink: true }} value={newTask.endDate} onChange={(e) => setNewTask({...newTask, endDate: e.target.value})} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Ακύρωση</Button>
          <Button onClick={handleSaveTask} variant="contained">Αποθήκευση</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}