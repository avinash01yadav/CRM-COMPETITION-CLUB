const storageKey = "coachingAdmissionsLeads";
const scheduleStorageKey = "competitionClubSchedules";
const schedulerMastersStorageKey = "competitionClubSchedulerMasters";
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
const supabaseScheduleTable = supabaseConfig.scheduleTable || "competition_club_schedules";
const supabaseMasterTable = supabaseConfig.masterTable || "competition_club_scheduler_masters";
const defaultSettings = {
  instituteName: "Competition Club",
  countryCode: "91",
  welcomeTemplate:
    "Hello {student}, welcome to {institute}. Thank you for your enquiry for {course}. Our team will contact you shortly with demo class details.",
  demoTemplate:
    "Hello {student}, your demo class for {demoSubject} is scheduled at {institute} on {demoDate} at {demoTime}. Please reply on WhatsApp if you need any help.",
  feeReminderTemplate:
    "Hello {student}, this is a reminder from {institute}. Your pending fee for {course} is Rs {pendingFee}. Kindly deposit it by {pendingFeeDate}. Thank you.",
  teacherScheduleTemplate:
    "Hello {teacher}, your classes at {institute} for {scheduleDate} are:\n{classList}",
  studentScheduleTemplate:
    "Please find the daily schedule\n\nDate :- {scheduleDate}\nDay :- {scheduleDay}\n\n{classList}\n\nThank you 🙏\n{institute}"
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
let schedules = loadSchedules();
let schedulerMasters = loadSchedulerMasters();
let settings = loadSettings();
let activeFilter = "all";
let activeFeeFilter = "all";
let activeDesk = "admission";

const elements = {
  totalCount: document.querySelector("#totalCount"),
  demoCount: document.querySelector("#demoCount"),
  enrolledCount: document.querySelector("#enrolledCount"),
  pendingFollowups: document.querySelector("#pendingFollowups"),
  syncStatus: document.querySelector("#syncStatus"),
  leadList: document.querySelector("#leadList"),
  feeList: document.querySelector("#feeList"),
  studentList: document.querySelector("#studentList"),
  feeSummaryText: document.querySelector("#feeSummaryText"),
  studentSummaryText: document.querySelector("#studentSummaryText"),
  resultText: document.querySelector("#resultText"),
  searchInput: document.querySelector("#searchInput"),
  sortSelect: document.querySelector("#sortSelect"),
  reportDate: document.querySelector("#reportDate"),
  reportPreview: document.querySelector("#reportPreview"),
  scheduleDate: document.querySelector("#scheduleDate"),
  scheduleList: document.querySelector("#scheduleList"),
  schedulePreview: document.querySelector("#schedulePreview"),
  scheduleSummaryText: document.querySelector("#scheduleSummaryText"),
  uploadStatus: document.querySelector("#uploadStatus"),
  batchList: document.querySelector("#batchList"),
  roomList: document.querySelector("#roomList"),
  teacherList: document.querySelector("#teacherList"),
  dialog: document.querySelector("#leadDialog"),
  demoScheduleDialog: document.querySelector("#demoScheduleDialog"),
  demoScheduleForm: document.querySelector("#demoScheduleForm"),
  studentDialog: document.querySelector("#studentDialog"),
  studentForm: document.querySelector("#studentForm"),
  studentFormTitle: document.querySelector("#studentFormTitle"),
  idCardDialog: document.querySelector("#idCardDialog"),
  idCardForm: document.querySelector("#idCardForm"),
  idCardPreview: document.querySelector("#idCardPreview"),
  scheduleDialog: document.querySelector("#scheduleDialog"),
  scheduleForm: document.querySelector("#scheduleForm"),
  scheduleFormTitle: document.querySelector("#scheduleFormTitle"),
  teacherShareDialog: document.querySelector("#teacherShareDialog"),
  teacherShareForm: document.querySelector("#teacherShareForm"),
  teacherSharePreview: document.querySelector("#teacherSharePreview"),
  batchDialog: document.querySelector("#batchDialog"),
  roomDialog: document.querySelector("#roomDialog"),
  teacherDialog: document.querySelector("#teacherDialog"),
  settingsDialog: document.querySelector("#settingsDialog"),
  settingsForm: document.querySelector("#settingsForm"),
  form: document.querySelector("#leadForm"),
  formTitle: document.querySelector("#formTitle"),
  deleteBtn: document.querySelector("#deleteBtn")
};

elements.reportDate.value = todayPlus(0);
elements.scheduleDate.value = todayPlus(1);
document.querySelector("#admissionDeskBtn").addEventListener("click", () => switchDesk("admission"));
document.querySelector("#studentDeskBtn").addEventListener("click", () => switchDesk("student"));
document.querySelector("#schedulerDeskBtn").addEventListener("click", () => switchDesk("scheduler"));
document.querySelector("#newLeadBtn").addEventListener("click", () => openForm());
document.querySelector("#newStudentBtn").addEventListener("click", () => openStudentForm());
document.querySelector("#newClassBtn").addEventListener("click", () => openScheduleForm());
document.querySelector("#newBatchBtn").addEventListener("click", () => openBatchForm());
document.querySelector("#newRoomBtn").addEventListener("click", () => openRoomForm());
document.querySelector("#newTeacherBtn").addEventListener("click", () => openTeacherForm());
document.querySelector("#closeDialogBtn").addEventListener("click", closeForm);
document.querySelector("#cancelBtn").addEventListener("click", closeForm);
document.querySelector("#closeDemoScheduleBtn").addEventListener("click", closeDemoScheduleForm);
document.querySelector("#cancelDemoScheduleBtn").addEventListener("click", closeDemoScheduleForm);
document.querySelector("#addDemoSlotBtn").addEventListener("click", () => addDemoSlotRow());
document.querySelector("#closeStudentBtn").addEventListener("click", closeStudentForm);
document.querySelector("#cancelStudentBtn").addEventListener("click", closeStudentForm);
document.querySelector("#closeIdCardBtn").addEventListener("click", closeIdCard);
document.querySelector("#cancelIdCardBtn").addEventListener("click", closeIdCard);
document.querySelector("#printIdCardBtn").addEventListener("click", printIdCard);
document.querySelector("#idCardPhotoInput").addEventListener("change", updateIdCardPhoto);
document.querySelector("#idCardValidityInput").addEventListener("change", updateIdCardPreview);
document.querySelector("#closeScheduleBtn").addEventListener("click", closeScheduleForm);
document.querySelector("#cancelScheduleBtn").addEventListener("click", closeScheduleForm);
document.querySelector("#closeTeacherShareBtn").addEventListener("click", closeTeacherShare);
document.querySelector("#cancelTeacherShareBtn").addEventListener("click", closeTeacherShare);
document.querySelector("#closeBatchBtn").addEventListener("click", () => elements.batchDialog.close());
document.querySelector("#cancelBatchBtn").addEventListener("click", () => elements.batchDialog.close());
document.querySelector("#closeRoomBtn").addEventListener("click", () => elements.roomDialog.close());
document.querySelector("#cancelRoomBtn").addEventListener("click", () => elements.roomDialog.close());
document.querySelector("#closeTeacherBtn").addEventListener("click", () => elements.teacherDialog.close());
document.querySelector("#cancelTeacherBtn").addEventListener("click", () => elements.teacherDialog.close());
document.querySelector("#shareTeacherScheduleBtn").addEventListener("click", shareTeacherSchedules);
document.querySelector("#shareStudentScheduleBtn").addEventListener("click", shareStudentGroupSchedule);
document.querySelector("#exportWeeklyScheduleBtn").addEventListener("click", exportWeeklySchedule);
document.querySelector("#exportTeacherMonthlyBtn").addEventListener("click", exportMonthlyTeacherClasses);
document.querySelector("#exportBatchMonthlyBtn").addEventListener("click", exportMonthlyBatchClasses);
document.querySelector("#downloadScheduleTemplateBtn").addEventListener("click", downloadScheduleTemplate);
document.querySelector("#uploadScheduleBtn").addEventListener("click", () => document.querySelector("#scheduleUploadInput").click());
document.querySelector("#scheduleUploadInput").addEventListener("change", importScheduleTemplate);
document.querySelector("#deleteWeekScheduleBtn").addEventListener("click", deleteSelectedWeekSchedules);
document.querySelector("#welcomeSettingsBtn").addEventListener("click", openSettings);
document.querySelector("#closeSettingsBtn").addEventListener("click", closeSettings);
document.querySelector("#cancelSettingsBtn").addEventListener("click", closeSettings);
document.querySelector("#exportBtn").addEventListener("click", exportCsv);
elements.searchInput.addEventListener("input", render);
elements.sortSelect.addEventListener("change", render);
elements.reportDate.addEventListener("change", updateReportPreview);
elements.scheduleDate.addEventListener("change", renderSchedules);
elements.form.addEventListener("submit", saveLead);
elements.demoScheduleForm.addEventListener("submit", saveDemoSchedule);
elements.studentForm.addEventListener("submit", saveStudentRecord);
elements.idCardForm.addEventListener("submit", saveIdCard);
elements.scheduleForm.addEventListener("submit", saveSchedule);
elements.teacherShareForm.addEventListener("submit", sendSelectedTeacherSchedule);
document.querySelector("#batchForm").addEventListener("submit", saveBatch);
document.querySelector("#roomForm").addEventListener("submit", saveRoom);
document.querySelector("#teacherForm").addEventListener("submit", saveTeacher);
elements.settingsForm.addEventListener("submit", saveSettings);
elements.deleteBtn.addEventListener("click", deleteLead);
document.querySelector("#deleteStudentBtn").addEventListener("click", deleteStudentRecord);
document.querySelector("#deleteScheduleBtn").addEventListener("click", deleteSchedule);
document.querySelector("#deleteBatchBtn").addEventListener("click", deleteBatch);
document.querySelector("#deleteRoomBtn").addEventListener("click", deleteRoom);
document.querySelector("#deleteTeacherBtn").addEventListener("click", deleteTeacher);
document.querySelector("#teacherName").addEventListener("change", fillTeacherPhoneFromMaster);
document.querySelector("#shareTeacherName").addEventListener("change", updateTeacherSharePreview);
document.querySelector("#shareScheduleType").addEventListener("change", updateTeacherSharePreview);
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
renderSchedules();
renderSchedulerMasters();
switchDesk("admission");
updateReportPreview();
updateSyncStatus(
  supabaseClient
    ? "Online sync configured. Checking Supabase..."
    : "Online sync not connected. Check supabase-config.js.",
  supabaseClient ? "ok" : "error"
);
syncFromSupabase();
syncSchedulesFromSupabase();
syncMastersFromSupabase();

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

function loadSchedules() {
  const saved = localStorage.getItem(scheduleStorageKey);
  if (!saved) return [];

  try {
    return JSON.parse(saved);
  } catch {
    return [];
  }
}

function loadSchedulerMasters() {
  const saved = localStorage.getItem(schedulerMastersStorageKey);
  if (!saved) return { batches: [], rooms: [], teachers: [] };

  try {
    return { batches: [], rooms: [], teachers: [], ...JSON.parse(saved) };
  } catch {
    return { batches: [], rooms: [], teachers: [] };
  }
}

function persist() {
  localStorage.setItem(storageKey, JSON.stringify(leads));
  saveLeadsToSupabase();
}

function persistSchedules() {
  localStorage.setItem(scheduleStorageKey, JSON.stringify(schedules));
  saveSchedulesToSupabase();
}

function persistSchedulerMasters() {
  localStorage.setItem(schedulerMastersStorageKey, JSON.stringify(schedulerMasters));
  saveMastersToSupabase();
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

async function syncSchedulesFromSupabase() {
  if (!supabaseClient) return;

  const { data, error } = await supabaseClient
    .from(supabaseScheduleTable)
    .select("data")
    .order("class_date", { ascending: true });

  if (error) {
    console.warn("Supabase schedule load failed. Using local schedule data.", error);
    return;
  }

  const remoteSchedules = (data || []).map((row) => row.data).filter(Boolean);
  if (!remoteSchedules.length) {
    await saveSchedulesToSupabase();
    return;
  }

  schedules = remoteSchedules;
  localStorage.setItem(scheduleStorageKey, JSON.stringify(schedules));
  renderSchedules();
}

async function saveSchedulesToSupabase() {
  if (!supabaseClient || !schedules.length) return;

  const rows = schedules.map((schedule) => ({
    id: schedule.id,
    class_date: schedule.classDate || null,
    teacher_name: schedule.teacherName || null,
    data: schedule,
    updated_at: new Date().toISOString()
  }));

  const { error } = await supabaseClient.from(supabaseScheduleTable).upsert(rows, { onConflict: "id" });
  if (error) {
    console.warn("Supabase schedule save failed. Schedule is still saved in this browser.", error);
  }
}

async function deleteScheduleFromSupabase(id) {
  if (!supabaseClient) return;

  const { error } = await supabaseClient.from(supabaseScheduleTable).delete().eq("id", id);
  if (error) {
    console.warn("Supabase schedule delete failed. Local delete is complete.", error);
  }
}

async function syncMastersFromSupabase() {
  if (!supabaseClient) return;

  const { data, error } = await supabaseClient
    .from(supabaseMasterTable)
    .select("master_type,data");

  if (error) {
    console.warn("Supabase master load failed. Using local master data.", error);
    return;
  }

  if (!data?.length) {
    await saveMastersToSupabase();
    return;
  }

  schedulerMasters = {
    batches: data.filter((row) => row.master_type === "batch").map((row) => row.data),
    rooms: data.filter((row) => row.master_type === "room").map((row) => row.data),
    teachers: data.filter((row) => row.master_type === "teacher").map((row) => row.data)
  };
  localStorage.setItem(schedulerMastersStorageKey, JSON.stringify(schedulerMasters));
  renderSchedulerMasters();
  renderSchedules();
}

async function saveMastersToSupabase() {
  if (!supabaseClient) return;

  const rows = [
    ...schedulerMasters.batches.map((item) => ({ id: item.id, master_type: "batch", data: item, updated_at: new Date().toISOString() })),
    ...schedulerMasters.rooms.map((item) => ({ id: item.id, master_type: "room", data: item, updated_at: new Date().toISOString() })),
    ...schedulerMasters.teachers.map((item) => ({ id: item.id, master_type: "teacher", data: item, updated_at: new Date().toISOString() }))
  ];
  if (!rows.length) return;

  const { error } = await supabaseClient.from(supabaseMasterTable).upsert(rows, { onConflict: "id" });
  if (error) console.warn("Supabase master save failed. Master data is still saved in this browser.", error);
}

async function deleteMasterFromSupabase(id) {
  if (!supabaseClient) return;
  const { error } = await supabaseClient.from(supabaseMasterTable).delete().eq("id", id);
  if (error) console.warn("Supabase master delete failed. Local delete is complete.", error);
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
  renderStudentDesk();
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
  document.querySelectorAll("[data-next-demo]").forEach((button) => {
    button.addEventListener("click", () => openDemoScheduleForm(button.dataset.nextDemo, "append"));
  });
  document.querySelectorAll("[data-whatsapp]").forEach((button) => {
    button.addEventListener("click", () => sendWelcomeWhatsApp(button.dataset.whatsapp));
  });
  document.querySelectorAll("[data-demo-message]").forEach((button) => {
    button.addEventListener("click", () => sendDemoWhatsApp(button.dataset.demoMessage));
  });
}

function switchDesk(desk) {
  activeDesk = desk;
  document.querySelectorAll(".admission-desk").forEach((section) => section.classList.toggle("hidden", desk !== "admission"));
  document.querySelectorAll(".student-desk").forEach((section) => section.classList.toggle("hidden", desk !== "student"));
  document.querySelectorAll(".scheduler-desk").forEach((section) => section.classList.toggle("hidden", desk !== "scheduler"));
  document.querySelector("#admissionDeskBtn").classList.toggle("active", desk === "admission");
  document.querySelector("#studentDeskBtn").classList.toggle("active", desk === "student");
  document.querySelector("#schedulerDeskBtn").classList.toggle("active", desk === "scheduler");
  document.querySelector("h1").textContent = desk === "admission" ? "Admission Desk" : desk === "student" ? "Student Desk" : "Scheduler Desk";
  document.querySelector("#newLeadBtn").hidden = desk !== "admission";
  document.querySelector("#exportBtn").hidden = desk !== "admission";
  document.querySelector("#welcomeSettingsBtn").hidden = desk === "student";
  if (desk === "student") {
    renderStudentDesk();
  }
  if (desk === "scheduler") {
    renderSchedulerMasters();
    renderSchedules();
  }
}

function renderSchedulerMasters() {
  renderMasterList("batch");
  renderMasterList("room");
  renderMasterList("teacher");
  populateScheduleOptions();
}

function renderMasterList(type) {
  const config = getMasterConfig(type);
  const items = schedulerMasters[config.collection];
  const container = elements[config.listElement];
  if (!items.length) {
    container.innerHTML = `<div class="empty-compact">No ${config.labelPlural} saved</div>`;
    return;
  }

  container.innerHTML = items.map((item) => `
    <button class="master-row" data-master-type="${type}" data-master-id="${item.id}" type="button">
      <strong>${escapeHtml(item[config.nameField])}</strong>
      <span>${escapeHtml(getMasterSummary(type, item))}</span>
    </button>
  `).join("");

  container.querySelectorAll("[data-master-id]").forEach((button) => {
    button.addEventListener("click", () => {
      if (type === "batch") openBatchForm(button.dataset.masterId);
      if (type === "room") openRoomForm(button.dataset.masterId);
      if (type === "teacher") openTeacherForm(button.dataset.masterId);
    });
  });
}

function getMasterConfig(type) {
  const configs = {
    batch: { collection: "batches", listElement: "batchList", nameField: "batchName", labelPlural: "batches" },
    room: { collection: "rooms", listElement: "roomList", nameField: "roomName", labelPlural: "classes" },
    teacher: { collection: "teachers", listElement: "teacherList", nameField: "teacherName", labelPlural: "teachers" }
  };
  return configs[type];
}

function getMasterSummary(type, item) {
  if (type === "batch") return `${item.batchStudentCount || 0} students | ${formatTime(item.batchStartTime)}${item.batchEndTime ? ` - ${formatTime(item.batchEndTime)}` : ""}`;
  if (type === "room") return `${item.roomCapacity || 0} sitting capacity`;
  return `${item.teacherSubject || "Subject not set"} | ${item.teacherPhone || "No mobile"}`;
}

function renderFeeFollowup() {
  const enrolled = getAdmissionLeads().filter((lead) => lead.status === "enrolled");
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

function renderStudentDesk() {
  const students = getFullFeeAdmissionStudents();
  const totalFee = students.reduce((total, lead) => total + getMoney(lead.totalFee || lead.fees), 0);
  const totalDiscount = students.reduce((total, lead) => total + getMoney(lead.discount), 0);
  const totalDeposit = students.reduce((total, lead) => total + getMoney(lead.feeDeposit || lead.totalFee || lead.fees), 0);

  elements.studentSummaryText.textContent = students.length
    ? `${students.length} full fee student${students.length === 1 ? "" : "s"} | Total fee Rs ${totalFee.toLocaleString("en-IN")} | Discount Rs ${totalDiscount.toLocaleString("en-IN")} | Deposit Rs ${totalDeposit.toLocaleString("en-IN")}`
    : "No full fee admission students yet";

  if (!students.length) {
    elements.studentList.innerHTML = `<div class="empty-state">No full fee admission students yet</div>`;
    return;
  }

  elements.studentList.innerHTML = students.map(renderStudentCard).join("");
  document.querySelectorAll("[data-student-edit]").forEach((button) => {
    button.addEventListener("click", () => {
      const lead = leads.find((item) => item.id === button.dataset.studentEdit);
      if (lead?.studentDeskOnly) {
        openStudentForm(button.dataset.studentEdit);
        return;
      }
      openForm(button.dataset.studentEdit);
    });
  });
  document.querySelectorAll("[data-id-card]").forEach((button) => {
    button.addEventListener("click", () => openIdCard(button.dataset.idCard));
  });
}

function renderStudentCard(lead) {
  const totalFee = getMoney(lead.totalFee || lead.fees);
  const discount = getMoney(lead.discount);
  const deposit = getMoney(lead.feeDeposit || totalFee - discount);

  return `
    <article class="lead-card student-card">
      <div>
        <div class="lead-title">
          <h3>${escapeHtml(lead.studentName)}</h3>
          <span class="student-id">ID ${escapeHtml(lead.studentId || "")}</span>
          <span class="status-pill status-enrolled">Full Fee</span>
          ${lead.idCardGenerated ? `<span class="status-pill status-demo">ID Card Generated</span>` : ""}
        </div>
        <div class="lead-meta">
          <span>${escapeHtml(lead.course)}</span>
          <span>${escapeHtml(lead.phone)}</span>
          ${lead.enrolledDate ? `<span>Enrolled: ${formatDate(lead.enrolledDate)}</span>` : ""}
          ${lead.idCardValidity ? `<span>Valid till: ${formatDate(lead.idCardValidity)}</span>` : ""}
          <span>Total: Rs ${totalFee.toLocaleString("en-IN")}</span>
          <span>Discount: Rs ${discount.toLocaleString("en-IN")}</span>
          <span>Deposit: Rs ${deposit.toLocaleString("en-IN")}</span>
        </div>
        <p class="lead-notes">${escapeHtml(lead.notes || "No notes added")}</p>
      </div>
      <div class="card-actions">
        <button class="small-button whatsapp-button" data-id-card="${lead.id}" type="button">${lead.idCardGenerated ? "View ID Card" : "ID Card"}</button>
        <button class="small-button" data-student-edit="${lead.id}" type="button">Edit</button>
      </div>
    </article>
  `;
}

function openIdCard(id) {
  const lead = leads.find((item) => item.id === id);
  if (!lead) return;

  document.querySelector("#idCardLeadId").value = id;
  document.querySelector("#idCardValidityInput").value = lead.idCardValidity || todayPlus(365);
  document.querySelector("#idCardPhotoInput").value = "";
  updateIdCardPreview();
  elements.idCardDialog.showModal();
}

function closeIdCard() {
  elements.idCardDialog.close();
}

function updateIdCardPhoto(event) {
  const file = event.target.files?.[0];
  const lead = leads.find((item) => item.id === document.querySelector("#idCardLeadId").value);
  if (!file || !lead) return;

  compressImageFile(file)
    .then((photo) => {
      lead.studentPhoto = photo;
      updateIdCardPreview();
    })
    .catch(() => {
      alert("Photo read nahi ho pa rahi hai. Please JPG/PNG photo select karein.");
      event.target.value = "";
    });
}

function compressImageFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("error", reject);
    reader.addEventListener("load", () => {
      const image = new Image();
      image.addEventListener("error", reject);
      image.addEventListener("load", () => {
        let maxSide = 900;
        let quality = 0.86;
        let compressed = "";

        while (maxSide >= 360) {
          const canvas = document.createElement("canvas");
          const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
          canvas.width = Math.max(1, Math.round(image.width * scale));
          canvas.height = Math.max(1, Math.round(image.height * scale));

          const context = canvas.getContext("2d");
          context.drawImage(image, 0, 0, canvas.width, canvas.height);

          quality = 0.86;
          compressed = canvas.toDataURL("image/jpeg", quality);
          while (getDataUrlSize(compressed) > 950000 && quality > 0.35) {
            quality -= 0.08;
            compressed = canvas.toDataURL("image/jpeg", quality);
          }

          if (getDataUrlSize(compressed) <= 950000) break;
          maxSide -= 120;
        }

        resolve(compressed);
      });
      image.src = reader.result;
    });
    reader.readAsDataURL(file);
  });
}

