const storageKey = "coachingAdmissionsLeads";
const settingsKey = "coachingAdmissionsSettings";
const supabaseConfig = window.SUPABASE_CONFIG || {};
const supabaseReady = Boolean(
  window.supabase &&
    supabaseConfig.url &&
    supabaseConfig.anonKey &&
    !supabaseConfig.url.includes("PASTE_") &&
    !supabaseConfig.anonKey.includes("PASTE_")
);
const supabaseClient = supabaseReady ? window.supabase.createClient(supabaseConfig.url, supabaseConfig.anonKey) : null;
const supabaseTable = supabaseConfig.table || "competition_club_leads";
const defaultSettings = {
  instituteName: "Competition Club",
  countryCode: "91",
  welcomeTemplate:
    "Hello {student}, welcome to {institute}. Thank you for your enquiry for {course}. Our team will contact you shortly with demo class details.",
  demoTemplate:
    "Hello {student}, your demo class for {demoSubject} is scheduled at {institute} on {demoDate} at {demoTime}. Please reply on WhatsApp if you need any help.",
  feeReminderTemplate:
    "Hello {student}, this is a reminder from {institute}. Your pending fee for {course} is Rs {pendingFee}. Kindly deposit it by {pendingFeeDate}. Thank you."
};

const sampleLeads = [
  {
    id: createId(),
    studentId: "26050301",
    studentName: "Aarav Sharma",
    parentName: "Nitin Sharma",
    phone: "9876543210",
    course: "Class 10 Math",
    source: "Referral",
    status: "demo",
    demoDate: todayPlus(1),
    demoTime: "17:00",
    demoSubject: "Math",
    followupDate: todayPlus(2),
    enrolledDate: "",
    feePlan: "oneTime",
    totalFee: "18000",
    discount: "1000",
    feeDeposit: "8000",
    pendingFee: "9000",
    pendingFeeDate: todayPlus(7),
    monthlyFee: "",
    monthlyFeeDeposit: "",
    monthlyDueDate: "",
    fees: "18000",
    counselor: "Priya",
    notes: "Needs evening batch after school.",
    createdAt: new Date().toISOString()
  },
  {
    id: createId(),
    studentId: "26050201",
    studentName: "Meera Patel",
    parentName: "Kavita Patel",
    phone: "9822211100",
    course: "NEET Foundation",
    source: "Website",
    status: "enquiry",
    demoDate: "",
    demoTime: "",
    demoSubject: "",
    followupDate: todayPlus(0),
    enrolledDate: "",
    feePlan: "monthly",
    totalFee: "32000",
    discount: "",
    feeDeposit: "",
    pendingFee: "",
    pendingFeeDate: "",
    monthlyFee: "2500",
    monthlyFeeDeposit: "",
    monthlyDueDate: todayPlus(2),
    fees: "32000",
    counselor: "Rahul",
    notes: "Parent asked for scholarship details.",
    createdAt: new Date(Date.now() - 86400000).toISOString()
  }
];

let leads = loadLeads();
let settings = loadSettings();
let activeFilter = "all";
let activeFeeFilter = "all";

const elements = {
  totalCount: document.querySelector("#totalCount"),
  demoCount: document.querySelector("#demoCount"),
  enrolledCount: document.querySelector("#enrolledCount"),
  pendingFollowups: document.querySelector("#pendingFollowups"),
  syncStatus: document.querySelector("#syncStatus"),
  leadList: document.querySelector("#leadList"),
  feeList: document.querySelector("#feeList"),
  feeSummaryText: document.querySelector("#feeSummaryText"),
  resultText: document.querySelector("#resultText"),
  searchInput: document.querySelector("#searchInput"),
  sortSelect: document.querySelector("#sortSelect"),
  reportDate: document.querySelector("#reportDate"),
  reportPreview: document.querySelector("#reportPreview"),
  dialog: document.querySelector("#leadDialog"),
  settingsDialog: document.querySelector("#settingsDialog"),
  settingsForm: document.querySelector("#settingsForm"),
  form: document.querySelector("#leadForm"),
  formTitle: document.querySelector("#formTitle"),
  deleteBtn: document.querySelector("#deleteBtn")
};

