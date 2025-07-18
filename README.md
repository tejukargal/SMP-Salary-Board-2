# SMP Salary Board

A modern, responsive web application for managing and viewing employee salary data with interactive dashboards and individual employee login capabilities.

## Features

- **CSV Data Parsing**: Automatically loads and processes salary data from CSV files
- **Dashboard View**: Year and month-wise consolidated salary summaries with metric cards
- **Employee Login**: Individual employee access using Employee Number
- **Responsive Design**: Optimized for both desktop and mobile devices
- **Dark/Light Theme**: Toggle between light and dark modes
- **Interactive Filtering**: Filter dashboard data by year and month
- **Salary History**: Detailed salary records for individual employees

## Getting Started

### Method 1: Direct File Access
1. Open `index.html` in any modern web browser
2. The application will automatically load the `Salary.csv` file if it's in the same directory

### Method 2: Using Local Server (Recommended)
1. Open terminal/command prompt
2. Navigate to the project directory
3. Run a local server:
   ```bash
   # Using Python 3
   python3 -m http.server 8000
   
   # Using Python 2
   python -m SimpleHTTPServer 8000
   
   # Using Node.js (if you have http-server installed)
   npx http-server
   ```
4. Open `http://localhost:8000` in your browser

## Usage

### Dashboard View
1. Click "View Dashboard" to see overall salary statistics
2. Use the year and month filters to view specific periods
3. View metric cards showing:
   - Total employees
   - Total records
   - Total net/gross salary
   - Average net/gross salary

### Employee Login
1. Enter your Employee Number in the login field
2. Click "Login" to view your personal salary details
3. View your salary history and personal metrics

### Theme Switching
- Click the theme toggle button (sun/moon icon) in the header to switch between light and dark modes
- Your theme preference is automatically saved

## CSV Data Format

The application expects a CSV file with the following columns:
- `EMP No`: Employee Number (unique identifier)
- `Name`: Employee Name
- `Designation`: Job Title
- `Month`: Salary Month
- `Year`: Salary Year
- `Net Salary`: Take-home salary amount
- `Gross Salary`: Total salary before deductions
- Other columns for detailed salary components

## Browser Compatibility

- Chrome/Chromium (recommended)
- Firefox
- Safari
- Edge
- Mobile browsers (iOS Safari, Chrome Mobile, etc.)

## Technical Stack

- **HTML5**: Modern semantic markup
- **CSS3**: Custom properties, Grid, Flexbox, responsive design
- **JavaScript ES6+**: Modern JavaScript features
- **Font Awesome**: Icons
- **No external dependencies**: Pure vanilla JavaScript implementation

## Mobile Responsiveness

The application is fully responsive and optimized for:
- Desktop screens (1200px+)
- Tablets (768px - 1199px)
- Mobile phones (320px - 767px)

## Security Notes

- The application runs entirely in the browser (client-side)
- No data is transmitted to external servers
- Employee numbers are used for authentication (ensure proper access control in production)

## Customization

### Colors and Themes
Modify the CSS custom properties in `styles.css` to change colors:
```css
:root {
  --primary-color: #2563eb;
  --secondary-color: #3b82f6;
  /* ... other color variables */
}
```

### Adding New Metrics
Extend the `renderMetrics()` function in `script.js` to add new dashboard metrics.

## Support

For issues or questions about the SMP Salary Board application, please check the implementation files:
- `index.html` - Main structure
- `styles.css` - Styling and themes
- `script.js` - Application logic

## License

This project is created for educational and internal use purposes.