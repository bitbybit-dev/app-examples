import Grid from '@mui/material/Grid2';
import React from 'react';
import { Link } from 'react-router-dom';

function Home() {
    return <Grid container spacing={2}>
        <Grid size={2}>
            <Link to="/threejs-library/pattern">PATTERN</Link>
        </Grid>
        <Grid size={2}>
            <Link to="/threejs-library/pattern">PATTERN</Link>
        </Grid>
        <Grid size={2}>
            <Link to="/threejs-library/pattern">PATTERN</Link>
        </Grid>
        <Grid size={2}>
            <Link to="/threejs-library/pattern">PATTERN</Link>
        </Grid>
        <Grid size={2}>
            <Link to="/threejs-library/pattern">PATTERN</Link>
        </Grid>
        <Grid size={2}>
            <Link to="/threejs-library/pattern">PATTERN</Link>
        </Grid>
    </Grid>
};

export default Home;