function getDataUrlSize(dataUrl) {
  const base64 = String(dataUrl || "").split(",")[1] || "";
  return Math.ceil((base64.length * 3) / 4);
}

function updateIdCardPreview() {
  const lead = leads.find((item) => item.id === document.querySelector("#idCardLeadId").value);
  if (!lead) return;

  const validity = document.querySelector("#idCardValidityInput").value || lead.idCardValidity || "";
  elements.idCardPreview.innerHTML = buildIdCardHtml(lead, validity);
}

function saveIdCard(event) {
  event.preventDefault();
  const lead = leads.find((item) => item.id === document.querySelector("#idCardLeadId").value);
  if (!lead) return;

  lead.idCardValidity = document.querySelector("#idCardValidityInput").value;
  lead.idCardGenerated = true;
  lead.idCardGeneratedAt = new Date().toISOString();
  persist();
  closeIdCard();
  render();
  switchDesk("student");
}

function printIdCard() {
  const lead = leads.find((item) => item.id === document.querySelector("#idCardLeadId").value);
  if (!lead) return;

  lead.idCardValidity = document.querySelector("#idCardValidityInput").value || lead.idCardValidity;
  lead.idCardGenerated = true;
  lead.idCardGeneratedAt = new Date().toISOString();
  persist();
  updateIdCardPreview();

  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Popup blocked hai. Browser me popup allow karke phir Print dabayein.");
    return;
  }

  printWindow.document.write(`
    <!doctype html>
    <html>
      <head>
        <title>${escapeHtml(lead.studentName)} ID Card</title>
        <style>
          body { margin: 0; padding: 24px; font-family: Arial, sans-serif; background: #f5f7fb; }
          .print-card-wrap { width: 340px; margin: 0 auto; }
          ${getIdCardPrintCss()}
        </style>
      </head>
      <body>
        <div class="print-card-wrap">${buildIdCardHtml(lead, lead.idCardValidity)}</div>
        <script>window.onload = () => { window.print(); };</script>
      </body>
    </html>
  `);
  printWindow.document.close();
  closeIdCard();
  render();
  switchDesk("student");
}

