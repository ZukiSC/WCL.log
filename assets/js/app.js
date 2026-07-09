// State variables
let workLogs = [];
let profile = {
    name: "Part-time Programmer",
    role: "Developer",
    githubToken: ""
};
let isDarkMode = false;
let schoolStartDate = null; // Date string YYYY-MM-DD when school started

// Schedule & Calendar State
let subjects = [];
let weeklyTopics = {}; // key: `${subjectId}_${weekKey}`, value: topic string
let calendarViewDate = new Date(2026, 5, 1); // June 1, 2026
let calendarSelectedDate = null;

// Initialize Application
window.addEventListener('DOMContentLoaded', () => {
    const yearEl = document.getElementById('current-year');
    if (yearEl) {
        yearEl.textContent = new Date().getFullYear();
    }

    loadData();

    resetFormDate();

    window.addEventListener('click', (e) => {
        const dropdown = document.getElementById('backup-dropdown');
        const btn = document.getElementById('backup-dropdown-btn');
        if (dropdown && btn && !btn.contains(e.target) && !dropdown.contains(e.target)) {
            dropdown.classList.add('hidden');
        }
    });

    window.addEventListener('beforeprint', () => {
        updateCalculations();
        renderPrintSummaryTable();
    });

    window.addEventListener('afterprint', () => {
        renderTable();
    });
});

// Load profile, logs, subjects, weekly topics from localStorage
function loadData() {
    const savedLogs = localStorage.getItem('wcl_logs');
    if (savedLogs) {
        try {
            workLogs = JSON.parse(savedLogs);
        } catch (e) {
            console.error("Error parsing saved work logs:", e);
            workLogs = [];
        }
    }

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

    // Load subjects
    const savedSubjects = localStorage.getItem('wcl_subjects');
    if (savedSubjects) {
        try {
            subjects = JSON.parse(savedSubjects);
        } catch (e) {
            console.error("Error parsing subjects:", e);
            subjects = [];
        }
    }

    // Load weekly topics
    const savedTopics = localStorage.getItem('wcl_weekly_topics');
    if (savedTopics) {
        try {
            weeklyTopics = JSON.parse(savedTopics);
        } catch (e) {
            console.error("Error parsing weekly topics:", e);
            weeklyTopics = {};
        }
    }

    // Load school start date
    const savedSchoolStart = localStorage.getItem('wcl_school_start');
    if (savedSchoolStart) {
        schoolStartDate = savedSchoolStart;
        const schoolInput = document.getElementById('school-start-date-input');
        if (schoolInput) schoolInput.value = savedSchoolStart;
    }

    const savedTheme = localStorage.getItem('wcl_theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        setTheme(true);
    } else {
        setTheme(false);
    }

    updateProfileUI();
    renderTable();
    updateCalculations();
    updateWeeklyTracker();
    renderSubjectList();
    renderCalendar();
}

// Save logs to localStorage
function saveData() {
    localStorage.setItem('wcl_logs', JSON.stringify(workLogs));
    renderTable();
    updateCalculations();
    updateWeeklyTracker();
}

// Save subjects to localStorage
function saveSubjects() {
    localStorage.setItem('wcl_subjects', JSON.stringify(subjects));
    renderSubjectList();
}

// Save weekly topics
function saveWeeklyTopicsData() {
    localStorage.setItem('wcl_weekly_topics', JSON.stringify(weeklyTopics));
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
    const schoolStartVal = document.getElementById('school-start-date-input').value;

    if (!nameVal) {
        showToast("Please enter a valid developer name", "error");
        return;
    }

    profile.name = nameVal;
    profile.role = roleVal || "Part-time Programmer";
    profile.githubToken = tokenVal;

    // Save school start date
    if (schoolStartVal) {
        schoolStartDate = schoolStartVal;
        localStorage.setItem('wcl_school_start', schoolStartVal);
    } else {
        schoolStartDate = null;
        localStorage.removeItem('wcl_school_start');
    }

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
    if (calendarSelectedDate) {
        calendarSelectedDate = null;
        renderCalendar();
    }
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
        const idx = workLogs.findIndex(log => log.id === entryId);
        if (idx !== -1) {
            workLogs[idx] = { ...workLogs[idx], date, hours, description, learnings };
            showToast("Work log entry updated.", "success");
        }
    } else {
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
    renderCalendar();
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
        renderCalendar();
        showToast("Log entry successfully removed.", "success");
    }
}

