document.addEventListener('DOMContentLoaded', () => {
    // --- CONFIGURATION ---
    const DASHBOARD_FEED_CSV_URL = 'YOUR_PUBLISHED_DashboardFeed_CB_ScaledScores_Prototype_CSV_URL_HERE'; // !!! REPLACE THIS !!!
    const LOCAL_STORAGE_STUDENT_ID_KEY = 'satHubStudentGmailId'; 

    // --- DOM ELEMENTS ---
    const studentIdInputContainerEl = document.getElementById('student-id-input-container');
    const studentIdInputEl = document.getElementById('studentIdInput');
    const loadDataButtonEl = document.getElementById('loadDataButton');
    const idInputErrorEl = document.getElementById('id-input-error');
    const loadingMessageEl = document.getElementById('loading-message');
    const errorMessageEl = document.getElementById('error-message');
    const noDataMessageEl = document.getElementById('no-data-message');
    const dashboardRootContainerEl = document.getElementById('dashboard-root-container');
    const dashboardStudentNameEl = document.getElementById('dashboard-student-name'); // Assuming you have this in your HTML
    const changeIdButtonEl = document.getElementById('changeIdButton');
    const retryIdButtonEl = document.getElementById('retryIdButton');
    
    const overviewCardsContainerEl = document.getElementById('overview-cards-container');
    const practiceTestsTableBodyEl = document.getElementById('practiceTests-table-body');
    // Get other elements if you want to clear/hide them
    const scoreTrendChartContainerEl = document.getElementById('scoreTrendChart')?.parentElement;
    const skillPerformanceChartContainerEl = document.getElementById('skillPerformanceChart')?.parentElement;
    const strengthsListEl = document.getElementById('strengths-list');
    const weaknessesListEl = document.getElementById('weaknesses-list');
    const canvasKhanQuizzesTableBodyEl = document.getElementById('canvas-khan-quizzes-table-body');
    const detailedSkillAnalysisContainerEl = document.getElementById('detailed-skill-analysis-container');
    const currentYearEl = document.getElementById('current-year');
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabPanes = document.querySelectorAll('.tab-pane');

    // --- GLOBAL DATA ---
    let allStudentScoresFromFeed = [];
    let currentStudentDisplayData = null;

     // --- ICON SVGs (Simplified for this prototype context if needed) ---
    const icons = {
        overallScore: `<svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>`,
        verbal: `<svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg>`,
        math: `<svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 14h.01M12 11h.01M15 11h.01M9 4h6a2 2 0 012 2v12a2 2 0 01-2 2H9a2 2 0 01-2-2V6a2 2 0 012-2z"></path></svg>`,
        avgQuiz: `<svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`,
    };


    // --- HELPER FUNCTIONS ---
    const formatDate = (dateString) => {
        if (!dateString || dateString.toLowerCase() === "n/a") return 'N/A';
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return dateString;
            return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
        } catch (e) { return dateString; }
    };

    function getStudentGmailFromURL() {
        const params = new URLSearchParams(window.location.search);
        return params.get('studentGmailId');
    }

    function parseCSVWithPapaParse(csvText, callback) {
        Papa.parse(csvText, {
            header: true,
            skipEmptyLines: true,
            dynamicTyping: true, // Convert numbers and booleans automatically
            complete: (results) => {
                callback(results.data);
            },
            error: (error) => {
                console.error("PapaParse Error:", error);
                callback([]);
            }
        });
    }
    
    // --- UI MANAGEMENT ---
    function showLoadingScreen(message = "Loading student data...") { /* ... same as your previous script ... */ 
        if(loadingMessageEl) {
            loadingMessageEl.innerHTML = `<svg class="animate-spin h-8 w-8 text-sky-500 mx-auto mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> ${message}`;
            loadingMessageEl.classList.remove('hidden');
        }
        if(studentIdInputContainerEl) studentIdInputContainerEl.classList.add('hidden');
        if(dashboardRootContainerEl) dashboardRootContainerEl.classList.add('hidden');
        if(errorMessageEl) errorMessageEl.classList.add('hidden');
        if(noDataMessageEl) noDataMessageEl.classList.add('hidden');
    }
    function showInputScreen(errorMessage = "") { /* ... same as your previous script ... */
        if(studentIdInputContainerEl) studentIdInputContainerEl.classList.remove('hidden');
        if(loadingMessageEl) loadingMessageEl.classList.add('hidden');
        if(dashboardRootContainerEl) dashboardRootContainerEl.classList.add('hidden');
        if(errorMessageEl) errorMessageEl.classList.add('hidden');
        if(noDataMessageEl) noDataMessageEl.classList.add('hidden');
        if (errorMessage && idInputErrorEl) {
            idInputErrorEl.textContent = errorMessage;
            idInputErrorEl.classList.remove('hidden');
        } else if (idInputErrorEl) {
            idInputErrorEl.classList.add('hidden');
        }
        if(studentIdInputEl) {
            studentIdInputEl.value = ""; 
            studentIdInputEl.focus();
        }
    }
    function displayError(message) {  /* ... same as your previous script ... */ 
        showLoadingScreen(); 
        if(errorMessageEl) {
            errorMessageEl.textContent = message;
            errorMessageEl.classList.remove('hidden');
        }
        if(studentIdInputContainerEl) studentIdInputContainerEl.classList.add('hidden'); 
        if(dashboardRootContainerEl) dashboardRootContainerEl.classList.add('hidden');
    }
    function displayNoDataFoundScreen() { /* ... same as your previous script ... */ 
        showLoadingScreen(); 
        if(noDataMessageEl) noDataMessageEl.classList.remove('hidden');
        if(studentIdInputContainerEl) studentIdInputContainerEl.classList.add('hidden'); 
        if(dashboardRootContainerEl) dashboardRootContainerEl.classList.add('hidden');
    }

    // --- DATA PROCESSING AND RENDERING ---
    function processAndStoreStudentData(studentGmailId) {
        currentStudentDisplayData = allStudentScoresFromFeed.find(row => row.StudentGmailID === studentGmailId);
        
        if (!currentStudentDisplayData) {
            displayNoDataFoundScreen();
            return false;
        }
        // Try to get student name from any available source if not directly in this feed
        // This part might need adjustment if your Student_Mapping is not part of this simplified feed
        currentStudentDisplayData.StudentName = currentStudentDisplayData.StudentName || studentGmailId.split('@')[0] || "Student"; 
        return true;
    }
    
    function renderDashboardProto() {
        if (!currentStudentDisplayData) {
            displayNoDataFoundScreen();
            return;
        }

        if(dashboardRootContainerEl) dashboardRootContainerEl.classList.remove('hidden');
        if(studentIdInputContainerEl) studentIdInputContainerEl.classList.add('hidden');
        if(loadingMessageEl) loadingMessageEl.classList.add('hidden');
        if(errorMessageEl) errorMessageEl.classList.add('hidden');
        if(noDataMessageEl) noDataMessageEl.classList.add('hidden');

        if(dashboardStudentNameEl) dashboardStudentNameEl.textContent = `Welcome, ${currentStudentDisplayData.StudentName}!`; // Assuming StudentName is in the feed
        
        renderOverviewCardsProto();
        renderPracticeTestsTableProto();
        
        // Hide or clear other sections for prototype
        if(scoreTrendChartContainerEl) scoreTrendChartContainerEl.innerHTML = "<p class='text-slate-500 text-center py-10'>Score trend chart not part of this prototype.</p>";
        if(skillPerformanceChartContainerEl) skillPerformanceChartContainerEl.innerHTML = "<p class='text-slate-500 text-center py-10'>Skill performance chart not part of this prototype.</p>";
        if(strengthsListEl) strengthsListEl.innerHTML = "<li>Detailed strengths/weaknesses not part of this prototype.</li>";
        if(weaknessesListEl) weaknessesListEl.innerHTML = "";
        if(canvasKhanQuizzesTableBodyEl) canvasKhanQuizzesTableBodyEl.innerHTML = "<tr><td colspan='5' class='text-center p-4 text-slate-500'>Other quizzes not part of this prototype.</td></tr>";
        if(detailedSkillAnalysisContainerEl) detailedSkillAnalysisContainerEl.innerHTML = "<p class='text-slate-500'>Detailed skill analysis not part of this prototype.</p>";

        if(currentYearEl) currentYearEl.textContent = new Date().getFullYear();
        setupTabsProto(); 
    }

    function renderOverviewCardsProto() {
        if (!overviewCardsContainerEl || !currentStudentDisplayData) return;
        
        const data = currentStudentDisplayData; // This is a single row for the student for one test

        const cards = [
            { title: 'Latest SAT Practice Score', value: data.ScaledScore_Total || 'N/A', sub: data.ScaledScore_Total ? '/ 1600' : '', icon: icons.overallScore, color: 'text-sky-600' },
            { title: 'Latest Verbal Score (R&W)', value: data.ScaledScore_RW || 'N/A', sub: data.ScaledScore_RW ? '/ 800' : '', icon: icons.verbal, color: 'text-indigo-600' },
            { title: 'Latest Math Score', value: data.ScaledScore_Math || 'N/A', sub: data.ScaledScore_Math ? '/ 800' : '', icon: icons.math, color: 'text-teal-600' },
            { title: 'Raw R&W | Raw Math', value: `${data.RawScore_RW === null ? 'N/A' : data.RawScore_RW} | ${data.RawScore_Math === null ? 'N/A' : data.RawScore_Math}`, sub: `(Raw Scores)`, icon: icons.avgQuiz, color: 'text-amber-600' }
        ];
        overviewCardsContainerEl.innerHTML = cards.map(card => `
            <div class="sathub-card p-4 md:p-6 flex items-center space-x-4">
                <div class="p-3 rounded-full bg-sky-100 ${card.color}">${card.icon || ''}</div>
                <div>
                    <p class="text-sm text-slate-500">${card.title}</p>
                    <p class="text-2xl font-bold ${card.color}">${card.value} <span class="text-base font-normal">${card.sub || ''}</span></p>
                </div>
            </div>
        `).join('');
    }
    
    function renderPracticeTestsTableProto() {
        if (!practiceTestsTableBodyEl || !currentStudentDisplayData) return;
        
        const test = currentStudentDisplayData; // Single object for the student's test data
        if (!test || test.ScaledScore_Total === null) { // Check if any score is null, implying not taken or error
            practiceTestsTableBodyEl.innerHTML = '<tr><td colspan="5" class="text-center p-4 text-slate-500">No official practice test data found or test not taken.</td></tr>';
            return;
        }
        practiceTestsTableBodyEl.innerHTML = `
            <tr class="border-b border-slate-100 hover:bg-sky-50">
                <td class="p-3">${test.PracticeTestName}</td>
                <td class="p-3">${formatDate(test.AttemptDate_RW) || formatDate(test.AttemptDate_Math) || 'N/A'}</td>
                <td class="p-3">${test.ScaledScore_RW || 'N/A'}</td>
                <td class="p-3">${test.ScaledScore_Math || 'N/A'}</td>
                <td class="p-3 font-semibold sathub-accent">${test.ScaledScore_Total || 'N/A'} / 1600</td>
            </tr>
        `;
    }

    // --- TAB SWITCHING (Simplified for prototype if needed, or keep full) ---
    function setupTabsProto() {
        if (!tabButtons || !tabPanes) return;
        // Show only Overview and Practice Tests tab for prototype, hide others
        const tabsToShow = ['overview', 'practiceTests']; 
        
        tabButtons.forEach(button => {
            const tabName = button.dataset.tab;
            if (!tabsToShow.includes(tabName)) {
                button.classList.add('hidden'); // Hide button
            } else {
                button.classList.remove('hidden');
            }

            button.addEventListener('click', () => {
                tabButtons.forEach(btn => {
                    if(tabsToShow.includes(btn.dataset.tab)) { // Only interact with visible tabs
                        btn.classList.remove('active', 'text-sky-600', 'border-sky-600');
                    }
                });
                button.classList.add('active', 'text-sky-600', 'border-sky-600');
                
                tabPanes.forEach(pane => {
                    if (tabsToShow.includes(pane.id.replace('-content',''))) {
                        pane.id === `${tabName}-content` ? pane.classList.remove('hidden') : pane.classList.add('hidden');
                    } else {
                         pane.classList.add('hidden'); // Ensure other panes are hidden
                    }
                });
            });
        });
        // Activate the first visible tab by default
        const firstVisibleTabButton = Array.from(tabButtons).find(btn => tabsToShow.includes(btn.dataset.tab));
        if (firstVisibleTabButton) firstVisibleTabButton.click(); 
    }
    
    // --- DATA FETCHING AND INITIALIZATION ---
    async function loadAndProcessDataProto(studentGmailId) {
        if (!studentGmailId) {
            showInputScreen("Student Gmail ID is missing.");
            return;
        }
        showLoadingScreen("Loading scores...");

        if (!DASHBOARD_FEED_CSV_URL || DASHBOARD_FEED_CSV_URL === 'YOUR_PUBLISHED_DashboardFeed_CB_ScaledScores_Prototype_CSV_URL_HERE') {
            displayError("Dashboard CSV URL is not configured. Please update script.js.");
            return;
        }

        try {
            const response = await fetch(DASHBOARD_FEED_CSV_URL);
            if (!response.ok) throw new Error(`Failed to fetch dashboard feed: ${response.statusText}`);
            const csvText = await response.text();
            
            parseCSVWithPapaParse(csvText, data => {
                allStudentScoresFromFeed = data;
                if (processAndStoreStudentData(studentGmailId)) {
                    renderDashboardProto();
                    localStorage.setItem(LOCAL_STORAGE_STUDENT_ID_KEY, studentGmailId);
                }
            });
        } catch (error) {
            console.error('Full error object in loadAndProcessDataProto:', error);
            let displayMsg = `Error loading data: ${error.message}. Check console and CSV URL.`;
            if (error.message.includes("Failed to parse URL") || error.message.includes("Invalid URL")) {
                displayMsg = "The Google Sheet CSV URL seems invalid or is still a placeholder.";
            }
            displayError(displayMsg);
        }
    }
    
    function clearSavedStudentIdAndPrompt() { /* ... same as your previous script ... */ 
        localStorage.removeItem(LOCAL_STORAGE_STUDENT_ID_KEY);
        currentStudentDisplayData = null; 
        if (scoreTrendChartInstance && typeof scoreTrendChartInstance.destroy === 'function') { scoreTrendChartInstance.destroy(); scoreTrendChartInstance = null; }
        if (skillPerformanceChartInstance && typeof skillPerformanceChartInstance.destroy === 'function') { skillPerformanceChartInstance.destroy(); skillPerformanceChartInstance = null; }
        showInputScreen("Please enter your Student Gmail ID.");
    }

    // --- INITIAL PAGE LOAD LOGIC ---
    function initializePage() {
        if (!studentIdInputContainerEl || !loadDataButtonEl || !changeIdButtonEl || !retryIdButtonEl) {
            console.error("Critical UI elements missing.");
            if(errorMessageEl) { errorMessageEl.textContent = "UI Error."; errorMessageEl.classList.remove('hidden');}
            return;
        }

        const studentGmailIdFromUrl = getStudentGmailFromURL();
        const savedStudentGmailId = localStorage.getItem(LOCAL_STORAGE_STUDENT_ID_KEY);
        let studentIdToLoad = studentGmailIdFromUrl || savedStudentGmailId;

        if (studentIdToLoad) {
            loadAndProcessDataProto(studentIdToLoad);
        } else {
            showInputScreen();
        }

        loadDataButtonEl.addEventListener('click', () => {
            const enteredId = studentIdInputEl.value.trim();
            if (idInputErrorEl) idInputErrorEl.classList.add('hidden');
            if (enteredId) {
                loadAndProcessDataProto(enteredId);
            } else if (idInputErrorEl) {
                idInputErrorEl.textContent = "Please enter your Student Gmail ID.";
                idInputErrorEl.classList.remove('hidden');
            }
        });

        changeIdButtonEl.addEventListener('click', clearSavedStudentIdAndPrompt);
        if (retryIdButtonEl) retryIdButtonEl.addEventListener('click', clearSavedStudentIdAndPrompt);
        // Static icons, if any (barchart2, clock were placeholders - remove if not used or handled differently)
        // if(document.getElementById('barchart2-icon-placeholder')) document.getElementById('barchart2-icon-placeholder').innerHTML = icons.barchart2;
        // if(document.getElementById('clock-icon-placeholder')) document.getElementById('clock-icon-placeholder').innerHTML = icons.clock; 
    }

    initializePage();
});