function buildIdCardHtml(lead, validity) {
  const photo = lead.studentPhoto
    ? `<img src="${lead.studentPhoto}" alt="${escapeHtml(lead.studentName)} photo" />`
    : `<span>PHOTO</span>`;
  const validText = validity ? formatDate(validity) : "Not set";

  return `
    <article class="id-card">
      <div class="id-card-head">
        <img class="id-header-logo" src="assets/logo-cc-straight.jpg" alt="Competition Club" />
        <small>STUDENT ID CARD</small>
      </div>
      <div class="id-card-strip"></div>
      <div class="id-card-body">
        <div class="id-card-photo">${photo}</div>
        <div class="id-card-title">
          <h3>${escapeHtml(lead.studentName)}</h3>
          <span>Valid till ${validText}</span>
        </div>
        <div class="id-card-info">
          <p><b>Student Roll No.</b><span>${escapeHtml(lead.studentId || "")}</span></p>
          <p><b>Course</b><span>${escapeHtml(lead.course || "")}</span></p>
          <p><b>Mobile</b><span>${escapeHtml(lead.phone || "")}</span></p>
          <p><b>Guardian</b><span>${escapeHtml(lead.parentName || "")}</span></p>
          <p><b>Emergency</b><span>${escapeHtml(lead.emergencyPhone || lead.phone || "")}</span></p>
        </div>
      </div>
      <div class="id-card-address">${escapeHtml(lead.address || "Competition Club")}</div>
      <div class="id-card-foot">
        <span>Issued by</span>
        <strong>${escapeHtml(settings.instituteName)}</strong>
        <span>Authorised Sign</span>
      </div>
    </article>
  `;
}

function getIdCardPrintCss() {
  return `
    .id-card { width: 340px; overflow: hidden; border: 1px solid #d0d5dd; border-radius: 16px; background: #fff; color: #101828; box-shadow: 0 12px 30px rgba(16, 24, 40, 0.12); }
    .id-card-head { padding: 8px 10px 10px; background: #cfe8fb; }
    .id-header-logo { display: block; width: 100%; height: 54px; object-fit: contain; background: #cfe8fb; }
    .id-card-head small { display: block; margin-top: 8px; padding: 5px 8px; border-radius: 999px; background: #423488; color: #fff; text-align: center; font-size: 11px; font-weight: 800; letter-spacing: 1px; }
    .id-card-strip { height: 5px; background: linear-gradient(90deg, #e31b3f, #f5b400, #8dd645, #159ca1, #423488); }
    .id-card-body { display: grid; grid-template-columns: 108px 1fr; gap: 12px; padding: 14px; }
    .id-card-photo { grid-row: span 2; width: 108px; height: 132px; display: grid; place-items: center; border: 2px solid #423488; border-radius: 12px; overflow: hidden; background: #f2f4f7; color: #667085; font-size: 12px; font-weight: 800; }
    .id-card-photo img { width: 100%; height: 100%; object-fit: cover; }
    .id-card-title h3 { margin: 0; color: #101828; font-size: 19px; line-height: 1.12; text-transform: uppercase; }
    .id-card-title span { display: inline-flex; margin-top: 7px; padding: 4px 8px; border-radius: 999px; background: #e8f6ef; color: #067647; font-size: 11px; font-weight: 800; }
    .id-card-info { grid-column: 1 / -1; display: grid; gap: 6px; margin-top: 4px; }
    .id-card-info p { display: grid; grid-template-columns: 105px 1fr; gap: 8px; margin: 0; padding: 6px 8px; border-radius: 8px; background: #f8fafc; font-size: 11px; }
    .id-card-info b { color: #475467; }
    .id-card-info span { color: #101828; font-weight: 800; }
    .id-card-address { margin: 0 14px 10px; padding: 7px 9px; border: 1px solid #eaecf0; border-radius: 8px; color: #475467; font-size: 10px; text-align: center; }
    .id-card-foot { display: grid; grid-template-columns: 1fr auto 1fr; align-items: end; gap: 8px; padding: 12px 14px; background: #f8fafc; border-top: 1px solid #eaecf0; color: #475467; font-size: 10px; }
    .id-card-foot strong { color: #423488; font-size: 11px; text-align: center; }
    .id-card-foot span:last-child { text-align: right; border-top: 1px solid #98a2b3; padding-top: 5px; }
  `;
}

function renderSchedules() {
  const visible = getSchedulesForDate(elements.scheduleDate.value);
  elements.scheduleSummaryText.textContent = visible.length
    ? `${visible.length} class${visible.length === 1 ? "" : "es"} scheduled`
    : "No classes scheduled";
  elements.schedulePreview.value = buildStudentGroupSchedule(elements.scheduleDate.value);

  if (!visible.length) {
    elements.scheduleList.innerHTML = `<div class="empty-state">No classes for this date</div>`;
    return;
  }

  elements.scheduleList.innerHTML = visible.map(renderScheduleCard).join("");
  document.querySelectorAll("[data-schedule-edit]").forEach((button) => {
    button.addEventListener("click", () => openScheduleForm(button.dataset.scheduleEdit));
  });
  document.querySelectorAll("[data-teacher-message]").forEach((button) => {
    button.addEventListener("click", () => shareSingleTeacherSchedule(button.dataset.teacherMessage));
  });
}

