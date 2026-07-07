// State variables
let workLogs = [];
let profile = {
    name: "Part-time Programmer",
    role: "Developer",
    githubToken: ""
};
let isDarkMode = false;

// Initialize Application
window.addEventListener('DOMContentLoaded', () => {
    // Set current year in footer
    const yearEl = document.getElementById('current-year');
    if (yearEl) {
        yearEl.textContent = new Date().getFullYear();
    }

    // Load data from LocalStorage
    loadData();

    // Initialize Form with Today's Date
    resetFormDate();

    // Setup click listeners to dismiss dropdown when clicking outside
    window.addEventListener('click', (e) => {
        const dropdown = document.getElementById('backup-dropdown');
        const btn = document.getElementById('backup-dropdown-btn');
        if (dropdown && btn && !btn.contains(e.target) && !dropdown.contains(e.target)) {
            dropdown.classList.add('hidden');
        }
    });

    // Ensure print summary stats are refreshed right before printing
    window.addEventListener('beforeprint', () => {
        updateCalculations();
        renderPrintSummaryTable();
    });

    // Restore the full table view after printing
    window.addEventListener('afterprint', () => {
        renderTable();
    });
});

// Load profile and logs from localStorage
function loadData() {
    // Load logs
    const savedLogs = localStorage.getItem('wcl_logs');
    if (savedLogs) {
        try {
            workLogs = JSON.parse(savedLogs);
        } catch (e) {
            console.error("Error parsing saved work logs:", e);
            workLogs = [];
        }
    }

    // Load Profile
    const savedProfile = localStorage.getItem('wcl_profile');
    if (savedProfile) {
        try {
            profile = JSON.parse(savedProfile);
        } catch (e) {
            console.error("Error parsing profile:", e);
        }
    } else {
        profile.name = "Jieson Dela Fuente";
        profile.role = "Part-time Programmer";
        profile.githubToken = "";
        saveProfileToStorage();
    }

    // Load Theme Preference
    const savedTheme = localStorage.getItem('wcl_theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        setTheme(true);
    } else {
        setTheme(false);
    }

    // Update UI elements
    updateProfileUI();
    renderTable();
    updateCalculations();
}

// Save logs to localStorage
function saveData() {
    localStorage.setItem('wcl_logs', JSON.stringify(workLogs));
    renderTable();
    updateCalculations();
}

// Save profile to storage
function saveProfileToStorage() {
    localStorage.setItem('wcl_profile', JSON.stringify(profile));
}

// Update profile labels across HTML
function updateProfileUI() {
    document.getElementById('nav-profile-name').textContent = profile.name;
    document.getElementById('nav-profile-role').textContent = profile.role;
    document.getElementById('hero-profile-name').textContent = profile.name;
    document.getElementById('profile-name-input').value = profile.name;
    document.getElementById('profile-role-input').value = profile.role;
    document.getElementById('github-token-input').value = profile.githubToken || "";

    // Update Print-specific values
    document.getElementById('print-developer-label').textContent = `Developer: ${profile.name} (${profile.role})`;
    document.getElementById('print-developer-signature').textContent = `Developer Signature: ${profile.name}`;
}

// Open Profile Editor Modal
function openSettingsModal() {
    const modal = document.getElementById('settings-modal');
    const content = document.getElementById('settings-modal-content');
    modal.classList.remove('hidden');
    setTimeout(() => {
        content.classList.remove('scale-95', 'opacity-0');
        content.classList.add('scale-100', 'opacity-100');
    }, 50);
}

// Close Profile Editor Modal
function closeSettingsModal() {
    const modal = document.getElementById('settings-modal');
    const content = document.getElementById('settings-modal-content');
    content.classList.remove('scale-100', 'opacity-100');
    content.classList.add('scale-95', 'opacity-0');
    setTimeout(() => {
        modal.classList.add('hidden');
    }, 200);
}

// Save profile values from modal inputs
function saveProfile() {
    const nameVal = document.getElementById('profile-name-input').value.trim();
    const roleVal = document.getElementById('profile-role-input').value.trim();
    const tokenVal = document.getElementById('github-token-input').value.trim();

    if (!nameVal) {
        showToast("Please enter a valid developer name", "error");
        return;
    }

    profile.name = nameVal;
    profile.role = roleVal || "Part-time Programmer";
    profile.githubToken = tokenVal;

    saveProfileToStorage();
    updateProfileUI();
    closeSettingsModal();
    showToast("Profile settings saved successfully", "success");
}

