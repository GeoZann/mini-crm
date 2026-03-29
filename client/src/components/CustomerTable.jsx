import { useState } from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, Collapse, Box, Typography, Chip } from '@mui/material';
import Interactions from './Interactions'; // Changed import from CustomerNotes to Interactions

function Row({ customer, onDelete }) {
    const [open, setOpen] = useState(false);

    return (
        <>
            <TableRow sx={{ '& > *': { borderBottom: 'unset' } }}>
                <TableCell>{customer.FirstName || customer.firstName}</TableCell>
                <TableCell>{customer.LastName || customer.lastName}</TableCell>
                <TableCell>{customer.Email || customer.email}</TableCell>
                <TableCell>
                    <Button variant="outlined" size="small" onClick={() => setOpen(!open)} sx={{ mr: 1 }}>
                        {/* Changed label from Notes to Interactions */}
                        {open ? 'Αποκρυψη' : 'Κινησεις'}
                    </Button>
                    <Button variant="contained" color="error" size="small" onClick={() => onDelete(customer.ID || customer.id)}>
                        Διαγραφη
                    </Button>
                </TableCell>
            </TableRow>
            <TableRow>
                <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={4}>
                    <Collapse in={open} timeout="auto" unmountOnExit>
                        <Box sx={{ margin: 2 }}>
                            {/* Rendering the new Interactions component inside the expanded row */}
                            <Interactions customerId={customer.ID || customer.id} />
                        </Box>
                    </Collapse>
                </TableCell>
            </TableRow>
        </>
    );
}

export default function CustomerTable({ customers, hasSearched, onDelete }) {
    if (hasSearched && customers.length === 0) {
        return <Typography variant="h6" sx={{ mt: 4, textAlign: 'center' }}>Δεν βρέθηκαν πελάτες.</Typography>;
    }

    if (customers.length === 0) return null;

    /* Ypologismos twn statistikwn gia ta emails */
    const totalCustomers = customers.length;
    const withEmail = customers.filter(c => c.Email || c.email).length;
    const withoutEmail = totalCustomers - withEmail;

    return (
        <Box sx={{ mt: 4 }}>
            {/* Ta xrwmastista tampelakia (Chips) */}
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <Chip label={`Σύνολο Πελατών: ${totalCustomers}`} color="primary" />
                <Chip label={`Με Email: ${withEmail}`} color="success" />
                <Chip label={`Χωρίς Email: ${withoutEmail}`} color="warning" />
            </Box>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow sx={{ bgcolor: 'primary.main' }}>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Όνομα</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Επώνυμο</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Email</TableCell>
                            <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Ενέργειες</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {customers.map((customer) => (
                            <Row key={customer.ID || customer.id} customer={customer} onDelete={onDelete} />
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
}