function renderScheduleCard(schedule) {
  return `
    <article class="lead-card schedule-card">
      <div>
        <div class="lead-title">
          <h3>${escapeHtml(schedule.classSubject)}</h3>
          <span class="student-id">${escapeHtml(schedule.classBatch)}</span>
        </div>
        <div class="lead-meta">
          <span>${formatTime(schedule.classStartTime)}${schedule.classEndTime ? ` - ${formatTime(schedule.classEndTime)}` : ""}</span>
          <span>Teacher: ${escapeHtml(schedule.teacherName)}</span>
          ${schedule.classTopic ? `<span>Topic: ${escapeHtml(schedule.classTopic)}</span>` : ""}
          ${schedule.teacherPhone ? `<span>${escapeHtml(schedule.teacherPhone)}</span>` : ""}
          ${schedule.classRoom ? `<span>Room: ${escapeHtml(schedule.classRoom)}</span>` : ""}
        </div>
        <p class="lead-notes">${escapeHtml(schedule.classNotes || "No notes added")}</p>
      </div>
      <div class="card-actions">
        <button class="small-button whatsapp-button" data-teacher-message="${schedule.id}" type="button">Teacher Msg</button>
        <button class="small-button" data-schedule-edit="${schedule.id}" type="button">Edit</button>
      </div>
    </article>
  `;
}

function renderMetrics() {
  const today = todayPlus(0);
  const admissionLeads = getAdmissionLeads();
  elements.totalCount.textContent = admissionLeads.length;
  elements.demoCount.textContent = admissionLeads.filter((lead) => lead.status === "demo").length;
  elements.enrolledCount.textContent = admissionLeads.filter((lead) => lead.status === "enrolled").length;
  elements.pendingFollowups.textContent = admissionLeads.filter((lead) => {
    return lead.followupDate && lead.followupDate <= today && lead.status !== "enrolled" && lead.status !== "lost";
  }).length;
}

function getAdmissionLeads() {
  return leads.filter((lead) => !lead.studentDeskOnly);
}