elements.reportDate.value = todayPlus(0);
document.querySelector("#newLeadBtn").addEventListener("click", () => openForm());
document.querySelector("#closeDialogBtn").addEventListener("click", closeForm);
document.querySelector("#cancelBtn").addEventListener("click", closeForm);
document.querySelector("#welcomeSettingsBtn").addEventListener("click", openSettings);
document.querySelector("#closeSettingsBtn").addEventListener("click", closeSettings);
document.querySelector("#cancelSettingsBtn").addEventListener("click", closeSettings);
document.querySelector("#exportBtn").addEventListener("click", exportCsv);
elements.searchInput.addEventListener("input", render);
elements.sortSelect.addEventListener("change", render);
elements.reportDate.addEventListener("change", updateReportPreview);
elements.form.addEventListener("submit", saveLead);
elements.settingsForm.addEventListener("submit", saveSettings);
elements.deleteBtn.addEventListener("click", deleteLead);
["fees", "totalFee", "discount", "feeDeposit", "monthlyFee", "monthlyFeeDeposit"].forEach((id) => {
  document.querySelector(`#${id}`).addEventListener("input", updatePendingFeeField);
});
document.querySelector("#feePlan").addEventListener("change", updatePendingFeeField);

document.querySelectorAll(".filter").forEach((button) => {
  if (button.dataset.feeFilter) return;
  button.addEventListener("click", () => {
    document.querySelectorAll("[data-filter]").forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    activeFilter = button.dataset.filter;
    render();
  });
});

document.querySelectorAll("[data-fee-filter]").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll("[data-fee-filter]").forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    activeFeeFilter = button.dataset.feeFilter;
    renderFeeFollowup();
  });
});

document.querySelectorAll("[data-report]").forEach((button) => {
  button.addEventListener("click", () => shareDailyReport(button.dataset.report));
});

render();
updateReportPreview();
updateSyncStatus(
  supabaseClient
    ? "Online sync configured. Checking Supabase..."
    : "Online sync not connected. Check supabase-config.js.",
  supabaseClient ? "ok" : "error"
);
syncFromSupabase();

function loadLeads() {
  const saved = localStorage.getItem(storageKey);
  if (!saved) {
    localStorage.setItem(storageKey, JSON.stringify(sampleLeads));
    return sampleLeads;
  }

  try {
    const parsed = JSON.parse(saved);
    let changed = false;
    parsed.forEach((lead) => {
      if (!lead.studentId) {
        lead.studentId = generateStudentId(lead.createdAt || new Date().toISOString(), parsed);
        changed = true;
      }
    });
    if (changed) localStorage.setItem(storageKey, JSON.stringify(parsed));
    return parsed;
  } catch {
    return [];
  }
}

function persist() {
  localStorage.setItem(storageKey, JSON.stringify(leads));
  saveLeadsToSupabase();
}

async function syncFromSupabase() {
  if (!supabaseClient) return;

  updateSyncStatus("Connecting to Supabase...", "ok");
  const { data, error } = await supabaseClient
    .from(supabaseTable)
    .select("data")
    .order("updated_at", { ascending: false });

  if (error) {
    console.warn("Supabase load failed. Using local browser data.", error);
    updateSyncStatus(`Supabase load failed: ${error.message}`, "error");
    return;
  }

  const remoteLeads = (data || []).map((row) => row.data).filter(Boolean);
  if (!remoteLeads.length) {
    await saveLeadsToSupabase();
    updateSyncStatus("Supabase connected. Local records uploaded.", "ok");
    return;
  }

  leads = remoteLeads;
  localStorage.setItem(storageKey, JSON.stringify(leads));
  updateSyncStatus(`Supabase connected. ${leads.length} records loaded.`, "ok");
  render();
}

async function saveLeadsToSupabase() {
  if (!supabaseClient) return;

  const rows = leads.map((lead) => ({
    id: lead.id,
    student_id: lead.studentId || null,
    data: lead,
    updated_at: new Date().toISOString()
  }));

  const { error } = await supabaseClient.from(supabaseTable).upsert(rows, { onConflict: "id" });
  if (error) {
    console.warn("Supabase save failed. Data is still saved in this browser.", error);
    updateSyncStatus(`Supabase save failed: ${error.message}`, "error");
  } else {
    updateSyncStatus(`Supabase saved. ${rows.length} records online.`, "ok");
  }
}

async function deleteLeadFromSupabase(id) {
  if (!supabaseClient) return;

  const { error } = await supabaseClient.from(supabaseTable).delete().eq("id", id);
  if (error) {
    console.warn("Supabase delete failed. Local delete is complete.", error);
    updateSyncStatus(`Supabase delete failed: ${error.message}`, "error");
  } else {
    updateSyncStatus("Supabase record deleted.", "ok");
  }
}

function updateSyncStatus(message, type) {
  if (!elements.syncStatus) return;
  elements.syncStatus.textContent = message;
  elements.syncStatus.classList.toggle("ok", type === "ok");
  elements.syncStatus.classList.toggle("error", type === "error");
}