// Clear All entries
function triggerClearAll() {
    if (confirm("WARNING: Are you sure you want to delete ALL work logs? This cannot be undone.")) {
        workLogs = [];
        saveData();
        resetForm();
        renderCalendar();
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

    document.getElementById('stat-total-hours').textContent = totalHours.toFixed(1);
    document.getElementById('stat-total-tasks').textContent = totalTasks;
    document.getElementById('stat-avg-hours').textContent = avgHours.toFixed(1);
    document.getElementById('stat-period-range').textContent = dateText;

    document.getElementById('print-stat-hours').textContent = `${totalHours.toFixed(1)} hrs`;
    document.getElementById('print-stat-tasks').textContent = totalTasks;
    document.getElementById('print-stat-period').textContent = dateText;
    document.getElementById('print-timestamp').textContent = `Printed: ${new Date().toLocaleString()}`;
}

// ===== 21 HR WEEKLY TRACKER =====
function updateWeeklyTracker() {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    monday.setHours(0, 0, 0, 0);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    let weekHours = 0;
    workLogs.forEach(log => {
        const logDate = new Date(log.date + 'T00:00:00');
        if (logDate >= monday && logDate <= sunday) {
            weekHours += parseFloat(log.hours || 0);
        }
    });

    const quota = 21;
    const pct = Math.min(100, (weekHours / quota) * 100);

    document.getElementById('stat-weekly-label').textContent = `Week of ${monday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    document.getElementById('stat-weekly-hours').textContent = `${weekHours.toFixed(1)} / ${quota}`;

    const fill = document.getElementById('weekly-progress-fill');
    fill.style.width = `${pct}%`;
    fill.className = 'progress-bar-fill';
    if (pct >= 100) {
        fill.classList.add('green');
    } else if (pct >= 70) {
        fill.classList.add('yellow');
    } else {
        fill.classList.add('red');
    }

    // Warning if below 15hrs and it's Thursday+ 
    if (dayOfWeek >= 4 && weekHours < 15) {
        const daysLeft = 7 - dayOfWeek;
        showToast(`⚠️ Only ${weekHours.toFixed(1)} hrs this week. You need ${(quota - weekHours).toFixed(1)} more hrs in ${daysLeft} day(s)!`, "warning");
    }
}

// Filter and Render logs
function renderTable() {
    const searchQuery = document.getElementById('search-query').value.toLowerCase().trim();
    const filterStart = document.getElementById('filter-start').value;
    const filterEnd = document.getElementById('filter-end').value;

    const filteredLogs = workLogs.filter(log => {
        const matchesSearch = log.description.toLowerCase().includes(searchQuery) ||
            (log.learnings && log.learnings.toLowerCase().includes(searchQuery));

        let matchesStart = true;
        if (filterStart) {
            matchesStart = new Date(log.date) >= new Date(filterStart + 'T00:00:00');
        }

        let matchesEnd = true;
        if (filterEnd) {
            matchesEnd = new Date(log.date) <= new Date(filterEnd + 'T23:59:59');
        }

        return matchesSearch && matchesStart && matchesEnd;
    });

    filteredLogs.sort((a, b) => new Date(b.date) - new Date(a.date));

    const tbody = document.getElementById('entries-tbody');
    const mobileList = document.getElementById('entries-mobile-list');
    const emptyState = document.getElementById('empty-state');
    const visibleCountBadge = document.getElementById('visible-count-badge');

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

    let tbodyHTML = '';
    let mobileHTML = '';

    filteredLogs.forEach(log => {
        const formattedDate = new Date(log.date).toLocaleDateString('en-US', {
            weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
        });

        const escDesc = escapeHtml(log.description);
        const escLearnings = escapeHtml(log.learnings || '');

        tbodyHTML += `
            <tr class="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                <td class="px-6 py-4 font-medium text-slate-900 dark:text-slate-200 whitespace-nowrap">${formattedDate}</td>
                <td class="px-6 py-4 text-center font-semibold text-slate-800 dark:text-slate-100">${parseFloat(log.hours).toFixed(1)}</td>
                <td class="px-6 py-4 text-slate-700 dark:text-slate-300 break-words max-w-xs">${escDesc}</td>
                <td class="px-6 py-4 text-slate-600 dark:text-slate-400 break-words max-w-sm">${escLearnings ? escLearnings : '<span class="text-xs text-slate-400 italic">No notes written.</span>'}</td>
                <td class="px-6 py-4 text-right whitespace-nowrap text-xs font-semibold no-print">
                    <div class="flex justify-end gap-1.5">
                        <button onclick="editEntry('${log.id}')" class="p-2 text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/30 rounded-lg transition-all cursor-pointer" title="Edit entry"><i class="fa-solid fa-pen"></i></button>
                        <button onclick="deleteEntry('${log.id}')" class="p-2 text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-all cursor-pointer" title="Delete entry"><i class="fa-solid fa-trash-can"></i></button>
                    </div>
                </td>
            </tr>`;

        mobileHTML += `
            <div class="p-5 space-y-3">
                <div class="flex justify-between items-start">
                    <div>
                        <span class="text-xs font-semibold text-slate-400 block">${formattedDate}</span>
                        <span class="inline-flex items-center gap-1 mt-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-brand-50 dark:bg-brand-950/30 text-brand-700 dark:text-brand-300"><i class="fa-regular fa-clock text-[10px]"></i> ${parseFloat(log.hours).toFixed(1)} hrs</span>
                    </div>
                    <div class="flex items-center gap-1 no-print">
                        <button onclick="editEntry('${log.id}')" class="p-2 text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg cursor-pointer"><i class="fa-solid fa-pencil"></i></button>
                        <button onclick="deleteEntry('${log.id}')" class="p-2 text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg cursor-pointer"><i class="fa-solid fa-trash-can"></i></button>
                    </div>
                </div>
                <div>
                    <span class="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-0.5">Task Description</span>
                    <p class="text-sm text-slate-800 dark:text-slate-200 break-words">${escDesc}</p>
                </div>
                <div>
                    <span class="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-0.5">Insights & Learnings</span>
                    <p class="text-sm text-slate-600 dark:text-slate-400 break-words">${escLearnings ? escLearnings : '<span class="text-xs text-slate-400 italic">No notes written.</span>'}</p>
                </div>
            </div>`;
    });

    if (tbody) tbody.innerHTML = tbodyHTML;
    if (mobileList) mobileList.innerHTML = mobileHTML;
}

// HTML escaping utility
function escapeHtml(str) {
    if (!str) return '';
    var amp = '&' + 'amp;';
    var lt = '&' + 'lt;';
    var gt = '&' + 'gt;';
    var quot = '&' + 'quot;';
    var apos = '&' + '#039;';
    return str
        .replace(/&/g, amp)
        .replace(/</g, lt)
        .replace(/>/g, gt)
        .replace(/"/g, quot)
        .replace(/'/g, apos);
}

// Trigger input dialog for JSON upload
function triggerImportClick() {
    document.getElementById('import-file-input').click();
    toggleDropdown();
}

// Export data as JSON file
function triggerExportJSON() {
    toggleDropdown();
    if (workLogs.length === 0) {
        showToast("No work log data exists to export.", "warning");
        return;
    }

    const exportObj = {
        profile: profile,
        logs: workLogs,
        subjects: subjects,
        weeklyTopics: weeklyTopics,
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

// Import JSON file
function handleImportJSON(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            const parsed = JSON.parse(e.target.result);

            if (parsed.logs && Array.isArray(parsed.logs)) {
                if (confirm(`Found ${parsed.logs.length} work log entries. Would you like to merge them with current logs? (Click CANCEL to overwrite)`)) {
                    const oldIds = new Set(workLogs.map(l => l.id));
                    parsed.logs.forEach(log => {
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

                // Import subjects if present
                if (parsed.subjects && Array.isArray(parsed.subjects)) {
                    subjects = parsed.subjects;
                    saveSubjects();
                }
                if (parsed.weeklyTopics) {
                    weeklyTopics = parsed.weeklyTopics;
                    saveWeeklyTopicsData();
                }

                saveData();
                renderSubjectList();
                renderCalendar();
                showToast("JSON logs imported successfully", "success");
            } else {
                showToast("Invalid JSON schema.", "error");
            }
        } catch (err) {
            console.error("Error reading import file:", err);
            showToast("Failed to parse JSON file.", "error");
        }
        event.target.value = '';
    };
    reader.readAsText(file);
}

// ===== TAB SWITCHING =====
function switchTab(tab) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`tab-${tab}`).classList.add('active');

    // Update tab content
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.getElementById(`tab-content-${tab}`).classList.add('active');

    // Refresh calendar when switching to it
    if (tab === 'calendar') {
        renderCalendar();
    }
    if (tab === 'schedule') {
        renderSubjectList();
    }
}

// ===== SCHEDULE MANAGER =====
function addSubject() {
    const code = document.getElementById('subj-code').value.trim().toUpperCase();
    const name = document.getElementById('subj-name').value.trim();
    const instructor = document.getElementById('subj-instructor').value.trim();
    const room = document.getElementById('subj-room').value.trim();
    const startTime = document.getElementById('subj-start').value;
    const endTime = document.getElementById('subj-end').value;
    const credits = parseInt(document.getElementById('subj-credits').value) || 3;

    // Get checked days
    const dayCheckboxes = document.querySelectorAll('#tab-content-schedule .day-checkbox-input:checked');
    const days = Array.from(dayCheckboxes).map(cb => parseInt(cb.value));

    if (!code || !name || !instructor || !startTime || !endTime) {
        showToast("Please fill in all required fields (Code, Name, Instructor, Start/End Time).", "error");
        return;
    }
    if (days.length === 0) {
        showToast("Please select at least one schedule day.", "error");
        return;
    }
    if (startTime >= endTime) {
        showToast("End time must be after start time.", "error");
        return;
    }

    // Check if editing existing
    const editId = document.getElementById('add-subject-btn').dataset.editId;
    if (editId) {
        const idx = subjects.findIndex(s => s.id === editId);
        if (idx !== -1) {
            subjects[idx] = { ...subjects[idx], code, name, instructor, room, startTime, endTime, days, credits };
            showToast("Subject updated.", "success");
        }
        document.getElementById('add-subject-btn').dataset.editId = '';
        document.getElementById('add-subject-btn-text').textContent = 'Add Subject';
        document.getElementById('cancel-subject-btn').classList.add('hidden');
    } else {
        const newSubj = {
            id: 'subj_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
            code, name, instructor, room, startTime, endTime, days, credits,
            createdAt: new Date().toISOString().split('T')[0]
        };
        subjects.push(newSubj);
        showToast(`Subject "${code} - ${name}" added.`, "success");
    }

    resetSubjectForm();
    saveSubjects();
}

function editSubject(id) {
    const subj = subjects.find(s => s.id === id);
    if (!subj) return;

    document.getElementById('subj-code').value = subj.code;
    document.getElementById('subj-name').value = subj.name;
    document.getElementById('subj-instructor').value = subj.instructor;
    document.getElementById('subj-room').value = subj.room;
    document.getElementById('subj-start').value = subj.startTime;
    document.getElementById('subj-end').value = subj.endTime;
    document.getElementById('subj-credits').value = subj.credits;

    // Uncheck all first
    document.querySelectorAll('#tab-content-schedule .day-checkbox-input').forEach(cb => cb.checked = false);
    // Check the subject's days
    subj.days.forEach(d => {
        const cb = document.querySelector(`#tab-content-schedule .day-checkbox-input[value="${d}"]`);
        if (cb) cb.checked = true;
    });

    document.getElementById('add-subject-btn').dataset.editId = id;
    document.getElementById('add-subject-btn-text').textContent = 'Update Subject';
    document.getElementById('cancel-subject-btn').classList.remove('hidden');
}