function getVisibleLeads() {
  const search = elements.searchInput.value.trim().toLowerCase();
  const filtered = getAdmissionLeads().filter((lead) => {
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
  const demoDayCount = getDemoDayCount(lead);
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
          ${demoDayCount ? `<span>Demo Day ${demoDayCount}</span>` : ""}
          ${lead.demoSlots?.length ? `<span>${lead.demoSlots.length} class${lead.demoSlots.length === 1 ? "" : "es"}</span>` : ""}
          ${lead.followupDate ? `<span>Follow-up: ${formatDate(lead.followupDate)}</span>` : ""}
          ${lead.fees ? `<span>Fees: Rs ${Number(lead.fees).toLocaleString("en-IN")}</span>` : ""}
        </div>
        <p class="lead-notes">${escapeHtml(lead.notes || "No notes added")}</p>
      </div>
      <div class="card-actions">
        ${nextAction ? `<button class="small-button" data-advance="${lead.id}" type="button">${nextAction}</button>` : ""}
        ${lead.status === "demo" ? `<button class="small-button" data-next-demo="${lead.id}" type="button">Next Demo</button>` : ""}
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
    openDemoScheduleForm(id);
    return;
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

function openStudentForm(id) {
  const lead = leads.find((item) => item.id === id);
  elements.studentForm.reset();
  document.querySelector("#studentRecordId").value = lead?.id || "";
  document.querySelector("#studentDeskId").value = lead?.studentId || "";
  elements.studentFormTitle.textContent = lead ? "Edit Student" : "Add Previous Student";
  document.querySelector("#deleteStudentBtn").hidden = !lead;

  if (lead) {
    document.querySelector("#studentDeskName").value = lead.studentName || "";
    document.querySelector("#studentDeskPhone").value = lead.phone || "";
    document.querySelector("#studentDeskCourse").value = lead.course || "";
    document.querySelector("#studentDeskParent").value = lead.parentName || "";
    document.querySelector("#studentDeskAdmissionDate").value = lead.enrolledDate || "";
    document.querySelector("#studentDeskValidity").value = lead.idCardValidity || "";
    document.querySelector("#studentDeskTotalFee").value = lead.totalFee || lead.fees || "";
    document.querySelector("#studentDeskDiscount").value = lead.discount || "";
    document.querySelector("#studentDeskDeposit").value = lead.feeDeposit || lead.totalFee || lead.fees || "";
    document.querySelector("#studentDeskAddress").value = lead.address || "";
    document.querySelector("#studentDeskEmergencyPhone").value = lead.emergencyPhone || "";
    document.querySelector("#studentDeskNotes").value = lead.notes || "";
  } else {
    document.querySelector("#studentDeskAdmissionDate").value = todayPlus(0);
    document.querySelector("#studentDeskValidity").value = todayPlus(365);
  }

  elements.studentDialog.showModal();
  document.querySelector("#studentDeskName").focus();
}

function closeStudentForm() {
  elements.studentDialog.close();
}

function saveStudentRecord(event) {
  event.preventDefault();
  const existingId = document.querySelector("#studentRecordId").value;
  const previousLead = leads.find((item) => item.id === existingId);
  const totalFee = document.querySelector("#studentDeskTotalFee").value;
  const discount = document.querySelector("#studentDeskDiscount").value;
  const deposit = document.querySelector("#studentDeskDeposit").value || Math.max(getMoney(totalFee) - getMoney(discount), 0);
  const lead = {
    ...(previousLead || {}),
    id: existingId || createId(),
    studentDeskOnly: true,
    studentId: document.querySelector("#studentDeskId").value.replace(/\D/g, ""),
    studentName: document.querySelector("#studentDeskName").value.trim(),
    parentName: document.querySelector("#studentDeskParent").value.trim(),
    phone: document.querySelector("#studentDeskPhone").value.trim(),
    course: document.querySelector("#studentDeskCourse").value.trim(),
    source: "Previous Student",
    status: "enrolled",
    enrolledDate: document.querySelector("#studentDeskAdmissionDate").value || todayPlus(0),
    feePlan: "oneTime",
    totalFee,
    discount,
    feeDeposit: String(deposit),
    pendingFee: "0",
    pendingFeeDate: "",
    monthlyFee: "",
    monthlyFeeDeposit: "",
    monthlyDueDate: "",
    fees: totalFee,
    address: document.querySelector("#studentDeskAddress").value.trim(),
    emergencyPhone: document.querySelector("#studentDeskEmergencyPhone").value.trim(),
    idCardValidity: document.querySelector("#studentDeskValidity").value,
    notes: document.querySelector("#studentDeskNotes").value.trim(),
    createdAt: previousLead?.createdAt || new Date().toISOString()
  };

  const existingIndex = leads.findIndex((item) => item.id === lead.id);
  if (existingIndex >= 0) {
    leads[existingIndex] = lead;
  } else {
    leads.unshift(lead);
  }

  persist();
  closeStudentForm();
  render();
  switchDesk("student");
}

function deleteStudentRecord() {
  const id = document.querySelector("#studentRecordId").value;
  if (!id) return;
  if (!confirm("Delete this student from Student Desk?")) return;
  leads = leads.filter((lead) => lead.id !== id);
  localStorage.setItem(storageKey, JSON.stringify(leads));
  deleteLeadFromSupabase(id);
  closeStudentForm();
  render();
  switchDesk("student");
}

function getLeadDemoSlots(lead) {
  if (!lead) return [];
  if (Array.isArray(lead.demoSlots) && lead.demoSlots.length) {
    return lead.demoSlots.filter((slot) => slot.subject && slot.date && slot.time);
  }
  if (lead.demoSubject && lead.demoDate && lead.demoTime) {
    return [{ subject: lead.demoSubject, date: lead.demoDate, time: lead.demoTime }];
  }
  return [];
}

function buildDemoDayGroups(lead) {
  const groups = new Map();
  getLeadDemoSlots(lead)
    .slice()
    .sort((left, right) => `${left.date} ${left.time}`.localeCompare(`${right.date} ${right.time}`))
    .forEach((slot) => {
      if (!groups.has(slot.date)) groups.set(slot.date, []);
      groups.get(slot.date).push(slot);
    });

  return [...groups.entries()].map(([date, slots]) => ({ date, slots }));
}

function getDemoDayCount(lead) {
  return buildDemoDayGroups(lead).length;
}

function buildDemoHistoryHtml(lead) {
  const groups = buildDemoDayGroups(lead);
  if (!groups.length) return "";

  return groups.map((group, index) => {
    const classes = group.slots.map((slot) => `${escapeHtml(slot.subject)} at ${formatTime(slot.time)}`).join(", ");
    return `<p><strong>Day ${index + 1}</strong> - ${formatDate(group.date)}: ${classes}</p>`;
  }).join("");
}

function getNextDemoDate(slots) {
  if (!slots.length) return todayPlus(1);
  const latestDate = slots.map((slot) => slot.date).sort().at(-1);
  const nextDate = new Date(`${latestDate}T00:00:00`);
  if (Number.isNaN(nextDate.getTime())) return todayPlus(1);
  nextDate.setDate(nextDate.getDate() + 1);
  return nextDate.toISOString().slice(0, 10);
}

function updateLeadDemoFields(lead, slots) {
  const sortedSlots = slots
    .filter((slot) => slot.subject && slot.date && slot.time)
    .sort((left, right) => `${left.date} ${left.time}`.localeCompare(`${right.date} ${right.time}`));
  lead.demoSlots = sortedSlots;
  lead.demoDate = sortedSlots[0]?.date || "";
  lead.demoTime = sortedSlots[0]?.time || "";
  lead.demoSubject = sortedSlots.map((slot) => slot.subject).join(", ");
}

function openDemoScheduleForm(id, mode = "replace") {
  const lead = leads.find((item) => item.id === id);
  if (!lead) return;

  document.querySelector("#demoLeadId").value = id;
  elements.demoScheduleForm.dataset.mode = mode;
  document.querySelector("#demoScheduleTitle").textContent = mode === "append" ? "Next Demo" : "Schedule Demo Classes";
  document.querySelector("#demoStudentSummary").innerHTML = `
    <strong>${escapeHtml(lead.studentName)}</strong>
    <span>${escapeHtml(lead.phone)}</span>
    <span>${escapeHtml(lead.course)}</span>
  `;
  document.querySelector("#demoHistory").innerHTML = buildDemoHistoryHtml(lead);
  document.querySelector("#demoSlotList").innerHTML = "";
  const existingSlots = getLeadDemoSlots(lead);
  const defaultDate = getNextDemoDate(existingSlots);
  const slotsToShow = mode === "append"
    ? [{ date: defaultDate, time: "", subject: "" }]
    : (existingSlots.length ? existingSlots : [{ date: lead.demoDate || todayPlus(1), time: lead.demoTime || "", subject: lead.demoSubject || "" }]);
  slotsToShow.forEach((slot) => addDemoSlotRow(slot));
  elements.demoScheduleDialog.showModal();
}

function closeDemoScheduleForm() {
  elements.demoScheduleDialog.close();
}

function addDemoSlotRow(slot = {}) {
  const row = document.createElement("div");
  row.className = "demo-slot-row";
  row.innerHTML = `
    <label>Subject<input class="demo-slot-subject" value="${escapeHtml(slot.subject || "")}" placeholder="Math, Reasoning, English" required /></label>
    <label>Date<input class="demo-slot-date" type="date" value="${escapeHtml(slot.date || todayPlus(1))}" required /></label>
    <label>Time<input class="demo-slot-time" type="time" value="${escapeHtml(slot.time || "")}" required /></label>
    <button class="small-button danger-lite" type="button">Remove</button>
  `;
  row.querySelector("button").addEventListener("click", () => row.remove());
  document.querySelector("#demoSlotList").appendChild(row);
}

function saveDemoSchedule(event) {
  event.preventDefault();
  const lead = leads.find((item) => item.id === document.querySelector("#demoLeadId").value);
  if (!lead) return;

  const rows = [...document.querySelectorAll(".demo-slot-row")];
  const newSlots = rows.map((row) => ({
    subject: row.querySelector(".demo-slot-subject").value.trim(),
    date: row.querySelector(".demo-slot-date").value,
    time: row.querySelector(".demo-slot-time").value
  })).filter((slot) => slot.subject && slot.date && slot.time);

  if (!newSlots.length) {
    alert("Please add at least one demo subject with date and time.");
    return;
  }

  const existingSlots = getLeadDemoSlots(lead);
  const slots = elements.demoScheduleForm.dataset.mode === "append" ? [...existingSlots, ...newSlots] : newSlots;
  lead.status = "demo";
  updateLeadDemoFields(lead, slots);
  lead.followupDate = lead.followupDate || todayPlus(2);
  persist();
  closeDemoScheduleForm();
  render();
}

function openScheduleForm(id) {
  const schedule = schedules.find((item) => item.id === id);
  elements.scheduleForm.reset();
  populateScheduleOptions();
  document.querySelector("#scheduleId").value = schedule?.id || "";
  elements.scheduleFormTitle.textContent = schedule ? "Edit Class" : "Add Class";
  document.querySelector("#deleteScheduleBtn").hidden = !schedule;
  document.querySelector("#classDate").value = schedule?.classDate || elements.scheduleDate.value || todayPlus(1);

  if (schedule) {
    Object.entries(schedule).forEach(([key, value]) => {
      const input = document.querySelector(`#${key}`);
      if (input) input.value = value || "";
    });
  }

  elements.scheduleDialog.showModal();
  document.querySelector("#classStartTime").focus();
}

function closeScheduleForm() {
  elements.scheduleDialog.close();
}

function saveSchedule(event) {
  event.preventDefault();
  const existingId = document.querySelector("#scheduleId").value;
  const selectedTeacher = getTeacherByName(document.querySelector("#teacherName").value);
  const schedule = {
    id: existingId || createId(),
    classDate: document.querySelector("#classDate").value,
    classStartTime: document.querySelector("#classStartTime").value,
    classEndTime: document.querySelector("#classEndTime").value,
    teacherName: document.querySelector("#teacherName").value.trim(),
    teacherPhone: document.querySelector("#teacherPhone").value.trim() || selectedTeacher?.teacherPhone || "",
    classSubject: document.querySelector("#classSubject").value.trim(),
    classTopic: document.querySelector("#classTopic").value.trim(),
    classBatch: document.querySelector("#classBatch").value.trim(),
    classRoom: document.querySelector("#classRoom").value.trim(),
    classNotes: document.querySelector("#classNotes").value.trim(),
    createdAt: existingId ? schedules.find((item) => item.id === existingId)?.createdAt || new Date().toISOString() : new Date().toISOString()
  };

  const conflict = findScheduleConflict(schedule);
  if (conflict) {
    alert(conflict);
    return;
  }

  const existingIndex = schedules.findIndex((item) => item.id === schedule.id);
  if (existingIndex >= 0) {
    schedules[existingIndex] = schedule;
  } else {
    schedules.push(schedule);
  }

  elements.scheduleDate.value = schedule.classDate;
  persistSchedules();
  closeScheduleForm();
  renderSchedules();
}

function deleteSchedule() {
  const id = document.querySelector("#scheduleId").value;
  schedules = schedules.filter((schedule) => schedule.id !== id);
  persistSchedules();
  deleteScheduleFromSupabase(id);
  closeScheduleForm();
  renderSchedules();
}

function deleteSelectedWeekSchedules() {
  const range = getWeekRange(elements.scheduleDate.value);
  const weekSchedules = schedules.filter((schedule) => isDateInRange(schedule.classDate, range.start, range.end));
  if (!weekSchedules.length) {
    updateUploadStatus(`No classes found from ${formatDate(range.start)} to ${formatDate(range.end)}.`, "error");
    return;
  }

  const confirmed = confirm(`Delete ${weekSchedules.length} classes from ${formatDate(range.start)} to ${formatDate(range.end)}?`);
  if (!confirmed) return;

  const deleteIds = new Set(weekSchedules.map((schedule) => schedule.id));
  schedules = schedules.filter((schedule) => !deleteIds.has(schedule.id));
  localStorage.setItem(scheduleStorageKey, JSON.stringify(schedules));
  weekSchedules.forEach((schedule) => deleteScheduleFromSupabase(schedule.id));
  renderSchedules();
  updateUploadStatus(`${weekSchedules.length} classes deleted for selected week. You can upload the corrected file now.`, "ok");
}

function openBatchForm(id) {
  const batch = schedulerMasters.batches.find((item) => item.id === id);
  document.querySelector("#batchForm").reset();
  document.querySelector("#batchId").value = batch?.id || "";
  document.querySelector("#deleteBatchBtn").hidden = !batch;
  if (batch) fillFormFields(batch);
  elements.batchDialog.showModal();
  document.querySelector("#batchName").focus();
}

function saveBatch(event) {
  event.preventDefault();
  const id = document.querySelector("#batchId").value || createId();
  const batch = {
    id,
    batchName: document.querySelector("#batchName").value.trim(),
    batchStudentCount: document.querySelector("#batchStudentCount").value,
    batchStartTime: document.querySelector("#batchStartTime").value,
    batchEndTime: document.querySelector("#batchEndTime").value
  };
  upsertMaster("batches", batch);
  elements.batchDialog.close();
}

function deleteBatch() {
  deleteMaster("batches", document.querySelector("#batchId").value);
  elements.batchDialog.close();
}

function openRoomForm(id) {
  const room = schedulerMasters.rooms.find((item) => item.id === id);
  document.querySelector("#roomForm").reset();
  document.querySelector("#roomId").value = room?.id || "";
  document.querySelector("#deleteRoomBtn").hidden = !room;
  if (room) fillFormFields(room);
  elements.roomDialog.showModal();
  document.querySelector("#roomName").focus();
}

function saveRoom(event) {
  event.preventDefault();
  const id = document.querySelector("#roomId").value || createId();
  const room = {
    id,
    roomName: document.querySelector("#roomName").value.trim(),
    roomCapacity: document.querySelector("#roomCapacity").value
  };
  upsertMaster("rooms", room);
  elements.roomDialog.close();
}

function deleteRoom() {
  deleteMaster("rooms", document.querySelector("#roomId").value);
  elements.roomDialog.close();
}

function openTeacherForm(id) {
  const teacher = schedulerMasters.teachers.find((item) => item.id === id);
  document.querySelector("#teacherForm").reset();
  document.querySelector("#teacherId").value = teacher?.id || "";
  document.querySelector("#deleteTeacherBtn").hidden = !teacher;
  if (teacher) {
    document.querySelector("#teacherMasterName").value = teacher.teacherName || "";
    document.querySelector("#teacherMasterPhone").value = teacher.teacherPhone || "";
    document.querySelector("#teacherMasterSubject").value = teacher.teacherSubject || "";
  }
  elements.teacherDialog.showModal();
  document.querySelector("#teacherMasterName").focus();
}

function saveTeacher(event) {
  event.preventDefault();
  const id = document.querySelector("#teacherId").value || createId();
  const teacher = {
    id,
    teacherName: document.querySelector("#teacherMasterName").value.trim(),
    teacherPhone: document.querySelector("#teacherMasterPhone").value.trim(),
    teacherSubject: document.querySelector("#teacherMasterSubject").value.trim()
  };
  upsertMaster("teachers", teacher);
  elements.teacherDialog.close();
}

function deleteTeacher() {
  deleteMaster("teachers", document.querySelector("#teacherId").value);
  elements.teacherDialog.close();
}

function upsertMaster(collection, item) {
  const index = schedulerMasters[collection].findIndex((existing) => existing.id === item.id);
  if (index >= 0) schedulerMasters[collection][index] = item;
  else schedulerMasters[collection].push(item);
  persistSchedulerMasters();
  renderSchedulerMasters();
}

function deleteMaster(collection, id) {
  schedulerMasters[collection] = schedulerMasters[collection].filter((item) => item.id !== id);
  persistSchedulerMasters();
  deleteMasterFromSupabase(id);
  renderSchedulerMasters();
}

function fillFormFields(data) {
  Object.entries(data).forEach(([key, value]) => {
    const input = document.querySelector(`#${key}`);
    if (input) input.value = value || "";
  });
}

function populateScheduleOptions() {
  populateSelect("#teacherName", schedulerMasters.teachers.map((teacher) => teacher.teacherName), "Select teacher");
  populateSelect("#classBatch", schedulerMasters.batches.map((batch) => batch.batchName), "Select batch");
  populateSelect("#classRoom", schedulerMasters.rooms.map((room) => room.roomName), "Select class");
}

function populateSelect(selector, values, placeholder) {
  const select = document.querySelector(selector);
  const current = select.value;
  select.innerHTML = `<option value="">${placeholder}</option>` + values
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b))
    .map((value) => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`)
    .join("");
  if (values.includes(current)) select.value = current;
}

function fillTeacherPhoneFromMaster() {
  const teacher = getTeacherByName(document.querySelector("#teacherName").value);
  if (teacher) document.querySelector("#teacherPhone").value = teacher.teacherPhone || "";
}

function getTeacherByName(name) {
  return schedulerMasters.teachers.find((teacher) => teacher.teacherName === name);
}

function getBatchByName(name) {
  return schedulerMasters.batches.find((batch) => batch.batchName === name);
}

function getRoomByName(name) {
  return schedulerMasters.rooms.find((room) => room.roomName === name);
}

function findScheduleConflict(schedule) {
  if (!schedule.classStartTime || !schedule.classEndTime) return "";

  const batch = getBatchByName(schedule.classBatch);
  const room = getRoomByName(schedule.classRoom);
  if (batch && room && getMoney(batch.batchStudentCount) > getMoney(room.roomCapacity)) {
    return `${schedule.classRoom} capacity is ${room.roomCapacity}, but ${schedule.classBatch} has ${batch.batchStudentCount} students. Please select a bigger class.`;
  }

  const sameDate = schedules.filter((item) => item.id !== schedule.id && item.classDate === schedule.classDate);
  const teacherConflict = sameDate.find((item) => item.teacherName === schedule.teacherName && timesOverlap(schedule, item));
  if (teacherConflict) {
    return `${schedule.teacherName} already has ${teacherConflict.classSubject} for ${teacherConflict.classBatch} at this time.`;
  }

  const roomConflict = sameDate.find((item) => schedule.classRoom && item.classRoom === schedule.classRoom && timesOverlap(schedule, item));
  if (roomConflict) {
    return `${schedule.classRoom} is already booked for ${roomConflict.classSubject} / ${roomConflict.classBatch} at this time.`;
  }

  const batchConflict = sameDate.find((item) => item.classBatch === schedule.classBatch && timesOverlap(schedule, item));
  if (batchConflict) {
    return `${schedule.classBatch} already has ${batchConflict.classSubject} at this time.`;
  }

  return "";
}

function timesOverlap(left, right) {
  if (!left.classStartTime || !left.classEndTime || !right.classStartTime || !right.classEndTime) return false;
  return left.classStartTime < right.classEndTime && left.classEndTime > right.classStartTime;
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
  const previousLead = leads.find((item) => item.id === existingId);
  const enteredDemoSubject = document.querySelector("#demoSubject").value.trim();
  const enteredDemoDate = document.querySelector("#demoDate").value;
  const enteredDemoTime = document.querySelector("#demoTime").value;
  const keepPreviousDemoSlots = Boolean(
    previousLead?.demoSlots?.length &&
      enteredDemoSubject === (previousLead.demoSubject || "") &&
      enteredDemoDate === (previousLead.demoDate || "") &&
      enteredDemoTime === (previousLead.demoTime || "")
  );
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
    demoSlots: keepPreviousDemoSlots
      ? getLeadDemoSlots(previousLead)
      : enteredDemoSubject
      ? [{ subject: enteredDemoSubject, date: enteredDemoDate, time: enteredDemoTime }]
      : getLeadDemoSlots(previousLead || {}),
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

function exportScheduleCsv(filename, rows, reportName) {
  const headers = [
    "Report",
    "Date",
    "Day",
    "Start Time",
    "End Time",
    "Teacher",
    "Teacher Mobile",
    "Subject",
    "Topic",
    "Batch",
    "Classroom",
    "Notes"
  ];
  const data = rows.map((schedule) => [
    reportName,
    schedule.classDate,
    getDayName(schedule.classDate),
    schedule.classStartTime,
    schedule.classEndTime,
    schedule.teacherName,
    schedule.teacherPhone,
    schedule.classSubject,
    schedule.classTopic,
    schedule.classBatch,
    schedule.classRoom,
    schedule.classNotes
  ]);
  downloadCsv(filename, [headers, ...data]);
}

function downloadCsv(filename, rows) {
  const csv = rows.map((row) => row.map(csvCell).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function openSettings() {
  document.querySelector("#instituteName").value = settings.instituteName;
  document.querySelector("#countryCode").value = settings.countryCode;
  document.querySelector("#welcomeTemplate").value = settings.welcomeTemplate;
  document.querySelector("#demoTemplate").value = settings.demoTemplate;
  document.querySelector("#feeReminderTemplate").value = settings.feeReminderTemplate;
  document.querySelector("#teacherScheduleTemplate").value = settings.teacherScheduleTemplate;
  document.querySelector("#studentScheduleTemplate").value = settings.studentScheduleTemplate;
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
    feeReminderTemplate: document.querySelector("#feeReminderTemplate").value.trim() || defaultSettings.feeReminderTemplate,
    teacherScheduleTemplate: document.querySelector("#teacherScheduleTemplate").value.trim() || defaultSettings.teacherScheduleTemplate,
    studentScheduleTemplate: document.querySelector("#studentScheduleTemplate").value.trim() || defaultSettings.studentScheduleTemplate
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
  const message = getLeadDemoSlots(lead).length ? buildMultiDemoMessage(lead) : fillTemplate(settings.demoTemplate, lead);
  if (!phone) {
    alert("Please add a valid student WhatsApp number before sending the demo message.");
    return;
  }

  openWhatsApp(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`);
}

function buildMultiDemoMessage(lead) {
  const lines = buildDemoDayGroups(lead).map((group, index) => {
    const classes = group.slots.map((slot) => `${slot.subject} at ${formatTime(slot.time)}`).join(", ");
    return `Day ${index + 1} - ${formatDate(group.date)}: ${classes}`;
  }).join("\n");
  return [
    `Hello ${lead.studentName || "Student"}, your demo classes at ${settings.instituteName} are scheduled:`,
    "",
    lines,
    "",
    "Please reply on WhatsApp if you need any help."
  ].join("\n");
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

function shareSingleTeacherSchedule(id) {
  const schedule = schedules.find((item) => item.id === id);
  if (!schedule) return;
  openTeacherShareDialog(schedule.teacherName, "daily");
}

function shareTeacherSchedules() {
  openTeacherShareDialog("", "daily");
}

function shareTeacherScheduleByName(teacherName, date = elements.scheduleDate.value) {
  const range = getWeekRange(date);
  const teacherSchedules = schedules
    .filter((schedule) => schedule.teacherName === teacherName && isDateInRange(schedule.classDate, range.start, range.end))
    .sort(sortScheduleRecords);
  if (!teacherSchedules.length) return;

  const phone = normalizePhone(teacherSchedules[0].teacherPhone);
  if (!phone) {
    alert("Please add the teacher WhatsApp number before sending the schedule.");
    return;
  }

  const message = buildTeacherScheduleMessage(teacherName, teacherSchedules);
  openWhatsApp(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`);
}

function openTeacherShareDialog(teacherName = "", type = "daily") {
  populateShareTeacherOptions();
  document.querySelector("#shareTeacherName").value = teacherName || document.querySelector("#shareTeacherName").value;
  document.querySelector("#shareScheduleType").value = type;
  updateTeacherSharePreview();
  elements.teacherShareDialog.showModal();
}

function closeTeacherShare() {
  elements.teacherShareDialog.close();
}

function populateShareTeacherOptions() {
  const week = getWeekRange(elements.scheduleDate.value);
  const names = [...new Set(schedules
    .filter((schedule) => isDateInRange(schedule.classDate, week.start, week.end))
    .map((schedule) => schedule.teacherName)
    .filter(Boolean))].sort((a, b) => a.localeCompare(b));
  const teacherNames = names.length ? names : schedulerMasters.teachers.map((teacher) => teacher.teacherName).filter(Boolean);
  populateSelect("#shareTeacherName", teacherNames, "Select teacher");
}

function getSelectedTeacherSchedules() {
  const teacherName = document.querySelector("#shareTeacherName").value;
  const type = document.querySelector("#shareScheduleType").value;
  if (type === "daily") {
    return getSchedulesForDate(elements.scheduleDate.value).filter((schedule) => schedule.teacherName === teacherName);
  }

  const week = getWeekRange(elements.scheduleDate.value);
  return schedules
    .filter((schedule) => schedule.teacherName === teacherName && isDateInRange(schedule.classDate, week.start, week.end))
    .sort(sortScheduleRecords);
}

function updateTeacherSharePreview() {
  const teacherName = document.querySelector("#shareTeacherName").value;
  if (!teacherName) {
    elements.teacherSharePreview.value = "Select a teacher to preview schedule.";
    return;
  }

  const type = document.querySelector("#shareScheduleType").value;
  const selectedSchedules = getSelectedTeacherSchedules();
  elements.teacherSharePreview.value = type === "daily"
    ? buildTeacherDailyScheduleMessage(teacherName, selectedSchedules)
    : buildTeacherScheduleMessage(teacherName, selectedSchedules);
}

function sendSelectedTeacherSchedule(event) {
  event.preventDefault();
  const teacherName = document.querySelector("#shareTeacherName").value;
  const teacher = getTeacherByName(teacherName);
  const phone = normalizePhone(teacher?.teacherPhone || getSelectedTeacherSchedules()[0]?.teacherPhone || "");
  if (!phone) {
    alert("Please add teacher mobile number in Teacher Master.");
    return;
  }

  const message = elements.teacherSharePreview.value;
  if (!message || message.includes("No classes scheduled")) {
    alert("No classes found for this teacher and selected schedule type.");
    return;
  }

  closeTeacherShare();
  openWhatsApp(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`);
}

function shareStudentGroupSchedule() {
  const message = buildStudentGroupSchedule(elements.scheduleDate.value);
  elements.schedulePreview.value = message;
  openWhatsApp(`https://wa.me/?text=${encodeURIComponent(message)}`);
}

function exportWeeklySchedule() {
  const range = getWeekRange(elements.scheduleDate.value);
  const rows = schedules
    .filter((schedule) => isDateInRange(schedule.classDate, range.start, range.end))
    .sort(sortScheduleRecords);
  exportScheduleCsv(`weekly-schedule-${range.start}-to-${range.end}.csv`, rows, "Weekly Schedule");
}

function exportMonthlyTeacherClasses() {
  const range = getMonthRange(elements.scheduleDate.value);
  const rows = schedules
    .filter((schedule) => isDateInRange(schedule.classDate, range.start, range.end))
    .sort((a, b) => (a.teacherName || "").localeCompare(b.teacherName || "") || sortScheduleRecords(a, b));
  exportScheduleCsv(`monthly-teacher-classes-${range.start}-to-${range.end}.csv`, rows, "Monthly Teacher Classes");
}

function exportMonthlyBatchClasses() {
  const range = getMonthRange(elements.scheduleDate.value);
  const rows = schedules
    .filter((schedule) => isDateInRange(schedule.classDate, range.start, range.end))
    .sort((a, b) => (a.classBatch || "").localeCompare(b.classBatch || "") || sortScheduleRecords(a, b));
  exportScheduleCsv(`monthly-batch-classes-${range.start}-to-${range.end}.csv`, rows, "Monthly Batch Classes");
}

function downloadScheduleTemplate() {
  if (window.JSZip) {
    downloadScheduleTemplateXlsx();
    return;
  }

  const range = getWeekRange(elements.scheduleDate.value);
  downloadCsv(`weekly-schedule-template-${range.start}.csv`, getScheduleTemplateRows(range));
}

function importScheduleTemplate(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  updateUploadStatus(`Reading ${file.name}...`, "ok");
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const rows = file.name.toLowerCase().endsWith(".xlsx")
        ? parseScheduleXlsx(reader.result)
        : parseCsv(String(reader.result || ""));
      updateUploadStatus(`${rows.length} rows read from ${file.name}. Checking schedule...`, "ok");

      const imported = rowsToSchedules(rows);
      if (!imported.length) {
        const message = "No schedule rows found. Keep Date, Start Time, Teacher, Subject, Batch and Classroom headings.";
        updateUploadStatus(message, "error");
        alert(message);
        event.target.value = "";
        return;
      }

      const result = addImportedSchedules(imported);
      persistSchedules();
      renderSchedules();
      event.target.value = "";
      const detail = result.reasons.length ? ` Reasons: ${result.reasons.slice(0, 3).join(" | ")}` : "";
      const message = `${result.added} classes uploaded. ${result.skipped} skipped.${detail}`;
      updateUploadStatus(message, result.added ? "ok" : "error");
      alert(message);
    } catch (error) {
      const message = `Upload failed: ${error.message}`;
      updateUploadStatus(message, "error");
      alert(message);
      event.target.value = "";
    }
  };
  reader.onerror = () => {
    const message = "File could not be read. Please close the Excel file and try upload again.";
    updateUploadStatus(message, "error");
    alert(message);
    event.target.value = "";
  };
  if (file.name.toLowerCase().endsWith(".xlsx")) {
    reader.readAsArrayBuffer(file);
  } else {
    reader.readAsText(file);
  }
}

