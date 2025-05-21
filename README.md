<img src="assets/logo.png" alt="OFLC Wage Atlas Logo" width="150" height="150"/>

## OFLC Wage Atlas

This project visualizes prevailing wage data published by the U.S. Department of Labor's Office of Foreign Labor Certification (OFLC) for Labor Condition Applications (LCAs). It enables interactive exploration of wage levels across U.S. regions for different occupational codes (SOC) and geographic areas.

### What It Does

The OFLC Wage Atlas provides a comprehensive visualization and analysis tool for prevailing wage data:

- **Data Visualization**: 
  - Loads and cleans official ALC wage data from the Department of Labor
  - Visualizes wages on a U.S. map by region (MSA or non-MSA)
  - Color-codes regions based on wage levels for intuitive understanding
  - Provides a responsive legend showing the wage level color mapping

- **Search and Filtering**:
  - Allows filtering by job role (SOC code/title), wage level (1–4 or average)
  - Supports filtering by state, city, county, and wage ranges
  - Provides autocomplete functionality for job title and county searches
  - Enables zip code lookup to find which area and county a location falls under

- **Information Display**:
  - Displays detailed wage information when hovering over map regions
  - Shows all wage levels (1-4 and average) for each geographic area
  - Includes a data table view for detailed analysis and comparison
  - Automatically calculates annual wages from hourly rates

- **User Interaction**:
  - Allows clicking on map regions to automatically set filters
  - Provides one-click map reset to return to the default view
  - Supports zooming and panning for detailed exploration
  - Enables direct access to wage data for specific areas via zip code lookup

- **Practical Applications**:
  - Supports analysis and justification for LCA/PERM filings
  - Helps employers determine appropriate wage levels for foreign workers
  - Assists immigration attorneys in preparing prevailing wage documentation
  - Provides researchers with interactive tools for wage data analysis

### How It Was Built

The Wage Atlas is a modern web application built with the following technologies:

- **Frontend**: Pure JavaScript, HTML5, and CSS3 without frameworks for optimal performance
- **Map Visualization**: Leaflet.js for interactive mapping capabilities
- **Data Processing**: PapaParse for CSV parsing and data manipulation
- **Geocoding**: Integration with zippopotam.us API for zip code to coordinates conversion
- **Geospatial Analysis**: Point-in-polygon algorithm to determine area containment
- **UI/UX**: Custom-designed interface with responsive layout for all device sizes
- **Styling**: Modern design system with consistent color palette and typography
- **Animations**: Smooth transitions and loading states for better user experience

The application architecture follows a modular approach:
- `data.js`: Handles data loading, parsing, and filtering
- `map.js`: Manages map visualization, boundaries, and interactive features
- `main.js`: Controls application initialization, UI interactions, and API integrations
- `styles.css`: Provides responsive styling with CSS variables for theming

The application uses several advanced techniques:
- **Dynamic Data Filtering**: Real-time filtering of wage data based on multiple criteria
- **Geocoding Integration**: Converting zip codes to geographic coordinates
- **Spatial Analysis**: Determining which geographic areas contain specific coordinates
- **Modal System**: Reusable modal components for information display and user interactions
- **Responsive Design**: Adapting to different screen sizes from desktop to mobile

### Data Processing and Preparation

The data processing workflow involved several steps:

1. **Data Collection**: Raw wage data was downloaded from the official DOL OFLC website
2. **Data Cleaning and Merging**: Python was used to process the raw CSV files:
   - Wage data and geography data were merged using Area names
   - The resulting dataset was then merged with SOC code data to map job titles to areas and their wage data
   - Annual wage calculations were performed for hourly wage entries
   - Missing or inconsistent data was cleaned and standardized

3. **Geographic Data Processing**:
   - CBSA (Core-Based Statistical Area) shapefiles from the U.S. Census Bureau were converted to GeoJSON format
   - State boundary files were processed to create a consistent base layer
   - Geographic identifiers were normalized to match between wage data and boundary files

4. **Data Integration**:
   - The processed wage data was integrated with geographic boundaries
   - A matching system was implemented to connect wage data to the appropriate geographic regions
   - Wage levels were calculated and color-coded for visualization

### Data Sources