function loadSettings() {
  const saved = localStorage.getItem(settingsKey);
  if (!saved) return defaultSettings;

  try {
    return { ...defaultSettings, ...JSON.parse(saved) };
  } catch {
    return defaultSettings;
  }
}

function persistSettings() {
  localStorage.setItem(settingsKey, JSON.stringify(settings));
}

function render() {
  renderMetrics();
  updateReportPreview();
  renderFeeFollowup();
  const visible = getVisibleLeads();
  elements.resultText.textContent = `${visible.length} record${visible.length === 1 ? "" : "s"} shown`;

  if (!visible.length) {
    elements.leadList.innerHTML = `<div class="empty-state">No matching records</div>`;
    return;
  }

  elements.leadList.innerHTML = visible.map(renderLeadCard).join("");
  document.querySelectorAll("[data-edit]").forEach((button) => {
    button.addEventListener("click", () => openForm(button.dataset.edit));
  });
  document.querySelectorAll("[data-advance]").forEach((button) => {
    button.addEventListener("click", () => advanceLead(button.dataset.advance));
  });
  document.querySelectorAll("[data-whatsapp]").forEach((button) => {
    button.addEventListener("click", () => sendWelcomeWhatsApp(button.dataset.whatsapp));
  });
  document.querySelectorAll("[data-demo-message]").forEach((button) => {
    button.addEventListener("click", () => sendDemoWhatsApp(button.dataset.demoMessage));
  });
}

function renderFeeFollowup() {
  const enrolled = leads.filter((lead) => lead.status === "enrolled");
  const paid = enrolled.filter((lead) => isFeePaid(lead));
  const monthly = enrolled.filter((lead) => isMonthlyFeeStudent(lead));
  const dueSoon = enrolled.filter((lead) => isFeeDueSoon(lead));
  const pending = enrolled.filter((lead) => hasFeePending(lead));
  const pendingTotal = pending.reduce((total, lead) => total + getPendingFee(lead), 0);
  const visible = enrolled.filter((lead) => matchesFeeFilter(lead));

  elements.feeSummaryText.textContent = enrolled.length
    ? `${paid.length} full fee | ${pending.length} pending | ${dueSoon.length} due in 2 days | ${monthly.length} monthly | Rs ${pendingTotal.toLocaleString("en-IN")} pending`
    : "No enrolled students yet";

  if (!enrolled.length) {
    elements.feeList.innerHTML = `<div class="empty-state">No enrolled students yet</div>`;
    return;
  }

  if (!visible.length) {
    elements.feeList.innerHTML = `<div class="empty-state">No students in this fee segment</div>`;
    return;
  }

  elements.feeList.innerHTML = visible.map(renderFeeCard).join("");
  document.querySelectorAll("[data-fee-reminder]").forEach((button) => {
    button.addEventListener("click", () => sendFeeReminderWhatsApp(button.dataset.feeReminder));
  });
  document.querySelectorAll("[data-fee-edit]").forEach((button) => {
    button.addEventListener("click", () => openForm(button.dataset.feeEdit));
  });
}

function renderMetrics() {
  const today = todayPlus(0);
  elements.totalCount.textContent = leads.length;
  elements.demoCount.textContent = leads.filter((lead) => lead.status === "demo").length;
  elements.enrolledCount.textContent = leads.filter((lead) => lead.status === "enrolled").length;
  elements.pendingFollowups.textContent = leads.filter((lead) => {
    return lead.followupDate && lead.followupDate <= today && lead.status !== "enrolled" && lead.status !== "lost";
  }).length;
}

function getVisibleLeads() {
  const search = elements.searchInput.value.trim().toLowerCase();
  const filtered = leads.filter((lead) => {
    const statusMatch = activeFilter === "all" || lead.status === activeFilter;
    const searchText = [
      lead.studentId,
      lead.studentName,
      lead.parentName,
      lead.phone,
      lead.course,
      lead.source,
      lead.counselor
    ].join(" ").toLowerCase();
    return statusMatch && searchText.includes(search);
  });

  return filtered.sort((a, b) => {
    if (elements.sortSelect.value === "name") {
      return a.studentName.localeCompare(b.studentName);
    }
    if (elements.sortSelect.value === "followup") {
      return (a.followupDate || "9999-12-31").localeCompare(b.followupDate || "9999-12-31");
    }
    return new Date(b.createdAt) - new Date(a.createdAt);
  });
}