function updateUploadStatus(message, type) {
  if (!elements.uploadStatus) return;
  elements.uploadStatus.textContent = message;
  elements.uploadStatus.classList.toggle("ok", type === "ok");
  elements.uploadStatus.classList.toggle("error", type === "error");
}

function getScheduleTemplateRows(range) {
  return [
    ["Date", "Start Time", "End Time", "Teacher", "Subject", "Topic", "Batch", "Classroom", "Notes"],
    [range.start, "09:00", "10:00", schedulerMasters.teachers[0]?.teacherName || "", schedulerMasters.teachers[0]?.teacherSubject || "", "Chapter / Topic", schedulerMasters.batches[0]?.batchName || "", schedulerMasters.rooms[0]?.roomName || "", ""]
  ];
}

async function downloadScheduleTemplateXlsx() {
  const range = getWeekRange(elements.scheduleDate.value);
  const rows = getScheduleTemplateRows(range);
  const zip = new JSZip();
  const teacherNames = schedulerMasters.teachers.map((teacher) => teacher.teacherName).filter(Boolean);
  const batchNames = schedulerMasters.batches.map((batch) => batch.batchName).filter(Boolean);
  const roomNames = schedulerMasters.rooms.map((room) => room.roomName).filter(Boolean);

  zip.file("[Content_Types].xml", xlsxContentTypesXml());
  zip.folder("_rels").file(".rels", xlsxRootRelsXml());
  zip.folder("xl").file("workbook.xml", xlsxWorkbookXml());
  zip.folder("xl").folder("_rels").file("workbook.xml.rels", xlsxWorkbookRelsXml());
  zip.folder("xl").folder("worksheets").file("sheet1.xml", scheduleSheetXml(rows));
  zip.folder("xl").folder("worksheets").file("sheet2.xml", listsSheetXml(teacherNames, batchNames, roomNames));

  const blob = await zip.generateAsync({
    type: "blob",
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `weekly-schedule-template-${range.start}.xlsx`;
  link.click();
  URL.revokeObjectURL(url);
}

function xlsxContentTypesXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/worksheets/sheet2.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
</Types>`;
}

function xlsxRootRelsXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`;
}

function xlsxWorkbookRelsXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet2.xml"/>
</Relationships>`;
}

function xlsxWorkbookXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    <sheet name="Schedule" sheetId="1" r:id="rId1"/>
    <sheet name="Lists" sheetId="2" state="hidden" r:id="rId2"/>
  </sheets>
</workbook>`;
}

