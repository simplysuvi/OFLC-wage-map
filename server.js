// Simple Node.js server to serve the OFLC Wage Map application

const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from the current directory
app.use(express.static(__dirname));

// Serve the CSV data files
app.use('/OFLC_Wages_2024-25', express.static(path.join(__dirname, 'data/OFLC_Wages_2024-25')));

// Serve the GeoJSON files
app.get('/cbsa_boundaries_raw.geojson', (req, res) => {
    res.sendFile(path.join(__dirname, 'data/cbsa_boundaries_raw.geojson'));
});

app.get('/gz_2010_us_040_00_5m.json', (req, res) => {
    res.sendFile(path.join(__dirname, 'data/gz_2010_us_040_00_5m.json'));
});

// Route for the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start the server
app.listen(PORT, () => {
    console.log(`OFLC Wage Map server running at http://localhost:${PORT}`);
    console.log('Press Ctrl+C to stop the server');
});
