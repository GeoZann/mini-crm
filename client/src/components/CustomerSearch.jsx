import { Box, TextField, Button } from '@mui/material';

// Δέχεται 3 Props από τον Γονιό: την τιμή, τη συνάρτηση αλλαγής, και τη συνάρτηση του κλικ
export default function CustomerSearch({ searchTerm, onSearchChange, onSearchSubmit }) {
  return (
    <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
      <TextField
        fullWidth
        label="Αναζήτηση με Επώνυμο"
        variant="outlined"
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
      />
      <Button variant="contained" color="primary" onClick={onSearchSubmit} sx={{ px: 4 }}>
        Αναζήτηση
      </Button>
    </Box>
  );
}