function scheduleSheetXml(rows) {
  const blankRows = Array.from({ length: 198 }, () => ["", "", "", "", "", "", "", "", ""]);
  const allRows = [...rows, ...blankRows];
  const dataRows = allRows.map((row, rowIndex) => xmlRow(row, rowIndex + 1)).join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <dimension ref="A1:I200"/>
  <sheetViews><sheetView workbookViewId="0"/></sheetViews>
  <sheetData>${dataRows}</sheetData>
  <dataValidations count="3">
    <dataValidation type="list" allowBlank="1" showErrorMessage="1" sqref="D2:D200"><formula1>Lists!$A$1:$A$200</formula1></dataValidation>
    <dataValidation type="list" allowBlank="1" showErrorMessage="1" sqref="G2:G200"><formula1>Lists!$B$1:$B$200</formula1></dataValidation>
    <dataValidation type="list" allowBlank="1" showErrorMessage="1" sqref="H2:H200"><formula1>Lists!$C$1:$C$200</formula1></dataValidation>
  </dataValidations>
</worksheet>`;
}

function listsSheetXml(teachers, batches, rooms) {
  const rowCount = Math.max(teachers.length, batches.length, rooms.length, 1);
  const rows = Array.from({ length: rowCount }, (_, index) => [
    teachers[index] || "",
    batches[index] || "",
    rooms[index] || ""
  ]);
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetData>${rows.map((row, index) => xmlRow(row, index + 1)).join("")}</sheetData>
</worksheet>`;
}

function xmlRow(values, rowNumber) {
  return `<row r="${rowNumber}">${values.map((value, index) => {
    const ref = `${columnName(index + 1)}${rowNumber}`;
    return `<c r="${ref}" t="inlineStr"><is><t>${escapeXml(value)}</t></is></c>`;
  }).join("")}</row>`;
}

function columnName(number) {
  let name = "";
  while (number > 0) {
    const remainder = (number - 1) % 26;
    name = String.fromCharCode(65 + remainder) + name;
    number = Math.floor((number - 1) / 26);
  }
  return name;
}

function escapeXml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
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
  const admissionLeads = getAdmissionLeads();
  const enquiries = admissionLeads.filter((lead) => getDateOnly(lead.createdAt) === reportDate);
  const demos = admissionLeads.filter((lead) => lead.demoDate === reportDate);
  const enrollments = admissionLeads.filter((lead) => lead.enrolledDate === reportDate || (lead.status === "enrolled" && getDateOnly(lead.createdAt) === reportDate));
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

function getSchedulesForDate(date) {
  return schedules
    .filter((schedule) => schedule.classDate === date)
    .sort((a, b) => (a.classStartTime || "").localeCompare(b.classStartTime || ""));
}

function buildTeacherScheduleMessage(teacherName, teacherSchedules) {
  const range = getWeekRange(teacherSchedules[0]?.classDate || elements.scheduleDate.value);
  return [
    `Date :- ${formatSlashDate(range.start)} to ${formatSlashDate(range.end)}`,
    teacherName,
    "",
    formatTeacherWeeklyScheduleLines(teacherSchedules),
    "",
    "Thank you 🙏",
    settings.instituteName
  ].join("\n");
}

function buildTeacherDailyScheduleMessage(teacherName, teacherSchedules) {
  const date = elements.scheduleDate.value;
  return [
    `Date :- ${formatSlashDate(date)}`,
    teacherName,
    "",
    `${getDayName(date)} - ${formatSlashDate(date)}`,
    formatTeacherDailyScheduleLines(teacherSchedules),
    "",
    "Thank you 🙏",
    settings.instituteName
  ].join("\n");
}

function buildStudentGroupSchedule(date) {
  const daySchedules = getSchedulesForDate(date);
  const classList = formatStudentGroupScheduleLines(daySchedules);
  return [
    "Please find the daily schedule",
    "",
    `Date :- ${formatSlashDate(date)}`,
    `Day :- ${getDayName(date)}`,
    "",
    classList || "No classes scheduled",
    "",
    "Thank you 🙏",
    settings.instituteName
  ].join("\n");
}

function formatScheduleLines(items) {
  if (!items.length) return "";

  return items.map((schedule, index) => {
    const time = `${formatTime(schedule.classStartTime)}${schedule.classEndTime ? ` - ${formatTime(schedule.classEndTime)}` : ""}`;
    const details = [
      `${index + 1}. ${formatDate(schedule.classDate)} ${time}`,
      schedule.classSubject,
      schedule.classTopic ? `Topic: ${schedule.classTopic}` : "",
      schedule.classBatch,
      schedule.teacherName ? `Teacher: ${schedule.teacherName}` : "",
      schedule.classRoom ? `Room: ${schedule.classRoom}` : "",
      schedule.classNotes ? `Note: ${schedule.classNotes}` : ""
    ].filter(Boolean);
    return details.join(" | ");
  }).join("\n");
}

function fillScheduleTemplate(template, values) {
  return template
    .replaceAll("{institute}", settings.instituteName)
    .replaceAll("{teacher}", values.teacher || "")
    .replaceAll("{scheduleDate}", values.scheduleDate || "")
    .replaceAll("{scheduleDay}", values.scheduleDay || "")
    .replaceAll("{classList}", values.classList || "");
}