function deleteSubject(id) {
    if (confirm("Delete this subject from your schedule?")) {
        subjects = subjects.filter(s => s.id !== id);
        saveSubjects();
        showToast("Subject removed.", "success");
    }
}

function resetSubjectForm() {
    document.getElementById('subj-code').value = '';
    document.getElementById('subj-name').value = '';
    document.getElementById('subj-instructor').value = '';
    document.getElementById('subj-room').value = '';
    document.getElementById('subj-start').value = '';
    document.getElementById('subj-end').value = '';
    document.getElementById('subj-credits').value = '3';
    document.querySelectorAll('#tab-content-schedule .day-checkbox-input').forEach(cb => cb.checked = false);
    document.getElementById('add-subject-btn').dataset.editId = '';
    document.getElementById('add-subject-btn-text').textContent = 'Add Subject';
    document.getElementById('cancel-subject-btn').classList.add('hidden');
}

function renderSubjectList() {
    const container = document.getElementById('subject-list');
    const countBadge = document.getElementById('schedule-subject-count');
    if (countBadge) countBadge.textContent = `${subjects.length} subjects`;

    if (subjects.length === 0) {
        container.innerHTML = `<div class="text-center py-6 text-xs text-slate-400"><i class="fa-solid fa-book-open text-lg block mb-2 opacity-50"></i>No subjects added yet. Add your school schedule above.</div>`;
        return;
    }

    let html = '';
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weekKey = getWeekKey(new Date());

    subjects.forEach(subj => {
        const hrsPerSession = computeHours(subj.startTime, subj.endTime);
        const hrsPerWeek = (hrsPerSession * subj.days.length).toFixed(1);
        const daysStr = subj.days.map(d => dayNames[d]).join(', ');
        const topic = weeklyTopics[`${subj.id}_${weekKey}`] || '';

        html += `
            <div class="subject-card bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl p-3">
                <div class="flex items-start justify-between gap-2">
                    <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-1.5 flex-wrap">
                            <span class="text-xs font-bold text-brand-600 dark:text-brand-400">${escapeHtml(subj.code)}</span>
                            <span class="text-[10px] text-slate-400 font-medium">${escapeHtml(subj.name)}</span>
                        </div>
                        <div class="text-[10px] text-slate-500 mt-0.5">${escapeHtml(subj.instructor)} · ${escapeHtml(subj.room)}</div>
                        <div class="text-[10px] text-slate-400 mt-0.5">${daysStr} · ${subj.startTime}-${subj.endTime} · ${hrsPerSession.toFixed(1)}hr/session · ${hrsPerWeek}hr/wk</div>
                        ${topic ? `<div class="text-[10px] text-emerald-600 dark:text-emerald-400 mt-0.5 font-medium italic">📘 ${escapeHtml(topic)}</div>` : ''}
                    </div>
                    <div class="flex gap-1 flex-shrink-0">
                        <button onclick="logSubjectToday('${subj.id}')" class="p-1.5 text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 rounded-lg transition-all cursor-pointer" title="Log Today"><i class="fa-solid fa-bolt text-[10px]"></i></button>
                        <button onclick="editSubject('${subj.id}')" class="p-1.5 text-amber-600 hover:text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 rounded-lg transition-all cursor-pointer" title="Edit"><i class="fa-solid fa-pen text-[10px]"></i></button>
                        <button onclick="deleteSubject('${subj.id}')" class="p-1.5 text-rose-600 hover:text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-all cursor-pointer" title="Delete"><i class="fa-solid fa-trash-can text-[10px]"></i></button>
                    </div>
                </div>
            </div>`;
    });

    container.innerHTML = html;
}

