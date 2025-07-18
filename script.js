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
        const lines = csvText.split('\n');
        const headers = lines[0].split(',').map(h => h.trim());
        
        this.salaryData = [];
        
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            
            const values = this.parseCSVLine(line);
            if (values.length >= headers.length) {
                const record = {};
                headers.forEach((header, index) => {
                    record[header] = values[index]?.trim() || '';
                });
                
                // Only add records with valid employee numbers
                if (record['EMP No'] && record['EMP No'] !== '') {
                    this.salaryData.push(record);
                }
            }
        }
        
        this.processData();
    }

    parseCSVLine(line) {
        const values = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                values.push(current);
                current = '';
            } else {
                current += char;
            }
        }
        
        values.push(current);
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

            // Calculate Gross Salary: Basic + DA + HRA + IR + SFN + SPAY-TYPIST + P
            const basic = parseFloat(record['Basic']?.replace(/,/g, '') || 0);
            const da = parseFloat(record['DA']?.replace(/,/g, '') || 0);
            const hra = parseFloat(record['HRA']?.replace(/,/g, '') || 0);
            const ir = parseFloat(record['IR']?.replace(/,/g, '') || 0);
            const sfn = parseFloat(record['SFN']?.replace(/,/g, '') || 0);
            const spayTypist = parseFloat(record['SPAY-TYPIST']?.replace(/,/g, '') || 0);
            const p = parseFloat(record['P']?.replace(/,/g, '') || 0);
            const grossSalary = basic + da + hra + ir + sfn + spayTypist + p;

            // Calculate Total Deductions: IT + PT + GSLIC + LIC + FBF
            const it = parseFloat(record['IT']?.replace(/,/g, '') || 0);
            const pt = parseFloat(record['PT']?.replace(/,/g, '') || 0);
            const gslic = parseFloat(record['GSLIC']?.replace(/,/g, '') || 0);
            const lic = parseFloat(record['LIC']?.replace(/,/g, '') || 0);
            const fbf = parseFloat(record['FBF']?.replace(/,/g, '') || 0);
            const totalDeductions = it + pt + gslic + lic + fbf;

            // Net Salary = Gross Salary - Total Deductions
            const netSalary = grossSalary - totalDeductions;

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

        console.log('Processed data:', this.processedData);
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
            // Calculate Gross Salary: Basic + DA + HRA + IR + SFN + SPAY-TYPIST + P
            const basic = parseFloat(record['Basic']?.replace(/,/g, '') || 0);
            const da = parseFloat(record['DA']?.replace(/,/g, '') || 0);
            const hra = parseFloat(record['HRA']?.replace(/,/g, '') || 0);
            const ir = parseFloat(record['IR']?.replace(/,/g, '') || 0);
            const sfn = parseFloat(record['SFN']?.replace(/,/g, '') || 0);
            const spayTypist = parseFloat(record['SPAY-TYPIST']?.replace(/,/g, '') || 0);
            const p = parseFloat(record['P']?.replace(/,/g, '') || 0);
            const grossSalary = basic + da + hra + ir + sfn + spayTypist + p;

            // Calculate Total Deductions: IT + PT + GSLIC + LIC + FBF
            const it = parseFloat(record['IT']?.replace(/,/g, '') || 0);
            const pt = parseFloat(record['PT']?.replace(/,/g, '') || 0);
            const gslic = parseFloat(record['GSLIC']?.replace(/,/g, '') || 0);
            const lic = parseFloat(record['LIC']?.replace(/,/g, '') || 0);
            const fbf = parseFloat(record['FBF']?.replace(/,/g, '') || 0);
            const deductions = it + pt + gslic + lic + fbf;

            // Net Salary = Gross Salary - Total Deductions
            const netSalary = grossSalary - deductions;

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
                value: uniqueEmployees.toLocaleString(),
                change: null,
                class: 'primary'
            },
            {
                title: 'Total Gross Salary',
                value: `₹${Math.round(totalGrossSalary).toLocaleString()}`,
                change: null,
                class: 'secondary'
            },
            {
                title: 'Total Deductions',
                value: `₹${Math.round(totalDeductions).toLocaleString()}`,
                change: null,
                class: 'accent'
            },
            {
                title: 'Total Net Salary',
                value: `₹${Math.round(totalNetSalary).toLocaleString()}`,
                change: null,
                class: 'primary'
            },
            {
                title: 'Total IT',
                value: `₹${Math.round(totalIT).toLocaleString()}`,
                change: null,
                class: 'secondary'
            },
            {
                title: 'Total LIC',
                value: `₹${Math.round(totalLIC).toLocaleString()}`,
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
            
            // Calculate Gross Salary: Basic + DA + HRA + IR + SFN + SPAY-TYPIST + P
            const basic = parseFloat(record['Basic']?.replace(/,/g, '') || 0);
            const da = parseFloat(record['DA']?.replace(/,/g, '') || 0);
            const hra = parseFloat(record['HRA']?.replace(/,/g, '') || 0);
            const ir = parseFloat(record['IR']?.replace(/,/g, '') || 0);
            const sfn = parseFloat(record['SFN']?.replace(/,/g, '') || 0);
            const spayTypist = parseFloat(record['SPAY-TYPIST']?.replace(/,/g, '') || 0);
            const p = parseFloat(record['P']?.replace(/,/g, '') || 0);
            const grossSalary = basic + da + hra + ir + sfn + spayTypist + p;

            // Calculate Total Deductions: IT + PT + GSLIC + LIC + FBF
            const it = parseFloat(record['IT']?.replace(/,/g, '') || 0);
            const pt = parseFloat(record['PT']?.replace(/,/g, '') || 0);
            const gslic = parseFloat(record['GSLIC']?.replace(/,/g, '') || 0);
            const lic = parseFloat(record['LIC']?.replace(/,/g, '') || 0);
            const fbf = parseFloat(record['FBF']?.replace(/,/g, '') || 0);
            const totalDeductions = it + pt + gslic + lic + fbf;

            // Net Salary = Gross Salary - Total Deductions
            const netSalary = grossSalary - totalDeductions;
            
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
                <td>${monthData.employees.size}</td>
                <td>₹${Math.round(monthData.totalGross).toLocaleString()}</td>
                <td>₹${Math.round(monthData.totalDeductions).toLocaleString()}</td>
                <td>₹${Math.round(monthData.totalNet).toLocaleString()}</td>
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
            // Calculate individual components
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

            // Calculate Gross Salary: Basic + DA + HRA + IR + SFN + SPAY-TYPIST + P
            const grossSalary = basic + da + hra + ir + sfn + spayTypist + p;
            
            // Calculate Total Deductions: IT + PT + GSLIC + LIC + FBF
            const totalDeductions = it + pt + gslic + lic + fbf;
            
            // Net Salary = Gross Salary - Total Deductions
            const netSalary = grossSalary - totalDeductions;

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
                        <div class="detail-item">
                            <div class="label">Total Employees</div>
                            <div class="value">${metrics.totalEmployees}</div>
                        </div>
                        <div class="detail-item">
                            <div class="label">Total Basic</div>
                            <div class="value">₹${Math.round(metrics.totalBasic).toLocaleString()}</div>
                        </div>
                        <div class="detail-item">
                            <div class="label">Total DA</div>
                            <div class="value">₹${Math.round(metrics.totalDA).toLocaleString()}</div>
                        </div>
                        <div class="detail-item">
                            <div class="label">Total HRA</div>
                            <div class="value">₹${Math.round(metrics.totalHRA).toLocaleString()}</div>
                        </div>
                        <div class="detail-item">
                            <div class="label">Total IR</div>
                            <div class="value">₹${Math.round(metrics.totalIR).toLocaleString()}</div>
                        </div>
                        <div class="detail-item">
                            <div class="label">Total SFN</div>
                            <div class="value">₹${Math.round(metrics.totalSFN).toLocaleString()}</div>
                        </div>
                        <div class="detail-item">
                            <div class="label">Total SPAY-TYPIST</div>
                            <div class="value">₹${Math.round(metrics.totalSpayTypist).toLocaleString()}</div>
                        </div>
                        <div class="detail-item">
                            <div class="label">Total P</div>
                            <div class="value">₹${Math.round(metrics.totalP).toLocaleString()}</div>
                        </div>
                        <div class="detail-item">
                            <div class="label">Total Gross</div>
                            <div class="value">₹${Math.round(metrics.totalGross).toLocaleString()}</div>
                        </div>
                        <div class="detail-item">
                            <div class="label">Total IT</div>
                            <div class="value">₹${Math.round(metrics.totalIT).toLocaleString()}</div>
                        </div>
                        <div class="detail-item">
                            <div class="label">Total PT</div>
                            <div class="value">₹${Math.round(metrics.totalPT).toLocaleString()}</div>
                        </div>
                        <div class="detail-item">
                            <div class="label">Total GSLIC</div>
                            <div class="value">₹${Math.round(metrics.totalGSLIC).toLocaleString()}</div>
                        </div>
                        <div class="detail-item">
                            <div class="label">Total LIC</div>
                            <div class="value">₹${Math.round(metrics.totalLIC).toLocaleString()}</div>
                        </div>
                        <div class="detail-item">
                            <div class="label">Total FBF</div>
                            <div class="value">₹${Math.round(metrics.totalFBF).toLocaleString()}</div>
                        </div>
                        <div class="detail-item">
                            <div class="label">Total Deductions</div>
                            <div class="value">₹${Math.round(metrics.totalDeductions).toLocaleString()}</div>
                        </div>
                        <div class="detail-item">
                            <div class="label">Total Net</div>
                            <div class="value">₹${Math.round(metrics.totalNet).toLocaleString()}</div>
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

        // Calculate additional metrics using corrected formulas
        let totalDeductions = 0;
        let totalIT = 0;
        let totalLIC = 0;

        employee.records.forEach(record => {
            // Calculate Total Deductions: IT + PT + GSLIC + LIC + FBF
            const it = parseFloat(record.record['IT']?.replace(/,/g, '') || 0);
            const pt = parseFloat(record.record['PT']?.replace(/,/g, '') || 0);
            const gslic = parseFloat(record.record['GSLIC']?.replace(/,/g, '') || 0);
            const lic = parseFloat(record.record['LIC']?.replace(/,/g, '') || 0);
            const fbf = parseFloat(record.record['FBF']?.replace(/,/g, '') || 0);
            const deductions = it + pt + gslic + lic + fbf;

            totalDeductions += deductions;
            totalIT += it;
            totalLIC += lic;
        });

        // Update employee metrics (without designation card)
        const employeeMetrics = document.getElementById('employeeMetrics');
        employeeMetrics.innerHTML = '';

        const metrics = [
            {
                title: 'Total Records',
                value: employee.records.length.toLocaleString(),
                class: 'primary'
            },
            {
                title: 'Total Gross Salary',
                value: `₹${employee.totalGross.toLocaleString()}`,
                class: 'secondary'
            },
            {
                title: 'Total Deductions',
                value: `₹${totalDeductions.toLocaleString()}`,
                class: 'accent'
            },
            {
                title: 'Total Net Salary',
                value: `₹${employee.totalNet.toLocaleString()}`,
                class: 'primary'
            },
            {
                title: 'Total IT',
                value: `₹${totalIT.toLocaleString()}`,
                class: 'secondary'
            },
            {
                title: 'Total LIC',
                value: `₹${totalLIC.toLocaleString()}`,
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
                    <td>₹${Math.round(record.grossSalary).toLocaleString()}</td>
                    <td>₹${Math.round(record.totalDeductions).toLocaleString()}</td>
                    <td>₹${Math.round(record.netSalary).toLocaleString()}</td>
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
        
        // Extract detailed salary components using corrected formulas
        const salaryData = record.record;
        const basic = parseFloat(salaryData['Basic']?.replace(/,/g, '') || 0);
        const da = parseFloat(salaryData['DA']?.replace(/,/g, '') || 0);
        const hra = parseFloat(salaryData['HRA']?.replace(/,/g, '') || 0);
        const ir = parseFloat(salaryData['IR']?.replace(/,/g, '') || 0);
        const sfn = parseFloat(salaryData['SFN']?.replace(/,/g, '') || 0);
        const spayTypist = parseFloat(salaryData['SPAY-TYPIST']?.replace(/,/g, '') || 0);
        const p = parseFloat(salaryData['P']?.replace(/,/g, '') || 0);
        const it = parseFloat(salaryData['IT']?.replace(/,/g, '') || 0);
        const pt = parseFloat(salaryData['PT']?.replace(/,/g, '') || 0);
        const gslic = parseFloat(salaryData['GSLIC']?.replace(/,/g, '') || 0);
        const lic = parseFloat(salaryData['LIC']?.replace(/,/g, '') || 0);
        const fbf = parseFloat(salaryData['FBF']?.replace(/,/g, '') || 0);

        const metrics = {
            basic,
            da,
            hra,
            ir,
            sfn,
            spayTypist,
            p,
            gross: basic + da + hra + ir + sfn + spayTypist + p, // Calculated Gross
            it,
            pt,
            gslic,
            lic,
            fbf,
            totalDeductions: it + pt + gslic + lic + fbf, // Calculated Total Deductions
            net: (basic + da + hra + ir + sfn + spayTypist + p) - (it + pt + gslic + lic + fbf) // Calculated Net
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
                        <div class="detail-item">
                            <div class="label">Designation</div>
                            <div class="value">${employee.designation}</div>
                        </div>
                        <div class="detail-item">
                            <div class="label">Basic Salary</div>
                            <div class="value">₹${Math.round(metrics.basic).toLocaleString()}</div>
                        </div>
                        <div class="detail-item">
                            <div class="label">DA</div>
                            <div class="value">₹${Math.round(metrics.da).toLocaleString()}</div>
                        </div>
                        <div class="detail-item">
                            <div class="label">HRA</div>
                            <div class="value">₹${Math.round(metrics.hra).toLocaleString()}</div>
                        </div>
                        <div class="detail-item">
                            <div class="label">IR</div>
                            <div class="value">₹${Math.round(metrics.ir).toLocaleString()}</div>
                        </div>
                        <div class="detail-item">
                            <div class="label">SFN</div>
                            <div class="value">₹${Math.round(metrics.sfn).toLocaleString()}</div>
                        </div>
                        <div class="detail-item">
                            <div class="label">SPAY-TYPIST</div>
                            <div class="value">₹${Math.round(metrics.spayTypist).toLocaleString()}</div>
                        </div>
                        <div class="detail-item">
                            <div class="label">P</div>
                            <div class="value">₹${Math.round(metrics.p).toLocaleString()}</div>
                        </div>
                        <div class="detail-item">
                            <div class="label">Gross Salary</div>
                            <div class="value">₹${Math.round(metrics.gross).toLocaleString()}</div>
                        </div>
                        <div class="detail-item">
                            <div class="label">IT</div>
                            <div class="value">₹${Math.round(metrics.it).toLocaleString()}</div>
                        </div>
                        <div class="detail-item">
                            <div class="label">PT</div>
                            <div class="value">₹${Math.round(metrics.pt).toLocaleString()}</div>
                        </div>
                        <div class="detail-item">
                            <div class="label">GSLIC</div>
                            <div class="value">₹${Math.round(metrics.gslic).toLocaleString()}</div>
                        </div>
                        <div class="detail-item">
                            <div class="label">LIC</div>
                            <div class="value">₹${Math.round(metrics.lic).toLocaleString()}</div>
                        </div>
                        <div class="detail-item">
                            <div class="label">FBF</div>
                            <div class="value">₹${Math.round(metrics.fbf).toLocaleString()}</div>
                        </div>
                        <div class="detail-item">
                            <div class="label">Total Deductions</div>
                            <div class="value">₹${Math.round(metrics.totalDeductions).toLocaleString()}</div>
                        </div>
                        <div class="detail-item">
                            <div class="label">Net Salary</div>
                            <div class="value">₹${Math.round(metrics.net).toLocaleString()}</div>
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