function renderLeadCard(lead) {
  const nextAction = getNextAction(lead.status);
  return `
    <article class="lead-card">
      <div>
        <div class="lead-title">
          <h3>${escapeHtml(lead.studentName)}</h3>
          <span class="student-id">ID ${escapeHtml(lead.studentId || "")}</span>
          <span class="status-pill status-${lead.status}">${lead.status}</span>
        </div>
        <div class="lead-meta">
          <span>${escapeHtml(lead.course)}</span>
          <span>${escapeHtml(lead.phone)}</span>
          <span>${escapeHtml(lead.source)}</span>
          ${lead.demoDate ? `<span>Demo: ${formatDate(lead.demoDate)}</span>` : ""}
          ${lead.demoTime ? `<span>Time: ${formatTime(lead.demoTime)}</span>` : ""}
          ${lead.demoSubject ? `<span>Subject: ${escapeHtml(lead.demoSubject)}</span>` : ""}
          ${lead.followupDate ? `<span>Follow-up: ${formatDate(lead.followupDate)}</span>` : ""}
          ${lead.fees ? `<span>Fees: Rs ${Number(lead.fees).toLocaleString("en-IN")}</span>` : ""}
        </div>
        <p class="lead-notes">${escapeHtml(lead.notes || "No notes added")}</p>
      </div>
      <div class="card-actions">
        ${nextAction ? `<button class="small-button" data-advance="${lead.id}" type="button">${nextAction}</button>` : ""}
        <button class="small-button whatsapp-button" data-whatsapp="${lead.id}" type="button">Welcome</button>
        <button class="small-button whatsapp-button" data-demo-message="${lead.id}" type="button">Demo Msg</button>
        <button class="small-button" data-edit="${lead.id}" type="button">Edit</button>
      </div>
    </article>
  `;
}

function renderFeeCard(lead) {
  const pendingFee = getPendingFee(lead);
  const totalFee = getMoney(lead.totalFee || lead.fees);
  const discount = getMoney(lead.discount);
  const deposit = getMoney(lead.feeDeposit);
  const monthlyFee = getMoney(lead.monthlyFee);
  const feeStatus = isMonthlyFeeStudent(lead) ? "Monthly" : pendingFee > 0 ? "Pending" : "Paid";
  const statusClass = pendingFee > 0 ? "status-demo" : "status-enrolled";

  return `
    <article class="lead-card fee-card">
      <div>
        <div class="lead-title">
          <h3>${escapeHtml(lead.studentName)}</h3>
          <span class="student-id">ID ${escapeHtml(lead.studentId || "")}</span>
          <span class="status-pill ${statusClass}">${feeStatus}</span>
          ${isFeeDueSoon(lead) ? `<span class="status-pill status-lost">Due in 2 days</span>` : ""}
        </div>
        <div class="lead-meta">
          <span>${escapeHtml(lead.course)}</span>
          <span>${escapeHtml(lead.phone)}</span>
          ${isMonthlyFeeStudent(lead) ? `<span>Monthly: Rs ${monthlyFee.toLocaleString("en-IN")}</span>` : `<span>Total: Rs ${totalFee.toLocaleString("en-IN")}</span>`}
          ${isMonthlyFeeStudent(lead) ? `<span>Monthly deposit: Rs ${getMoney(lead.monthlyFeeDeposit).toLocaleString("en-IN")}</span>` : `<span>Discount: Rs ${discount.toLocaleString("en-IN")}</span>`}
          ${!isMonthlyFeeStudent(lead) ? `<span>Deposit: Rs ${deposit.toLocaleString("en-IN")}</span>` : ""}
          <span>Pending: Rs ${pendingFee.toLocaleString("en-IN")}</span>
          ${getFeeDueDate(lead) && pendingFee > 0 ? `<span>Due: ${formatDate(getFeeDueDate(lead))}</span>` : ""}
        </div>
      </div>
      <div class="card-actions">
        ${pendingFee > 0 ? `<button class="small-button whatsapp-button" data-fee-reminder="${lead.id}" type="button">Fee Reminder</button>` : ""}
        <button class="small-button" data-fee-edit="${lead.id}" type="button">Edit Fee</button>
      </div>
    </article>
  `;
}

function getNextAction(status) {
  if (status === "enquiry") return "Schedule Demo";
  if (status === "demo") return "Mark Enrolled";
  return "";
}

function advanceLead(id) {
  const lead = leads.find((item) => item.id === id);
  if (!lead) return;

  if (lead.status === "enquiry") {
    lead.status = "demo";
    lead.demoDate = lead.demoDate || todayPlus(1);
    lead.followupDate = lead.followupDate || todayPlus(2);
  } else if (lead.status === "demo") {
    lead.status = "enrolled";
    lead.enrolledDate = lead.enrolledDate || todayPlus(0);
    lead.feePlan = lead.feePlan || "oneTime";
    lead.totalFee = lead.totalFee || lead.fees || "";
    lead.pendingFee = calculatePendingFee(lead);
    lead.followupDate = "";
  }

  persist();
  render();
}