// Toggle Dark/Light Theme
function toggleTheme() {
    setTheme(!isDarkMode);
}

// Set the active UI theme state
function setTheme(dark) {
    isDarkMode = dark;
    const themeIcon = document.getElementById('theme-icon');
    if (!themeIcon) return;

    if (isDarkMode) {
        document.documentElement.classList.add('dark');
        themeIcon.className = "fa-solid fa-sun text-lg text-amber-400";
        localStorage.setItem('wcl_theme', 'dark');
    } else {
        document.documentElement.classList.remove('dark');
        themeIcon.className = "fa-solid fa-moon text-lg text-slate-500";
        localStorage.setItem('wcl_theme', 'light');
    }
}

// Reset the date input to today's date
function resetFormDate() {
    const dateInput = document.getElementById('entry-date');
    if (dateInput) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.value = today;
    }
}

// Helper to quickly fill hours
function setQuickHours(hours) {
    document.getElementById('entry-hours').value = hours;
}

// Scroll to and focus on form (for mobile/UX)
function focusForm() {
    document.getElementById('entry-form').scrollIntoView({ behavior: 'smooth' });
    document.getElementById('entry-date').focus();
}

// Dropdown actions toggler
function toggleDropdown() {
    const dropdown = document.getElementById('backup-dropdown');
    dropdown.classList.toggle('hidden');
}

// Clear Date Filters
function clearDateFilters() {
    document.getElementById('filter-start').value = "";
    document.getElementById('filter-end').value = "";
    renderTable();
    showToast("Date filters cleared", "info");
}

// Clear form fields
function resetForm() {
    document.getElementById('entry-id').value = "";
    resetFormDate();
    document.getElementById('entry-hours').value = "";
    document.getElementById('entry-description').value = "";
    document.getElementById('entry-learnings').value = "";

    // Toggle edit buttons back to original
    document.getElementById('form-title').innerHTML = `<i class="fa-solid fa-plus-circle text-brand-600 dark:text-brand-400 mr-2"></i>Log New Activity`;
    document.getElementById('submit-btn').innerHTML = `<i class="fa-solid fa-plus-circle"></i> Add Entry`;
    document.getElementById('cancel-btn').classList.add('hidden');
    document.getElementById('edit-indicator').classList.add('hidden');
}

// Handle Add/Edit Form submission
function handleFormSubmit(e) {
    e.preventDefault();

    const entryId = document.getElementById('entry-id').value;
    const date = document.getElementById('entry-date').value;
    const hours = parseFloat(document.getElementById('entry-hours').value);
    const description = document.getElementById('entry-description').value.trim();
    const learnings = document.getElementById('entry-learnings').value.trim();

    if (!date || isNaN(hours) || hours <= 0 || !description) {
        showToast("Please ensure all required fields are filled out correctly.", "error");
        return;
    }

    if (entryId) {
        // EDIT MODE
        const idx = workLogs.findIndex(log => log.id === entryId);
        if (idx !== -1) {
            workLogs[idx] = {
                ...workLogs[idx],
                date,
                hours,
                description,
                learnings
            };
            showToast("Work log entry updated.", "success");
        }
    } else {
        // CREATE MODE
        const newLog = {
            id: 'log_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            date,
            hours,
            description,
            learnings
        };
        workLogs.push(newLog);
        showToast("New work log entry logged.", "success");
    }

    saveData();
    resetForm();
}

// Trigger loading and preparation for Edit Mode
function editEntry(id) {
    const entry = workLogs.find(log => log.id === id);
    if (!entry) return;

    document.getElementById('entry-id').value = entry.id;
    document.getElementById('entry-date').value = entry.date;
    document.getElementById('entry-hours').value = entry.hours;
    document.getElementById('entry-description').value = entry.description;
    document.getElementById('entry-learnings').value = entry.learnings || "";

    // Modify form title and buttons
    document.getElementById('form-title').innerHTML = `<i class="fa-solid fa-pencil text-amber-500 mr-2"></i>Edit Entry`;
    document.getElementById('submit-btn').innerHTML = `<i class="fa-solid fa-check"></i> Update Entry`;
    document.getElementById('cancel-btn').classList.remove('hidden');
    document.getElementById('edit-indicator').classList.remove('hidden');

    focusForm();
}

