import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, Box, Typography, Chip, CircularProgress } from '@mui/material';

function Row({ customer, onDelete }) {
    return (
        <TableRow>
            <TableCell>{customer.FirstName || customer.firstName}</TableCell>
            <TableCell>{customer.LastName || customer.lastName}</TableCell>
            <TableCell>{customer.Email || customer.email}</TableCell>
            <TableCell>
                <Button variant="contained" color="error" size="small" onClick={() => onDelete(customer.ID || customer.id)}>
                    Διαγραφη
                </Button>
            </TableCell>
        </TableRow>
    );
}

export default function CustomerTable({ customers, hasSearched, onDelete, loading }) {
    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <CircularProgress />
            </Box>
        );
    }

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