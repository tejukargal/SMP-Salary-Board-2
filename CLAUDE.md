# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a vanilla JavaScript web application called "SMP Salary Board" - a modern, responsive employee salary management system. The project is client-side only with no build process or external dependencies beyond Font Awesome icons.

## Development Commands

Since this is a static web application, no build/test/lint commands are available. The application runs directly in the browser:

### Running the Application
```bash
# Method 1: Direct file access
# Open index.html in any modern web browser

# Method 2: Using local server (recommended for CSV loading)
python3 -m http.server 8000
# or
python -m SimpleHTTPServer 8000
# or
npx http-server

# Then visit http://localhost:8000
```

## Architecture

### File Structure
- `index.html` - Main HTML structure with sections for upload, login, dashboard, and employee details
- `script.js` - Single JavaScript class `SalaryBoardApp` containing all application logic
- `styles.css` - Complete CSS styling with CSS custom properties for theming
- `Salary.csv` - Sample salary data file (expected format documented in README)

### Core Application Flow
1. **CSV Upload/Loading** - App tries to auto-load `Salary.csv`, falls back to file upload
2. **Data Processing** - CSV is parsed and processed into structured data using pre-calculated values
3. **Navigation** - Three main views: Dashboard (aggregate data), Employee Login, Employee Details
4. **Salary Calculations** - Uses pre-calculated values from CSV:
   - **Gross Salary**: Uses `Gross Salary` column from CSV
   - **Total Deductions**: Uses `Total Deductions` column from CSV
   - **Net Salary**: Uses `Net Salary` column from CSV
   - **Individual Components**: Uses individual columns (Basic, DA, HRA, etc.) for breakdown displays

### Key Components
- **SalaryBoardApp class** (script.js:1-1066) - Main application controller
- **Data Processing** (script.js:154-270) - CSV parsing and salary calculations
- **Dashboard View** (script.js:357-615) - Aggregated metrics and consolidated table
- **Employee View** (script.js:793-1042) - Individual employee salary history
- **Theme System** (styles.css:1-36) - CSS custom properties for light/dark themes

### State Management
- `this.salaryData` - Raw CSV data array
- `this.processedData` - Structured data with employees, summaries, and calculations
- `this.currentView` - Current section ('upload', 'login', 'dashboard', 'employee')
- `this.currentEmployee` - Currently logged-in employee number

## Working with the Code

### Adding New Features
- Dashboard metrics: Extend `renderMetrics()` function (script.js:365)
- Employee calculations: Modify calculation logic in `processData()` (script.js:154)
- New views: Add to `hideAllSections()` and create corresponding show method
- Styling: Use existing CSS custom properties and follow component patterns

### CSV Data Format
Expected columns: EMP No, Name, Designation, Month, Year, Basic, DA, HRA, IR, SFN, SPAY-TYPIST, P, IT, PT, GSLIC, LIC, FBF, **Net Salary**, **Gross Salary**, **Total Deductions**

**Important**: The CSV must contain pre-calculated Gross Salary, Total Deductions, and Net Salary columns. The application uses these values directly rather than calculating them from components.

### Large Dataset Support
- **Robust CSV Parsing**: Enhanced parser handles 2000+ rows without data loss
- **Progress Logging**: Console logs show parsing progress and data validation
- **Error Handling**: Improved handling of malformed CSV lines and edge cases
- **Performance**: Efficient processing of large datasets with minimal memory usage

### Indian Number Formatting
- **formatIndianNumber() method**: Converts numbers to Indian format (1,23,456)
- **Consistent Application**: All monetary values use Indian formatting across the application
- **Examples**: 
  - ₹123456 displays as ₹1,23,456
  - ₹1234567 displays as ₹12,34,567
  - ₹12345678 displays as ₹1,23,45,678

### Theme Support
Uses CSS custom properties for theming. Toggle between light/dark with `data-theme` attribute on document element.

## Browser Compatibility
Designed for modern browsers with ES6+ support. No polyfills included.