// Delete confirmation
function deleteEntry(id) {
    if (confirm("Are you sure you want to delete this log entry?")) {
        workLogs = workLogs.filter(log => log.id !== id);
        saveData();
        showToast("Log entry successfully removed.", "success");
    }
}

// Clear All entries
function triggerClearAll() {
    if (confirm("WARNING: Are you sure you want to delete ALL work logs? This cannot be undone.")) {
        workLogs = [];
        saveData();
        resetForm();
        showToast("All log data has been wiped.", "warning");
    }
}

// Update statistics displays
function updateCalculations() {
    let totalHours = 0;
    let totalTasks = workLogs.length;

    workLogs.forEach(log => {
        totalHours += parseFloat(log.hours || 0);
    });

    const avgHours = totalTasks > 0 ? (totalHours / totalTasks) : 0;

    // Determine date range covered
    let dateText = "N/A";
    if (totalTasks > 0) {
        const dates = workLogs.map(log => new Date(log.date));
        const minDate = new Date(Math.min.apply(null, dates));
        const maxDate = new Date(Math.max.apply(null, dates));

        const opt = { month: 'short', day: 'numeric', year: 'numeric' };
        if (minDate.toDateString() === maxDate.toDateString()) {
            dateText = minDate.toLocaleDateString('en-US', opt);
        } else {
            dateText = `${minDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${maxDate.toLocaleDateString('en-US', opt)}`;
        }
    }

    // Bind values to UI
    document.getElementById('stat-total-hours').textContent = totalHours.toFixed(1);
    document.getElementById('stat-total-tasks').textContent = totalTasks;
    document.getElementById('stat-avg-hours').textContent = avgHours.toFixed(1);
    document.getElementById('stat-period-range').textContent = dateText;

    // Bind values to Print Layout
    document.getElementById('print-stat-hours').textContent = `${totalHours.toFixed(1)} hrs`;
    document.getElementById('print-stat-tasks').textContent = totalTasks;
    document.getElementById('print-stat-period').textContent = dateText;
    document.getElementById('print-timestamp').textContent = `Printed: ${new Date().toLocaleString()}`;
}

