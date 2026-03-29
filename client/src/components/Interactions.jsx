import { useState, useEffect, useContext } from 'react';
import { Box, Typography, TextField, Button, MenuItem, Paper, Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material';
import axios from 'axios';
import { NotificationContext } from '../context/NotificationContext';

export default function Interactions({ customerId }) {
    const [interactions, setInteractions] = useState([]);
    const [categories, setCategories] = useState([]);
    const [categoryId, setCategoryId] = useState('');
    const [notes, setNotes] = useState('');
    const { showNotification } = useContext(NotificationContext);

    // Fetch Categories and Interactions from the server
    const fetchData = async () => {
        try {
            const token = localStorage.getItem('token');
            const headers = { Authorization: `Bearer ${token}` };

            // Fetching dropdown categories
            const catRes = await axios.get('http://localhost:3000/api/categories', { headers });
            setCategories(catRes.data);

            // Fetching past interactions for this specific customer
            const intRes = await axios.get(`http://localhost:3000/api/customers/${customerId}/interactions`, { headers });
            setInteractions(intRes.data);
        } catch (error) {
            console.error("Error fetching data:", error);
        }
    };

    useEffect(() => {
        if (customerId) {
            fetchData();
        }
    }, [customerId]);

    const handleSave = async (e) => {
        e.preventDefault();
        
        if (!categoryId || !notes) {
            showNotification("Παρακαλώ συμπληρώστε όλα τα πεδία.", "warning");
            return;
        }

        try {
            const token = localStorage.getItem('token');
            // We do not send employeeId, the backend gets it securely from the JWT token
            await axios.post(`http://localhost:3000/api/customers/${customerId}/interactions`,
                { categoryId, notes },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            
            showNotification("Η κίνηση καταγράφηκε επιτυχώς!", "success");
            setCategoryId('');
            setNotes('');
            fetchData(); // Refresh the table
        } catch (error) {
            console.error("Error saving:", error);
            showNotification("Σφάλμα αποθήκευσης.", "error");
        }
    };

    return (
        <Box sx={{ mt: 2, p: 3, border: '1px solid #e0e0e0', borderRadius: 2, bgcolor: '#fafafa' }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                Ιστορικό Κινήσεων
            </Typography>

            {/* Input Form */}
            <Box component="form" onSubmit={handleSave} sx={{ display: 'flex', gap: 2, mb: 4, alignItems: 'center' }}>
                <TextField
                    select
                    label="Κατηγορία"
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    sx={{ minWidth: 200 }}
                    required
                >
                    {categories.map((cat) => (
                        <MenuItem key={cat.ID} value={cat.ID}>
                            {cat.Name}
                        </MenuItem>
                    ))}
                </TextField>

                <TextField
                    label="Περιγραφή Κίνησης / Σημειώσεις"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    fullWidth
                    required
                />

                <Button type="submit" variant="contained" color="primary" sx={{ whiteSpace: 'nowrap' }}>
                    Καταγραφη
                </Button>
            </Box>

            {/* Interactions History Table */}
            {interactions.length > 0 ? (
                <Table size="small" component={Paper} elevation={0} sx={{ border: '1px solid #e0e0e0' }}>
                    <TableHead>
                        <TableRow sx={{ bgcolor: '#eeeeee' }}>
                            <TableCell sx={{ fontWeight: 'bold' }}>Ημερομηνία</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Υπάλληλος</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Κατηγορία</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Σημειώσεις</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {interactions.map((interaction) => (
                            <TableRow key={interaction.ID}>
                                <TableCell>{new Date(interaction.InteractionDate).toLocaleString('el-GR')}</TableCell>
                                <TableCell>{interaction.EmployeeName}</TableCell>
                                <TableCell>{interaction.CategoryName}</TableCell>
                                <TableCell>{interaction.Notes}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            ) : (
                <Typography variant="body2" color="textSecondary">
                    Δεν υπάρχουν καταγεγραμμένες κινήσεις για αυτόν τον πελάτη.
                </Typography>
            )}
        </Box>
    );
}