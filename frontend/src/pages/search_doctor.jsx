import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Container,
  InputAdornment,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import NavHeader from '../components/NavHeader';
import { searchDoctors, getPatientInfo } from '../services/api';

const PATIENT_ID = 1; // temporary until merge

function DoctorSearch() {

  const [query, setQuery] = useState(''); //this state will be for storing the search query entered by the user
  const [results, setResults] = useState([]); //this state will be for storing the search results returned by the API
  const [loading, setLoading] = useState(false); //this state will be for indicating whether a search is currently in progress
  const [searched, setSearched] = useState(false); //this state will be for indicating whether a search has been performed

  //====== 1 ======== 
  function handleSearch() {
    setLoading(true); //set loading state to true when a search is initiated
    setSearched(true); //set searched state to true when a search is performed

    searchDoctors(query) //call the searchDoctors function from the API service with the current query
      .then((data) => setResults(data)) //update results state with the data returned from the API
      .catch(() => setResults([])) //if there's an error, set results to an empty array
      .finally(() => setLoading(false)); //set loading state to false once the search is complete
  }

  //====== 2 ======== 
  function handleKeyDown(e) {
    if (e.key === 'Enter') handleSearch();
  }



  return (
    /* NOTE: Created using FIGMA MUI library components, FIGMA Anima plugin, and VS CODE PLUGINS 
    https://www.geeksforgeeks.org/reactjs/react-mui-paper-api/
    https://www.bing.com/ck/a?!&&p=005b9c1b33e8a8bdd557754fc538d6efe735d489ab0c6f5463ad710c561c91bbJmltdHM9MTc3NTYwNjQwMA&ptn=3&ver=2&hsh=4&fclid=0ed859f0-c337-6416-3eff-4bf0c22e6531&u=a1L3ZpZGVvcy9yaXZlcnZpZXcvcmVsYXRlZHZpZGVvP3E9cGFwZXIrdnMrY2FyZCttdWkrdmlzdWFsJm1pZD0xNTI4MDQzRTE1MEQ4QTZDMjQ5RTE1MjgwNDNFMTUwRDhBNkMyNDlFJkZPUk09VklSRQ
    */
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5' }}>
      <NavHeader patient={null} loading={false} />
      <Container maxWidth={false} sx={{ px: { xs: 2, md: 4 }, py: 3 }}>

        <Paper elevation={1} sx={{ p: 3 }}>
          <Typography variant="h5" sx={{ mb: 3 }}> Doctor Search </Typography>
          { /*============================================================================= */}
          {/* Search bar component */}
          <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            <TextField fullWidth placeholder="Search by name or specialty" value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={handleKeyDown} />
            <Button variant="contained" onClick={handleSearch} sx={{ whiteSpace: 'nowrap' }}> Search  </Button>
          </Box>

          { /*============================================================================= */}
          {/* Results table */}
          {loading ? (<Typography>Searching...</Typography>) : searched && results.length === 0 ? (<Typography color="text.secondary">No doctors found.</Typography>) : results.length > 0 ? (
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Specialty</TableCell>
                  <TableCell>Email</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {results.map((doctor_obj, index) => (
                  <TableRow key={doctor_obj.ID || index}>
                    <TableCell>{doctor_obj.FIRST_NAME || 'n/a'} {doctor_obj.LAST_NAME || ''}</TableCell>
                    <TableCell>{doctor_obj.SPECIALTY || 'n/a'}</TableCell>
                    <TableCell>{doctor_obj.WORK_EMAIL || 'n/a'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : null}
          { /*============================================================================= */}
        </Paper>

      </Container>
    </Box>
  );
}

export default DoctorSearch;