function openForm(id) {
  const lead = leads.find((item) => item.id === id);
  elements.form.reset();
  document.querySelector("#leadId").value = lead?.id || "";
  document.querySelector("#studentId").value = lead?.studentId || "Auto generated after save";
  elements.formTitle.textContent = lead ? "Edit Record" : "New Enquiry";
  elements.deleteBtn.hidden = !lead;

  if (lead) {
    Object.entries(lead).forEach(([key, value]) => {
      const input = document.querySelector(`#${key}`);
      if (input) input.value = value || "";
    });
  }

  elements.dialog.showModal();
  document.querySelector("#studentName").focus();
}

function closeForm() {
  elements.dialog.close();
}

function updatePendingFeeField() {
  const feePlan = document.querySelector("#feePlan").value;
  if (feePlan === "monthly") {
    const monthlyFee = document.querySelector("#monthlyFee").value;
    const monthlyFeeDeposit = document.querySelector("#monthlyFeeDeposit").value;
    document.querySelector("#pendingFee").value = calculatePendingFee({ feePlan, monthlyFee, monthlyFeeDeposit });
    return;
  }

  const totalFee = document.querySelector("#totalFee").value || document.querySelector("#fees").value;
  const discount = document.querySelector("#discount").value;
  const feeDeposit = document.querySelector("#feeDeposit").value;
  document.querySelector("#pendingFee").value = calculatePendingFee({ feePlan, totalFee, discount, feeDeposit });
}

function saveLead(event) {
  event.preventDefault();
  const existingId = document.querySelector("#leadId").value;
  const wasNewLead = !existingId;
  const lead = {
    id: existingId || createId(),
    studentId: document.querySelector("#studentId").value.replace(/\D/g, ""),
    studentName: document.querySelector("#studentName").value.trim(),
    parentName: document.querySelector("#parentName").value.trim(),
    phone: document.querySelector("#phone").value.trim(),
    course: document.querySelector("#course").value.trim(),
    source: document.querySelector("#source").value,
    status: document.querySelector("#status").value,
    demoDate: document.querySelector("#demoDate").value,
    demoTime: document.querySelector("#demoTime").value,
    demoSubject: document.querySelector("#demoSubject").value.trim(),
    followupDate: document.querySelector("#followupDate").value,
    enrolledDate: document.querySelector("#enrolledDate").value,
    feePlan: document.querySelector("#feePlan").value,
    totalFee: document.querySelector("#totalFee").value,
    discount: document.querySelector("#discount").value,
    feeDeposit: document.querySelector("#feeDeposit").value,
    pendingFee: document.querySelector("#pendingFee").value,
    pendingFeeDate: document.querySelector("#pendingFeeDate").value,
    monthlyFee: document.querySelector("#monthlyFee").value,
    monthlyFeeDeposit: document.querySelector("#monthlyFeeDeposit").value,
    monthlyDueDate: document.querySelector("#monthlyDueDate").value,
    fees: document.querySelector("#fees").value,
    counselor: document.querySelector("#counselor").value.trim(),
    notes: document.querySelector("#notes").value.trim(),
    createdAt: new Date().toISOString()
  };

  if (wasNewLead || !lead.studentId) {
    lead.studentId = generateStudentId(lead.createdAt);
  }

  if (lead.status === "enrolled" && !lead.enrolledDate) {
    lead.enrolledDate = todayPlus(0);
  }

  if (lead.status === "enrolled") {
    lead.feePlan = lead.feePlan || "oneTime";
    lead.totalFee = lead.totalFee || lead.fees || "";
    lead.pendingFee = lead.pendingFee || calculatePendingFee(lead);
  }

  const existingIndex = leads.findIndex((item) => item.id === lead.id);
  if (existingIndex >= 0) {
    lead.createdAt = leads[existingIndex].createdAt;
    leads[existingIndex] = lead;
  } else {
    leads.unshift(lead);
  }

  persist();
  closeForm();
  render();

  if (wasNewLead) {
    sendWelcomeWhatsApp(lead.id);
  }
}

function deleteLead() {
  const id = document.querySelector("#leadId").value;
  leads = leads.filter((lead) => lead.id !== id);
  persist();
  deleteLeadFromSupabase(id);
  closeForm();
  render();
}