function computeHours(startTime, endTime) {
    const [sh, sm] = startTime.split(':').map(Number);
    const [eh, em] = endTime.split(':').map(Number);
    return Math.max(0, ((eh * 60 + em) - (sh * 60 + sm)) / 60);
}

function getWeekKey(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diff));
    return `${monday.getFullYear()}-W${String(Math.ceil((monday.getTime() - new Date(monday.getFullYear(), 0, 1).getTime()) / 86400000 / 7)).padStart(2, '0')}`;
}

function getMondayOfWeek(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday;
}

function logSubjectToday(subjectId) {
    const subj = subjects.find(s => s.id === subjectId);
    if (!subj) return;

    const today = new Date();
    const todayDay = today.getDay(); // 0=Sun, 1=Mon... 6=Sat
    if (!subj.days.includes(todayDay)) {
        showToast(`${subj.code} is not scheduled today (${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][todayDay]}).`, "warning");
        return;
    }

    createLogFromSubject(subj, today.toISOString().split('T')[0]);
}

function logAllSubjectsForWeek() {
    const monday = getMondayOfWeek(new Date());
    let count = 0;
    let skipped = 0;

    for (let i = 0; i < 7; i++) {
        const day = new Date(monday);
        day.setDate(monday.getDate() + i);
        const dayOfWeek = day.getDay(); // 0=Sun, 6=Sat
        const dateStr = day.toISOString().split('T')[0];

        subjects.forEach(subj => {
            if (subj.days.includes(dayOfWeek)) {
                // Check for duplicate
                const exists = workLogs.some(log => log.date === dateStr && log.description.startsWith(`[${subj.code}]`));
                if (exists) {
                    skipped++;
                } else {
                    createLogFromSubject(subj, dateStr);
                    count++;
                }
            }
        });
    }

    saveData();
    renderCalendar();
    const msg = count > 0 ? `${count} log entries created.` : 'No new entries.';
    const skipMsg = skipped > 0 ? ` (${skipped} skipped - already logged)` : '';
    showToast(`✅ ${msg}${skipMsg}`, count > 0 ? "success" : "info");
}