// Filter and Render logs in desktop and mobile viewport structures
function renderTable() {
    const searchQuery = document.getElementById('search-query').value.toLowerCase().trim();
    const filterStart = document.getElementById('filter-start').value;
    const filterEnd = document.getElementById('filter-end').value;

    // Filter entries
    const filteredLogs = workLogs.filter(log => {
        const matchesSearch = log.description.toLowerCase().includes(searchQuery) ||
            (log.learnings && log.learnings.toLowerCase().includes(searchQuery));

        let matchesStart = true;
        if (filterStart) {
            matchesStart = new Date(log.date) >= new Date(filterStart);
        }

        let matchesEnd = true;
        if (filterEnd) {
            matchesEnd = new Date(log.date) <= new Date(filterEnd);
        }

        return matchesSearch && matchesStart && matchesEnd;
    });

    // Sort logs by date descending
    filteredLogs.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Elements
    const tbody = document.getElementById('entries-tbody');
    const mobileList = document.getElementById('entries-mobile-list');
    const emptyState = document.getElementById('empty-state');
    const visibleCountBadge = document.getElementById('visible-count-badge');

    // Render visible counter
    if (visibleCountBadge) {
        visibleCountBadge.textContent = `${filteredLogs.length} entries`;
    }

    if (filteredLogs.length === 0) {
        if (tbody) tbody.innerHTML = '';
        if (mobileList) mobileList.innerHTML = '';
        if (emptyState) emptyState.classList.remove('hidden');
        return;
    }

    if (emptyState) emptyState.classList.add('hidden');

    // Render Desktop Table Rows
    let tbodyHTML = '';
    // Render Mobile Cards List
    let mobileHTML = '';

    filteredLogs.forEach(log => {
        const formattedDate = new Date(log.date).toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });

        // Escape HTML characters to prevent XSS
        const escDesc = escapeHtml(log.description);
        const escLearnings = escapeHtml(log.learnings || '');

        tbodyHTML += `
            <tr class="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                <td class="px-6 py-4 font-medium text-slate-900 dark:text-slate-200 whitespace-nowrap">
                    ${formattedDate}
                </td>
                <td class="px-6 py-4 text-center font-semibold text-slate-800 dark:text-slate-100">
                    ${parseFloat(log.hours).toFixed(1)}
                </td>
                <td class="px-6 py-4 text-slate-700 dark:text-slate-300 break-words max-w-xs">
                    ${escDesc}
                </td>
                <td class="px-6 py-4 text-slate-600 dark:text-slate-400 break-words max-w-sm">
                    ${escLearnings ? escLearnings : '<span class="text-xs text-slate-400 italic">No notes written.</span>'}
                </td>
                <td class="px-6 py-4 text-right whitespace-nowrap text-xs font-semibold no-print">
                    <div class="flex justify-end gap-1.5">
                        <button onclick="editEntry('${log.id}')" class="p-2 text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/30 rounded-lg transition-all cursor-pointer" title="Edit entry">
                            <i class="fa-solid fa-pen"></i>
                        </button>
                        <button onclick="deleteEntry('${log.id}')" class="p-2 text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-all cursor-pointer" title="Delete entry">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;

        mobileHTML += `
            <div class="p-5 space-y-3">
                <div class="flex justify-between items-start">
                    <div>
                        <span class="text-xs font-semibold text-slate-400 block">${formattedDate}</span>
                        <span class="inline-flex items-center gap-1 mt-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-brand-50 dark:bg-brand-950/30 text-brand-700 dark:text-brand-300">
                            <i class="fa-regular fa-clock text-[10px]"></i> ${parseFloat(log.hours).toFixed(1)} hrs
                        </span>
                    </div>
                    <div class="flex items-center gap-1 no-print">
                        <button onclick="editEntry('${log.id}')" class="p-2 text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg cursor-pointer">
                            <i class="fa-solid fa-pencil"></i>
                        </button>
                        <button onclick="deleteEntry('${log.id}')" class="p-2 text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg cursor-pointer">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </div>
                </div>
                <div>
                    <span class="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-0.5">Task Description</span>
                    <p class="text-sm text-slate-800 dark:text-slate-200 break-words">${escDesc}</p>
                </div>
                <div>
                    <span class="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-0.5">Insights & Learnings</span>
                    <p class="text-sm text-slate-600 dark:text-slate-400 break-words">
                        ${escLearnings ? escLearnings : '<span class="text-xs text-slate-400 italic">No notes written.</span>'}
                    </p>
                </div>
            </div>
        `;
    });

    if (tbody) tbody.innerHTML = tbodyHTML;
    if (mobileList) mobileList.innerHTML = mobileHTML;
}

// HTML escaping utility to prevent XSS
function escapeHtml(str) {
    if (!str) return '';
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Trigger input dialog for JSON upload
function triggerImportClick() {
    document.getElementById('import-file-input').click();
    toggleDropdown();
}

// Export data as JSON file for download
function triggerExportJSON() {
    toggleDropdown();
    if (workLogs.length === 0) {
        showToast("No work log data exists to export.", "warning");
        return;
    }

    const exportObj = {
        profile: profile,
        logs: workLogs,
        exportedAt: new Date().toISOString()
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportObj, null, 2));
    const downloadAnchor = document.createElement('a');

    const fileSafeName = profile.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `wcl_backup_${fileSafeName}_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    showToast("Backup exported as JSON successfully", "success");
}

// Import JSON file log entries
function handleImportJSON(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            const parsed = JSON.parse(e.target.result);

            if (parsed.logs && Array.isArray(parsed.logs)) {
                // Confirm override
                if (confirm(`Found ${parsed.logs.length} work log entries. Would you like to merge them with current logs? (Click CANCEL to overwrite current logs completely)`)) {
                    // Merge logs, checking for duplicates by date and description
                    const oldIds = new Set(workLogs.map(l => l.id));
                    parsed.logs.forEach(log => {
                        // assign new ID to avoid conflict if merging
                        if (oldIds.has(log.id)) {
                            log.id = 'log_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
                        }
                        workLogs.push(log);
                    });
                } else {
                    workLogs = parsed.logs;
                }

                if (parsed.profile) {
                    profile = { ...profile, ...parsed.profile };
                    saveProfileToStorage();
                    updateProfileUI();
                }

                saveData();
                showToast("JSON logs imported successfully", "success");
            } else {
                showToast("Invalid JSON schema. Ensure it contains a valid log entries list.", "error");
            }
        } catch (err) {
            console.error("Error reading import file:", err);
            showToast("Failed to parse JSON file.", "error");
        }
        // Clear input
        event.target.value = '';
    };
    reader.readAsText(file);
}

