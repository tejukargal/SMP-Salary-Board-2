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

    abbreviateDesignation(designation) {
        const abbreviations = {
            'Second Division Assistant': 'SDA',
            'Assistant': 'Asst',
            'Senior Assistant': 'Sr Asst',
            'Superintendent': 'Supdt',
            'Assistant Superintendent': 'Asst Supdt',
            'Deputy Superintendent': 'Dy Supdt',
            'Junior Assistant': 'Jr Asst',
            'Clerk': 'Clerk',
            'Senior Clerk': 'Sr Clerk',
            'Head Clerk': 'Head Clerk',
            'Office Assistant': 'Office Asst',
            'Computer Operator': 'Comp Op',
            'Data Entry Operator': 'DEO',
            'Stenographer': 'Steno',
            'Junior Stenographer': 'Jr Steno',
            'Senior Stenographer': 'Sr Steno',
            'Typist': 'Typist',
            'Senior Typist': 'Sr Typist',
            'Manager': 'Mgr',
            'Assistant Manager': 'Asst Mgr',
            'Deputy Manager': 'Dy Mgr',
            'General Manager': 'GM',
            'Executive': 'Exec',
            'Senior Executive': 'Sr Exec',
            'Chief Executive': 'Chief Exec',
            'Officer': 'Officer',
            'Senior Officer': 'Sr Officer',
            'Assistant Officer': 'Asst Officer',
            'Junior Officer': 'Jr Officer',
            'Accountant': 'Accountant',
            'Senior Accountant': 'Sr Accountant',
            'Chief Accountant': 'Chief Acc',
            'Cashier': 'Cashier',
            'Auditor': 'Auditor',
            'Internal Auditor': 'Int Auditor',
            'Supervisor': 'Supervisor',
            'Team Leader': 'TL',
            'Project Manager': 'PM',
            'Technical Assistant': 'Tech Asst',
            'Laboratory Assistant': 'Lab Asst',
            'Field Assistant': 'Field Asst',
            'Research Assistant': 'Research Asst',
            'Administrative Officer': 'Admin Officer',
            'Personnel Officer': 'Personnel Off',
            'Finance Officer': 'Finance Off',
            'Accounts Officer': 'Accounts Off',
            'Security Officer': 'Security Off',
            'Welfare Officer': 'Welfare Off',
            'Training Officer': 'Training Off',
            'Public Relations Officer': 'PRO',
            'Information Officer': 'Info Officer',
            'Development Officer': 'Dev Officer',
            'Program Officer': 'Program Off',
            'Field Officer': 'Field Officer',
            'Extension Officer': 'Ext Officer',
            'Technical Officer': 'Tech Officer',
            'Medical Officer': 'MO',
            'Veterinary Officer': 'VO',
            'Engineer': 'Engr',
            'Assistant Engineer': 'AE',
            'Executive Engineer': 'EE',
            'Superintending Engineer': 'SE',
            'Chief Engineer': 'CE',
            'Junior Engineer': 'JE',
            'Sub Engineer': 'Sub Engr',
            'Overseer': 'Overseer',
            'Foreman': 'Foreman',
            'Technician': 'Tech',
            'Senior Technician': 'Sr Tech',
            'Laboratory Technician': 'Lab Tech',
            'Computer Technician': 'Comp Tech',
            'Electrician': 'Electrician',
            'Mechanic': 'Mechanic',
            'Driver': 'Driver',
            'Peon': 'Peon',
            'Watchman': 'Watchman',
            'Sweeper': 'Sweeper',
            'Mali': 'Mali',
            'Cook': 'Cook',
            'Attendant': 'Attendant'
        };
        
        return abbreviations[designation] || designation;
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
            
            // Additional employee information
            const nextIncrementDate = record['Next Increment Date'] || '';
            const group = record['Group'] || '';
            const bankAc = record['Bank A/C Number'] || '';

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
                nextIncrementDate,
                group,
                bankAc,
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
        
        // Individual allowance components
        let totalBasic = 0;
        let totalDA = 0;
        let totalHRA = 0;
        let totalIR = 0;
        let totalSFN = 0;
        let totalSpayTypist = 0;
        let totalP = 0;
        
        // Individual deduction components
        let totalIT = 0;
        let totalPT = 0;
        let totalGSLIC = 0;
        let totalLIC = 0;
        let totalFBF = 0;

        filteredData.forEach(record => {
            // Use existing calculated values from CSV
            const grossSalary = parseFloat(record['Gross Salary']?.replace(/,/g, '') || 0);
            const deductions = parseFloat(record['Total Deductions']?.replace(/,/g, '') || 0);
            const netSalary = parseFloat(record['Net Salary']?.replace(/,/g, '') || 0);

            // Individual allowance components
            const basic = parseFloat(record['Basic']?.replace(/,/g, '') || 0);
            const da = parseFloat(record['DA']?.replace(/,/g, '') || 0);
            const hra = parseFloat(record['HRA']?.replace(/,/g, '') || 0);
            const ir = parseFloat(record['IR']?.replace(/,/g, '') || 0);
            const sfn = parseFloat(record['SFN']?.replace(/,/g, '') || 0);
            const spayTypist = parseFloat(record['SPAY-TYPIST']?.replace(/,/g, '') || 0);
            const p = parseFloat(record['P']?.replace(/,/g, '') || 0);
            
            // Individual deduction components
            const it = parseFloat(record['IT']?.replace(/,/g, '') || 0);
            const pt = parseFloat(record['PT']?.replace(/,/g, '') || 0);
            const gslic = parseFloat(record['GSLIC']?.replace(/,/g, '') || 0);
            const lic = parseFloat(record['LIC']?.replace(/,/g, '') || 0);
            const fbf = parseFloat(record['FBF']?.replace(/,/g, '') || 0);

            totalGrossSalary += grossSalary;
            totalDeductions += deductions;
            totalNetSalary += netSalary;
            
            // Add allowances
            totalBasic += basic;
            totalDA += da;
            totalHRA += hra;
            totalIR += ir;
            totalSFN += sfn;
            totalSpayTypist += spayTypist;
            totalP += p;
            
            // Add deductions
            totalIT += it;
            totalPT += pt;
            totalGSLIC += gslic;
            totalLIC += lic;
            totalFBF += fbf;
        });

        // Create single comprehensive metric card with compact individual cards
        const comprehensiveCard = this.createComprehensiveMetricCard({
            employees: uniqueEmployees,
            totalRecords: totalRecords,
            grossSalary: totalGrossSalary,
            deductions: totalDeductions,
            netSalary: totalNetSalary,
            // Allowances
            basic: totalBasic,
            da: totalDA,
            hra: totalHRA,
            ir: totalIR,
            sfn: totalSFN,
            spayTypist: totalSpayTypist,
            p: totalP,
            // Deductions
            it: totalIT,
            pt: totalPT,
            gslic: totalGSLIC,
            lic: totalLIC,
            fbf: totalFBF
        });

        metricsGrid.appendChild(comprehensiveCard);

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

    createComprehensiveMetricCard(data) {
        const card = document.createElement('div');
        card.className = 'comprehensive-metric-card';
        
        card.innerHTML = `
            <div class="comprehensive-header">
                <h3>Salary Summary Overview</h3>
                <div class="period-info">${data.employees} Employees • ${data.totalRecords} Records</div>
            </div>
            
            <div class="comprehensive-content">
                <div class="summary-section">
                    <div class="summary-item primary">
                        <div class="summary-label">Total Net Salary</div>
                        <div class="summary-value">₹${this.formatIndianNumber(Math.round(data.netSalary))}</div>
                    </div>
                    <div class="summary-item secondary clickable-breakdown" data-breakdown-type="allowances">
                        <div class="summary-label">Total Gross Salary</div>
                        <div class="summary-value">₹${this.formatIndianNumber(Math.round(data.grossSalary))}</div>
                        <div class="breakdown-hint">Click to view allowances breakdown</div>
                    </div>
                    <div class="summary-item accent clickable-breakdown" data-breakdown-type="deductions">
                        <div class="summary-label">Total Deductions</div>
                        <div class="summary-value">₹${this.formatIndianNumber(Math.round(data.deductions))}</div>
                        <div class="breakdown-hint">Click to view deductions breakdown</div>
                    </div>
                </div>
            </div>
        `;
        
        // Add click event listeners for breakdown functionality
        card.addEventListener('click', (e) => {
            const breakdownCard = e.target.closest('.clickable-breakdown');
            if (breakdownCard) {
                const breakdownType = breakdownCard.dataset.breakdownType;
                this.showDashboardBreakdown(breakdownType, data);
            }
        });
        
        return card;
    }

    showDashboardBreakdown(breakdownType, data) {
        // Create breakdown modal similar to monthly breakdown
        const modal = document.createElement('div');
        modal.className = 'breakdown-modal';
        
        let title, items;
        if (breakdownType === 'allowances') {
            title = 'Allowances Breakdown';
            items = [
                { label: 'Basic', value: data.basic },
                { label: 'DA', value: data.da },
                { label: 'HRA', value: data.hra },
                { label: 'IR', value: data.ir },
                { label: 'SFN', value: data.sfn },
                { label: 'SPAY', value: data.spayTypist },
                { label: 'P', value: data.p }
            ];
        } else {
            title = 'Deductions Breakdown';
            items = [
                { label: 'IT', value: data.it },
                { label: 'PT', value: data.pt },
                { label: 'GSLIC', value: data.gslic },
                { label: 'LIC', value: data.lic },
                { label: 'FBF', value: data.fbf }
            ];
        }

        modal.innerHTML = `
            <div class="breakdown-content">
                <div class="breakdown-header">
                    <div class="breakdown-title-section">
                        <h3>${title}</h3>
                    </div>
                    <button class="close-breakdown" aria-label="Close">&times;</button>
                </div>
                
                <div class="breakdown-text">
                    <div class="breakdown-summary">
                        <div class="summary-line total">
                            <span class="summary-label">Total ${breakdownType === 'allowances' ? 'Gross Salary' : 'Deductions'}</span>
                            <span class="summary-value">₹${this.formatIndianNumber(Math.round(breakdownType === 'allowances' ? data.grossSalary : data.deductions))}</span>
                        </div>
                    </div>
                    
                    <div class="breakdown-separator"></div>
                    
                    <div class="breakdown-sections">
                        <div class="breakdown-section">
                            <h4 class="section-title">${breakdownType === 'allowances' ? 'Individual Allowances' : 'Individual Deductions'}</h4>
                            <div class="section-content">
                                ${items.map(item => `
                                    <div class="breakdown-line">
                                        <span class="breakdown-label">${item.label}</span>
                                        <span class="breakdown-value">₹${this.formatIndianNumber(Math.round(item.value))}</span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                </div>
                <div class="breakdown-footer">
                    <button class="close-breakdown-footer" aria-label="Close Modal">
                        Close
                    </button>
                </div>
            </div>
            <div class="breakdown-overlay"></div>
        `;

        document.body.appendChild(modal);

        // Close modal functionality
        const closeBtn = modal.querySelector('.close-breakdown');
        const closeFooterBtn = modal.querySelector('.close-breakdown-footer');
        const overlay = modal.querySelector('.breakdown-overlay');
        
        const closeModal = () => {
            document.body.removeChild(modal);
        };

        closeBtn.addEventListener('click', closeModal);
        closeFooterBtn.addEventListener('click', closeModal);
        overlay.addEventListener('click', closeModal);
        
        // Close on Escape key
        const escapeHandler = (e) => {
            if (e.key === 'Escape') {
                closeModal();
                document.removeEventListener('keydown', escapeHandler);
            }
        };
        document.addEventListener('keydown', escapeHandler);
    }

    createEmployeeComprehensiveMetricCard(data) {
        const card = document.createElement('div');
        card.className = 'comprehensive-metric-card';
        
        card.innerHTML = `
            <div class="comprehensive-content">
                <div class="summary-section">
                    <div class="summary-item primary">
                        <div class="summary-label">Total Net Salary</div>
                        <div class="summary-value">₹${this.formatIndianNumber(Math.round(data.netSalary))}</div>
                    </div>
                    <div class="summary-item secondary clickable-breakdown" data-breakdown-type="allowances">
                        <div class="summary-label">Total Gross Salary</div>
                        <div class="summary-value">₹${this.formatIndianNumber(Math.round(data.grossSalary))}</div>
                        <div class="breakdown-hint">Click to view allowances breakdown</div>
                    </div>
                    <div class="summary-item accent clickable-breakdown" data-breakdown-type="deductions">
                        <div class="summary-label">Total Deductions</div>
                        <div class="summary-value">₹${this.formatIndianNumber(Math.round(data.deductions))}</div>
                        <div class="breakdown-hint">Click to view deductions breakdown</div>
                    </div>
                </div>
            </div>
        `;
        
        // Add click event listeners for breakdown functionality
        card.addEventListener('click', (e) => {
            const breakdownCard = e.target.closest('.clickable-breakdown');
            if (breakdownCard) {
                const breakdownType = breakdownCard.dataset.breakdownType;
                this.showEmployeeBreakdown(breakdownType, data);
            }
        });
        
        return card;
    }

    showEmployeeBreakdown(breakdownType, data) {
        // Create breakdown modal similar to dashboard breakdown
        const modal = document.createElement('div');
        modal.className = 'breakdown-modal';
        
        let title, items;
        if (breakdownType === 'allowances') {
            title = `${breakdownType === 'allowances' ? 'Allowances' : 'Deductions'} Breakdown`;
            
            // Calculate DA and HRA percentages based on rounded amounts
            const roundedBasic = Math.round(data.basic);
            const roundedDA = Math.round(data.da);
            const roundedHRA = Math.round(data.hra);
            const daPercentage = roundedBasic > 0 ? ((roundedDA / roundedBasic) * 100).toFixed(2) : 0;
            const hraPercentage = roundedBasic > 0 ? ((roundedHRA / roundedBasic) * 100).toFixed(2) : 0;
            
            items = [
                { label: 'Basic', value: data.basic },
                { label: 'DA', value: data.da, percentage: daPercentage },
                { label: 'HRA', value: data.hra, percentage: hraPercentage },
                { label: 'IR', value: data.ir },
                { label: 'SFN', value: data.sfn },
                { label: 'SPAY', value: data.spayTypist },
                { label: 'P', value: data.p }
            ];
        } else {
            title = `${breakdownType === 'allowances' ? 'Allowances' : 'Deductions'} Breakdown`;
            items = [
                { label: 'IT', value: data.it },
                { label: 'PT', value: data.pt },
                { label: 'GSLIC', value: data.gslic },
                { label: 'LIC', value: data.lic },
                { label: 'FBF', value: data.fbf }
            ];
        }

        modal.innerHTML = `
            <div class="breakdown-content">
                <div class="breakdown-header">
                    <div class="breakdown-title-section">
                        <h3>${data.employee.name}</h3>
                    </div>
                    <button class="close-breakdown" aria-label="Close">&times;</button>
                </div>
                
                <div class="breakdown-text">
                    <div class="breakdown-summary">
                        <div class="summary-line total">
                            <span class="summary-label">Total ${breakdownType === 'allowances' ? 'Gross Salary' : 'Deductions'}</span>
                            <span class="summary-value">₹${this.formatIndianNumber(Math.round(breakdownType === 'allowances' ? data.grossSalary : data.deductions))}</span>
                        </div>
                    </div>
                    
                    <div class="breakdown-separator"></div>
                    
                    <div class="breakdown-sections">
                        <div class="breakdown-section">
                            <h4 class="section-title">${breakdownType === 'allowances' ? 'Individual Allowances' : 'Individual Deductions'}</h4>
                            <div class="section-content">
                                ${items.map(item => `
                                    <div class="breakdown-line-horizontal">
                                        <span class="breakdown-item-text">
                                            ${item.label} - ₹${this.formatIndianNumber(Math.round(item.value))}${item.percentage ? ` (${item.percentage}%)` : ''}
                                        </span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                </div>
                <div class="breakdown-footer">
                    <button class="close-breakdown-footer" aria-label="Close Modal">
                        Close
                    </button>
                </div>
            </div>
            <div class="breakdown-overlay"></div>
        `;

        document.body.appendChild(modal);

        // Close modal functionality
        const closeBtn = modal.querySelector('.close-breakdown');
        const closeFooterBtn = modal.querySelector('.close-breakdown-footer');
        const overlay = modal.querySelector('.breakdown-overlay');
        
        const closeModal = () => {
            document.body.removeChild(modal);
        };

        closeBtn.addEventListener('click', closeModal);
        closeFooterBtn.addEventListener('click', closeModal);
        overlay.addEventListener('click', closeModal);
        
        // Close on Escape key
        const escapeHandler = (e) => {
            if (e.key === 'Escape') {
                closeModal();
                document.removeEventListener('keydown', escapeHandler);
            }
        };
        document.addEventListener('keydown', escapeHandler);
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
        // Replace charts with compact metric cards
        this.renderCompactMonthlyCards(selectedYear, selectedMonth);
    }

    renderCompactMonthlyCards(selectedYear, selectedMonth) {
        const cardsContainer = document.getElementById('monthlyCardsContainer');
        cardsContainer.innerHTML = '';

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

        sortedData.forEach((monthData) => {
            const card = this.createMonthlyMetricCard(monthData);
            cardsContainer.appendChild(card);
        });
    }

    createMonthlyMetricCard(monthData) {
        const card = document.createElement('div');
        card.className = 'monthly-unified-card';
        card.dataset.periodKey = `${monthData.month}-${monthData.year}`;
        
        card.innerHTML = `
            <div class="card-header">
                <div class="header-content">
                    <div class="title-section">
                        <h3 class="period-title">${monthData.month} ${monthData.year}</h3>
                        <span class="employee-count">${monthData.employees.size} employees</span>
                    </div>
                </div>
            </div>
            <div class="unified-metrics">
                <div class="metric-row">
                    <span class="metric-type">Gross:</span>
                    <span class="metric-value gross-value">₹${this.formatIndianNumber(Math.round(monthData.totalGross))}</span>
                </div>
                <div class="metric-row">
                    <span class="metric-type">Deductions:</span>
                    <span class="metric-value deductions-value">₹${this.formatIndianNumber(Math.round(monthData.totalDeductions))}</span>
                </div>
                <div class="metric-row">
                    <span class="metric-type">Net:</span>
                    <span class="metric-value net-value">₹${this.formatIndianNumber(Math.round(monthData.totalNet))}</span>
                </div>
            </div>
        `;
        
        card.addEventListener('click', () => {
            this.showMonthlyBreakdown(monthData);
        });
        
        return card;
    }

    showMonthlyBreakdown(monthData) {
        // Calculate detailed breakdown
        let breakdown = {
            basic: 0, da: 0, hra: 0, ir: 0, sfn: 0, spayTypist: 0, p: 0,
            it: 0, pt: 0, gslic: 0, lic: 0, fbf: 0
        };

        monthData.records.forEach(record => {
            breakdown.basic += parseFloat(record['Basic']?.replace(/,/g, '') || 0);
            breakdown.da += parseFloat(record['DA']?.replace(/,/g, '') || 0);
            breakdown.hra += parseFloat(record['HRA']?.replace(/,/g, '') || 0);
            breakdown.ir += parseFloat(record['IR']?.replace(/,/g, '') || 0);
            breakdown.sfn += parseFloat(record['SFN']?.replace(/,/g, '') || 0);
            breakdown.spayTypist += parseFloat(record['SPAY-TYPIST']?.replace(/,/g, '') || 0);
            breakdown.p += parseFloat(record['P']?.replace(/,/g, '') || 0);
            breakdown.it += parseFloat(record['IT']?.replace(/,/g, '') || 0);
            breakdown.pt += parseFloat(record['PT']?.replace(/,/g, '') || 0);
            breakdown.gslic += parseFloat(record['GSLIC']?.replace(/,/g, '') || 0);
            breakdown.lic += parseFloat(record['LIC']?.replace(/,/g, '') || 0);
            breakdown.fbf += parseFloat(record['FBF']?.replace(/,/g, '') || 0);
        });

        // Create breakdown modal
        const modal = document.createElement('div');
        modal.className = 'breakdown-modal';
        modal.innerHTML = `
            <div class="breakdown-content">
                <div class="breakdown-header">
                    <div class="breakdown-title-section">
                        <h3>${monthData.month} ${monthData.year}</h3>
                    </div>
                    <button class="close-breakdown" aria-label="Close">&times;</button>
                </div>
                
                <div class="breakdown-text">
                    <div class="breakdown-summary">
                        <div class="summary-line">
                            <span class="summary-label">Total Gross Salary</span>
                            <span class="summary-value">₹${this.formatIndianNumber(Math.round(monthData.totalGross))}</span>
                        </div>
                        <div class="summary-line">
                            <span class="summary-label">Total Deductions</span>
                            <span class="summary-value">₹${this.formatIndianNumber(Math.round(monthData.totalDeductions))}</span>
                        </div>
                        <div class="summary-line total">
                            <span class="summary-label">Net Salary</span>
                            <span class="summary-value">₹${this.formatIndianNumber(Math.round(monthData.totalNet))}</span>
                        </div>
                    </div>
                    
                    <div class="breakdown-separator"></div>
                    
                    <div class="breakdown-sections">
                        <div class="breakdown-section">
                            <h4 class="section-title">Allowances</h4>
                            <div class="section-content">
                                <div class="breakdown-line">
                                    <span class="breakdown-label">Basic</span>
                                    <span class="breakdown-value">₹${this.formatIndianNumber(Math.round(breakdown.basic))}</span>
                                </div>
                                <div class="breakdown-line">
                                    <span class="breakdown-label">DA</span>
                                    <span class="breakdown-value">₹${this.formatIndianNumber(Math.round(breakdown.da))}</span>
                                </div>
                                <div class="breakdown-line">
                                    <span class="breakdown-label">HRA</span>
                                    <span class="breakdown-value">₹${this.formatIndianNumber(Math.round(breakdown.hra))}</span>
                                </div>
                                <div class="breakdown-line">
                                    <span class="breakdown-label">IR</span>
                                    <span class="breakdown-value">₹${this.formatIndianNumber(Math.round(breakdown.ir))}</span>
                                </div>
                                <div class="breakdown-line">
                                    <span class="breakdown-label">SFN</span>
                                    <span class="breakdown-value">₹${this.formatIndianNumber(Math.round(breakdown.sfn))}</span>
                                </div>
                                <div class="breakdown-line">
                                    <span class="breakdown-label">SP-Typist</span>
                                    <span class="breakdown-value">₹${this.formatIndianNumber(Math.round(breakdown.spayTypist))}</span>
                                </div>
                                <div class="breakdown-line">
                                    <span class="breakdown-label">P Allow</span>
                                    <span class="breakdown-value">₹${this.formatIndianNumber(Math.round(breakdown.p))}</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="breakdown-section">
                            <h4 class="section-title">Deductions</h4>
                            <div class="section-content">
                                <div class="breakdown-line">
                                    <span class="breakdown-label">IT</span>
                                    <span class="breakdown-value">₹${this.formatIndianNumber(Math.round(breakdown.it))}</span>
                                </div>
                                <div class="breakdown-line">
                                    <span class="breakdown-label">PT</span>
                                    <span class="breakdown-value">₹${this.formatIndianNumber(Math.round(breakdown.pt))}</span>
                                </div>
                                <div class="breakdown-line">
                                    <span class="breakdown-label">GSLIC</span>
                                    <span class="breakdown-value">₹${this.formatIndianNumber(Math.round(breakdown.gslic))}</span>
                                </div>
                                <div class="breakdown-line">
                                    <span class="breakdown-label">LIC</span>
                                    <span class="breakdown-value">₹${this.formatIndianNumber(Math.round(breakdown.lic))}</span>
                                </div>
                                <div class="breakdown-line">
                                    <span class="breakdown-label">FBF</span>
                                    <span class="breakdown-value">₹${this.formatIndianNumber(Math.round(breakdown.fbf))}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="breakdown-footer">
                    <button class="close-breakdown-footer" aria-label="Close Modal">
                        Close
                    </button>
                </div>
            </div>
            <div class="breakdown-overlay"></div>
        `;

        document.body.appendChild(modal);

        // Close modal functionality
        const closeBtn = modal.querySelector('.close-breakdown');
        const closeFooterBtn = modal.querySelector('.close-breakdown-footer');
        const overlay = modal.querySelector('.breakdown-overlay');
        
        const closeModal = () => {
            document.body.removeChild(modal);
        };

        closeBtn.addEventListener('click', closeModal);
        closeFooterBtn.addEventListener('click', closeModal);
        overlay.addEventListener('click', closeModal);
        
        // Close on Escape key
        const escapeHandler = (e) => {
            if (e.key === 'Escape') {
                closeModal();
                document.removeEventListener('keydown', escapeHandler);
            }
        };
        document.addEventListener('keydown', escapeHandler);
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
                <div class="breakdown-comprehensive-card">
                    <div class="breakdown-header">
                        <h4>Detailed Breakdown for ${month} ${year}</h4>
                        <div class="breakdown-info">${this.formatIndianNumber(metrics.totalEmployees)} Employees</div>
                    </div>
                    
                    <div class="breakdown-content">
                        <div class="breakdown-summary-section">
                            <div class="breakdown-summary-item primary">
                                <div class="breakdown-summary-label">Total Net Salary</div>
                                <div class="breakdown-summary-value">₹${this.formatIndianNumber(Math.round(metrics.totalNet))}</div>
                            </div>
                            <div class="breakdown-summary-item secondary">
                                <div class="breakdown-summary-label">Total Gross Salary</div>
                                <div class="breakdown-summary-value">₹${this.formatIndianNumber(Math.round(metrics.totalGross))}</div>
                            </div>
                            <div class="breakdown-summary-item accent">
                                <div class="breakdown-summary-label">Total Deductions</div>
                                <div class="breakdown-summary-value">₹${this.formatIndianNumber(Math.round(metrics.totalDeductions))}</div>
                            </div>
                        </div>
                        
                        <div class="breakdown-details-grid">
                            <div class="breakdown-details-section">
                                <h5>Allowances Breakdown</h5>
                                <div class="breakdown-details-items">
                                    <div class="breakdown-details-item">
                                        <span class="breakdown-details-label">Basic Salary</span>
                                        <span class="breakdown-details-value">₹${this.formatIndianNumber(Math.round(metrics.totalBasic))}</span>
                                    </div>
                                    <div class="breakdown-details-item">
                                        <span class="breakdown-details-label">Dearness Allowance</span>
                                        <span class="breakdown-details-value">₹${this.formatIndianNumber(Math.round(metrics.totalDA))}</span>
                                    </div>
                                    <div class="breakdown-details-item">
                                        <span class="breakdown-details-label">House Rent Allowance</span>
                                        <span class="breakdown-details-value">₹${this.formatIndianNumber(Math.round(metrics.totalHRA))}</span>
                                    </div>
                                    <div class="breakdown-details-item">
                                        <span class="breakdown-details-label">Other Allowances</span>
                                        <span class="breakdown-details-value">₹${this.formatIndianNumber(Math.round(metrics.totalIR + metrics.totalSFN + metrics.totalSpayTypist + metrics.totalP))}</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="breakdown-details-section">
                                <h5>Deductions Breakdown</h5>
                                <div class="breakdown-details-items">
                                    <div class="breakdown-details-item">
                                        <span class="breakdown-details-label">Income Tax</span>
                                        <span class="breakdown-details-value">₹${this.formatIndianNumber(Math.round(metrics.totalIT))}</span>
                                    </div>
                                    <div class="breakdown-details-item">
                                        <span class="breakdown-details-label">Professional Tax</span>
                                        <span class="breakdown-details-value">₹${this.formatIndianNumber(Math.round(metrics.totalPT))}</span>
                                    </div>
                                    <div class="breakdown-details-item">
                                        <span class="breakdown-details-label">Insurance (LIC + GSLIC)</span>
                                        <span class="breakdown-details-value">₹${this.formatIndianNumber(Math.round(metrics.totalLIC + metrics.totalGSLIC))}</span>
                                    </div>
                                    <div class="breakdown-details-item">
                                        <span class="breakdown-details-label">Other Deductions</span>
                                        <span class="breakdown-details-value">₹${this.formatIndianNumber(Math.round(metrics.totalFBF))}</span>
                                    </div>
                                </div>
                            </div>
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
        document.getElementById('employeeName').textContent = `${employee.name}`;
        document.getElementById('employeeInfo').textContent = `${employee.empNo} • ${this.abbreviateDesignation(employee.designation)}`;
        
        // Add Bank A/c and Group information from most recent month
        const employeeAdditionalInfo = document.getElementById('employeeAdditionalInfo');
        if (employeeAdditionalInfo) {
            // Sort records by date to get the most recent one (create a copy to avoid mutating original)
            const sortedRecords = [...employee.records].sort((a, b) => {
                if (a.year !== b.year) return b.year - a.year;
                return this.getMonthNumber(b.month) - this.getMonthNumber(a.month);
            });
            
            const recentRecord = sortedRecords[0];
            const bankAc = recentRecord?.bankAc || 'N/A';
            const group = recentRecord?.group || 'N/A';
            const periodRange = employee.records.length > 1 ? 
                `${sortedRecords[sortedRecords.length - 1].month} ${sortedRecords[sortedRecords.length - 1].year} - ${recentRecord.month} ${recentRecord.year}` :
                `${recentRecord.month} ${recentRecord.year}`;
                
            employeeAdditionalInfo.innerHTML = `
                <div class="additional-info-grid">
                    <div class="info-item-row">
                        <div class="info-item">
                            <span class="info-label">Bank A/C:</span>
                            <span class="info-value">${bankAc}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Group:</span>
                            <span class="info-value">${group}</span>
                        </div>
                    </div>
                </div>
            `;
        }

        // Calculate additional metrics using stored values
        let totalDeductions = 0;
        
        // Individual allowance components
        let totalBasic = 0;
        let totalDA = 0;
        let totalHRA = 0;
        let totalIR = 0;
        let totalSFN = 0;
        let totalSpayTypist = 0;
        let totalP = 0;
        
        // Individual deduction components
        let totalIT = 0;
        let totalPT = 0;
        let totalGSLIC = 0;
        let totalLIC = 0;
        let totalFBF = 0;

        employee.records.forEach(record => {
            // Use stored values from when the record was processed
            totalDeductions += record.totalDeductions;
            
            // Add allowances
            totalBasic += record.basic;
            totalDA += record.da;
            totalHRA += record.hra;
            totalIR += record.ir;
            totalSFN += record.sfn;
            totalSpayTypist += record.spayTypist;
            totalP += record.p;
            
            // Add deductions
            totalIT += record.it;
            totalPT += record.pt;
            totalGSLIC += record.gslic;
            totalLIC += record.lic;
            totalFBF += record.fbf;
        });

        // Store calculated deductions in employee object for summary card
        employee.totalDeductions = totalDeductions;

        // Clear employee metrics section as we'll create a summary card at the top of salary history
        const employeeMetrics = document.getElementById('employeeMetrics');
        employeeMetrics.innerHTML = '';

        // Update Salary History header with period information
        this.updateSalaryHistoryHeader(employee);
        
        // Update salary history with card design similar to monthly cards
        this.renderEmployeeSalaryCards(employee);
    }

    renderEmployeeSalaryCards(employee) {
        // Find or create the container for employee salary cards
        let cardsContainer = document.getElementById('employeeSalaryCards');
        if (!cardsContainer) {
            // Create the container if it doesn't exist
            const tableContainer = document.querySelector('#employeeSection .data-table-container');
            if (tableContainer) {
                cardsContainer = document.createElement('div');
                cardsContainer.id = 'employeeSalaryCards';
                cardsContainer.className = 'monthly-cards-container';
                tableContainer.parentNode.replaceChild(cardsContainer, tableContainer);
            } else {
                return; // Cannot find suitable place to insert cards
            }
        } else {
            cardsContainer.innerHTML = '';
        }

        // Create summary card at the top
        const summaryCard = this.createEmployeeSummaryCard(employee);
        cardsContainer.appendChild(summaryCard);

        // Sort records by date (newest first)
        const sortedRecords = employee.records.sort((a, b) => {
            if (a.year !== b.year) return b.year - a.year;
            return this.getMonthNumber(b.month) - this.getMonthNumber(a.month);
        });

        // Create cards for each salary record
        sortedRecords.forEach((record) => {
            const card = this.createEmployeeSalaryCard(record, employee);
            cardsContainer.appendChild(card);
        });
    }

    createEmployeeSalaryCard(record, employee) {
        const card = document.createElement('div');
        card.className = 'monthly-unified-card';
        card.dataset.recordKey = `${record.month}-${record.year}`;
        
        card.innerHTML = `
            <div class="card-header">
                <h3 class="period-title">${record.month} ${record.year}</h3>
                <span class="employee-badge">${this.abbreviateDesignation(employee.designation)}</span>
            </div>
            <div class="unified-metrics">
                <div class="metric-row">
                    <span class="metric-type">Gross:</span>
                    <span class="metric-value gross-value">₹${this.formatIndianNumber(Math.round(record.grossSalary))}</span>
                </div>
                <div class="metric-row">
                    <span class="metric-type">Deductions:</span>
                    <span class="metric-value deductions-value">₹${this.formatIndianNumber(Math.round(record.totalDeductions))}</span>
                </div>
                <div class="metric-row">
                    <span class="metric-type">Net:</span>
                    <span class="metric-value net-value">₹${this.formatIndianNumber(Math.round(record.netSalary))}</span>
                </div>
                ${record.nextIncrementDate ? `
                <div class="metric-row increment-date">
                    <span class="metric-type">Next Increment:</span>
                    <span class="metric-value increment-value">${record.nextIncrementDate}</span>
                </div>
                ` : ''}
            </div>
        `;
        
        card.addEventListener('click', () => {
            this.showEmployeeSalaryBreakdown(record, employee);
        });
        
        return card;
    }

    createEmployeeSummaryCard(employee) {
        const card = document.createElement('div');
        card.className = 'monthly-unified-card summary-card';
        
        // Calculate period range for display
        const sortedRecords = [...employee.records].sort((a, b) => {
            if (a.year !== b.year) return a.year - b.year;
            return this.getMonthNumber(a.month) - this.getMonthNumber(b.month);
        });
        
        const startDate = sortedRecords[0];
        const endDate = sortedRecords[sortedRecords.length - 1];
        const periodRange = employee.records.length > 1 ? 
            `${startDate.month} ${startDate.year} - ${endDate.month} ${endDate.year}` :
            `${endDate.month} ${endDate.year}`;
        
        card.innerHTML = `
            <div class="card-header">
                <h3 class="period-title">Total Summary</h3>
                <span class="employee-badge">${periodRange}</span>
            </div>
            <div class="unified-metrics">
                <div class="metric-row">
                    <span class="metric-type">Gross:</span>
                    <span class="metric-value gross-value">₹${this.formatIndianNumber(Math.round(employee.totalGross))}</span>
                </div>
                <div class="metric-row">
                    <span class="metric-type">Deductions:</span>
                    <span class="metric-value deductions-value">₹${this.formatIndianNumber(Math.round(employee.totalDeductions))}</span>
                </div>
                <div class="metric-row">
                    <span class="metric-type">Net:</span>
                    <span class="metric-value net-value">₹${this.formatIndianNumber(Math.round(employee.totalNet))}</span>
                </div>
                <div class="metric-row">
                    <span class="metric-type">Records:</span>
                    <span class="metric-value records-value">${employee.records.length}</span>
                </div>
            </div>
        `;
        
        // Add click event to show total breakdown
        card.addEventListener('click', () => {
            this.showEmployeeTotalBreakdown(employee);
        });
        
        return card;
    }

    showEmployeeSalaryBreakdown(record, employee) {
        // Create breakdown modal similar to monthly breakdown
        const modal = document.createElement('div');
        modal.className = 'breakdown-modal';
        modal.innerHTML = `
            <div class="breakdown-content">
                <div class="breakdown-header">
                    <div class="breakdown-title-section">
                        <h3>${employee.name}</h3>
                        <span class="breakdown-employee-badge">${record.month} ${record.year}</span>
                    </div>
                    <button class="close-breakdown" aria-label="Close">&times;</button>
                </div>
                
                <div class="breakdown-text">
                    <div class="breakdown-summary">
                        <div class="summary-line">
                            <span class="summary-label">Total Gross Salary</span>
                            <span class="summary-value">₹${this.formatIndianNumber(Math.round(record.grossSalary))}</span>
                        </div>
                        <div class="summary-line">
                            <span class="summary-label">Total Deductions</span>
                            <span class="summary-value">₹${this.formatIndianNumber(Math.round(record.totalDeductions))}</span>
                        </div>
                        <div class="summary-line total">
                            <span class="summary-label">Net Salary</span>
                            <span class="summary-value">₹${this.formatIndianNumber(Math.round(record.netSalary))}</span>
                        </div>
                    </div>
                    
                    <div class="breakdown-separator"></div>
                    
                    <div class="breakdown-sections">
                        <div class="breakdown-section">
                            <h4 class="section-title">Allowances</h4>
                            <div class="section-content">
                                <div class="breakdown-line-horizontal">
                                    <span class="breakdown-item-text">
                                        Basic - ₹${this.formatIndianNumber(Math.round(record.basic))}
                                    </span>
                                </div>
                                <div class="breakdown-line-horizontal">
                                    <span class="breakdown-item-text">
                                        DA - ₹${this.formatIndianNumber(Math.round(record.da))} (${Math.round(record.basic) > 0 ? ((Math.round(record.da) / Math.round(record.basic)) * 100).toFixed(2) : 0}%)
                                    </span>
                                </div>
                                <div class="breakdown-line-horizontal">
                                    <span class="breakdown-item-text">
                                        HRA - ₹${this.formatIndianNumber(Math.round(record.hra))} (${Math.round(record.basic) > 0 ? ((Math.round(record.hra) / Math.round(record.basic)) * 100).toFixed(2) : 0}%)
                                    </span>
                                </div>
                                <div class="breakdown-line-horizontal">
                                    <span class="breakdown-item-text">
                                        IR - ₹${this.formatIndianNumber(Math.round(record.ir))}
                                    </span>
                                </div>
                                <div class="breakdown-line-horizontal">
                                    <span class="breakdown-item-text">
                                        SFN - ₹${this.formatIndianNumber(Math.round(record.sfn))}
                                    </span>
                                </div>
                                <div class="breakdown-line-horizontal">
                                    <span class="breakdown-item-text">
                                        SP-Typist - ₹${this.formatIndianNumber(Math.round(record.spayTypist))}
                                    </span>
                                </div>
                                <div class="breakdown-line-horizontal">
                                    <span class="breakdown-item-text">
                                        P Allow - ₹${this.formatIndianNumber(Math.round(record.p))}
                                    </span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="breakdown-section">
                            <h4 class="section-title">Deductions</h4>
                            <div class="section-content">
                                <div class="breakdown-line-horizontal">
                                    <span class="breakdown-item-text">
                                        IT - ₹${this.formatIndianNumber(Math.round(record.it))}
                                    </span>
                                </div>
                                <div class="breakdown-line-horizontal">
                                    <span class="breakdown-item-text">
                                        PT - ₹${this.formatIndianNumber(Math.round(record.pt))}
                                    </span>
                                </div>
                                <div class="breakdown-line-horizontal">
                                    <span class="breakdown-item-text">
                                        GSLIC - ₹${this.formatIndianNumber(Math.round(record.gslic))}
                                    </span>
                                </div>
                                <div class="breakdown-line-horizontal">
                                    <span class="breakdown-item-text">
                                        LIC - ₹${this.formatIndianNumber(Math.round(record.lic))}
                                    </span>
                                </div>
                                <div class="breakdown-line-horizontal">
                                    <span class="breakdown-item-text">
                                        FBF - ₹${this.formatIndianNumber(Math.round(record.fbf))}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="breakdown-footer">
                    <button class="close-breakdown-footer" aria-label="Close Modal">
                        Close
                    </button>
                </div>
            </div>
            <div class="breakdown-overlay"></div>
        `;

        document.body.appendChild(modal);

        // Close modal functionality
        const closeBtn = modal.querySelector('.close-breakdown');
        const closeFooterBtn = modal.querySelector('.close-breakdown-footer');
        const overlay = modal.querySelector('.breakdown-overlay');
        
        const closeModal = () => {
            document.body.removeChild(modal);
        };

        closeBtn.addEventListener('click', closeModal);
        closeFooterBtn.addEventListener('click', closeModal);
        overlay.addEventListener('click', closeModal);
        
        // Close on Escape key
        const escapeHandler = (e) => {
            if (e.key === 'Escape') {
                closeModal();
                document.removeEventListener('keydown', escapeHandler);
            }
        };
        document.addEventListener('keydown', escapeHandler);
    }

    showEmployeeTotalBreakdown(employee) {
        // Calculate totals for all allowances and deductions
        let totalBasic = 0, totalDA = 0, totalHRA = 0, totalIR = 0, totalSFN = 0, totalSpayTypist = 0, totalP = 0;
        let totalIT = 0, totalPT = 0, totalGSLIC = 0, totalLIC = 0, totalFBF = 0;

        employee.records.forEach(record => {
            totalBasic += record.basic;
            totalDA += record.da;
            totalHRA += record.hra;
            totalIR += record.ir;
            totalSFN += record.sfn;
            totalSpayTypist += record.spayTypist;
            totalP += record.p;
            totalIT += record.it;
            totalPT += record.pt;
            totalGSLIC += record.gslic;
            totalLIC += record.lic;
            totalFBF += record.fbf;
        });

        // Create breakdown modal
        const modal = document.createElement('div');
        modal.className = 'breakdown-modal';
        modal.innerHTML = `
            <div class="breakdown-content">
                <div class="breakdown-header">
                    <div class="breakdown-title-section">
                        <h3>${employee.name}</h3>
                        <span class="breakdown-employee-badge">Total Summary</span>
                    </div>
                    <button class="close-breakdown" aria-label="Close">&times;</button>
                </div>
                
                <div class="breakdown-text">
                    <div class="breakdown-summary">
                        <div class="summary-line total">
                            <span class="summary-label">Total Gross Salary</span>
                            <span class="summary-value">₹${this.formatIndianNumber(Math.round(employee.totalGross))}</span>
                        </div>
                        <div class="summary-line total">
                            <span class="summary-label">Total Deductions</span>
                            <span class="summary-value">₹${this.formatIndianNumber(Math.round(employee.totalDeductions))}</span>
                        </div>
                        <div class="summary-line total">
                            <span class="summary-label">Total Net Salary</span>
                            <span class="summary-value">₹${this.formatIndianNumber(Math.round(employee.totalNet))}</span>
                        </div>
                    </div>
                    
                    <div class="breakdown-separator"></div>
                    
                    <div class="breakdown-sections">
                        <div class="breakdown-section">
                            <h4 class="section-title">Total Allowances</h4>
                            <div class="section-content">
                                <div class="breakdown-line-horizontal">
                                    <span class="breakdown-item-text">Basic - ₹${this.formatIndianNumber(Math.round(totalBasic))}</span>
                                </div>
                                <div class="breakdown-line-horizontal">
                                    <span class="breakdown-item-text">DA - ₹${this.formatIndianNumber(Math.round(totalDA))}</span>
                                </div>
                                <div class="breakdown-line-horizontal">
                                    <span class="breakdown-item-text">HRA - ₹${this.formatIndianNumber(Math.round(totalHRA))}</span>
                                </div>
                                <div class="breakdown-line-horizontal">
                                    <span class="breakdown-item-text">IR - ₹${this.formatIndianNumber(Math.round(totalIR))}</span>
                                </div>
                                <div class="breakdown-line-horizontal">
                                    <span class="breakdown-item-text">SFN - ₹${this.formatIndianNumber(Math.round(totalSFN))}</span>
                                </div>
                                <div class="breakdown-line-horizontal">
                                    <span class="breakdown-item-text">SPAY - ₹${this.formatIndianNumber(Math.round(totalSpayTypist))}</span>
                                </div>
                                <div class="breakdown-line-horizontal">
                                    <span class="breakdown-item-text">P - ₹${this.formatIndianNumber(Math.round(totalP))}</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="breakdown-section">
                            <h4 class="section-title">Total Deductions</h4>
                            <div class="section-content">
                                <div class="breakdown-line-horizontal">
                                    <span class="breakdown-item-text">IT - ₹${this.formatIndianNumber(Math.round(totalIT))}</span>
                                </div>
                                <div class="breakdown-line-horizontal">
                                    <span class="breakdown-item-text">PT - ₹${this.formatIndianNumber(Math.round(totalPT))}</span>
                                </div>
                                <div class="breakdown-line-horizontal">
                                    <span class="breakdown-item-text">GSLIC - ₹${this.formatIndianNumber(Math.round(totalGSLIC))}</span>
                                </div>
                                <div class="breakdown-line-horizontal">
                                    <span class="breakdown-item-text">LIC - ₹${this.formatIndianNumber(Math.round(totalLIC))}</span>
                                </div>
                                <div class="breakdown-line-horizontal">
                                    <span class="breakdown-item-text">FBF - ₹${this.formatIndianNumber(Math.round(totalFBF))}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="breakdown-footer">
                    <button class="close-breakdown-footer" aria-label="Close Modal">
                        Close
                    </button>
                </div>
            </div>
            <div class="breakdown-overlay"></div>
        `;

        document.body.appendChild(modal);

        // Close modal functionality
        const closeBtn = modal.querySelector('.close-breakdown');
        const closeFooterBtn = modal.querySelector('.close-breakdown-footer');
        const overlay = modal.querySelector('.breakdown-overlay');
        
        const closeModal = () => {
            document.body.removeChild(modal);
        };

        closeBtn.addEventListener('click', closeModal);
        closeFooterBtn.addEventListener('click', closeModal);
        overlay.addEventListener('click', closeModal);
        
        // Close on Escape key
        const escapeHandler = (e) => {
            if (e.key === 'Escape') {
                closeModal();
                document.removeEventListener('keydown', escapeHandler);
            }
        };
        document.addEventListener('keydown', escapeHandler);
    }

    toggleEmployeeSalaryDetails(record) {
        const recordKey = `${record.month}-${record.year}`;
        const existingDetailsRow = document.querySelector(`tr[data-employee-details-for="${recordKey}"]`);
        const mainRow = document.querySelector(`tr[data-record-key="${recordKey}"]`);
        
        if (existingDetailsRow) {
            // Hide details
            existingDetailsRow.remove();
            mainRow.classList.remove('expanded');
        } else {
            // Close any other open details first
            this.closeAllEmployeeSalaryDetails();
            // Show details
            this.showEmployeeSalaryDetails(record);
            mainRow.classList.add('expanded');
        }
    }

    closeAllEmployeeSalaryDetails() {
        // Close all employee salary details
        const allDetailsRows = document.querySelectorAll('tr[data-employee-details-for]');
        const allExpandedRows = document.querySelectorAll('.employee-salary-row.expanded');
        
        allDetailsRows.forEach(row => row.remove());
        allExpandedRows.forEach(row => row.classList.remove('expanded'));
    }

    showEmployeeSalaryDetails(record) {
        const recordKey = `${record.month}-${record.year}`;
        const employee = this.processedData.employees[this.currentEmployee];
        
        const mainRow = document.querySelector(`tr[data-record-key="${recordKey}"]`);
        const detailsRow = document.createElement('tr');
        detailsRow.className = 'details-row';
        detailsRow.dataset.employeeDetailsFor = recordKey;
        
        detailsRow.innerHTML = `
            <td colspan="5">
                <div class="breakdown-comprehensive-card">
                    <div class="breakdown-header">
                        <h4>Detailed Breakdown for ${employee.name} - ${record.month} ${record.year}</h4>
                        <div class="breakdown-info">${this.abbreviateDesignation(employee.designation)}</div>
                    </div>
                    
                    <div class="breakdown-content">
                        <div class="breakdown-summary-section">
                            <div class="breakdown-summary-item primary">
                                <div class="breakdown-summary-label">Net Salary</div>
                                <div class="breakdown-summary-value">₹${this.formatIndianNumber(Math.round(record.netSalary))}</div>
                            </div>
                            <div class="breakdown-summary-item secondary">
                                <div class="breakdown-summary-label">Gross Salary</div>
                                <div class="breakdown-summary-value">₹${this.formatIndianNumber(Math.round(record.grossSalary))}</div>
                            </div>
                            <div class="breakdown-summary-item accent">
                                <div class="breakdown-summary-label">Total Deductions</div>
                                <div class="breakdown-summary-value">₹${this.formatIndianNumber(Math.round(record.totalDeductions))}</div>
                            </div>
                        </div>
                        
                        <div class="breakdown-details-grid">
                            <div class="breakdown-details-section">
                                <h5>Allowances Breakdown</h5>
                                <div class="breakdown-details-items">
                                    <div class="breakdown-details-item">
                                        <span class="breakdown-details-label">Basic Salary</span>
                                        <span class="breakdown-details-value">₹${this.formatIndianNumber(Math.round(record.basic))}</span>
                                    </div>
                                    <div class="breakdown-details-item">
                                        <span class="breakdown-details-label">Dearness Allowance</span>
                                        <span class="breakdown-details-value">₹${this.formatIndianNumber(Math.round(record.da))}</span>
                                    </div>
                                    <div class="breakdown-details-item">
                                        <span class="breakdown-details-label">House Rent Allowance</span>
                                        <span class="breakdown-details-value">₹${this.formatIndianNumber(Math.round(record.hra))}</span>
                                    </div>
                                    <div class="breakdown-details-item">
                                        <span class="breakdown-details-label">Other Allowances</span>
                                        <span class="breakdown-details-value">₹${this.formatIndianNumber(Math.round(record.ir + record.sfn + record.spayTypist + record.p))}</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="breakdown-details-section">
                                <h5>Deductions Breakdown</h5>
                                <div class="breakdown-details-items">
                                    <div class="breakdown-details-item">
                                        <span class="breakdown-details-label">Income Tax</span>
                                        <span class="breakdown-details-value">₹${this.formatIndianNumber(Math.round(record.it))}</span>
                                    </div>
                                    <div class="breakdown-details-item">
                                        <span class="breakdown-details-label">Professional Tax</span>
                                        <span class="breakdown-details-value">₹${this.formatIndianNumber(Math.round(record.pt))}</span>
                                    </div>
                                    <div class="breakdown-details-item">
                                        <span class="breakdown-details-label">Insurance (LIC + GSLIC)</span>
                                        <span class="breakdown-details-value">₹${this.formatIndianNumber(Math.round(record.lic + record.gslic))}</span>
                                    </div>
                                    <div class="breakdown-details-item">
                                        <span class="breakdown-details-label">Other Deductions</span>
                                        <span class="breakdown-details-value">₹${this.formatIndianNumber(Math.round(record.fbf))}</span>
                                    </div>
                                </div>
                            </div>
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

    updateSalaryHistoryHeader(employee) {
        const salaryHistoryHeader = document.getElementById('salaryHistoryHeader');
        if (!salaryHistoryHeader) return;

        // Sort records by date to get the most recent one (create a copy to avoid mutating original)
        const sortedRecords = [...employee.records].sort((a, b) => {
            if (a.year !== b.year) return b.year - a.year;
            return this.getMonthNumber(b.month) - this.getMonthNumber(a.month);
        });
        
        const recentRecord = sortedRecords[0];
        const periodRange = employee.records.length > 1 ? 
            `${sortedRecords[sortedRecords.length - 1].month} ${sortedRecords[sortedRecords.length - 1].year} - ${recentRecord.month} ${recentRecord.year}` :
            `${recentRecord.month} ${recentRecord.year}`;
        
        salaryHistoryHeader.innerHTML = `Salary History <span style="font-weight: 400; color: var(--text-secondary); font-size: 0.85em;">(${periodRange})</span>`;
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