// ===== LOG ALL SUBJECTS IN A CUSTOM DATE RANGE =====
function logSubjectsInRange() {
    const startVal = document.getElementById('range-start-date').value;
    const endVal = document.getElementById('range-end-date').value;

    if (!startVal || !endVal) {
        showToast("Please select both From and To dates.", "warning");
        return;
    }
    if (subjects.length === 0) {
        showToast("Add subjects first before batch logging.", "warning");
        return;
    }

    const startDate = new Date(startVal);
    const endDate = new Date(endVal);
    endDate.setHours(23, 59, 59, 999);

    if (endDate < startDate) {
        showToast("End date must be after start date.", "error");
        return;
    }

    // Confirm with user about the scope
    const totalDays = Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
    const estimatedEntries = subjects.reduce((sum, subj) => sum + subj.days.length, 0) * Math.ceil(totalDays / 7);

    if (!confirm(`This will log all subjects from ${startVal} to ${endVal} (${totalDays} days, ~${estimatedEntries} possible entries). Duplicates will be skipped. Proceed?`)) {
        return;
    }

    let count = 0;
    let skipped = 0;

    // Iterate through each day in the range
    const current = new Date(startDate);
    current.setHours(0, 0, 0, 0);

    while (current <= endDate) {
        const dayOfWeek = current.getDay(); // 0=Sun, 6=Sat
        const dateStr = current.toISOString().split('T')[0];

        subjects.forEach(subj => {
            if (subj.days.includes(dayOfWeek)) {
                // Check for duplicate
                const exists = workLogs.some(log => log.date === dateStr && log.description.startsWith(`[${subj.code}]`));
                if (exists) {
                    skipped++;
                } else {
                    createLogFromSubject(subj, dateStr);
                    count++;
                }
            }
        });

        current.setDate(current.getDate() + 1);
    }

    saveData();
    renderCalendar();
    const msg = count > 0 ? `${count} log entries created.` : 'No new entries.';
    const skipMsg = skipped > 0 ? ` (${skipped} skipped - already logged)` : '';
    showToast(`✅ ${msg}${skipMsg}`, count > 0 ? "success" : "info");
}