// Inject high-quality demo dataset
function loadDemoData() {
    const demoLogs = [
        {
            id: "demo_1",
            date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            hours: 6.5,
            description: "Built the database migration schema and repository patterns for user profiles using Drizzle ORM and PostgreSQL.",
            learnings: "Deepened knowledge in structured database indexing. Solved a circular dependency bug in relational definitions between workspace profiles."
        },
        {
            id: "demo_2",
            date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            hours: 4.0,
            description: "Optimized dashboard charts queries to aggregate hourly metrics efficiently using raw CTE queries.",
            learnings: "Learned how PostgreSQL handles subqueries and index scans. SQL optimization reduced database load from 450ms query response to 28ms."
        },
        {
            id: "demo_3",
            date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            hours: 8.0,
            description: "Refactored user authentication endpoints to support Multi-Factor Authentication (MFA) via TOTP.",
            learnings: "Acquired insights into standard cryptographic algorithms (HMAC/SHA1) for generating time-based one-time passwords. Implemented secure recovery code cycles."
        }
    ];

    if (workLogs.length > 0) {
        if (!confirm("This will merge or overwrite current logs. Proceed to load demo logs?")) {
            return;
        }
    }

    workLogs = [...demoLogs, ...workLogs];
    saveData();
    showToast("Demo contribution logs loaded.", "success");
}

// Toggle Batch Log accordion panel
function toggleBatchPanel() {
    const panel = document.getElementById('batch-import-panel');
    const chevron = document.getElementById('batch-panel-chevron');
    if (panel.classList.contains('hidden')) {
        panel.classList.remove('hidden');
        chevron.style.transform = 'rotate(180deg)';
        updateBatchDayCount();
        document.getElementById('batch-start-date').addEventListener('change', updateBatchDayCount);
        document.getElementById('batch-end-date').addEventListener('change', updateBatchDayCount);
    } else {
        panel.classList.add('hidden');
        chevron.style.transform = 'rotate(0deg)';
    }
}

// Update the day count badge in the batch button
function updateBatchDayCount() {
    const start = document.getElementById('batch-start-date').value;
    const end = document.getElementById('batch-end-date').value;
    const badge = document.getElementById('batch-day-count');
    if (start && end) {
        const s = new Date(start);
        const e = new Date(end);
        const diff = Math.floor((e - s) / (1000 * 60 * 60 * 24)) + 1;
        badge.textContent = diff > 0 ? diff : 0;
    } else {
        badge.textContent = '0';
    }
}

// Set date range to the past 7 days
function setLastWeek() {
    const today = new Date();
    const weekAgo = new Date(today);
    weekAgo.setDate(today.getDate() - 6);
    document.getElementById('batch-start-date').value = weekAgo.toISOString().split('T')[0];
    document.getElementById('batch-end-date').value = today.toISOString().split('T')[0];
    updateBatchDayCount();
}

// Submit batch log entries - creates one entry per day in the date range
function handleBatchSubmit() {
    const start = document.getElementById('batch-start-date').value;
    const end = document.getElementById('batch-end-date').value;
    const hours = parseFloat(document.getElementById('batch-hours').value);
    const description = document.getElementById('batch-description').value.trim();
    const learnings = document.getElementById('batch-learnings').value.trim();

    if (!start || !end) {
        showToast("Please select both start and end dates.", "warning");
        return;
    }
    if (isNaN(hours) || hours <= 0) {
        showToast("Please enter valid hours per day.", "warning");
        return;
    }
    if (!description) {
        showToast("Please enter a task description.", "warning");
        return;
    }

    const s = new Date(start);
    const e = new Date(end);
    if (e < s) {
        showToast("End date must be after start date.", "error");
        return;
    }

    let count = 0;
    const current = new Date(s);
    while (current <= e) {
        const dateStr = current.toISOString().split('T')[0];
        const newLog = {
            id: 'log_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            date: dateStr,
            hours: hours,
            description: description + (learnings ? ` [${learnings}]` : ''),
            learnings: learnings || ''
        };
        workLogs.push(newLog);
        current.setDate(current.getDate() + 1);
        count++;
    }

    saveData();
    showToast(`${count} daily log entries created successfully!`, "success");

    // Clear batch form fields
    document.getElementById('batch-description').value = '';
    document.getElementById('batch-learnings').value = '';
    document.getElementById('batch-start-date').value = '';
    document.getElementById('batch-end-date').value = '';
    document.getElementById('batch-hours').value = '2.0';
    updateBatchDayCount();
}

