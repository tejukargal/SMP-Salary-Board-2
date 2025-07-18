class SalaryBoardApp {
    constructor() {
        this.salaryData = [];
        this.processedData = {};
        this.currentView = 'upload';
        this.currentEmployee = null;
        this.theme = localStorage.getItem('theme') || 'light';
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.applyTheme();
        this.loadCSVData();
    }

    setupEventListeners() {
        // Theme toggle
        document.getElementById('themeToggle').addEventListener('click', () => {
            this.toggleTheme();
        });

        // CSV file upload
        document.getElementById('csvFile').addEventListener('change', (e) => {
            this.handleCSVUpload(e);
        });

        // Login functionality
        document.getElementById('loginBtn').addEventListener('click', () => {
            this.handleEmployeeLogin();
        });

        // Dashboard view
        document.getElementById('dashboardBtn').addEventListener('click', () => {
            this.showDashboard();
        });

        // Back button
        document.getElementById('backBtn').addEventListener('click', () => {
            this.showLogin();
        });

        // Logout
        document.getElementById('logoutBtn').addEventListener('click', () => {
            this.logout();
        });

        // Filters
        document.getElementById('yearFilter').addEventListener('change', () => {
            this.updateDashboard();
        });

        document.getElementById('monthFilter').addEventListener('change', () => {
            this.updateDashboard();
        });

        // Enter key for login
        document.getElementById('empNo').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleEmployeeLogin();
            }
        });
    }

    toggleTheme() {
        this.theme = this.theme === 'light' ? 'dark' : 'light';
        this.applyTheme();
        localStorage.setItem('theme', this.theme);
    }

    applyTheme() {
        document.documentElement.setAttribute('data-theme', this.theme);
        const themeIcon = document.querySelector('#themeToggle i');
        themeIcon.className = this.theme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
    }

    async loadCSVData() {
        try {
            const response = await fetch('./Salary.csv');
            const csvText = await response.text();
            this.parseCSV(csvText);
            this.showLogin();
        } catch (error) {
            console.error('Error loading CSV:', error);
            this.showUploadSection();
        }
    }

    handleCSVUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        this.showLoading();
        
        const reader = new FileReader();
        reader.onload = (e) => {
            this.parseCSV(e.target.result);
            this.hideLoading();
            this.showLogin();
        };
        reader.readAsText(file);
    }

    parseCSV(csvText) {
        console.log('Starting CSV parsing...');
        const lines = csvText.split('\n');
        console.log(`Total lines in CSV: ${lines.length}`);
        
        // Handle header row more robustly
        const headerLine = lines[0];
        let headers;
        
        if (headerLine.includes(',')) {
            headers = this.parseCSVLine(headerLine).map(h => h.trim());
        } else {
            headers = headerLine.split(',').map(h => h.trim());
        }
        
        console.log('Headers:', headers);
        this.salaryData = [];
        let processedCount = 0;
        let skippedCount = 0;
        let currentRecord = '';
        let inQuotedField = false;
        
        // Parse CSV handling multiline fields
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            
            // Skip empty lines
            if (!line || line.length === 0) {
                skippedCount++;
                continue;
            }
            
            // Check if we're continuing a multiline field
            if (currentRecord) {
                currentRecord += ' ' + line;
            } else {
                currentRecord = line;
            }
            
            // Check if this line completes a record
            const quoteCount = (currentRecord.match(/"/g) || []).length;
            inQuotedField = quoteCount % 2 !== 0;
            
            // If we're not in a quoted field, try to parse the record
            if (!inQuotedField) {
                const values = this.parseCSVLine(currentRecord);
                
                // Check if we have the right number of fields (or close to it)
                if (values.length >= headers.length - 2) { // Allow some tolerance
                    // Create record
                    const record = {};
                    headers.forEach((header, index) => {
                        record[header] = values[index]?.trim() || '';
                    });
                    
                    // Only add records with valid employee numbers
                    if (record['EMP No'] && record['EMP No'] !== '' && record['EMP No'] !== 'EMP No' && /^\d+$/.test(record['EMP No'])) {
                        this.salaryData.push(record);
                        processedCount++;
                    } else {
                        console.log(`Skipped record with invalid EMP No: "${record['EMP No']}", Line: ${currentRecord.substring(0, 100)}`);
                        skippedCount++;
                    }
                    
                    currentRecord = '';
                } else {
                    // Not enough fields, might be a continuation
                    console.log(`Incomplete record, continuing... Fields: ${values.length}, Expected: ${headers.length}, Line: ${currentRecord.substring(0, 100)}`);
                }
            }
        }
        
        // Handle any remaining record
        if (currentRecord && !inQuotedField) {
            const values = this.parseCSVLine(currentRecord);
            if (values.length >= headers.length - 2) {
                const record = {};
                headers.forEach((header, index) => {
                    record[header] = values[index]?.trim() || '';
                });
                
                if (record['EMP No'] && record['EMP No'] !== '' && record['EMP No'] !== 'EMP No' && /^\d+$/.test(record['EMP No'])) {
                    this.salaryData.push(record);
                    processedCount++;
                } else {
                    skippedCount++;
                }
            }
        }
        
        console.log(`CSV parsing completed:`);
        console.log(`- Total records processed: ${processedCount}`);
        console.log(`- Records skipped: ${skippedCount}`);
        console.log(`- Final salary data length: ${this.salaryData.length}`);
        
        this.processData();
    }

    parseCSVLine(line) {
        const values = [];
        let current = '';
        let inQuotes = false;
        let i = 0;
        
        while (i < line.length) {
            const char = line[i];
            
            if (char === '"') {
                // Handle escaped quotes
                if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
                    current += '"';
                    i += 2;
                    continue;
                }
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                // Clean up the value and handle multiline fields
                let cleanValue = current.trim();
                // Remove any remaining quotes
                cleanValue = cleanValue.replace(/^"|"$/g, '');
                // Clean up multiline designation fields
                cleanValue = cleanValue.replace(/\s+/g, ' ').trim();
                values.push(cleanValue);
                current = '';
            } else {
                current += char;
            }
            i++;
        }
        
        // Handle the last value
        let cleanValue = current.trim();
        cleanValue = cleanValue.replace(/^"|"$/g, '');
        cleanValue = cleanValue.replace(/\s+/g, ' ').trim();
        values.push(cleanValue);
        return values;
    }

    processData() {
        this.processedData = {
            employees: {},
            yearSummary: {},
            monthSummary: {},
            totalEmployees: 0,
            years: new Set(),
            months: new Set()
        };

        this.salaryData.forEach(record => {
            const empNo = record['EMP No'];
            const year = record['Year'];
            const month = record['Month'];
            const name = record['Name'];
            const designation = record['Designation'];

            // Use existing calculated values from CSV
            const grossSalary = parseFloat(record['Gross Salary']?.replace(/,/g, '') || 0);
            const totalDeductions = parseFloat(record['Total Deductions']?.replace(/,/g, '') || 0);
            const netSalary = parseFloat(record['Net Salary']?.replace(/,/g, '') || 0);

            // Individual components for breakdown display
            const basic = parseFloat(record['Basic']?.replace(/,/g, '') || 0);
            const da = parseFloat(record['DA']?.replace(/,/g, '') || 0);
            const hra = parseFloat(record['HRA']?.replace(/,/g, '') || 0);
            const ir = parseFloat(record['IR']?.replace(/,/g, '') || 0);
            const sfn = parseFloat(record['SFN']?.replace(/,/g, '') || 0);
            const spayTypist = parseFloat(record['SPAY-TYPIST']?.replace(/,/g, '') || 0);
            const p = parseFloat(record['P']?.replace(/,/g, '') || 0);
            const it = parseFloat(record['IT']?.replace(/,/g, '') || 0);
            const pt = parseFloat(record['PT']?.replace(/,/g, '') || 0);
            const gslic = parseFloat(record['GSLIC']?.replace(/,/g, '') || 0);
            const lic = parseFloat(record['LIC']?.replace(/,/g, '') || 0);
            const fbf = parseFloat(record['FBF']?.replace(/,/g, '') || 0);

            // Employee data
            if (!this.processedData.employees[empNo]) {
                this.processedData.employees[empNo] = {
                    empNo,
                    name,
                    designation,
                    records: [],
                    totalNet: 0,
                    totalGross: 0,
                    avgNet: 0,
                    avgGross: 0
                };
            }

            this.processedData.employees[empNo].records.push({
                year,
                month,
                netSalary,
                grossSalary,
                totalDeductions,
                basic,
                da,
                hra,
                ir,
                sfn,
                spayTypist,
                p,
                it,
                pt,
                gslic,
                lic,
                fbf,
                record
            });

            this.processedData.employees[empNo].totalNet += netSalary;
            this.processedData.employees[empNo].totalGross += grossSalary;

            // Year summary
            if (!this.processedData.yearSummary[year]) {
                this.processedData.yearSummary[year] = {
                    totalNet: 0,
                    totalGross: 0,
                    totalDeductions: 0,
                    employeeCount: new Set(),
                    records: 0
                };
            }
            this.processedData.yearSummary[year].totalNet += netSalary;
            this.processedData.yearSummary[year].totalGross += grossSalary;
            this.processedData.yearSummary[year].totalDeductions += totalDeductions;
            this.processedData.yearSummary[year].employeeCount.add(empNo);
            this.processedData.yearSummary[year].records++;

            // Month summary
            const monthKey = `${year}-${month}`;
            if (!this.processedData.monthSummary[monthKey]) {
                this.processedData.monthSummary[monthKey] = {
                    year,
                    month,
                    totalNet: 0,
                    totalGross: 0,
                    totalDeductions: 0,
                    employeeCount: new Set(),
                    records: 0
                };
            }
            this.processedData.monthSummary[monthKey].totalNet += netSalary;
            this.processedData.monthSummary[monthKey].totalGross += grossSalary;
            this.processedData.monthSummary[monthKey].totalDeductions += totalDeductions;
            this.processedData.monthSummary[monthKey].employeeCount.add(empNo);
            this.processedData.monthSummary[monthKey].records++;

            this.processedData.years.add(year);
            this.processedData.months.add(month);
        });

        // Calculate averages for employees
        Object.values(this.processedData.employees).forEach(emp => {
            const recordCount = emp.records.length;
            emp.avgNet = emp.totalNet / recordCount;
            emp.avgGross = emp.totalGross / recordCount;
        });

        // Convert Sets to arrays and sort
        this.processedData.years = Array.from(this.processedData.years).sort();
        this.processedData.months = Array.from(this.processedData.months);
        this.processedData.totalEmployees = Object.keys(this.processedData.employees).length;

        console.log('Data processing completed:');
        console.log(`- Total employees: ${this.processedData.totalEmployees}`);
        console.log(`- Years: ${this.processedData.years.join(', ')}`);
        console.log(`- Months: ${this.processedData.months.join(', ')}`);
        console.log(`- Total salary records: ${this.salaryData.length}`);
        console.log('Sample employee data:', Object.values(this.processedData.employees)[0]);
    }

    showUploadSection() {
        this.hideAllSections();
        document.getElementById('uploadSection').style.display = 'block';
        this.currentView = 'upload';
    }

    showLogin() {
        this.hideAllSections();
        document.getElementById('loginSection').style.display = 'block';
        this.currentView = 'login';
        document.getElementById('empNo').focus();
    }

    showDashboard() {
        this.hideAllSections();
        document.getElementById('dashboardSection').style.display = 'block';
        document.getElementById('logoutBtn').style.display = 'block';
        this.currentView = 'dashboard';
        this.setupDashboardFilters();
        this.updateDashboard();
    }

    showEmployeeDetails(empNo) {
        this.hideAllSections();
        document.getElementById('employeeSection').style.display = 'block';
        document.getElementById('logoutBtn').style.display = 'block';
        this.currentView = 'employee';
        this.currentEmployee = empNo;
        this.updateEmployeeDetails();
    }

    hideAllSections() {
        document.getElementById('uploadSection').style.display = 'none';
        document.getElementById('loginSection').style.display = 'none';
        document.getElementById('dashboardSection').style.display = 'none';
        document.getElementById('employeeSection').style.display = 'none';
        document.getElementById('logoutBtn').style.display = 'none';
    }

    handleEmployeeLogin() {
        const empNo = document.getElementById('empNo').value.trim();
        
        if (!empNo) {
            alert('Please enter your employee number');
            return;
        }

        if (this.processedData.employees[empNo]) {
            this.showEmployeeDetails(empNo);
        } else {
            alert('Employee number not found. Please check and try again.');
        }
    }

    logout() {
        this.currentEmployee = null;
        document.getElementById('empNo').value = '';
        this.showLogin();
    }

    setupDashboardFilters() {
        const yearFilter = document.getElementById('yearFilter');
        const monthFilter = document.getElementById('monthFilter');

        // Clear existing options
        yearFilter.innerHTML = '<option value="">All Years</option>';
        monthFilter.innerHTML = '<option value="">All Months</option>';

        // Add year options
        this.processedData.years.forEach(year => {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = year;
            yearFilter.appendChild(option);
        });

        // Add month options
        this.processedData.months.forEach(month => {
            const option = document.createElement('option');
            option.value = month;
            option.textContent = month;
            monthFilter.appendChild(option);
        });
    }

    updateDashboard() {
        const selectedYear = document.getElementById('yearFilter').value;
        const selectedMonth = document.getElementById('monthFilter').value;
        
        this.renderMetrics(selectedYear, selectedMonth);
        this.renderCharts(selectedYear, selectedMonth);
    }

    renderMetrics(selectedYear, selectedMonth) {
        const metricsGrid = document.getElementById('metricsGrid');
        metricsGrid.innerHTML = '';

        // Filter data based on selection
        let filteredData = this.salaryData;
        
        if (selectedYear) {
            filteredData = filteredData.filter(record => record['Year'] === selectedYear);
        }
        
        if (selectedMonth) {
            filteredData = filteredData.filter(record => record['Month'] === selectedMonth);
        }

        // Calculate metrics using corrected formulas
        const totalRecords = filteredData.length;
        const uniqueEmployees = new Set(filteredData.map(r => r['EMP No'])).size;
        
        let totalNetSalary = 0;
        let totalGrossSalary = 0;
        let totalDeductions = 0;
        let totalIT = 0;
        let totalLIC = 0;

        filteredData.forEach(record => {
            // Use existing calculated values from CSV
            const grossSalary = parseFloat(record['Gross Salary']?.replace(/,/g, '') || 0);
            const deductions = parseFloat(record['Total Deductions']?.replace(/,/g, '') || 0);
            const netSalary = parseFloat(record['Net Salary']?.replace(/,/g, '') || 0);

            // Individual components for summary metrics
            const it = parseFloat(record['IT']?.replace(/,/g, '') || 0);
            const lic = parseFloat(record['LIC']?.replace(/,/g, '') || 0);

            totalGrossSalary += grossSalary;
            totalDeductions += deductions;
            totalNetSalary += netSalary;
            totalIT += it;
            totalLIC += lic;
        });

        // Create metric cards
        const metrics = [
            {
                title: 'Total Employees',
                value: this.formatIndianNumber(uniqueEmployees),
                change: null,
                class: 'primary'
            },
            {
                title: 'Total Gross Salary',
                value: `₹${this.formatIndianNumber(Math.round(totalGrossSalary))}`,
                change: null,
                class: 'secondary'
            },
            {
                title: 'Total Deductions',
                value: `₹${this.formatIndianNumber(Math.round(totalDeductions))}`,
                change: null,
                class: 'accent'
            },
            {
                title: 'Total Net Salary',
                value: `₹${this.formatIndianNumber(Math.round(totalNetSalary))}`,
                change: null,
                class: 'primary'
            },
            {
                title: 'Total IT',
                value: `₹${this.formatIndianNumber(Math.round(totalIT))}`,
                change: null,
                class: 'secondary'
            },
            {
                title: 'Total LIC',
                value: `₹${this.formatIndianNumber(Math.round(totalLIC))}`,
                change: null,
                class: 'accent'
            }
        ];

        metrics.forEach(metric => {
            const card = this.createMetricCard(metric);
            metricsGrid.appendChild(card);
        });

        // Update period display
        this.updatePeriodDisplay(filteredData, selectedYear, selectedMonth);
    }

    createMetricCard(metric) {
        const card = document.createElement('div');
        card.className = `metric-card ${metric.class}`;
        
        card.innerHTML = `
            <div class="metric-title">${metric.title}</div>
            <div class="metric-value">${metric.value}</div>
            ${metric.change ? `<div class="metric-change ${metric.change > 0 ? 'positive' : 'negative'}">
                <i class="fas fa-arrow-${metric.change > 0 ? 'up' : 'down'}"></i>
                ${Math.abs(metric.change)}%
            </div>` : ''}
        `;
        
        return card;
    }

    updatePeriodDisplay(filteredData, selectedYear, selectedMonth) {
        const periodDisplay = document.getElementById('periodDisplay');
        
        if (filteredData.length === 0) {
            periodDisplay.innerHTML = '<h3>No Data Available</h3>';
            return;
        }

        // Get date range
        const dates = filteredData.map(record => ({
            year: parseInt(record['Year']),
            month: record['Month'],
            monthNum: this.getMonthNumber(record['Month'])
        }));

        dates.sort((a, b) => {
            if (a.year !== b.year) return a.year - b.year;
            return a.monthNum - b.monthNum;
        });

        const startDate = dates[0];
        const endDate = dates[dates.length - 1];

        let periodText = '';
        if (selectedYear && selectedMonth) {
            periodText = `${selectedMonth} ${selectedYear}`;
        } else if (selectedYear) {
            periodText = `Year ${selectedYear}`;
        } else if (selectedMonth) {
            periodText = `${selectedMonth} (All Years)`;
        } else {
            periodText = `From ${startDate.month} ${startDate.year} To ${endDate.month} ${endDate.year}`;
        }

        periodDisplay.innerHTML = `
            <h3>Period: ${periodText}</h3>
            <div class="period-info">Total Records: ${filteredData.length}</div>
        `;
    }

    renderCharts(selectedYear, selectedMonth) {
        // Replace charts with consolidated data table
        this.renderConsolidatedData(selectedYear, selectedMonth);
    }

    renderConsolidatedData(selectedYear, selectedMonth) {
        const tableBody = document.getElementById('consolidatedTableBody');
        tableBody.innerHTML = '';

        // Group data by month-year
        const groupedData = {};
        
        let filteredData = this.salaryData;
        if (selectedYear) {
            filteredData = filteredData.filter(record => record['Year'] === selectedYear);
        }
        if (selectedMonth) {
            filteredData = filteredData.filter(record => record['Month'] === selectedMonth);
        }

        filteredData.forEach(record => {
            const key = `${record['Month']}-${record['Year']}`;
            if (!groupedData[key]) {
                groupedData[key] = {
                    month: record['Month'],
                    year: record['Year'],
                    records: [],
                    totalGross: 0,
                    totalDeductions: 0,
                    totalNet: 0,
                    employees: new Set()
                };
            }
            
            groupedData[key].records.push(record);
            
            // Use existing calculated values from CSV
            const grossSalary = parseFloat(record['Gross Salary']?.replace(/,/g, '') || 0);
            const totalDeductions = parseFloat(record['Total Deductions']?.replace(/,/g, '') || 0);
            const netSalary = parseFloat(record['Net Salary']?.replace(/,/g, '') || 0);
            
            groupedData[key].totalGross += grossSalary;
            groupedData[key].totalDeductions += totalDeductions;
            groupedData[key].totalNet += netSalary;
            groupedData[key].employees.add(record['EMP No']);
        });

        // Sort by year and month
        const sortedData = Object.values(groupedData).sort((a, b) => {
            if (a.year !== b.year) return b.year - a.year;
            return this.getMonthNumber(b.month) - this.getMonthNumber(a.month);
        });

        sortedData.forEach((monthData, index) => {
            const row = document.createElement('tr');
            row.className = 'period-row';
            row.dataset.periodKey = `${monthData.month}-${monthData.year}`;
            row.style.cursor = 'pointer';
            row.title = 'Click to view details';
            
            row.innerHTML = `
                <td>${monthData.month}</td>
                <td>${monthData.year}</td>
                <td>${this.formatIndianNumber(monthData.employees.size)}</td>
                <td>₹${this.formatIndianNumber(Math.round(monthData.totalGross))}</td>
                <td>₹${this.formatIndianNumber(Math.round(monthData.totalDeductions))}</td>
                <td>₹${this.formatIndianNumber(Math.round(monthData.totalNet))}</td>
            `;
            
            row.addEventListener('click', () => {
                this.togglePeriodDetails(`${monthData.month}-${monthData.year}`);
            });
            
            tableBody.appendChild(row);
        });
    }

    togglePeriodDetails(periodKey) {
        const existingDetailsRow = document.querySelector(`tr[data-details-for="${periodKey}"]`);
        const mainRow = document.querySelector(`tr[data-period-key="${periodKey}"]`);
        
        if (existingDetailsRow) {
            // Hide details
            existingDetailsRow.remove();
            mainRow.classList.remove('expanded');
        } else {
            // Close any other open details first
            this.closeAllPeriodDetails();
            // Show details
            this.showPeriodDetails(periodKey);
            mainRow.classList.add('expanded');
        }
    }

    closeAllPeriodDetails() {
        // Close all dashboard period details
        const allDetailsRows = document.querySelectorAll('tr[data-details-for]');
        const allExpandedRows = document.querySelectorAll('.period-row.expanded');
        
        allDetailsRows.forEach(row => row.remove());
        allExpandedRows.forEach(row => row.classList.remove('expanded'));
    }

    showPeriodDetails(periodKey) {
        const [month, year] = periodKey.split('-');
        const periodData = this.salaryData.filter(record => 
            record['Month'] === month && record['Year'] === year
        );

        // Calculate detailed metrics using corrected formulas
        const metrics = {
            totalEmployees: new Set(periodData.map(r => r['EMP No'])).size,
            totalBasic: 0,
            totalDA: 0,
            totalHRA: 0,
            totalIR: 0,
            totalSFN: 0,
            totalSpayTypist: 0,
            totalP: 0,
            totalGross: 0,
            totalIT: 0,
            totalPT: 0,
            totalGSLIC: 0,
            totalLIC: 0,
            totalFBF: 0,
            totalDeductions: 0,
            totalNet: 0
        };

        periodData.forEach(record => {
            // Get individual components from CSV
            const basic = parseFloat(record['Basic']?.replace(/,/g, '') || 0);
            const da = parseFloat(record['DA']?.replace(/,/g, '') || 0);
            const hra = parseFloat(record['HRA']?.replace(/,/g, '') || 0);
            const ir = parseFloat(record['IR']?.replace(/,/g, '') || 0);
            const sfn = parseFloat(record['SFN']?.replace(/,/g, '') || 0);
            const spayTypist = parseFloat(record['SPAY-TYPIST']?.replace(/,/g, '') || 0);
            const p = parseFloat(record['P']?.replace(/,/g, '') || 0);
            const it = parseFloat(record['IT']?.replace(/,/g, '') || 0);
            const pt = parseFloat(record['PT']?.replace(/,/g, '') || 0);
            const gslic = parseFloat(record['GSLIC']?.replace(/,/g, '') || 0);
            const lic = parseFloat(record['LIC']?.replace(/,/g, '') || 0);
            const fbf = parseFloat(record['FBF']?.replace(/,/g, '') || 0);

            // Use existing calculated values from CSV
            const grossSalary = parseFloat(record['Gross Salary']?.replace(/,/g, '') || 0);
            const totalDeductions = parseFloat(record['Total Deductions']?.replace(/,/g, '') || 0);
            const netSalary = parseFloat(record['Net Salary']?.replace(/,/g, '') || 0);

            // Add to totals
            metrics.totalBasic += basic;
            metrics.totalDA += da;
            metrics.totalHRA += hra;
            metrics.totalIR += ir;
            metrics.totalSFN += sfn;
            metrics.totalSpayTypist += spayTypist;
            metrics.totalP += p;
            metrics.totalGross += grossSalary;
            metrics.totalIT += it;
            metrics.totalPT += pt;
            metrics.totalGSLIC += gslic;
            metrics.totalLIC += lic;
            metrics.totalFBF += fbf;
            metrics.totalDeductions += totalDeductions;
            metrics.totalNet += netSalary;
        });

        const mainRow = document.querySelector(`tr[data-period-key="${periodKey}"]`);
        const detailsRow = document.createElement('tr');
        detailsRow.className = 'details-row';
        detailsRow.dataset.detailsFor = periodKey;
        
        detailsRow.innerHTML = `
            <td colspan="6">
                <div class="details-content">
                    <h4>Detailed Breakdown for ${month} ${year}</h4>
                    <div class="details-grid">
                        <div class="detail-item info-employees">
                            <div class="label">Total Employees</div>
                            <div class="value">${this.formatIndianNumber(metrics.totalEmployees)}</div>
                        </div>
                        <div class="detail-item allowance-basic">
                            <div class="label">Total Basic</div>
                            <div class="value">₹${this.formatIndianNumber(Math.round(metrics.totalBasic))}</div>
                        </div>
                        <div class="detail-item allowance-da">
                            <div class="label">Total DA</div>
                            <div class="value">₹${this.formatIndianNumber(Math.round(metrics.totalDA))}</div>
                        </div>
                        <div class="detail-item allowance-hra">
                            <div class="label">Total HRA</div>
                            <div class="value">₹${this.formatIndianNumber(Math.round(metrics.totalHRA))}</div>
                        </div>
                        <div class="detail-item allowance-other">
                            <div class="label">Total IR</div>
                            <div class="value">₹${this.formatIndianNumber(Math.round(metrics.totalIR))}</div>
                        </div>
                        <div class="detail-item allowance-other">
                            <div class="label">Total SFN</div>
                            <div class="value">₹${this.formatIndianNumber(Math.round(metrics.totalSFN))}</div>
                        </div>
                        <div class="detail-item allowance-other">
                            <div class="label">Total SPAY-TYPIST</div>
                            <div class="value">₹${this.formatIndianNumber(Math.round(metrics.totalSpayTypist))}</div>
                        </div>
                        <div class="detail-item allowance-other">
                            <div class="label">Total P</div>
                            <div class="value">₹${this.formatIndianNumber(Math.round(metrics.totalP))}</div>
                        </div>
                        <div class="detail-item total-gross">
                            <div class="label">Total Gross</div>
                            <div class="value">₹${this.formatIndianNumber(Math.round(metrics.totalGross))}</div>
                        </div>
                        <div class="detail-item deduction-tax">
                            <div class="label">Total IT</div>
                            <div class="value">₹${this.formatIndianNumber(Math.round(metrics.totalIT))}</div>
                        </div>
                        <div class="detail-item deduction-tax">
                            <div class="label">Total PT</div>
                            <div class="value">₹${this.formatIndianNumber(Math.round(metrics.totalPT))}</div>
                        </div>
                        <div class="detail-item deduction-insurance">
                            <div class="label">Total GSLIC</div>
                            <div class="value">₹${this.formatIndianNumber(Math.round(metrics.totalGSLIC))}</div>
                        </div>
                        <div class="detail-item deduction-insurance">
                            <div class="label">Total LIC</div>
                            <div class="value">₹${this.formatIndianNumber(Math.round(metrics.totalLIC))}</div>
                        </div>
                        <div class="detail-item deduction-other">
                            <div class="label">Total FBF</div>
                            <div class="value">₹${this.formatIndianNumber(Math.round(metrics.totalFBF))}</div>
                        </div>
                        <div class="detail-item total-deductions">
                            <div class="label">Total Deductions</div>
                            <div class="value">₹${this.formatIndianNumber(Math.round(metrics.totalDeductions))}</div>
                        </div>
                        <div class="detail-item total-net">
                            <div class="label">Total Net</div>
                            <div class="value">₹${this.formatIndianNumber(Math.round(metrics.totalNet))}</div>
                        </div>
                    </div>
                </div>
            </td>
        `;
        
        mainRow.insertAdjacentElement('afterend', detailsRow);
    }

    updateEmployeeDetails() {
        const employee = this.processedData.employees[this.currentEmployee];
        
        if (!employee) {
            alert('Employee data not found');
            this.showLogin();
            return;
        }

        // Update employee name with designation
        document.getElementById('employeeName').textContent = `${employee.name} (${employee.empNo}) - ${employee.designation}`;

        // Calculate additional metrics using stored values
        let totalDeductions = 0;
        let totalIT = 0;
        let totalLIC = 0;

        employee.records.forEach(record => {
            // Use stored values from when the record was processed
            totalDeductions += record.totalDeductions;
            totalIT += record.it;
            totalLIC += record.lic;
        });

        // Update employee metrics (without designation card)
        const employeeMetrics = document.getElementById('employeeMetrics');
        employeeMetrics.innerHTML = '';

        const metrics = [
            {
                title: 'Total Records',
                value: this.formatIndianNumber(employee.records.length),
                class: 'primary'
            },
            {
                title: 'Total Gross Salary',
                value: `₹${this.formatIndianNumber(Math.round(employee.totalGross))}`,
                class: 'secondary'
            },
            {
                title: 'Total Deductions',
                value: `₹${this.formatIndianNumber(Math.round(totalDeductions))}`,
                class: 'accent'
            },
            {
                title: 'Total Net Salary',
                value: `₹${this.formatIndianNumber(Math.round(employee.totalNet))}`,
                class: 'primary'
            },
            {
                title: 'Total IT',
                value: `₹${this.formatIndianNumber(Math.round(totalIT))}`,
                class: 'secondary'
            },
            {
                title: 'Total LIC',
                value: `₹${this.formatIndianNumber(Math.round(totalLIC))}`,
                class: 'accent'
            }
        ];

        metrics.forEach(metric => {
            const card = this.createMetricCard(metric);
            employeeMetrics.appendChild(card);
        });

        // Update salary history table with new design
        const tableBody = document.getElementById('employeeTableBody');
        tableBody.innerHTML = '';

        employee.records
            .sort((a, b) => {
                if (a.year !== b.year) return b.year - a.year;
                return this.getMonthNumber(b.month) - this.getMonthNumber(a.month);
            })
            .forEach(record => {
                const row = document.createElement('tr');
                row.className = 'employee-record-row';
                row.dataset.recordKey = `${record.month}-${record.year}`;
                row.style.cursor = 'pointer';
                row.title = 'Click to view details';
                
                row.innerHTML = `
                    <td>${record.month}</td>
                    <td>${record.year}</td>
                    <td>₹${this.formatIndianNumber(Math.round(record.grossSalary))}</td>
                    <td>₹${this.formatIndianNumber(Math.round(record.totalDeductions))}</td>
                    <td>₹${this.formatIndianNumber(Math.round(record.netSalary))}</td>
                `;
                
                row.addEventListener('click', () => {
                    this.toggleEmployeeRecordDetails(record);
                });
                
                tableBody.appendChild(row);
            });
    }

    toggleEmployeeRecordDetails(record) {
        const recordKey = `${record.month}-${record.year}`;
        const existingDetailsRow = document.querySelector(`tr[data-employee-details-for="${recordKey}"]`);
        const mainRow = document.querySelector(`tr[data-record-key="${recordKey}"]`);
        
        if (existingDetailsRow) {
            // Hide details
            existingDetailsRow.remove();
            mainRow.classList.remove('expanded');
        } else {
            // Close any other open details first
            this.closeAllEmployeeDetails();
            // Show details
            this.showEmployeeRecordDetails(record);
            mainRow.classList.add('expanded');
        }
    }

    closeAllEmployeeDetails() {
        // Close all employee record details
        const allDetailsRows = document.querySelectorAll('tr[data-employee-details-for]');
        const allExpandedRows = document.querySelectorAll('.employee-record-row.expanded');
        
        allDetailsRows.forEach(row => row.remove());
        allExpandedRows.forEach(row => row.classList.remove('expanded'));
    }

    showEmployeeRecordDetails(record) {
        const recordKey = `${record.month}-${record.year}`;
        const employee = this.processedData.employees[this.currentEmployee];
        
        // Use stored values from the record
        const metrics = {
            basic: record.basic,
            da: record.da,
            hra: record.hra,
            ir: record.ir,
            sfn: record.sfn,
            spayTypist: record.spayTypist,
            p: record.p,
            gross: record.grossSalary,
            it: record.it,
            pt: record.pt,
            gslic: record.gslic,
            lic: record.lic,
            fbf: record.fbf,
            totalDeductions: record.totalDeductions,
            net: record.netSalary
        };

        const mainRow = document.querySelector(`tr[data-record-key="${recordKey}"]`);
        const detailsRow = document.createElement('tr');
        detailsRow.className = 'details-row';
        detailsRow.dataset.employeeDetailsFor = recordKey;
        
        detailsRow.innerHTML = `
            <td colspan="5">
                <div class="details-content">
                    <h4>Detailed Breakdown for ${employee.name} - ${record.month} ${record.year}</h4>
                    <div class="details-grid">
                        <div class="detail-item info-designation">
                            <div class="label">Designation</div>
                            <div class="value">${employee.designation}</div>
                        </div>
                        <div class="detail-item allowance-basic">
                            <div class="label">Basic Salary</div>
                            <div class="value">₹${this.formatIndianNumber(Math.round(metrics.basic))}</div>
                        </div>
                        <div class="detail-item allowance-da">
                            <div class="label">DA</div>
                            <div class="value">₹${this.formatIndianNumber(Math.round(metrics.da))}</div>
                        </div>
                        <div class="detail-item allowance-hra">
                            <div class="label">HRA</div>
                            <div class="value">₹${this.formatIndianNumber(Math.round(metrics.hra))}</div>
                        </div>
                        <div class="detail-item allowance-other">
                            <div class="label">IR</div>
                            <div class="value">₹${this.formatIndianNumber(Math.round(metrics.ir))}</div>
                        </div>
                        <div class="detail-item allowance-other">
                            <div class="label">SFN</div>
                            <div class="value">₹${this.formatIndianNumber(Math.round(metrics.sfn))}</div>
                        </div>
                        <div class="detail-item allowance-other">
                            <div class="label">SPAY-TYPIST</div>
                            <div class="value">₹${this.formatIndianNumber(Math.round(metrics.spayTypist))}</div>
                        </div>
                        <div class="detail-item allowance-other">
                            <div class="label">P</div>
                            <div class="value">₹${this.formatIndianNumber(Math.round(metrics.p))}</div>
                        </div>
                        <div class="detail-item total-gross">
                            <div class="label">Gross Salary</div>
                            <div class="value">₹${this.formatIndianNumber(Math.round(metrics.gross))}</div>
                        </div>
                        <div class="detail-item deduction-tax">
                            <div class="label">IT</div>
                            <div class="value">₹${this.formatIndianNumber(Math.round(metrics.it))}</div>
                        </div>
                        <div class="detail-item deduction-tax">
                            <div class="label">PT</div>
                            <div class="value">₹${this.formatIndianNumber(Math.round(metrics.pt))}</div>
                        </div>
                        <div class="detail-item deduction-insurance">
                            <div class="label">GSLIC</div>
                            <div class="value">₹${this.formatIndianNumber(Math.round(metrics.gslic))}</div>
                        </div>
                        <div class="detail-item deduction-insurance">
                            <div class="label">LIC</div>
                            <div class="value">₹${this.formatIndianNumber(Math.round(metrics.lic))}</div>
                        </div>
                        <div class="detail-item deduction-other">
                            <div class="label">FBF</div>
                            <div class="value">₹${this.formatIndianNumber(Math.round(metrics.fbf))}</div>
                        </div>
                        <div class="detail-item total-deductions">
                            <div class="label">Total Deductions</div>
                            <div class="value">₹${this.formatIndianNumber(Math.round(metrics.totalDeductions))}</div>
                        </div>
                        <div class="detail-item total-net">
                            <div class="label">Net Salary</div>
                            <div class="value">₹${this.formatIndianNumber(Math.round(metrics.net))}</div>
                        </div>
                    </div>
                </div>
            </td>
        `;
        
        mainRow.insertAdjacentElement('afterend', detailsRow);
    }

    getMonthNumber(monthName) {
        const months = {
            'January': 1, 'February': 2, 'March': 3, 'April': 4,
            'May': 5, 'June': 6, 'July': 7, 'August': 8,
            'September': 9, 'October': 10, 'November': 11, 'December': 12
        };
        return months[monthName] || 0;
    }

    formatIndianNumber(number) {
        if (number === null || number === undefined || isNaN(number)) return '0';
        
        // Convert to string and handle decimal places
        const parts = Math.abs(number).toString().split('.');
        const integerPart = parts[0];
        const decimalPart = parts[1] ? '.' + parts[1] : '';
        
        // Indian number formatting
        let formatted = '';
        const length = integerPart.length;
        
        if (length <= 3) {
            formatted = integerPart;
        } else if (length <= 5) {
            formatted = integerPart.slice(0, length - 3) + ',' + integerPart.slice(-3);
        } else if (length <= 7) {
            formatted = integerPart.slice(0, length - 5) + ',' + integerPart.slice(length - 5, length - 3) + ',' + integerPart.slice(-3);
        } else if (length <= 9) {
            formatted = integerPart.slice(0, length - 7) + ',' + integerPart.slice(length - 7, length - 5) + ',' + integerPart.slice(length - 5, length - 3) + ',' + integerPart.slice(-3);
        } else {
            // For very large numbers, continue the pattern
            formatted = integerPart.slice(0, length - 9) + ',' + integerPart.slice(length - 9, length - 7) + ',' + integerPart.slice(length - 7, length - 5) + ',' + integerPart.slice(length - 5, length - 3) + ',' + integerPart.slice(-3);
        }
        
        return (number < 0 ? '-' : '') + formatted + decimalPart;
    }

    showLoading() {
        document.getElementById('loadingOverlay').style.display = 'flex';
    }

    hideLoading() {
        document.getElementById('loadingOverlay').style.display = 'none';
    }
}

// Initialize the app when DOM is loaded
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new SalaryBoardApp();
});