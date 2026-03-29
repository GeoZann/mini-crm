import { Box, TextField, Button, CircularProgress } from '@mui/material';

export default function CustomerSearch({ searchTerm, onSearchChange, onSearchSubmit, loading }) {
  return (
    <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
      <TextField
        fullWidth
        label="Αναζήτηση με Επώνυμο"
        variant="outlined"
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        disabled={loading}
      />
      <Button 
        variant="contained" 
        color="primary" 
        onClick={onSearchSubmit} 
        sx={{ px: 4 }}
        disabled={loading}
      >
        {loading ? <CircularProgress size={24} color="inherit" /> : "Αναζήτηση"}
      </Button>
    </Box>
  );
}