function createLogFromSubject(subj, dateStr) {
    const hours = computeHours(subj.startTime, subj.endTime);
    const weekKey = getWeekKey(new Date(dateStr));
    const topic = weeklyTopics[`${subj.id}_${weekKey}`] || '';

    const description = `[${subj.code}] ${subj.name} | ${subj.room} | Instructor: ${subj.instructor}`;
    const learnings = topic ? `${topic} — ${subj.name} session` : `${subj.name} — class session`;

    const newLog = {
        id: 'log_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        date: dateStr,
        hours: hours,
        description: description,
        learnings: learnings
    };
    workLogs.push(newLog);
}

// ===== WEEKLY TOPICS MODAL =====
function openWeeklyTopicsModal() {
    if (subjects.length === 0) {
        showToast("Add subjects first before setting weekly topics.", "warning");
        return;
    }

    const monday = getMondayOfWeek(new Date());
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    const weekKey = getWeekKey(new Date());

    document.getElementById('weekly-topics-week-label').textContent =
        `For Week of ${monday.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} - ${sunday.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;

    const list = document.getElementById('weekly-topics-list');
    let html = '';
    subjects.forEach(subj => {
        const existing = weeklyTopics[`${subj.id}_${weekKey}`] || '';
        html += `
            <div class="topic-input-row">
                <span class="text-xs font-semibold text-slate-700 dark:text-slate-300 w-20 flex-shrink-0">${escapeHtml(subj.code)}</span>
                <span class="text-[10px] text-slate-400 flex-shrink-0 w-28 truncate">${escapeHtml(subj.name)}</span>
                <input type="text" class="topic-input flex-1 px-2 py-1 border border-slate-200 dark:border-slate-700 rounded-lg bg-transparent dark:text-white text-xs focus:outline-none focus:ring-1 focus:ring-brand-500" 
                    placeholder="e.g. Week X: Topic name" value="${escapeHtml(existing)}" data-subj-id="${subj.id}" data-week-key="${weekKey}">
            </div>`;
    });
    list.innerHTML = html;

    const modal = document.getElementById('weekly-topics-modal');
    const content = document.getElementById('weekly-topics-content');
    modal.classList.remove('hidden');
    setTimeout(() => {
        content.classList.remove('scale-95', 'opacity-0');
        content.classList.add('scale-100', 'opacity-100');
    }, 50);
}

function closeWeeklyTopicsModal() {
    const modal = document.getElementById('weekly-topics-modal');
    const content = document.getElementById('weekly-topics-content');
    content.classList.remove('scale-100', 'opacity-100');
    content.classList.add('scale-95', 'opacity-0');
    setTimeout(() => { modal.classList.add('hidden'); }, 200);
}

function saveWeeklyTopics() {
    const inputs = document.querySelectorAll('#weekly-topics-list .topic-input');
    inputs.forEach(input => {
        const subjId = input.dataset.subjId;
        const weekKey = input.dataset.weekKey;
        const value = input.value.trim();
        if (value) {
            weeklyTopics[`${subjId}_${weekKey}`] = value;
        } else {
            delete weeklyTopics[`${subjId}_${weekKey}`];
        }
    });
    saveWeeklyTopicsData();
    renderSubjectList();
    closeWeeklyTopicsModal();
    showToast("Weekly topics saved!", "success");
}

// ===== CALENDAR =====
function calendarPrevMonth() {
    calendarViewDate.setMonth(calendarViewDate.getMonth() - 1);
    renderCalendar();
}

function calendarNextMonth() {
    calendarViewDate.setMonth(calendarViewDate.getMonth() + 1);
    renderCalendar();
}

function renderCalendar() {
    const grid = document.getElementById('calendar-grid');
    const monthLabel = document.getElementById('calendar-month-label');

    const year = calendarViewDate.getFullYear();
    const month = calendarViewDate.getMonth();

    monthLabel.textContent = new Date(year, month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    // Compute hours per day for current view
    const hoursByDate = {};
    workLogs.forEach(log => {
        if (hoursByDate[log.date]) {
            hoursByDate[log.date] += parseFloat(log.hours || 0);
        } else {
            hoursByDate[log.date] = parseFloat(log.hours || 0);
        }
    });

    // Month total and today
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    let monthTotal = 0;

    // First day of month and last day
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startPad = firstDay.getDay(); // 0=Sun

    // Generate cells
    let html = '';
    // Headers already in HTML, just generate day cells
    // Remove existing cells after headers
    const existingCells = grid.querySelectorAll('.calendar-day, .calendar-day.other-month');
    existingCells.forEach(el => el.remove());

    // Previous month's trailing days
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startPad - 1; i >= 0; i--) {
        const day = prevMonthLastDay - i;
        html += `<div class="calendar-day other-month"><span class="day-number">${day}</span></div>`;
    }

    // Current month days
    for (let day = 1; day <= lastDay.getDate(); day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const hrs = hoursByDate[dateStr] || 0;
        monthTotal += hrs;

        const isToday = dateStr === todayStr;
        const isSelected = dateStr === calendarSelectedDate;

        // Color class based on hours
        let calClass = 'cal-day-0';
        if (hrs > 0 && hrs <= 1.5) calClass = 'cal-day-1';
        else if (hrs > 1.5 && hrs <= 3) calClass = 'cal-day-2';
        else if (hrs > 3 && hrs <= 5) calClass = 'cal-day-3';
        else if (hrs > 5 && hrs <= 7) calClass = 'cal-day-4';
        else if (hrs > 7) calClass = 'cal-day-5';

        const classNames = `calendar-day ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''} ${calClass}`;

        html += `<div class="${classNames}" onclick="selectCalendarDay('${dateStr}')" title="${dateStr}: ${hrs.toFixed(1)} hrs">
            <span class="day-number">${day}</span>
            ${hrs > 0 ? `<span class="day-hours">${hrs.toFixed(1)}h</span>` : ''}
        </div>`;
    }

    // Next month's leading days to fill grid
    const totalCells = startPad + lastDay.getDate();
    const remaining = (7 - (totalCells % 7)) % 7;
    for (let day = 1; day <= remaining; day++) {
        html += `<div class="calendar-day other-month"><span class="day-number">${day}</span></div>`;
    }

    // Append after headers
    grid.innerHTML = `
        <div class="calendar-header-cell">Sun</div>
        <div class="calendar-header-cell">Mon</div>
        <div class="calendar-header-cell">Tue</div>
        <div class="calendar-header-cell">Wed</div>
        <div class="calendar-header-cell">Thu</div>
        <div class="calendar-header-cell">Fri</div>
        <div class="calendar-header-cell">Sat</div>
        ${html}`;

    // Update stats
    document.getElementById('calendar-month-hours').textContent =
        `${new Date(year, month).toLocaleDateString('en-US', { month: 'short' })}: ${monthTotal.toFixed(1)} hrs`;
    document.getElementById('calendar-today-hours').textContent =
        `Today: ${(hoursByDate[todayStr] || 0).toFixed(1)} hrs`;
}

function selectCalendarDay(dateStr) {
    calendarSelectedDate = dateStr;
    renderCalendar();

    // Set date filters
    document.getElementById('filter-start').value = dateStr;
    document.getElementById('filter-end').value = dateStr;
    renderTable();

    document.getElementById('calendar-day-detail').innerHTML =
        `📅 <strong>${new Date(dateStr).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}</strong> — showing filtered logs`;
}

// ===== BATCH LOG (existing) =====
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

function setLastWeek() {
    const today = new Date();
    const weekAgo = new Date(today);
    weekAgo.setDate(today.getDate() - 6);
    document.getElementById('batch-start-date').value = weekAgo.toISOString().split('T')[0];
    document.getElementById('batch-end-date').value = today.toISOString().split('T')[0];
    updateBatchDayCount();
}

function handleBatchSubmit() {
    const start = document.getElementById('batch-start-date').value;
    const end = document.getElementById('batch-end-date').value;
    const hours = parseFloat(document.getElementById('batch-hours').value);
    const description = document.getElementById('batch-description').value.trim();
    const learnings = document.getElementById('batch-learnings').value.trim();

    if (!start || !end) { showToast("Please select both start and end dates.", "warning"); return; }
    if (isNaN(hours) || hours <= 0) { showToast("Please enter valid hours per day.", "warning"); return; }
    if (!description) { showToast("Please enter a task description.", "warning"); return; }

    const s = new Date(start);
    const e = new Date(end);
    if (e < s) { showToast("End date must be after start date.", "error"); return; }

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
    renderCalendar();
    showToast(`${count} daily log entries created successfully!`, "success");

    document.getElementById('batch-description').value = '';
    document.getElementById('batch-learnings').value = '';
    document.getElementById('batch-start-date').value = '';
    document.getElementById('batch-end-date').value = '';
    document.getElementById('batch-hours').value = '2.0';
    updateBatchDayCount();
}

// ===== GITHUB IMPORT (existing) =====
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

async function importFromGithub() {
    const urlInput = document.getElementById('github-url-input').value.trim();
    const token = profile.githubToken || '';

    if (!urlInput) { showToast("Please enter a GitHub URL", "warning"); return; }

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
        showToast("Invalid GitHub URL.", "error");
        return;
    }

    showToast("Fetching details from GitHub API...", "info");

    const headers = {};
    if (token) { headers['Authorization'] = `token ${token}`; }

    try {
        const response = await fetch(apiEndpoint, { headers });
        if (!response.ok) {
            if (response.status === 404) throw new Error("Repository or item not found.");
            else if (response.status === 401 || response.status === 403) throw new Error("GitHub API request unauthorized or rate-limited.");
            throw new Error(`GitHub API returned error: status ${response.status}`);
        }

        const data = await response.json();

        let date = '';
        let description = '';
        let learnings = '';
        let hours = 1.0;

        if (type === 'commit') {
            const rawDate = data.commit.author.date || data.commit.committer.date;
            date = rawDate.split('T')[0];
            const message = data.commit.message;
            const lines = message.split('\n');
            description = lines[0];
            learnings = lines.slice(1).join('\n').trim();
            const hoursMatch = message.match(/\b(\d+(?:\.\d+)?)\s*h(?:r|s)?\b/i);
            if (hoursMatch) hours = parseFloat(hoursMatch[1]);
        } else if (type === 'pr') {
            date = (data.merged_at || data.created_at).split('T')[0];
            description = `PR #${data.number}: ${data.title}`;
            learnings = data.body || '';
            const hoursMatch = (data.title + ' ' + (data.body || '')).match(/\b(\d+(?:\.\d+)?)\s*h(?:r|s)?\b/i);
            if (hoursMatch) hours = parseFloat(hoursMatch[1]);
        } else if (type === 'issue') {
            date = data.created_at.split('T')[0];
            description = `Issue #${data.number}: ${data.title}`;
            learnings = data.body || '';
        }

        document.getElementById('entry-date').value = date;
        document.getElementById('entry-hours').value = hours;
        document.getElementById('entry-description').value = description;
        document.getElementById('entry-learnings').value = learnings;

        showToast("Populated data from GitHub! Review and click Add Entry.", "success");
        focusForm();
    } catch (err) {
        console.error(err);
        showToast(err.message, "error");
    }
}