function formatStudentGroupScheduleLines(items) {
  if (!items.length) return "";

  const batches = [...new Set(items.map((schedule) => schedule.classBatch).filter(Boolean))];
  return batches.map((batch) => {
    const batchClasses = items
      .filter((schedule) => schedule.classBatch === batch)
      .sort((a, b) => (a.classStartTime || "").localeCompare(b.classStartTime || ""));
    const offClass = batchClasses.find((schedule) => isOffSchedule(schedule));
    if (offClass) return `${batch}-off`;

    if (batchClasses.length === 1 && isCompactBatchLine(batchClasses[0])) {
      const schedule = batchClasses[0];
      return `${batch} - ${formatNoticeTime(schedule.classStartTime)} - ${formatNoticeSubject(schedule)}`;
    }

    const lines = batchClasses.map((schedule) => {
      const time = `${formatNoticeTime(schedule.classStartTime)} to ${formatNoticeTime(schedule.classEndTime)}`;
      const teacher = schedule.teacherName ? ` (${schedule.teacherName})` : "";
      return `${time} - ${formatNoticeSubject(schedule)}${teacher}`;
    });

    return `${batch}\n${lines.join("\n")}`;
  }).join("\n\n");
}

function formatTeacherWeeklyScheduleLines(items) {
  if (!items.length) return "No classes scheduled";

  const dates = [...new Set(items.map((schedule) => schedule.classDate).filter(Boolean))].sort();
  return dates.map((date) => {
    const dayItems = items
      .filter((schedule) => schedule.classDate === date)
      .sort((a, b) => (a.classStartTime || "").localeCompare(b.classStartTime || ""));
    const lines = dayItems.map((schedule) => {
      const time = `${formatNoticeTime(schedule.classStartTime)} to ${formatNoticeTime(schedule.classEndTime)}`;
      const batch = schedule.classBatch ? ` - ${schedule.classBatch}` : "";
      const room = schedule.classRoom ? ` (${schedule.classRoom})` : "";
      return `${time} - ${formatNoticeSubject(schedule)}${batch}${room}`;
    });

    return `${getDayName(date)} - ${formatSlashDate(date)}\n${lines.join("\n")}`;
  }).join("\n\n");
}

function formatTeacherDailyScheduleLines(items) {
  if (!items.length) return "No classes scheduled";

  return items
    .sort((a, b) => (a.classStartTime || "").localeCompare(b.classStartTime || ""))
    .map((schedule) => {
      const time = `${formatNoticeTime(schedule.classStartTime)} to ${formatNoticeTime(schedule.classEndTime)}`;
      const batch = schedule.classBatch ? ` - ${schedule.classBatch}` : "";
      const room = schedule.classRoom ? ` (${schedule.classRoom})` : "";
      return `${time} - ${formatNoticeSubject(schedule)}${batch}${room}`;
    })
    .join("\n");
}

function isOffSchedule(schedule) {
  const subject = String(schedule.classSubject || "").trim().toLowerCase();
  const topic = String(schedule.classTopic || "").trim().toLowerCase();
  return subject === "off" || topic === "off";
}

function isCompactBatchLine(schedule) {
  const subject = String(schedule.classSubject || "").toLowerCase();
  const topic = String(schedule.classTopic || "").toLowerCase();
  return subject.includes("test") || topic.includes("test");
}

function formatNoticeSubject(schedule) {
  if (schedule.classTopic && !String(schedule.classSubject || "").toLowerCase().includes("test")) {
    return `${schedule.classSubject} - ${schedule.classTopic}`;
  }
  return schedule.classTopic || schedule.classSubject || "";
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];
    if (char === '"' && quoted && next === '"') {
      cell += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      row.push(cell);
      cell = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(cell);
      if (row.some((value) => value.trim())) rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }

  row.push(cell);
  if (row.some((value) => value.trim())) rows.push(row);
  return rows;
}

function rowsToSchedules(rows) {
  if (rows.length < 2) return [];
  const headerIndex = rows.findIndex((row) => row.some((cell) => normalizeHeader(cell) === "date"));
  if (headerIndex < 0) return [];

  const headers = rows[headerIndex].map((header) => normalizeHeader(header));
  return rows.slice(headerIndex + 1).map((row, index) => {
    const value = (...names) => {
      const foundIndex = names.map((name) => headers.indexOf(name)).find((position) => position >= 0);
      return foundIndex >= 0 ? String(row[foundIndex] || "").trim() : "";
    };
    const teacher = getTeacherByName(value("teacher"));
    return {
      id: createId(),
      importRow: headerIndex + index + 2,
      classDate: normalizeImportDate(value("date", "classdate", "scheduledate")),
      classStartTime: normalizeImportTime(value("starttime", "time", "fromtime", "classtime")),
      classEndTime: normalizeImportTime(value("endtime", "totime")),
      teacherName: value("teacher"),
      teacherPhone: teacher?.teacherPhone || value("teachermobile") || "",
      classSubject: value("subject", "subjrc", "subjec", "classsubject"),
      classTopic: value("topic", "topicname", "chapter"),
      classBatch: value("batch", "batchname", "group"),
      classRoom: value("classroom", "class", "classname", "room"),
      classNotes: value("notes"),
      createdAt: new Date().toISOString()
    };
  }).filter((schedule) => schedule.classDate || schedule.classStartTime || schedule.teacherName || schedule.classSubject || schedule.classBatch || schedule.classRoom);
}

function parseScheduleXlsx(buffer) {
  if (!window.XLSX) {
    alert("Excel upload library is not loaded. Please save the template as CSV and upload again.");
    return [];
  }

  const workbook = XLSX.read(buffer, { type: "array" });
  const sheet = workbook.Sheets.Schedule || workbook.Sheets[workbook.SheetNames[0]];
  return XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
}

function addImportedSchedules(imported) {
  let added = 0;
  let skipped = 0;
  const reasons = [];
  imported.forEach((schedule) => {
    const missing = getMissingScheduleFields(schedule);
    if (missing) {
      skipped += 1;
      reasons.push(`Row ${schedule.importRow}: ${missing}`);
      return;
    }

    const conflict = findScheduleConflict(schedule);
    if (conflict) {
      skipped += 1;
      reasons.push(`Row ${schedule.importRow}: ${conflict}`);
      return;
    }
    schedules.push(schedule);
    added += 1;
  });
  return { added, skipped, reasons };
}

function getMissingScheduleFields(schedule) {
  const missing = [];
  if (!schedule.classDate) missing.push("Date");
  if (!schedule.classStartTime) missing.push("Start Time");
  if (!schedule.teacherName) missing.push("Teacher");
  if (!schedule.classSubject) missing.push("Subject");
  if (!schedule.classBatch) missing.push("Batch");
  if (!schedule.classRoom) missing.push("Classroom");
  return missing.length ? `Missing ${missing.join(", ")}` : "";
}

function normalizeHeader(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function normalizeImportDate(value) {
  if (!value) return "";
  if (typeof value === "number" || /^\d+(\.\d+)?$/.test(String(value))) {
    const serial = Number(value);
    if (serial > 20000) {
      const date = new Date(Math.round((serial - 25569) * 86400 * 1000));
      return toDateInputValue(date);
    }
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const parts = String(value).split(/[/-]/).map((part) => part.trim());
  if (parts.length === 3) {
    const [first, second, third] = parts;
    if (first.length === 4) return `${first}-${second.padStart(2, "0")}-${third.padStart(2, "0")}`;
    return `${third}-${second.padStart(2, "0")}-${first.padStart(2, "0")}`;
  }
  return "";
}

function normalizeImportTime(value) {
  if (!value) return "";
  if (typeof value === "number" || /^0?\.\d+$/.test(String(value))) {
    const totalMinutes = Math.round(Number(value) * 24 * 60);
    const hours = Math.floor(totalMinutes / 60) % 24;
    const minutes = totalMinutes % 60;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
  }
  const trimmed = String(value).trim();
  if (/^\d{2}:\d{2}$/.test(trimmed)) return trimmed;
  if (/^\d{1}:\d{2}$/.test(trimmed)) return `0${trimmed}`;
  return trimmed;
}

function buildMonthlyCourseReport(reportDate) {
  const selected = new Date(`${reportDate}T00:00:00`);
  const monthStart = `${selected.getFullYear()}-${String(selected.getMonth() + 1).padStart(2, "0")}-01`;
  const monthName = new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric" }).format(selected);
  const admissionLeads = getAdmissionLeads();
  const rows = getCourseNames(admissionLeads).map((course) => {
    const enquiries = admissionLeads.filter((lead) => {
      return sameCourse(lead.course, course) && isDateInRange(getDateOnly(lead.createdAt), monthStart, reportDate);
    }).length;
    const demos = admissionLeads.filter((lead) => {
      return sameCourse(lead.course, course) && isDateInRange(lead.demoDate, monthStart, reportDate);
    }).length;
    const enrollments = admissionLeads.filter((lead) => {
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

function getCourseNames(items = leads) {
  return [...new Set(items.map((lead) => normalizeCourseName(lead.course)).filter(Boolean))].sort((a, b) => {
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

function getFullFeeAdmissionStudents() {
  return leads
    .filter((lead) => lead.status === "enrolled")
    .filter((lead) => !isMonthlyFeeStudent(lead))
    .filter((lead) => isFeePaid(lead))
    .sort((left, right) => {
      const rightDate = right.enrolledDate || getDateOnly(right.createdAt);
      const leftDate = left.enrolledDate || getDateOnly(left.createdAt);
      return rightDate.localeCompare(leftDate) || left.studentName.localeCompare(right.studentName);
    });
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

function getWeekRange(value) {
  const date = new Date(`${value || todayPlus(0)}T00:00:00`);
  const day = date.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const start = new Date(date);
  start.setDate(date.getDate() + mondayOffset);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return { start: toDateInputValue(start), end: toDateInputValue(end) };
}

function getMonthRange(value) {
  const date = new Date(`${value || todayPlus(0)}T00:00:00`);
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  return { start: toDateInputValue(start), end: toDateInputValue(end) };
}

function getDayName(value) {
  return new Intl.DateTimeFormat("en-IN", { weekday: "long" }).format(new Date(`${value}T00:00:00`));
}

function formatSlashDate(value) {
  const [year, month, day] = String(value || "").split("-");
  if (!year || !month || !day) return value || "";
  return `${day}/${month}/${year}`;
}

function formatNoticeTime(value) {
  if (!value) return "";
  const [hoursValue, minutesValue] = value.split(":").map(Number);
  const suffix = hoursValue >= 12 ? "pm" : "am";
  const hours = hoursValue % 12 || 12;
  return `${String(hours).padStart(2, "0")}:${String(minutesValue || 0).padStart(2, "0")}${suffix}`;
}

function sortScheduleRecords(a, b) {
  return (a.classDate || "").localeCompare(b.classDate || "") || (a.classStartTime || "").localeCompare(b.classStartTime || "");
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
