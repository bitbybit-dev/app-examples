import React from 'react';
import './App.css';
import { createTheme, ThemeProvider } from '@mui/material';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Pattern from './examples/pattern/Pattern';
import Layout from './Layout';
import Home from './Home';
import NoPage from './NoPage';

const theme = createTheme({
    palette: {
        primary: {
            main: 'rgb(225, 162, 120)',
        },
        secondary: {
            main: '#00fff0',
        },
    },
});

function App() {

    return (
        <ThemeProvider theme={theme}>
            <BrowserRouter>
                <Routes>
                    <Route path="/threejs-library/" element={<Layout />}>
                        <Route index element={<Home />} />
                        <Route path="/threejs-library/pattern" element={<Pattern />} />
                        <Route path="*" element={<NoPage />} />
                    </Route>
                </Routes>
            </BrowserRouter>
        </ThemeProvider>
    )

}

export default App;