function exportCsv() {
  const headers = [
    "Student ID",
    "Student Name",
    "Parent Name",
    "Phone",
    "Course",
    "Source",
    "Status",
    "Demo Date",
    "Demo Time",
    "Demo Subject",
    "Follow-up Date",
    "Enrollment Date",
    "Fees Quoted",
    "Total Fee",
    "Fee Plan",
    "Discount",
    "Fee Deposit",
    "Pending Fee",
    "Pending Fee Date",
    "Monthly Fee",
    "Monthly Fee Deposit",
    "Next Monthly Due Date",
    "Counselor",
    "Notes"
  ];
  const rows = leads.map((lead) => [
    lead.studentId,
    lead.studentName,
    lead.parentName,
    lead.phone,
    lead.course,
    lead.source,
    lead.status,
    lead.demoDate,
    lead.demoTime,
    lead.demoSubject,
    lead.followupDate,
    lead.enrolledDate,
    lead.fees,
    lead.totalFee,
    lead.feePlan,
    lead.discount,
    lead.feeDeposit,
    lead.pendingFee,
    lead.pendingFeeDate,
    lead.monthlyFee,
    lead.monthlyFeeDeposit,
    lead.monthlyDueDate,
    lead.counselor,
    lead.notes
  ]);
  const csv = [headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `admissions-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function openSettings() {
  document.querySelector("#instituteName").value = settings.instituteName;
  document.querySelector("#countryCode").value = settings.countryCode;
  document.querySelector("#welcomeTemplate").value = settings.welcomeTemplate;
  document.querySelector("#demoTemplate").value = settings.demoTemplate;
  document.querySelector("#feeReminderTemplate").value = settings.feeReminderTemplate;
  elements.settingsDialog.showModal();
}

function closeSettings() {
  elements.settingsDialog.close();
}

function saveSettings(event) {
  event.preventDefault();
  settings = {
    instituteName: document.querySelector("#instituteName").value.trim() || defaultSettings.instituteName,
    countryCode: document.querySelector("#countryCode").value.replace(/\D/g, "") || defaultSettings.countryCode,
    welcomeTemplate: document.querySelector("#welcomeTemplate").value.trim() || defaultSettings.welcomeTemplate,
    demoTemplate: document.querySelector("#demoTemplate").value.trim() || defaultSettings.demoTemplate,
    feeReminderTemplate: document.querySelector("#feeReminderTemplate").value.trim() || defaultSettings.feeReminderTemplate
  };
  persistSettings();
  closeSettings();
  updateReportPreview();
}

function sendWelcomeWhatsApp(id) {
  const lead = leads.find((item) => item.id === id);
  if (!lead) return;

  const phone = normalizePhone(lead.phone);
  const message = fillTemplate(settings.welcomeTemplate, lead);
  if (!phone) {
    alert("Please add a valid student WhatsApp number before sending the welcome message.");
    return;
  }

  openWhatsApp(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`);
}

function sendDemoWhatsApp(id) {
  const lead = leads.find((item) => item.id === id);
  if (!lead) return;

  const phone = normalizePhone(lead.phone);
  const message = fillTemplate(settings.demoTemplate, lead);
  if (!phone) {
    alert("Please add a valid student WhatsApp number before sending the demo message.");
    return;
  }

  openWhatsApp(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`);
}

function sendFeeReminderWhatsApp(id) {
  const lead = leads.find((item) => item.id === id);
  if (!lead) return;

  if (getPendingFee(lead) <= 0) {
    alert("Full fee payment is complete, so no reminder is needed.");
    return;
  }

  const phone = normalizePhone(lead.phone);
  const message = fillTemplate(settings.feeReminderTemplate, lead);
  if (!phone) {
    alert("Please add a valid student WhatsApp number before sending the fee reminder.");
    return;
  }

  openWhatsApp(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`);
}

function shareDailyReport(type) {
  const message = buildDailyReport(type, elements.reportDate.value);
  elements.reportPreview.value = message;
  openWhatsApp(`https://wa.me/?text=${encodeURIComponent(message)}`);
}

function updateReportPreview() {
  if (!elements.reportPreview) return;
  elements.reportPreview.value = buildDailyReport("full", elements.reportDate.value || todayPlus(0));
}