// Toggle GitHub import accordion panel
function toggleGithubPanel() {
    const panel = document.getElementById('github-import-panel');
    const chevron = document.getElementById('github-panel-chevron');
    if (panel.classList.contains('hidden')) {
        panel.classList.remove('hidden');
        chevron.style.transform = 'rotate(180deg)';
    } else {
        panel.classList.add('hidden');
        chevron.style.transform = 'rotate(0deg)';
    }
}

// Fetch Commit, PR, or Issue details from GitHub REST API
async function importFromGithub() {
    const urlInput = document.getElementById('github-url-input').value.trim();
    const token = profile.githubToken || '';

    if (!urlInput) {
        showToast("Please enter a GitHub URL", "warning");
        return;
    }

    const commitRegex = /https:\/\/github\.com\/([^\/]+)\/([^\/]+)\/commit\/([a-f0-9]+)/i;
    const prRegex = /https:\/\/github\.com\/([^\/]+)\/([^\/]+)\/pull\/(\d+)/i;
    const issueRegex = /https:\/\/github\.com\/([^\/]+)\/([^\/]+)\/issues\/(\d+)/i;

    let apiEndpoint = '';
    let type = '';

    const commitMatch = urlInput.match(commitRegex);
    const prMatch = urlInput.match(prRegex);
    const issueMatch = urlInput.match(issueRegex);

    if (commitMatch) {
        const [_, owner, repo, sha] = commitMatch;
        apiEndpoint = `https://api.github.com/repos/${owner}/${repo}/commits/${sha}`;
        type = 'commit';
    } else if (prMatch) {
        const [_, owner, repo, num] = prMatch;
        apiEndpoint = `https://api.github.com/repos/${owner}/${repo}/pulls/${num}`;
        type = 'pr';
    } else if (issueMatch) {
        const [_, owner, repo, num] = issueMatch;
        apiEndpoint = `https://api.github.com/repos/${owner}/${repo}/issues/${num}`;
        type = 'issue';
    } else {
        showToast("Invalid GitHub URL. Paste a valid Commit, PR, or Issue link.", "error");
        return;
    }

    showToast("Fetching details from GitHub API...", "info");

    const headers = {};
    if (token) {
        headers['Authorization'] = `token ${token}`;
    }

    try {
        const response = await fetch(apiEndpoint, { headers });
        if (!response.ok) {
            if (response.status === 404) {
                throw new Error("Repository or item not found. For private repositories, configure your Personal Access Token in settings.");
            } else if (response.status === 401 || response.status === 403) {
                throw new Error("GitHub API request unauthorized or rate-limited. Configure a token in settings.");
            }
            throw new Error(`GitHub API returned error: status ${response.status}`);
        }

        const data = await response.json();

        let date = '';
        let description = '';
        let learnings = '';
        let hours = 1.0; // default initial value

        if (type === 'commit') {
            const rawDate = data.commit.author.date || data.commit.committer.date;
            date = rawDate.split('T')[0];

            const message = data.commit.message;
            const lines = message.split('\n');
            description = lines[0]; // First line of commit message
            learnings = lines.slice(1).join('\n').trim(); // Detailed body of commit message

            // Attempt parsing hours from message, e.g. "Completed feature [4h]" or "refactor (time: 1.5h)"
            const hoursMatch = message.match(/\b(\d+(?:\.\d+)?)\s*h(?:r|s)?\b/i);
            if (hoursMatch) {
                hours = parseFloat(hoursMatch[1]);
            }
        } else if (type === 'pr') {
            date = (data.merged_at || data.created_at).split('T')[0];
            description = `PR #${data.number}: ${data.title}`;
            learnings = data.body || '';

            const hoursMatch = (data.title + ' ' + (data.body || '')).match(/\b(\d+(?:\.\d+)?)\s*h(?:r|s)?\b/i);
            if (hoursMatch) {
                hours = parseFloat(hoursMatch[1]);
            }
        } else if (type === 'issue') {
            date = data.created_at.split('T')[0];
            description = `Issue #${data.number}: ${data.title}`;
            learnings = data.body || '';
        }

        // Populate into standard form fields
        document.getElementById('entry-date').value = date;
        document.getElementById('entry-hours').value = hours;
        document.getElementById('entry-description').value = description;
        document.getElementById('entry-learnings').value = learnings;

        showToast("Populated data from GitHub! Review the entry and click Add Entry.", "success");
        focusForm();

    } catch (err) {
        console.error(err);
        showToast(err.message, "error");
    }
}