// ===== PRINT =====
function renderPrintSummaryTable() {
    const tbody = document.getElementById('entries-tbody');
    if (!tbody) return;

    if (workLogs.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="px-6 py-8 text-center text-xs text-slate-400">No entries to display in summary.</td></tr>';
        return;
    }

    const sorted = [...workLogs].sort((a, b) => new Date(b.date) - new Date(a.date));

    let html = '';
    sorted.forEach(log => {
        const formattedDate = new Date(log.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        const desc = log.description || '';
        const shortDesc = desc.length > 100 ? desc.substring(0, 97) + '...' : desc;
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
            </tr>`;
    });

    tbody.innerHTML = html;
}

// ===== TOAST =====
function showToast(message, type = "info") {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');

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
        <button class="text-slate-400 hover:text-slate-600 dark:hover:text-white flex-shrink-0" onclick="this.parentElement.remove()"><i class="fa-solid fa-xmark"></i></button>`;

    container.appendChild(toast);

    setTimeout(() => { toast.classList.add('toast-active'); }, 10);

    setTimeout(() => {
        toast.classList.remove('toast-active');
        toast.style.transform = 'translateY(-1rem) scale(0.95)';
        toast.style.opacity = '0';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => { toast.remove(); }, 300);
    }, 4000);
}