function buildDailyReport(type, date) {
  const reportDate = date || todayPlus(0);
  const enquiries = leads.filter((lead) => getDateOnly(lead.createdAt) === reportDate);
  const demos = leads.filter((lead) => lead.demoDate === reportDate);
  const enrollments = leads.filter((lead) => lead.enrolledDate === reportDate || (lead.status === "enrolled" && getDateOnly(lead.createdAt) === reportDate));
  const titleDate = formatDate(reportDate);

  if (type === "monthlyCourse") {
    return buildMonthlyCourseReport(reportDate);
  }

  if (type === "enquiry") {
    return formatReport(`${settings.instituteName} - Daily Enquiries Report`, titleDate, enquiries);
  }
  if (type === "demo") {
    return formatReport(`${settings.instituteName} - Daily Demo Report`, titleDate, demos);
  }
  if (type === "enrolled") {
    return formatReport(`${settings.instituteName} - Daily Enrollment Report`, titleDate, enrollments);
  }

  return [
    `${settings.instituteName} - Full Daily Admissions Report`,
    `Date: ${titleDate}`,
    "",
    `Enquiries: ${enquiries.length}`,
    `Demos: ${demos.length}`,
    `Enrollments: ${enrollments.length}`,
    "",
    "Enquiries",
    formatReportLines(enquiries),
    "",
    "Demos",
    formatReportLines(demos),
    "",
    "Enrollments",
    formatReportLines(enrollments)
  ].join("\n");
}

function buildMonthlyCourseReport(reportDate) {
  const selected = new Date(`${reportDate}T00:00:00`);
  const monthStart = `${selected.getFullYear()}-${String(selected.getMonth() + 1).padStart(2, "0")}-01`;
  const monthName = new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric" }).format(selected);
  const rows = getCourseNames().map((course) => {
    const enquiries = leads.filter((lead) => {
      return sameCourse(lead.course, course) && isDateInRange(getDateOnly(lead.createdAt), monthStart, reportDate);
    }).length;
    const demos = leads.filter((lead) => {
      return sameCourse(lead.course, course) && isDateInRange(lead.demoDate, monthStart, reportDate);
    }).length;
    const enrollments = leads.filter((lead) => {
      const enrolledDate = lead.enrolledDate || (lead.status === "enrolled" ? getDateOnly(lead.createdAt) : "");
      return sameCourse(lead.course, course) && isDateInRange(enrolledDate, monthStart, reportDate);
    }).length;
    return { course, enquiries, demos, enrollments };
  }).filter((row) => row.enquiries || row.demos || row.enrollments);

  const totals = rows.reduce((sum, row) => {
    sum.enquiries += row.enquiries;
    sum.demos += row.demos;
    sum.enrollments += row.enrollments;
    return sum;
  }, { enquiries: 0, demos: 0, enrollments: 0 });

  return [
    `${settings.instituteName} - Monthly Course Wise Report`,
    `Month: ${monthName}`,
    `Till Date: ${formatDate(reportDate)}`,
    "",
    `Total Enquiries: ${totals.enquiries}`,
    formatCourseTotals(rows, "enquiries"),
    "",
    `Total Demos: ${totals.demos}`,
    formatCourseTotals(rows, "demos"),
    "",
    `Total Enrollments: ${totals.enrollments}`,
    formatCourseTotals(rows, "enrollments")
  ].join("\n");
}

function formatCourseTotals(rows, key) {
  const filtered = rows.filter((row) => row[key] > 0);
  if (!filtered.length) return "No records";

  return filtered.map((row, index) => `${index + 1}. ${row.course}: ${row[key]}`).join("\n");
}

function getCourseNames() {
  return [...new Set(leads.map((lead) => normalizeCourseName(lead.course)).filter(Boolean))].sort((a, b) => {
    return a.localeCompare(b);
  });
}

function normalizeCourseName(course) {
  return String(course || "").trim();
}

function sameCourse(left, right) {
  return normalizeCourseName(left).toLowerCase() === normalizeCourseName(right).toLowerCase();
}

function isDateInRange(value, start, end) {
  return Boolean(value) && value >= start && value <= end;
}

function formatReport(title, titleDate, records) {
  return [title, `Date: ${titleDate}`, `Total: ${records.length}`, "", formatReportLines(records)].join("\n");
}

function formatReportLines(records) {
  if (!records.length) return "No records";

  return records.map((lead, index) => {
    const details = [
      `${index + 1}. ${lead.studentName}`,
      lead.studentId ? `ID: ${lead.studentId}` : "",
      lead.course,
      lead.phone,
      lead.status,
      lead.demoDate ? `Demo: ${formatDate(lead.demoDate)}` : "",
      lead.demoTime ? `Time: ${formatTime(lead.demoTime)}` : "",
      lead.demoSubject ? `Subject: ${lead.demoSubject}` : "",
      lead.enrolledDate ? `Enrolled: ${formatDate(lead.enrolledDate)}` : ""
    ].filter(Boolean);
    return details.join(" | ");
  }).join("\n");
}