#### Wage Data
All wage data used in this project was downloaded from the official DOL OFLC website: [https://flag.dol.gov/wage-data/wage-data-downloads](https://flag.dol.gov/wage-data/wage-data-downloads)

#### Geographic Data
Geographic boundary data was sourced from the U.S. Census Bureau:
- CBSA (Core-Based Statistical Area) boundaries for metropolitan and micropolitan areas
- State boundaries for the base map layer

#### External APIs
- **Zippopotam.us API**: Used for the zip code lookup feature to convert zip codes to geographic coordinates and location information. [https://api.zippopotam.us](https://api.zippopotam.us)

### Files Used

#### Application Files
| File | Purpose |
|------|---------|
| `index.html` | Main HTML structure and UI components |
| `main.js` | Application initialization, event handling, and zip code lookup functionality |
| `data.js` | Data loading, parsing, filtering, and processing |
| `map.js` | Map visualization, boundaries, and interactive features |
| `styles.css` | Responsive styling with CSS variables for theming |

#### Data Files
| File | Purpose |
|------|---------|
| `data/OFLC_Wages_2024-25/official/ALC_Export.csv` | Official OFLC wage data (Level 1–4, Average) by SOC and Area |
| `data/OFLC_Wages_2024-25/official/Geography.csv` | Maps `Area` codes to MSA/region names and states |
| `data/OFLC_Wages_2024-25/official/oes_soc_occs.csv` | SOC code to official job title + description |
| `data/OFLC_Wages_2024-25/official/Wage Year 2024–25 ACWIA Crosswalks.xlsx` | Maps O*NET codes to ACWIA-compatible SOC codes |
| `data/OFLC_Wages_2024-25/official/Wage Year 2024–25 Appendix A, Job Zone, and Education.xlsx` | Contains job zone and education level info per SOC |
| `data/cbsa_boundaries_raw.geojson` | CBSA boundary data converted from Census Bureau shapefiles |
| `data/gz_2010_us_040_00_5m.json` | U.S. state boundaries for base map layer |

#### External Resources
| Resource | Purpose |
|----------|---------|
| Leaflet.js | Interactive mapping library |
| PapaParse | CSV parsing library |
| Font Awesome | Icons for UI elements |
| Zippopotam.us API | Zip code to location data conversion |

### Features

#### Core Features
- **Interactive Map**: Color-coded visualization of wage data across geographic regions
- **Filtering System**: Multi-level filtering by job title, wage level, state, city, county, and wage ranges
- **Autocomplete Search**: Type-ahead functionality for job titles and counties
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Data Table**: Sortable table view of filtered wage data
- **Hover Information**: Detailed wage information displayed when hovering over regions
- **Loading Indicators**: Visual feedback during data loading and processing

#### Navigation and Controls
- **Map Reset**: One-click reset button to return to the default map view
- **Filter Toggle**: Easy access to filters through a dedicated button
- **Information Modal**: Access to data source information and documentation
- **Table Toggle**: Show/hide the data table for detailed analysis

#### Advanced Features
- **Zip Code Lookup**: Enter a zip code to find which area and county it falls under
  - Uses the zippopotam.us API to convert zip codes to geographic coordinates
  - Determines which CBSA area and county the coordinates fall within
  - Displays location information including city, state, area, and county
  - Provides direct access to wage data for the identified area when available
- **Geographic Selection**: Click on map regions to automatically set filters
- **Wage Range Filtering**: Set minimum and maximum wage thresholds
- **Annual Wage Calculation**: Automatic conversion of hourly wages to annual salaries
- **Dynamic Color Scaling**: Wage levels visualized with an intuitive color gradient
- **Responsive Legend**: Interactive legend showing wage level color mapping

### Zip Code Lookup Feature

The zip code lookup feature is a powerful addition to the OFLC Wage Atlas that allows users to quickly find wage data for specific locations:

#### How It Works
1. **User Input**: Enter a 5-digit US zip code in the lookup field
2. **API Integration**: The application calls the zippopotam.us API to convert the zip code to geographic coordinates
3. **Spatial Analysis**: Using Leaflet's point-in-polygon algorithm, the application determines which CBSA area and county the coordinates fall within
4. **Data Retrieval**: The application matches the identified area with the wage data in the database
5. **Results Display**: The user sees the location information (city, state), area name, and county
6. **Direct Access**: If wage data is available for the area, users can click "View Wage Data" to automatically set the appropriate filters and view the data

#### Benefits
- **Convenience**: Quickly find wage data for specific locations without manual searching
- **Precision**: Accurately determine which geographic area a location falls within
- **Efficiency**: Bypass multiple filter selections with a single zip code lookup
- **Accessibility**: Makes the data more accessible to users who know their location but not the CBSA area name

#### Technical Implementation
- Integrates with the zippopotam.us API for geocoding
- Implements point-in-polygon algorithm for spatial analysis
- Uses a modal interface for a clean user experience
- Provides real-time feedback during the lookup process
- Handles edge cases such as zip codes outside defined CBSA areas

### Disclaimer

This project uses publicly available data from the U.S. Department of Labor. It is intended for analysis, research, and visualization purposes only. Always refer to official guidance when submitting immigration applications.