// Generate a condensed, space-efficient table for print output
function renderPrintSummaryTable() {
    const tbody = document.getElementById('entries-tbody');
    if (!tbody) return;

    if (workLogs.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="px-6 py-8 text-center text-xs text-slate-400">No entries to display in summary.</td></tr>';
        return;
    }

    // Sort logs by date descending
    const sorted = [...workLogs].sort((a, b) => new Date(b.date) - new Date(a.date));

    let html = '';
    sorted.forEach(log => {
        const formattedDate = new Date(log.date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });

        // Truncate description to 100 characters for print
        const desc = log.description || '';
        const shortDesc = desc.length > 100 ? desc.substring(0, 97) + '...' : desc;

        // Truncate learnings to 80 characters for print
        const learn = log.learnings || '';
        const shortLearn = learn.length > 80 ? learn.substring(0, 77) + '...' : learn;

        const escDesc = escapeHtml(shortDesc);
        const escLearn = escapeHtml(shortLearn);

        html += `
            <tr>
                <td class="px-3 py-2 text-xs font-medium text-slate-800 whitespace-nowrap">${formattedDate}</td>
                <td class="px-3 py-2 text-xs text-center font-semibold text-slate-800">${parseFloat(log.hours).toFixed(1)}</td>
                <td class="px-3 py-2 text-xs text-slate-700">${escDesc}</td>
                <td class="px-3 py-2 text-xs text-slate-600">${escLearn ? escLearn : '<span class="text-slate-400 italic">—</span>'}</td>
            </tr>
        `;
    });

    tbody.innerHTML = html;
}

// Vanilla Custom Toast System
function showToast(message, type = "info") {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');

    // Setup style variables
    let icon = '<i class="fa-solid fa-info-circle"></i>';
    let bgClass = 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border-slate-200 dark:border-slate-700';

    if (type === "success") {
        icon = '<i class="fa-solid fa-circle-check text-emerald-500"></i>';
        bgClass = 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border-emerald-100 dark:border-emerald-950/30';
    } else if (type === "warning") {
        icon = '<i class="fa-solid fa-triangle-exclamation text-amber-500"></i>';
        bgClass = 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border-amber-100 dark:border-amber-950/30';
    } else if (type === "error") {
        icon = '<i class="fa-solid fa-circle-xmark text-rose-500"></i>';
        bgClass = 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border-rose-100 dark:border-rose-950/30';
    }

    toast.className = `flex items-center gap-3 p-4 rounded-xl border shadow-lg max-w-sm w-80 toast-enter ${bgClass}`;
    toast.innerHTML = `
        <div class="text-lg flex-shrink-0">${icon}</div>
        <div class="text-xs font-semibold flex-grow leading-tight">${message}</div>
        <button class="text-slate-400 hover:text-slate-600 dark:hover:text-white flex-shrink-0" onclick="this.parentElement.remove()">
            <i class="fa-solid fa-xmark"></i>
        </button>
    `;

    container.appendChild(toast);

    // Animation triggers
    setTimeout(() => {
        toast.classList.add('toast-active');
    }, 10);

    // Auto dismiss toast
    setTimeout(() => {
        toast.classList.remove('toast-active');
        toast.style.transform = 'translateY(-1rem) scale(0.95)';
        toast.style.opacity = '0';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 4000);
}