function fillTemplate(template, lead) {
  return template
    .replaceAll("{student}", lead.studentName || "Student")
    .replaceAll("{studentId}", lead.studentId || "")
    .replaceAll("{course}", lead.course || "your selected course")
    .replaceAll("{institute}", settings.instituteName)
    .replaceAll("{demoDate}", lead.demoDate ? formatDate(lead.demoDate) : "soon")
    .replaceAll("{demoTime}", lead.demoTime ? formatTime(lead.demoTime) : "a time confirmed by our team")
    .replaceAll("{demoSubject}", lead.demoSubject || lead.course || "your selected subject")
    .replaceAll("{totalFee}", formatMoney(lead.totalFee || lead.fees))
    .replaceAll("{discount}", formatMoney(lead.discount))
    .replaceAll("{feeDeposit}", formatMoney(lead.feeDeposit))
    .replaceAll("{pendingFee}", formatMoney(getPendingFee(lead)))
    .replaceAll("{pendingFeeDate}", getFeeDueDate(lead) ? formatDate(getFeeDueDate(lead)) : "the due date")
    .replaceAll("{monthlyFee}", formatMoney(lead.monthlyFee))
    .replaceAll("{monthlyDueDate}", lead.monthlyDueDate ? formatDate(lead.monthlyDueDate) : "the monthly due date")
    .replaceAll("{phone}", lead.phone || "");
}

function calculatePendingFee(lead) {
  if (isMonthlyFeeStudent(lead)) {
    return Math.max(getMoney(lead.monthlyFee) - getMoney(lead.monthlyFeeDeposit), 0);
  }

  const total = getMoney(lead.totalFee || lead.fees);
  const discount = getMoney(lead.discount);
  const deposit = getMoney(lead.feeDeposit);
  return Math.max(total - discount - deposit, 0);
}

function getPendingFee(lead) {
  if (!isMonthlyFeeStudent(lead) && lead.pendingFee !== "" && lead.pendingFee !== undefined && lead.pendingFee !== null) {
    return getMoney(lead.pendingFee);
  }
  return calculatePendingFee(lead);
}

function hasFeePending(lead) {
  return getPendingFee(lead) > 0;
}

function isFeePaid(lead) {
  return getPendingFee(lead) <= 0;
}

function isMonthlyFeeStudent(lead) {
  return lead.feePlan === "monthly";
}

function getFeeDueDate(lead) {
  return isMonthlyFeeStudent(lead) ? lead.monthlyDueDate : lead.pendingFeeDate;
}

function isFeeDueSoon(lead) {
  if (!hasFeePending(lead)) return false;
  const dueDate = getFeeDueDate(lead);
  if (!dueDate) return false;

  const today = todayPlus(0);
  const twoDaysLater = todayPlus(2);
  return dueDate >= today && dueDate <= twoDaysLater;
}

function matchesFeeFilter(lead) {
  if (activeFeeFilter === "paid") return isFeePaid(lead);
  if (activeFeeFilter === "pending") return hasFeePending(lead);
  if (activeFeeFilter === "dueSoon") return isFeeDueSoon(lead);
  if (activeFeeFilter === "monthly") return isMonthlyFeeStudent(lead);
  return true;
}

function getMoney(value) {
  const amount = Number(value);
  return Number.isFinite(amount) ? Math.max(amount, 0) : 0;
}

function formatMoney(value) {
  return getMoney(value).toLocaleString("en-IN");
}

function generateStudentId(createdAt, existingLeads = leads) {
  const datePart = getDateOnly(createdAt || new Date().toISOString()).replaceAll("-", "").slice(2);
  const dayCount = existingLeads.filter((lead) => {
    return getDateOnly(lead.createdAt) === getDateOnly(createdAt) && String(lead.studentId || "").startsWith(datePart);
  }).length + 1;
  return `${datePart}${String(dayCount).padStart(2, "0").slice(-2)}`;
}

function normalizePhone(value) {
  const digits = String(value || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.length === 10) return `${settings.countryCode}${digits}`;
  return digits;
}

function openWhatsApp(url) {
  window.open(url, "_blank", "noopener");
}

function getDateOnly(value) {
  if (!value) return "";
  return toDateInputValue(new Date(value));
}

function csvCell(value) {
  return `"${String(value || "").replaceAll('"', '""')}"`;
}

function formatDate(value) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(new Date(`${value}T00:00:00`));
}

function formatTime(value) {
  if (!value) return "";
  const [hours, minutes] = value.split(":").map(Number);
  const date = new Date();
  date.setHours(hours, minutes || 0, 0, 0);
  return new Intl.DateTimeFormat("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true
  }).format(date);
}

function todayPlus(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return toDateInputValue(date);
}

function toDateInputValue(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function createId() {
  if (window.crypto?.randomUUID) return window.crypto.randomUUID();
  return `lead-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
