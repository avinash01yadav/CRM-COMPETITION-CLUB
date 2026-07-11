const storageKey = "coachingAdmissionsLeads";
const scheduleStorageKey = "competitionClubSchedules";
const schedulerMastersStorageKey = "competitionClubSchedulerMasters";
const studyMaterialStorageKey = "competitionClubStudyMaterials";
const settingsKey = "coachingAdmissionsSettings";
const accessUsersStorageKey = "competitionClubAccessUsers";
const currentUserStorageKey = "competitionClubCurrentUser";
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
const materialBucket = supabaseConfig.materialBucket || "competition-club-materials";
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
let studyMaterials = loadStudyMaterials();
let settings = loadSettings();
let accessUsers = loadAccessUsers();
let currentUser = loadCurrentUser();
let activeFilter = "all";
let activeFeeFilter = "all";
let activeDesk = "admission";
const openMaterialFolders = new Set();

const elements = {
  totalCount: document.querySelector("#totalCount"),
  demoCount: document.querySelector("#demoCount"),
  enrolledCount: document.querySelector("#enrolledCount"),
  pendingFollowups: document.querySelector("#pendingFollowups"),
  syncStatus: document.querySelector("#syncStatus"),
  leadList: document.querySelector("#leadList"),
  feeList: document.querySelector("#feeList"),
  studentList: document.querySelector("#studentList"),
  materialList: document.querySelector("#materialList"),
  feeSummaryText: document.querySelector("#feeSummaryText"),
  studentSummaryText: document.querySelector("#studentSummaryText"),
  materialSummaryText: document.querySelector("#materialSummaryText"),
  resultText: document.querySelector("#resultText"),
  searchInput: document.querySelector("#searchInput"),
  sortSelect: document.querySelector("#sortSelect"),
  reportDate: document.querySelector("#reportDate"),
  reportPreview: document.querySelector("#reportPreview"),
  scheduleDate: document.querySelector("#scheduleDate"),
  scheduleWeekStrip: document.querySelector("#scheduleWeekStrip"),
  scheduleBoard: document.querySelector("#scheduleBoard"),
  scheduleList: document.querySelector("#scheduleList"),
  schedulePreview: document.querySelector("#schedulePreview"),
  scheduleSummaryText: document.querySelector("#scheduleSummaryText"),
  uploadStatus: document.querySelector("#uploadStatus"),
  materialUploadStatus: document.querySelector("#materialUploadStatus"),
  batchList: document.querySelector("#batchList"),
  roomList: document.querySelector("#roomList"),
  teacherList: document.querySelector("#teacherList"),
  dialog: document.querySelector("#leadDialog"),
  demoScheduleDialog: document.querySelector("#demoScheduleDialog"),
  demoScheduleForm: document.querySelector("#demoScheduleForm"),
  enrollmentDialog: document.querySelector("#enrollmentDialog"),
  enrollmentForm: document.querySelector("#enrollmentForm"),
  feeEditDialog: document.querySelector("#feeEditDialog"),
  feeEditForm: document.querySelector("#feeEditForm"),
  studentFeeScheduleDialog: document.querySelector("#studentFeeScheduleDialog"),
  studentFeeScheduleForm: document.querySelector("#studentFeeScheduleForm"),
  feeReceiptDialog: document.querySelector("#feeReceiptDialog"),
  feeReceiptPreview: document.querySelector("#feeReceiptPreview"),
  studentDialog: document.querySelector("#studentDialog"),
  studentForm: document.querySelector("#studentForm"),
  studentFormTitle: document.querySelector("#studentFormTitle"),
  idCardDialog: document.querySelector("#idCardDialog"),
  idCardForm: document.querySelector("#idCardForm"),
  idCardPreview: document.querySelector("#idCardPreview"),
  scheduleDialog: document.querySelector("#scheduleDialog"),
  scheduleForm: document.querySelector("#scheduleForm"),
  scheduleFormTitle: document.querySelector("#scheduleFormTitle"),
  batchPeriodsDialog: document.querySelector("#batchPeriodsDialog"),
  batchPeriodsForm: document.querySelector("#batchPeriodsForm"),
  teacherShareDialog: document.querySelector("#teacherShareDialog"),
  teacherShareForm: document.querySelector("#teacherShareForm"),
  teacherSharePreview: document.querySelector("#teacherSharePreview"),
  batchDialog: document.querySelector("#batchDialog"),
  roomDialog: document.querySelector("#roomDialog"),
  teacherDialog: document.querySelector("#teacherDialog"),
  settingsDialog: document.querySelector("#settingsDialog"),
  settingsForm: document.querySelector("#settingsForm"),
  loginDialog: document.querySelector("#loginDialog"),
  loginForm: document.querySelector("#loginForm"),
  loginManagerDialog: document.querySelector("#loginManagerDialog"),
  loginManagerForm: document.querySelector("#loginManagerForm"),
  form: document.querySelector("#leadForm"),
  formTitle: document.querySelector("#formTitle"),
  deleteBtn: document.querySelector("#deleteBtn")
};

elements.reportDate.value = todayPlus(0);
elements.scheduleDate.value = todayPlus(1);
document.querySelector("#enquiryDeskBtn").addEventListener("click", () => requestDeskAccess("enquiry"));
document.querySelector("#demoDeskBtn").addEventListener("click", () => requestDeskAccess("demo"));
document.querySelector("#admissionDeskBtn").addEventListener("click", () => requestDeskAccess("admission"));
document.querySelector("#studentDeskBtn").addEventListener("click", () => requestDeskAccess("student"));
document.querySelector("#schedulerDeskBtn").addEventListener("click", () => requestDeskAccess("scheduler"));
document.querySelector("#materialDeskBtn").addEventListener("click", () => requestDeskAccess("material"));
document.querySelectorAll("[data-landing-desk]").forEach((button) => {
  button.addEventListener("click", () => requestDeskAccess(button.dataset.landingDesk));
});
document.querySelector("#homeBtn").addEventListener("click", showLandingScreen);
document.querySelector("#logoutBtn").addEventListener("click", logoutUser);
document.querySelector("#loginManagerBtn").addEventListener("click", openLoginManager);
document.querySelector("#newLeadBtn").addEventListener("click", () => openForm());
document.querySelector("#newStudentBtn").addEventListener("click", () => openStudentForm());
document.querySelector("#newClassBtn").addEventListener("click", () => openScheduleForm());
document.querySelector("#newBatchPeriodsBtn").addEventListener("click", () => openBatchPeriodsDialog());
document.querySelector("#newBatchBtn").addEventListener("click", () => openBatchForm());
document.querySelector("#newRoomBtn").addEventListener("click", () => openRoomForm());
document.querySelector("#newTeacherBtn").addEventListener("click", () => openTeacherForm());
document.querySelector("#closeDialogBtn").addEventListener("click", closeForm);
document.querySelector("#cancelBtn").addEventListener("click", closeForm);
document.querySelector("#closeDemoScheduleBtn").addEventListener("click", closeDemoScheduleForm);
document.querySelector("#cancelDemoScheduleBtn").addEventListener("click", closeDemoScheduleForm);
document.querySelector("#addDemoSlotBtn").addEventListener("click", () => addDemoSlotRow());
document.querySelector("#closeEnrollmentBtn").addEventListener("click", closeEnrollmentForm);
document.querySelector("#cancelEnrollmentBtn").addEventListener("click", closeEnrollmentForm);
document.querySelector("#addPendingInstallmentBtn").addEventListener("click", () => addPendingInstallmentRow());
document.querySelector("#closeFeeReceiptBtn").addEventListener("click", closeFeeReceipt);
document.querySelector("#cancelFeeReceiptBtn").addEventListener("click", closeFeeReceipt);
document.querySelector("#printFeeReceiptBtn").addEventListener("click", printCurrentFeeReceipt);
document.querySelector("#closeFeeEditBtn").addEventListener("click", closeFeeEditDialog);
document.querySelector("#cancelFeeEditBtn").addEventListener("click", closeFeeEditDialog);
elements.feeEditForm.addEventListener("submit", saveFeeEditPayment);
document.querySelector("#closeStudentFeeScheduleBtn").addEventListener("click", closeStudentFeeScheduleDialog);
document.querySelector("#cancelStudentFeeScheduleBtn").addEventListener("click", closeStudentFeeScheduleDialog);
document.querySelector("#addStudentPendingInstallmentBtn").addEventListener("click", () => addStudentPendingInstallmentRow());
elements.studentFeeScheduleForm.addEventListener("submit", saveStudentPendingFeeSchedule);
["enrollmentTotalFee", "enrollmentDiscount", "enrollmentFeeSubmitted"].forEach((id) => {
  document.querySelector(`#${id}`).addEventListener("input", updateEnrollmentPendingFee);
});
document.querySelector("#enrollmentPaymentMode").addEventListener("change", toggleEnrollmentTransactionField);
document.querySelector("#feeEditPaymentMode").addEventListener("change", toggleFeeEditTransactionField);
document.querySelector("#closeStudentBtn").addEventListener("click", closeStudentForm);
document.querySelector("#cancelStudentBtn").addEventListener("click", closeStudentForm);
document.querySelector("#closeIdCardBtn").addEventListener("click", closeIdCard);
document.querySelector("#cancelIdCardBtn").addEventListener("click", closeIdCard);
document.querySelector("#printIdCardBtn").addEventListener("click", printIdCard);
document.querySelector("#idCardPhotoInput").addEventListener("change", updateIdCardPhoto);
document.querySelector("#enquiryPhotoInput").addEventListener("change", updateEnquiryPhoto);
document.querySelector("#idCardValidityInput").addEventListener("change", updateIdCardPreview);
document.querySelector("#closeScheduleBtn").addEventListener("click", closeScheduleForm);
document.querySelector("#cancelScheduleBtn").addEventListener("click", closeScheduleForm);
document.querySelector("#closeBatchPeriodsBtn").addEventListener("click", closeBatchPeriodsDialog);
document.querySelector("#cancelBatchPeriodsBtn").addEventListener("click", closeBatchPeriodsDialog);
document.querySelector("#addBatchPeriodRowBtn").addEventListener("click", () => addBatchPeriodRow());
elements.batchPeriodsForm.addEventListener("submit", saveBatchPeriods);
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
document.querySelector("#downloadCallingExcelBtn").addEventListener("click", downloadDailyCallingExcel);
document.querySelector("#shareCallingExcelBtn").addEventListener("click", shareDailyCallingWhatsApp);
document.querySelector("#uploadCallingExcelBtn").addEventListener("click", () => document.querySelector("#callingExcelInput").click());
document.querySelector("#callingExcelInput").addEventListener("change", importDailyCallingExcel);
document.querySelector("#deleteWeekScheduleBtn").addEventListener("click", deleteSelectedWeekSchedules);
document.querySelector("#welcomeSettingsBtn").addEventListener("click", openSettings);
document.querySelector("#closeSettingsBtn").addEventListener("click", closeSettings);
document.querySelector("#cancelSettingsBtn").addEventListener("click", closeSettings);
document.querySelector("#exportBtn").addEventListener("click", exportCsv);
document.querySelector("#closeLoginBtn").addEventListener("click", closeLogin);
document.querySelector("#cancelLoginBtn").addEventListener("click", closeLogin);
document.querySelector("#closeLoginManagerBtn").addEventListener("click", closeLoginManager);
document.querySelector("#cancelLoginManagerBtn").addEventListener("click", closeLoginManager);
elements.searchInput.addEventListener("input", render);
elements.sortSelect.addEventListener("change", render);
elements.reportDate.addEventListener("change", updateReportPreview);
elements.scheduleDate.addEventListener("change", renderSchedules);
document.querySelector("#materialFolderForm").addEventListener("submit", createMaterialFolder);
document.querySelector("#materialUploadForm").addEventListener("submit", uploadStudyMaterial);
setupMaterialDropZone();
elements.form.addEventListener("submit", saveLead);
elements.demoScheduleForm.addEventListener("submit", saveDemoSchedule);
elements.enrollmentForm.addEventListener("submit", saveEnrollmentDetails);
elements.studentForm.addEventListener("submit", saveStudentRecord);
elements.idCardForm.addEventListener("submit", saveIdCard);
elements.scheduleForm.addEventListener("submit", saveSchedule);
elements.teacherShareForm.addEventListener("submit", sendSelectedTeacherSchedule);
document.querySelector("#batchForm").addEventListener("submit", saveBatch);
document.querySelector("#roomForm").addEventListener("submit", saveRoom);
document.querySelector("#teacherForm").addEventListener("submit", saveTeacher);
elements.settingsForm.addEventListener("submit", saveSettings);
elements.loginForm.addEventListener("submit", loginUser);
elements.loginManagerForm.addEventListener("submit", saveAccessUser);
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
showLandingScreen();
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
syncStudyMaterialsFromSupabase();
syncAccessUsersFromSupabase();

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

function loadStudyMaterials() {
  const saved = localStorage.getItem(studyMaterialStorageKey);
  if (!saved) return { folders: [], files: [] };

  try {
    const parsed = JSON.parse(saved);
    return {
      folders: Array.isArray(parsed.folders) ? parsed.folders : [],
      files: Array.isArray(parsed.files) ? parsed.files : []
    };
  } catch {
    return { folders: [], files: [] };
  }
}

function loadAccessUsers() {
  const saved = localStorage.getItem(accessUsersStorageKey);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length) return parsed;
    } catch {
      // Use defaults below.
    }
  }

  const defaults = [
    { id: createId(), name: "Admin", loginId: "admin", password: "admin123", role: "admin", desks: ["enquiry", "demo", "admission", "student", "scheduler", "material"] },
    { id: createId(), name: "Enquiry Staff", loginId: "enquiry", password: "enquiry123", role: "employee", desks: ["enquiry"] },
    { id: createId(), name: "Admission Staff", loginId: "admission", password: "admission123", role: "employee", desks: ["admission"] },
    { id: createId(), name: "Student Staff", loginId: "student", password: "student123", role: "employee", desks: ["student"] },
    { id: createId(), name: "Scheduler Staff", loginId: "scheduler", password: "scheduler123", role: "employee", desks: ["scheduler"] },
    { id: createId(), name: "Material Staff", loginId: "material", password: "material123", role: "employee", desks: ["material"] }
  ];
  localStorage.setItem(accessUsersStorageKey, JSON.stringify(defaults));
  return defaults;
}

function loadCurrentUser() {
  const loginId = localStorage.getItem(currentUserStorageKey);
  if (!loginId) return null;
  return accessUsers.find((user) => user.loginId === loginId) || null;
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

function persistStudyMaterials() {
  localStorage.setItem(studyMaterialStorageKey, JSON.stringify(studyMaterials));
  saveStudyMaterialsToSupabase();
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

async function syncStudyMaterialsFromSupabase() {
  if (!supabaseClient) return;

  const { data, error } = await supabaseClient
    .from(supabaseMasterTable)
    .select("master_type,data")
    .in("master_type", ["material_folder", "material_file"]);

  if (error) {
    console.warn("Supabase material load failed. Using local material data.", error);
    return;
  }

  if (!data?.length) {
    await saveStudyMaterialsToSupabase();
    return;
  }

  studyMaterials = {
    folders: data.filter((row) => row.master_type === "material_folder").map((row) => row.data),
    files: data.filter((row) => row.master_type === "material_file").map((row) => row.data)
  };
  localStorage.setItem(studyMaterialStorageKey, JSON.stringify(studyMaterials));
  renderMaterialDesk();
}

async function saveStudyMaterialsToSupabase() {
  if (!supabaseClient) return;

  const rows = [
    ...studyMaterials.folders.map((item) => ({ id: item.id, master_type: "material_folder", data: item, updated_at: new Date().toISOString() })),
    ...studyMaterials.files.map((item) => ({ id: item.id, master_type: "material_file", data: item, updated_at: new Date().toISOString() }))
  ];
  if (!rows.length) return;

  const { error } = await supabaseClient.from(supabaseMasterTable).upsert(rows, { onConflict: "id" });
  if (error) {
    console.warn("Supabase material save failed. Material list is still saved in this browser.", error);
    updateMaterialStatus(`Material save failed: ${error.message}`, "error");
  }
}

async function deleteMaterialMetadataFromSupabase(id) {
  if (!supabaseClient) return;
  const { error } = await supabaseClient.from(supabaseMasterTable).delete().eq("id", id);
  if (error) console.warn("Supabase material delete failed. Local delete is complete.", error);
}

async function syncAccessUsersFromSupabase() {
  if (!supabaseClient) return;

  const { data, error } = await supabaseClient
    .from(supabaseMasterTable)
    .select("data")
    .eq("master_type", "access_user");

  if (error) {
    console.warn("Supabase access user load failed. Using local login IDs.", error);
    return;
  }

  if (!data?.length) {
    await saveAccessUsersToSupabase();
    return;
  }

  accessUsers = data.map((row) => row.data).filter(Boolean);
  localStorage.setItem(accessUsersStorageKey, JSON.stringify(accessUsers));
  currentUser = loadCurrentUser();
}

async function saveAccessUsersToSupabase() {
  if (!supabaseClient) return;

  const rows = accessUsers.map((user) => ({
    id: user.id,
    master_type: "access_user",
    data: user,
    updated_at: new Date().toISOString()
  }));

  const { error } = await supabaseClient.from(supabaseMasterTable).upsert(rows, { onConflict: "id" });
  if (error) console.warn("Supabase login ID save failed. Login IDs are still saved in this browser.", error);
}

async function deleteAccessUserFromSupabase(id) {
  if (!supabaseClient) return;
  const { error } = await supabaseClient.from(supabaseMasterTable).delete().eq("id", id);
  if (error) console.warn("Supabase login ID delete failed. Local delete is complete.", error);
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
  renderMaterialDesk();
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
  document.querySelectorAll("[data-demo-fill]").forEach((button) => {
    button.addEventListener("click", () => openDemoScheduleForm(button.dataset.demoFill));
  });
  document.querySelectorAll("[data-whatsapp]").forEach((button) => {
    button.addEventListener("click", () => sendWelcomeWhatsApp(button.dataset.whatsapp));
  });
  document.querySelectorAll("[data-demo-message]").forEach((button) => {
    button.addEventListener("click", () => sendDemoWhatsApp(button.dataset.demoMessage));
  });
}

function showLandingScreen() {
  document.body.classList.add("landing-mode");
  activeDesk = "";
}

function requestDeskAccess(desk) {
  if (currentUser && canAccessDesk(currentUser, desk)) {
    switchDesk(desk);
    return;
  }

  document.querySelector("#loginTargetDesk").value = desk;
  document.querySelector("#loginDeskTitle").textContent = `${getDeskLabel(desk)} Login`;
  elements.loginForm.reset();
  elements.loginDialog.showModal();
  document.querySelector("#loginId").focus();
}

function loginUser(event) {
  event.preventDefault();
  const desk = document.querySelector("#loginTargetDesk").value;
  const loginId = document.querySelector("#loginId").value.trim();
  const password = document.querySelector("#loginPassword").value;
  const user = accessUsers.find((item) => item.loginId.toLowerCase() === loginId.toLowerCase() && item.password === password);

  if (!user) {
    alert("Login ID ya password galat hai.");
    return;
  }

  if (!canAccessDesk(user, desk)) {
    alert("Is employee ko is desk ki permission nahi hai.");
    return;
  }

  currentUser = user;
  localStorage.setItem(currentUserStorageKey, user.loginId);
  closeLogin();
  switchDesk(desk);
}

function closeLogin() {
  elements.loginDialog.close();
}

function logoutUser() {
  currentUser = null;
  localStorage.removeItem(currentUserStorageKey);
  showLandingScreen();
}

function canAccessDesk(user, desk) {
  return user?.role === "admin" ||
    user?.desks?.includes(desk) ||
    ((desk === "enquiry" || desk === "demo") && user?.desks?.includes("admission")) ||
    (desk === "demo" && user?.desks?.includes("enquiry"));
}

function getDeskLabel(desk) {
  const labels = {
    enquiry: "Enquiry Desk",
    demo: "Demo Desk",
    admission: "Admission Desk",
    student: "Student Desk",
    scheduler: "Scheduler Desk",
    material: "Study Material"
  };
  return labels[desk] || "Desk";
}

function openLoginManager() {
  if (currentUser?.role !== "admin") {
    alert("Only admin can create login IDs.");
    return;
  }
  elements.loginManagerForm.reset();
  renderLoginUserList();
  elements.loginManagerDialog.showModal();
}

function closeLoginManager() {
  elements.loginManagerDialog.close();
}

function saveAccessUser(event) {
  event.preventDefault();
  const loginId = document.querySelector("#employeeLoginId").value.trim();
  const desks = [...document.querySelectorAll("#loginManagerForm .permission-grid input:checked")].map((input) => input.value);
  if (!desks.length) {
    alert("At least one desk permission select karein.");
    return;
  }

  const existing = accessUsers.find((user) => user.loginId.toLowerCase() === loginId.toLowerCase());
  const user = {
    id: existing?.id || createId(),
    name: document.querySelector("#employeeName").value.trim(),
    loginId,
    password: document.querySelector("#employeePassword").value,
    role: existing?.role === "admin" ? "admin" : "employee",
    desks: existing?.role === "admin" ? ["enquiry", "demo", "admission", "student", "scheduler", "material"] : desks
  };

  if (existing) {
    accessUsers = accessUsers.map((item) => item.id === existing.id ? user : item);
  } else {
    accessUsers.push(user);
  }

  persistAccessUsers();
  elements.loginManagerForm.reset();
  renderLoginUserList();
}

function renderLoginUserList() {
  const container = document.querySelector("#loginUserList");
  container.innerHTML = accessUsers.map((user) => `
    <div class="login-user-row">
      <div>
        <strong>${escapeHtml(user.name)}</strong>
        <span>${escapeHtml(user.loginId)} | ${user.role === "admin" ? "All desks" : user.desks.map(getDeskLabel).join(", ")}</span>
      </div>
      ${user.role !== "admin" ? `<button class="small-button danger-lite" data-delete-login="${user.id}" type="button">Delete</button>` : ""}
    </div>
  `).join("");

  container.querySelectorAll("[data-delete-login]").forEach((button) => {
    button.addEventListener("click", () => deleteAccessUser(button.dataset.deleteLogin));
  });
}

function deleteAccessUser(id) {
  const user = accessUsers.find((item) => item.id === id);
  if (!user || user.role === "admin") return;
  if (!confirm(`Delete login ID ${user.loginId}?`)) return;
  accessUsers = accessUsers.filter((item) => item.id !== id);
  persistAccessUsers();
  deleteAccessUserFromSupabase(id);
  renderLoginUserList();
}

function persistAccessUsers() {
  localStorage.setItem(accessUsersStorageKey, JSON.stringify(accessUsers));
  saveAccessUsersToSupabase();
}

function switchDesk(desk) {
  if (!currentUser || !canAccessDesk(currentUser, desk)) {
    requestDeskAccess(desk);
    return;
  }
  document.body.classList.remove("landing-mode");
  activeDesk = desk;
  document.querySelectorAll(".enquiry-desk").forEach((section) => section.classList.toggle("hidden", desk !== "enquiry"));
  document.querySelectorAll(".pipeline-desk").forEach((section) => section.classList.toggle("hidden", desk !== "enquiry" && desk !== "demo"));
  document.querySelectorAll(".admission-desk").forEach((section) => section.classList.toggle("hidden", desk !== "admission"));
  document.querySelectorAll(".student-desk").forEach((section) => section.classList.toggle("hidden", desk !== "student"));
  document.querySelectorAll(".scheduler-desk").forEach((section) => section.classList.toggle("hidden", desk !== "scheduler"));
  document.querySelectorAll(".material-desk").forEach((section) => section.classList.toggle("hidden", desk !== "material"));
  document.querySelector("#enquiryDeskBtn").classList.toggle("active", desk === "enquiry");
  document.querySelector("#demoDeskBtn").classList.toggle("active", desk === "demo");
  document.querySelector("#admissionDeskBtn").classList.toggle("active", desk === "admission");
  document.querySelector("#studentDeskBtn").classList.toggle("active", desk === "student");
  document.querySelector("#schedulerDeskBtn").classList.toggle("active", desk === "scheduler");
  document.querySelector("#materialDeskBtn").classList.toggle("active", desk === "material");
  document.querySelector("h1").textContent = desk === "enquiry" ? "Enquiry Desk" : desk === "demo" ? "Demo Desk" : desk === "admission" ? "Admission Desk" : desk === "student" ? "Student Desk" : desk === "material" ? "Study Material Desk" : "Scheduler Desk";
  document.querySelector("#newLeadBtn").hidden = desk !== "enquiry";
  document.querySelector("#exportBtn").hidden = desk !== "enquiry" && desk !== "demo";
  document.querySelector("#welcomeSettingsBtn").hidden = desk === "student" || desk === "material";
  document.querySelector("#loginManagerBtn").hidden = currentUser?.role !== "admin";
  if (desk === "enquiry" || desk === "demo" || desk === "admission") {
    render();
  }
  if (desk === "student") {
    renderStudentDesk();
  }
  if (desk === "material") {
    renderMaterialDesk();
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
  const enrolled = getFeeDeskLeads();
  const monthly = enrolled.filter((lead) => isMonthlyFeeStudent(lead));
  const dueSoon = enrolled.filter((lead) => isFeeDueSoon(lead));
  const pending = enrolled.filter((lead) => hasFeePending(lead));
  const pendingTotal = pending.reduce((total, lead) => total + getPendingFee(lead), 0);
  const visible = enrolled.filter((lead) => matchesFeeFilter(lead));

  elements.feeSummaryText.textContent = enrolled.length
    ? `${pending.length} pending | ${dueSoon.length} due in 2 days | ${monthly.length} monthly | Rs ${pendingTotal.toLocaleString("en-IN")} pending`
    : "No pending fee students";

  if (!enrolled.length) {
    elements.feeList.innerHTML = `<div class="empty-state">No pending fee students. Full paid students are in Student Desk.</div>`;
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
    button.addEventListener("click", () => openFeeEditDialog(button.dataset.feeEdit));
  });
  document.querySelectorAll("[data-fee-receipt]").forEach((button) => {
    button.addEventListener("click", () => openFeeReceipt(button.dataset.feeReceipt));
  });
  document.querySelectorAll("[data-fee-schedule]").forEach((button) => {
    button.addEventListener("click", () => openPendingFeeScheduleDialog(button.dataset.feeSchedule));
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

function renderMaterialDesk() {
  const rootFolders = getMaterialChildFolders("");
  const folderCount = studyMaterials.folders.length;
  elements.materialSummaryText.textContent = folderCount
    ? `${folderCount} folder${folderCount === 1 ? "" : "s"} | ${studyMaterials.files.length} file${studyMaterials.files.length === 1 ? "" : "s"}`
    : "No folders created yet";

  populateMaterialFolderSelect();

  if (!rootFolders.length) {
    elements.materialList.innerHTML = `<div class="empty-state">Create your first folder for study material or mock tests</div>`;
    return;
  }

  elements.materialList.innerHTML = rootFolders.map((folder) => renderMaterialFolder(folder, 0)).join("");
  document.querySelectorAll("[data-toggle-folder]").forEach((button) => {
    button.addEventListener("click", () => toggleMaterialFolder(button.dataset.toggleFolder));
  });
  document.querySelectorAll("[data-delete-folder]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      deleteMaterialFolder(button.dataset.deleteFolder);
    });
  });
  document.querySelectorAll("[data-delete-material]").forEach((button) => {
    button.addEventListener("click", () => deleteStudyMaterial(button.dataset.deleteMaterial));
  });
}

function renderMaterialFolder(folder, level = 0) {
  const files = studyMaterials.files
    .filter((file) => file.folderId === folder.id)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const childFolders = getMaterialChildFolders(folder.id);
  const isOpen = openMaterialFolders.has(folder.id);

  return `
    <article class="material-folder ${isOpen ? "open" : ""}" style="--folder-level: ${level}">
      <div class="material-folder-head">
        <button class="material-folder-toggle" data-toggle-folder="${folder.id}" type="button">
          <h3><span>${isOpen ? "−" : "+"}</span>${escapeHtml(folder.name)}</h3>
          <p>${childFolders.length} folder${childFolders.length === 1 ? "" : "s"} | ${files.length} file${files.length === 1 ? "" : "s"}</p>
        </button>
        <button class="small-button danger-lite" data-delete-folder="${folder.id}" type="button">Delete Folder</button>
      </div>
      ${isOpen ? `
        <div class="material-files">
          ${childFolders.map((child) => renderMaterialFolder(child, level + 1)).join("")}
          ${files.length ? files.map(renderMaterialFile).join("") : childFolders.length ? "" : `<div class="empty-compact">No files in this folder</div>`}
        </div>
      ` : ""}
    </article>
  `;
}

function renderMaterialFile(file) {
  return `
    <div class="material-file">
      <div>
        <strong>${escapeHtml(file.name)}</strong>
        <span>${escapeHtml(file.type || "File")} | ${formatFileSize(file.size)} | ${formatDate(getDateOnly(file.createdAt))}</span>
      </div>
      <div class="material-file-actions">
        <a class="small-button" href="${escapeHtml(file.url)}" target="_blank" rel="noopener">Open</a>
        <button class="small-button danger-lite" data-delete-material="${file.id}" type="button">Delete</button>
      </div>
    </div>
  `;
}

function populateMaterialFolderSelect() {
  const select = document.querySelector("#materialFolderSelect");
  const parentSelect = document.querySelector("#materialParentFolderSelect");
  const options = getMaterialFolderOptions();
  select.innerHTML = options.length
    ? options.map((folder) => `<option value="${folder.id}">${escapeHtml(folder.label)}</option>`).join("")
    : `<option value="">Create folder first</option>`;
  parentSelect.innerHTML = `<option value="">Main folder</option>${options.map((folder) => `<option value="${folder.id}">${escapeHtml(folder.label)}</option>`).join("")}`;
}

function setupMaterialDropZone() {
  const dropZone = document.querySelector("#materialDropZone");
  const fileInput = document.querySelector("#materialFileInput");
  const dropText = document.querySelector("#materialDropText");
  if (!dropZone || !fileInput || !dropText) return;

  const openPicker = () => fileInput.click();
  dropZone.addEventListener("click", openPicker);
  dropZone.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openPicker();
    }
  });

  ["dragenter", "dragover"].forEach((eventName) => {
    dropZone.addEventListener(eventName, (event) => {
      event.preventDefault();
      dropZone.classList.add("drag-over");
    });
  });

  ["dragleave", "drop"].forEach((eventName) => {
    dropZone.addEventListener(eventName, (event) => {
      event.preventDefault();
      dropZone.classList.remove("drag-over");
    });
  });

  dropZone.addEventListener("drop", (event) => {
    const file = event.dataTransfer?.files?.[0];
    if (!file) return;
    if (!isAllowedMaterialFile(file)) {
      alert("Only PDF, DOC and DOCX files are allowed.");
      return;
    }
    const transfer = new DataTransfer();
    transfer.items.add(file);
    fileInput.files = transfer.files;
    dropText.textContent = file.name;
    updateMaterialStatus(`${file.name} selected. Now click Upload File.`, "ok");
  });

  fileInput.addEventListener("change", () => {
    dropText.textContent = fileInput.files?.[0]?.name || "or click to select file";
  });
}

function createMaterialFolder(event) {
  event.preventDefault();
  const input = document.querySelector("#materialFolderName");
  const parentId = document.querySelector("#materialParentFolderSelect").value;
  const name = input.value.trim();
  if (!name) return;

  const duplicate = studyMaterials.folders.some((folder) => {
    return (folder.parentId || "") === parentId && folder.name.toLowerCase() === name.toLowerCase();
  });
  if (duplicate) {
    alert("This folder already exists in the selected location.");
    return;
  }

  studyMaterials.folders.push({ id: createId(), parentId, name, createdAt: new Date().toISOString() });
  input.value = "";
  persistStudyMaterials();
  renderMaterialDesk();
  updateMaterialStatus("Folder created.", "ok");
}

async function uploadStudyMaterial(event) {
  event.preventDefault();
  const folderId = document.querySelector("#materialFolderSelect").value;
  const file = document.querySelector("#materialFileInput").files?.[0];
  const folder = studyMaterials.folders.find((item) => item.id === folderId);
  if (!folder || !file) return;

  if (!isAllowedMaterialFile(file)) {
    alert("Only PDF, DOC and DOCX files are allowed.");
    return;
  }

  if (!supabaseClient) {
    alert("Supabase is not connected. Online file upload needs Supabase Storage.");
    return;
  }

  updateMaterialStatus(`Uploading ${file.name}...`, "ok");
  const safeName = file.name.replace(/[^a-zA-Z0-9.\-_ ]/g, "").replaceAll(" ", "-");
  const path = `${folderId}/${Date.now()}-${safeName}`;
  const { error } = await supabaseClient.storage.from(materialBucket).upload(path, file, {
    cacheControl: "3600",
    upsert: true
  });

  if (error) {
    updateMaterialStatus(`Upload failed: ${error.message}`, "error");
    alert(`Upload failed. Please check Supabase Storage bucket/policy.\n\n${error.message}`);
    return;
  }

  const { data } = supabaseClient.storage.from(materialBucket).getPublicUrl(path);
  studyMaterials.files.unshift({
    id: createId(),
    folderId,
    name: file.name,
    type: getMaterialType(file.name),
    size: file.size,
    path,
    url: data.publicUrl,
    createdAt: new Date().toISOString()
  });

  document.querySelector("#materialFileInput").value = "";
  document.querySelector("#materialDropText").textContent = "or click to select file";
  persistStudyMaterials();
  renderMaterialDesk();
  updateMaterialStatus(`${file.name} uploaded successfully.`, "ok");
}

function deleteMaterialFolder(id) {
  const hasFiles = studyMaterials.files.some((file) => file.folderId === id);
  const hasSubfolders = studyMaterials.folders.some((folder) => (folder.parentId || "") === id);
  if (hasFiles || hasSubfolders) {
    alert("Please delete files and subfolders inside this folder first.");
    return;
  }
  if (!confirm("Delete this folder?")) return;

  studyMaterials.folders = studyMaterials.folders.filter((folder) => folder.id !== id);
  openMaterialFolders.delete(id);
  localStorage.setItem(studyMaterialStorageKey, JSON.stringify(studyMaterials));
  deleteMaterialMetadataFromSupabase(id);
  renderMaterialDesk();
  updateMaterialStatus("Folder deleted.", "ok");
}

function toggleMaterialFolder(id) {
  if (openMaterialFolders.has(id)) {
    openMaterialFolders.delete(id);
  } else {
    openMaterialFolders.add(id);
  }
  renderMaterialDesk();
}

function getMaterialChildFolders(parentId = "") {
  return studyMaterials.folders
    .filter((folder) => (folder.parentId || "") === parentId)
    .sort((a, b) => a.name.localeCompare(b.name));
}

function getMaterialFolderOptions(parentId = "", depth = 0) {
  return getMaterialChildFolders(parentId).flatMap((folder) => {
    const prefix = depth ? `${"— ".repeat(depth)}` : "";
    return [
      { id: folder.id, label: `${prefix}${folder.name}` },
      ...getMaterialFolderOptions(folder.id, depth + 1)
    ];
  });
}

async function deleteStudyMaterial(id) {
  const file = studyMaterials.files.find((item) => item.id === id);
  if (!file) return;
  if (!confirm(`Delete ${file.name}?`)) return;

  studyMaterials.files = studyMaterials.files.filter((item) => item.id !== id);
  localStorage.setItem(studyMaterialStorageKey, JSON.stringify(studyMaterials));
  deleteMaterialMetadataFromSupabase(id);
  if (supabaseClient && file.path) {
    await supabaseClient.storage.from(materialBucket).remove([file.path]);
  }
  renderMaterialDesk();
  updateMaterialStatus("File deleted.", "ok");
}

function isAllowedMaterialFile(file) {
  return /\.(pdf|doc|docx)$/i.test(file.name);
}

function getMaterialType(name) {
  if (/\.pdf$/i.test(name)) return "PDF";
  if (/\.docx?$/i.test(name)) return "Word";
  return "File";
}

function formatFileSize(size) {
  const amount = Number(size) || 0;
  if (amount >= 1024 * 1024) return `${(amount / (1024 * 1024)).toFixed(1)} MB`;
  if (amount >= 1024) return `${Math.round(amount / 1024)} KB`;
  return `${amount} B`;
}

function updateMaterialStatus(message, type = "ok") {
  if (!elements.materialUploadStatus) return;
  elements.materialUploadStatus.textContent = message;
  elements.materialUploadStatus.classList.toggle("ok", type === "ok");
  elements.materialUploadStatus.classList.toggle("error", type === "error");
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
  renderScheduleWeekStrip();
  renderScheduleBoard(visible);

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

function renderScheduleBoard(daySchedules) {
  const roomNames = getScheduleBoardRooms(daySchedules);
  if (!roomNames.length) {
    elements.scheduleBoard.innerHTML = `<div class="empty-state">Add classrooms in Master Setup to use board view</div>`;
    return;
  }

  elements.scheduleBoard.innerHTML = roomNames
    .map((roomName) => {
      const roomSchedules = daySchedules.filter((schedule) => (schedule.classRoom || "No Room") === roomName);
      return `
        <section class="schedule-room-column">
          <div class="schedule-room-head">
            <h3>${escapeHtml(roomName)}</h3>
            <div>
              <button class="small-button" data-room-periods="${escapeHtml(roomName)}" type="button">Batch Periods</button>
              <button class="small-button" data-room-add="${escapeHtml(roomName)}" type="button">Add Class</button>
            </div>
          </div>
          <div class="schedule-room-body">
            ${roomSchedules.length ? roomSchedules.map(renderScheduleBoardBlock).join("") : `<div class="schedule-room-empty">No class</div>`}
          </div>
        </section>
      `;
    })
    .join("");

  document.querySelectorAll("[data-room-add]").forEach((button) => {
    button.addEventListener("click", () => openScheduleForm("", { classRoom: button.dataset.roomAdd }));
  });
  document.querySelectorAll("[data-room-periods]").forEach((button) => {
    button.addEventListener("click", () => openBatchPeriodsDialog({ classRoom: button.dataset.roomPeriods }));
  });
  document.querySelectorAll("[data-board-edit]").forEach((button) => {
    button.addEventListener("click", () => openScheduleForm(button.dataset.boardEdit));
  });
}

function renderScheduleWeekStrip() {
  const range = getWeekRange(elements.scheduleDate.value);
  const dates = Array.from({ length: 7 }, (_, index) => todayPlusFrom(range.start, index));
  elements.scheduleWeekStrip.innerHTML = dates
    .map((date) => {
      const count = getSchedulesForDate(date).length;
      return `
        <button class="week-date-pill ${date === elements.scheduleDate.value ? "active" : ""}" data-week-date="${date}" type="button">
          <span>${getDayName(date).slice(0, 3)}</span>
          <strong>${formatSlashDate(date)}</strong>
          <small>${count} class${count === 1 ? "" : "es"}</small>
        </button>
      `;
    })
    .join("");
  document.querySelectorAll("[data-week-date]").forEach((button) => {
    button.addEventListener("click", () => {
      elements.scheduleDate.value = button.dataset.weekDate;
      renderSchedules();
    });
  });
}

function getScheduleBoardRooms(daySchedules) {
  const masterRooms = schedulerMasters.rooms.map((room) => room.roomName).filter(Boolean);
  const scheduledRooms = daySchedules.map((schedule) => schedule.classRoom || "No Room").filter(Boolean);
  return [...new Set([...masterRooms, ...scheduledRooms])].sort((a, b) => a.localeCompare(b));
}

function renderScheduleBoardBlock(schedule) {
  const time = `${formatTime(schedule.classStartTime)}${schedule.classEndTime ? ` - ${formatTime(schedule.classEndTime)}` : ""}`;
  return `
    <button class="schedule-board-class" data-board-edit="${schedule.id}" type="button">
      <strong>${escapeHtml(schedule.classBatch || "Batch")}</strong>
      <span>${escapeHtml(time)}</span>
      <span>${escapeHtml(schedule.classSubject || "Subject")}${schedule.teacherName ? ` - ${escapeHtml(schedule.teacherName)}` : ""}</span>
      ${schedule.classTopic ? `<small>${escapeHtml(schedule.classTopic)}</small>` : ""}
    </button>
  `;
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
  const enquiryDeskLeads = getEnquiryDeskLeads();
  const admissionLeads = getAdmissionLeads();
  elements.totalCount.textContent = enquiryDeskLeads.length;
  elements.demoCount.textContent = enquiryDeskLeads.filter((lead) => lead.status === "demo").length;
  elements.enrolledCount.textContent = admissionLeads.filter((lead) => lead.status === "enrolled").length;
  elements.pendingFollowups.textContent = enquiryDeskLeads.filter((lead) => {
    return lead.followupDate && lead.followupDate <= today && lead.status !== "enrolled" && lead.status !== "lost";
  }).length;
}

function getAdmissionLeads() {
  return leads.filter((lead) => !lead.studentDeskOnly);
}

function getEnquiryDeskLeads() {
  return getAdmissionLeads().filter((lead) => lead.status === "enquiry" || lead.status === "lost");
}

function getDemoDeskLeads() {
  return getAdmissionLeads().filter((lead) => lead.status === "demo");
}

function getFeeDeskLeads() {
  return getAdmissionLeads()
    .filter((lead) => lead.status === "enrolled")
    .filter((lead) => hasFeePending(lead));
}

function getVisibleLeads() {
  const search = elements.searchInput.value.trim().toLowerCase();
  const sourceLeads = activeDesk === "demo" ? getDemoDeskLeads() : getEnquiryDeskLeads();
  const filtered = sourceLeads.filter((lead) => {
    const statusMatch = activeDesk === "demo" || activeFilter === "all" || lead.status === activeFilter;
    const searchText = [
      lead.studentId,
      lead.studentName,
      lead.parentName,
      lead.phone,
      lead.parentPhone,
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
  const actionButtons = getLeadCardActions(lead, nextAction);
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
          <span>Student: ${escapeHtml(lead.phone)}</span>
          ${lead.parentPhone ? `<span>Parent: ${escapeHtml(lead.parentPhone)}</span>` : ""}
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
        ${actionButtons}
      </div>
    </article>
  `;
}

function getLeadCardActions(lead, nextAction) {
  if (activeDesk === "enquiry") {
    return lead.status === "enquiry" ? `<button class="small-button" data-advance="${lead.id}" type="button">Mark Demo</button>` : "";
  }
  if (activeDesk === "demo") {
    return [
      !getLeadDemoSlots(lead).length ? `<button class="small-button" data-demo-fill="${lead.id}" type="button">Fill Demo Info</button>` : "",
      getLeadDemoSlots(lead).length ? `<button class="small-button" data-next-demo="${lead.id}" type="button">Next Demo</button>` : "",
      nextAction ? `<button class="small-button" data-advance="${lead.id}" type="button">${nextAction}</button>` : "",
      `<button class="small-button whatsapp-button" data-demo-message="${lead.id}" type="button">Demo Msg</button>`,
      `<button class="small-button" data-edit="${lead.id}" type="button">Edit</button>`
    ].filter(Boolean).join("");
  }
  return `<button class="small-button" data-edit="${lead.id}" type="button">Edit</button>`;
}

function renderFeeCard(lead) {
  const pendingFee = getPendingFee(lead);
  const totalFee = getMoney(lead.totalFee || lead.fees);
  const discount = getMoney(lead.discount);
  const deposit = getMoney(lead.feeDeposit);
  const monthlyFee = getMoney(lead.monthlyFee);
  const feeStatus = isMonthlyFeeStudent(lead) ? "Monthly" : pendingFee > 0 ? "Pending" : "Paid";
  const statusClass = pendingFee > 0 ? "status-demo" : "status-enrolled";
  const needsFeeSchedule = pendingFee > 0 && !hasPendingFeeSchedule(lead);

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
          ${formatPendingInstallments(lead)}
        </div>
      </div>
      <div class="card-actions">
        ${pendingFee > 0 ? `<button class="small-button whatsapp-button" data-fee-reminder="${lead.id}" type="button">Fee Reminder</button>` : ""}
        ${needsFeeSchedule ? `<button class="small-button" data-fee-schedule="${lead.id}" type="button">Schedule Payment</button>` : ""}
        <button class="small-button" data-fee-receipt="${lead.id}" type="button">Receipt</button>
        <button class="small-button" data-fee-edit="${lead.id}" type="button">Edit Fee</button>
      </div>
    </article>
  `;
}

function formatPendingInstallments(lead) {
  if (!Array.isArray(lead.pendingInstallments) || !lead.pendingInstallments.length || getPendingFee(lead) <= 0) return "";
  return lead.pendingInstallments
    .filter((item) => getMoney(item.amount) > 0)
    .map((item, index) => `<span>Installment ${index + 1}: Rs ${getMoney(item.amount).toLocaleString("en-IN")}${item.date ? ` on ${formatDate(item.date)}` : ""}</span>`)
    .join("");
}

function getNextAction(status) {
  if (status === "enquiry") return "Mark Demo";
  if (status === "demo") return "Mark Enrolled";
  return "";
}

function advanceLead(id) {
  const lead = leads.find((item) => item.id === id);
  if (!lead) return;

  if (lead.status === "enquiry") {
    lead.status = "demo";
    lead.followupDate = lead.followupDate || todayPlus(1);
    persist();
    render();
    switchDesk("demo");
    return;
  } else if (lead.status === "demo") {
    openEnrollmentForm(id);
    return;
  }

  persist();
  render();
}

function openEnrollmentForm(id) {
  const lead = leads.find((item) => item.id === id);
  if (!lead) return;

  elements.enrollmentForm.reset();
  document.querySelector("#enrollmentLeadId").value = id;
  document.querySelector("#enrollmentStudentSummary").innerHTML = `
    <strong>${escapeHtml(lead.studentName)}</strong>
    <span>ID ${escapeHtml(lead.studentId || "")}</span>
    <span>${escapeHtml(lead.phone || "")}</span>
    <span>${escapeHtml(lead.course || "")}</span>
  `;
  document.querySelector("#enrollmentTotalFee").value = lead.totalFee || lead.fees || "";
  document.querySelector("#enrollmentDiscount").value = lead.discount || "";
  document.querySelector("#enrollmentFeeSubmitted").value = lead.feeDeposit || "";
  document.querySelector("#enrollmentPaymentMode").value = lead.paymentMode || "Cash";
  document.querySelector("#enrollmentTransactionId").value = lead.transactionId || "";
  document.querySelector("#enrollmentValidity").value = lead.validityDate || lead.idCardValidity || todayPlus(365);
  document.querySelector("#pendingInstallmentList").innerHTML = "";
  const installments = Array.isArray(lead.pendingInstallments) && lead.pendingInstallments.length
    ? lead.pendingInstallments
    : [{ amount: lead.pendingFee || "", date: lead.pendingFeeDate || "" }];
  installments.forEach((installment) => addPendingInstallmentRow(installment));
  updateEnrollmentPendingFee();
  toggleEnrollmentTransactionField();
  elements.enrollmentDialog.showModal();
  document.querySelector("#enrollmentTotalFee").focus();
}

function closeEnrollmentForm() {
  elements.enrollmentDialog.close();
}

function openFeeEditDialog(id) {
  const lead = leads.find((item) => item.id === id);
  if (!lead) return;

  const pending = getPendingFee(lead);
  const dueDate = getFeeDueDate(lead);
  document.querySelector("#feeEditLeadId").value = id;
  document.querySelector("#feeEditStudentSummary").innerHTML = `
    <span><strong>${escapeHtml(lead.studentName || "Student")}</strong></span>
    <span>Roll No. ${escapeHtml(lead.studentId || "-")}</span>
    <span>${escapeHtml(lead.course || "-")}</span>
    <span>${escapeHtml(lead.phone || "-")}</span>
  `;
  document.querySelector("#feeEditTotalFee").value = formatMoney(lead.totalFee || lead.fees);
  document.querySelector("#feeEditDiscount").value = formatMoney(lead.discount);
  document.querySelector("#feeEditDeposit").value = formatMoney(lead.feeDeposit);
  document.querySelector("#feeEditPending").value = formatMoney(pending);
  document.querySelector("#feeEditAdmissionPaymentMode").value = lead.paymentMode || "-";
  document.querySelector("#feeEditAdmissionTransactionId").value = lead.transactionId || "-";
  document.querySelector("#feeEditValidity").value = lead.validityDate ? formatDate(lead.validityDate) : "-";
  document.querySelector("#feeEditPendingDueDate").value = dueDate ? formatDate(dueDate) : "-";
  document.querySelector("#feeEditInstallmentSummary").innerHTML = buildFeeEditInstallmentSummary(lead);
  document.querySelector("#feeEditPaymentDate").value = todayPlus(0);
  document.querySelector("#feeEditPaymentAmount").value = pending > 0 ? pending : "";
  document.querySelector("#feeEditPaymentMode").value = "Cash";
  document.querySelector("#feeEditTransactionId").value = "";
  toggleFeeEditTransactionField();
  elements.feeEditDialog.showModal();
}

function closeFeeEditDialog() {
  elements.feeEditDialog.close();
}

function buildFeeEditInstallmentSummary(lead) {
  const installments = Array.isArray(lead.pendingInstallments)
    ? lead.pendingInstallments.filter((item) => getMoney(item.amount) > 0 || item.date)
    : [];
  const payments = Array.isArray(lead.feePayments) ? lead.feePayments : [];
  const installmentHtml = installments.length
    ? installments
        .map(
          (item, index) => `
            <div class="fee-edit-row">
              <span>Pending ${index + 1}</span>
              <strong>Rs ${getMoney(item.amount).toLocaleString("en-IN")}</strong>
              <span>Due: ${item.date ? formatDate(item.date) : "-"}</span>
            </div>
          `
        )
        .join("")
    : `<div class="fee-edit-row"><span>No pending installment schedule</span></div>`;
  const paymentHtml = payments.length
    ? payments
        .map(
          (item, index) => `
            <div class="fee-edit-row">
              <span>Payment ${index + 1}</span>
              <strong>Rs ${getMoney(item.amount).toLocaleString("en-IN")}</strong>
              <span>${item.paymentDate ? formatDate(item.paymentDate) : "-"} | ${escapeHtml(item.paymentMode || "-")}${item.transactionId ? ` | ${escapeHtml(item.transactionId)}` : ""}</span>
            </div>
          `
        )
        .join("")
    : "";
  return `
    <div class="fee-edit-section-title">Pending schedule</div>
    ${installmentHtml}
    ${paymentHtml ? `<div class="fee-edit-section-title">Received pending payments</div>${paymentHtml}` : ""}
  `;
}

function toggleFeeEditTransactionField() {
  document.querySelector("#feeEditTransactionField").classList.toggle("hidden", document.querySelector("#feeEditPaymentMode").value !== "Online");
}

function saveFeeEditPayment(event) {
  event.preventDefault();
  const lead = leads.find((item) => item.id === document.querySelector("#feeEditLeadId").value);
  if (!lead) return;

  const pendingBefore = getPendingFee(lead);
  const amount = getMoney(document.querySelector("#feeEditPaymentAmount").value);
  const paymentDate = document.querySelector("#feeEditPaymentDate").value;
  const paymentMode = document.querySelector("#feeEditPaymentMode").value;
  const transactionId = document.querySelector("#feeEditTransactionId").value.trim();

  if (amount <= 0) {
    alert("Please enter pending fee received amount.");
    return;
  }
  if (amount > pendingBefore) {
    alert("Received amount pending fee se zyada nahi ho sakta.");
    return;
  }
  if (paymentMode === "Online" && !transactionId) {
    alert("Online payment ke liye transaction ID mention karein.");
    return;
  }

  lead.feeDeposit = String(getMoney(lead.feeDeposit) + amount);
  lead.pendingFee = calculatePendingFee(lead);
  lead.feePayments = Array.isArray(lead.feePayments) ? lead.feePayments : [];
  lead.feePayments.push({
    amount: String(amount),
    paymentDate,
    paymentMode,
    transactionId: paymentMode === "Online" ? transactionId : "",
    recordedAt: new Date().toISOString()
  });
  updatePendingInstallmentsAfterPayment(lead, amount);
  lead.pendingFeeDate = getNextPendingInstallmentDate(lead);
  lead.followupDate = lead.pendingFeeDate || "";

  persist();
  closeFeeEditDialog();
  render();
  openFeeReceipt(lead.id);
}

function updatePendingInstallmentsAfterPayment(lead, paidAmount) {
  if (!Array.isArray(lead.pendingInstallments) || !lead.pendingInstallments.length) return;
  let remainingPayment = paidAmount;
  lead.pendingInstallments = lead.pendingInstallments
    .map((item) => {
      const amount = getMoney(item.amount);
      if (remainingPayment <= 0 || amount <= 0) return item;
      const adjusted = Math.max(amount - remainingPayment, 0);
      remainingPayment = Math.max(remainingPayment - amount, 0);
      return { ...item, amount: String(adjusted) };
    })
    .filter((item) => getMoney(item.amount) > 0 || item.date);
}

function getNextPendingInstallmentDate(lead) {
  const nextInstallment = Array.isArray(lead.pendingInstallments)
    ? lead.pendingInstallments.find((item) => getMoney(item.amount) > 0 && item.date)
    : null;
  if (nextInstallment) return nextInstallment.date;
  return getPendingFee(lead) > 0 ? lead.pendingFeeDate || "" : "";
}

function addPendingInstallmentRow(installment = {}) {
  const row = document.createElement("div");
  row.className = "pending-installment-row";
  row.innerHTML = `
    <div class="pending-fee-date-pair">
      <label>Pending fee<input class="pending-installment-amount" type="number" min="0" step="100" value="${escapeHtml(installment.amount || "")}" /></label>
      <label>Pending date<input class="pending-installment-date" type="date" value="${escapeHtml(installment.date || "")}" /></label>
    </div>
    <label>Payment mode<select class="pending-installment-mode"><option>Cash</option><option>Online</option><option>Cheque</option></select></label>
    <label class="pending-installment-transaction-field">Transaction ID<input class="pending-installment-transaction" value="${escapeHtml(installment.transactionId || "")}" /></label>
    <button class="small-button danger-lite" type="button">Remove</button>
  `;
  row.querySelector(".pending-installment-mode").value = installment.paymentMode || "Cash";
  row.querySelector("button").addEventListener("click", () => {
    row.remove();
    updateEnrollmentPendingFee();
  });
  const toggleInstallmentTransaction = () => {
    row.querySelector(".pending-installment-transaction-field").classList.toggle("hidden", row.querySelector(".pending-installment-mode").value !== "Online");
  };
  row.querySelector(".pending-installment-mode").addEventListener("change", toggleInstallmentTransaction);
  toggleInstallmentTransaction();
  row.querySelector(".pending-installment-amount").addEventListener("input", updateEnrollmentPendingFee);
  document.querySelector("#pendingInstallmentList").appendChild(row);
}

function toggleEnrollmentTransactionField() {
  document.querySelector("#enrollmentTransactionField").classList.toggle("hidden", document.querySelector("#enrollmentPaymentMode").value !== "Online");
}

function updateEnrollmentPendingFee() {
  const totalFee = getMoney(document.querySelector("#enrollmentTotalFee").value);
  const discount = getMoney(document.querySelector("#enrollmentDiscount").value);
  const submitted = getMoney(document.querySelector("#enrollmentFeeSubmitted").value);
  document.querySelector("#enrollmentPendingFee").value = Math.max(totalFee - discount - submitted, 0);
}

function saveEnrollmentDetails(event) {
  event.preventDefault();
  const lead = leads.find((item) => item.id === document.querySelector("#enrollmentLeadId").value);
  if (!lead) return;

  const pendingFee = getMoney(document.querySelector("#enrollmentPendingFee").value);
  const installments = [...document.querySelectorAll(".pending-installment-row")]
    .map((row) => ({
      amount: row.querySelector(".pending-installment-amount").value,
      date: row.querySelector(".pending-installment-date").value,
      paymentMode: row.querySelector(".pending-installment-mode").value,
      transactionId: row.querySelector(".pending-installment-transaction").value.trim()
    }))
    .filter((item) => getMoney(item.amount) > 0 || item.date);

  lead.status = "enrolled";
  lead.enrolledDate = lead.enrolledDate || todayPlus(0);
  lead.feePlan = "oneTime";
  lead.totalFee = document.querySelector("#enrollmentTotalFee").value;
  lead.fees = lead.totalFee;
  lead.discount = document.querySelector("#enrollmentDiscount").value;
  lead.feeDeposit = document.querySelector("#enrollmentFeeSubmitted").value;
  lead.paymentMode = document.querySelector("#enrollmentPaymentMode").value;
  lead.transactionId = lead.paymentMode === "Online" ? document.querySelector("#enrollmentTransactionId").value.trim() : "";
  lead.validityDate = document.querySelector("#enrollmentValidity").value;
  lead.idCardValidity = lead.validityDate || lead.idCardValidity || "";
  lead.pendingFee = String(pendingFee);
  lead.pendingInstallments = installments;
  const firstDue = installments.find((item) => getMoney(item.amount) > 0 && item.date);
  lead.pendingFeeDate = pendingFee > 0 ? firstDue?.date || "" : "";
  lead.followupDate = lead.pendingFeeDate || "";
  persist();
  closeEnrollmentForm();
  render();
  switchDesk("admission");
  openFeeReceipt(lead.id);
}

function openFeeReceipt(id) {
  const lead = leads.find((item) => item.id === id);
  if (!lead) return;
  elements.feeReceiptDialog.dataset.leadId = id;
  elements.feeReceiptPreview.innerHTML = buildFeeReceiptHtml(lead);
  elements.feeReceiptDialog.showModal();
}

function closeFeeReceipt() {
  elements.feeReceiptDialog.close();
}

function printCurrentFeeReceipt() {
  const lead = leads.find((item) => item.id === elements.feeReceiptDialog.dataset.leadId);
  if (!lead) return;
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Popup blocked hai. Browser me popup allow karke phir Print dabayein.");
    return;
  }
  printWindow.document.write(`
    <!doctype html>
    <html>
      <head>
        <title>${escapeHtml(lead.studentName)} Fee Receipt</title>
        <style>
          body { margin: 0; padding: 20px; font-family: Arial, sans-serif; background: #fff; color: #111; }
          ${getFeeReceiptPrintCss()}
        </style>
      </head>
      <body>${buildFeeReceiptHtml(lead)}</body>
    </html>
  `);
  printWindow.document.close();
  printWindow.onload = () => printWindow.print();
}

function buildFeeReceiptHtml(lead) {
  const totalFee = getMoney(lead.totalFee || lead.fees);
  const discount = getMoney(lead.discount);
  const payable = Math.max(totalFee - discount, 0);
  const paid = getMoney(lead.feeDeposit);
  const pending = getPendingFee(lead);
  const receiptNo = `${lead.studentId || lead.id.slice(-6)}-${getDateOnly(lead.enrolledDate || todayPlus(0)).replaceAll("-", "")}`;
  const installments = Array.isArray(lead.pendingInstallments) ? lead.pendingInstallments.filter((item) => getMoney(item.amount) > 0 || item.date) : [];
  const feePayments = Array.isArray(lead.feePayments) ? lead.feePayments : [];
  const installmentRows = installments.length
    ? installments.map((item, index) => `
        <tr>
          <td>Due Amount ${index + 1}</td>
          <td>Rs ${getMoney(item.amount).toLocaleString("en-IN")}/-</td>
          <td>${item.paymentMode || "Payment Mode"}</td>
          <td>${item.date ? formatDate(item.date) : ""}${item.transactionId ? ` | Txn: ${escapeHtml(item.transactionId)}` : ""}</td>
        </tr>
      `).join("")
    : `<tr><td>Due Amount</td><td>Rs ${pending.toLocaleString("en-IN")}/-</td><td>Due Date</td><td>${lead.pendingFeeDate ? formatDate(lead.pendingFeeDate) : ""}</td></tr>`;
  const paymentRows = feePayments
    .map((item, index) => `
      <tr>
        <td>Pending Payment ${index + 1}</td>
        <td>Rs ${getMoney(item.amount).toLocaleString("en-IN")}/-</td>
        <td>${escapeHtml(item.paymentMode || "Payment Mode")}</td>
        <td>${item.paymentDate ? formatDate(item.paymentDate) : ""}${item.transactionId ? ` | Txn: ${escapeHtml(item.transactionId)}` : ""}</td>
      </tr>
    `)
    .join("");

  return `
    <article class="fee-receipt">
      <div class="receipt-watermark">COMPETITION CLUB</div>
      <header class="receipt-head">
        <img src="assets/logo.jpeg" alt="Competition Club logo" />
        <div class="receipt-title">
          <h3>FEE RECEIPT</h3>
          <span>Receipt No: ${escapeHtml(receiptNo)}</span>
        </div>
        <address>
          <strong>COMPETITION CLUB</strong><br />
          Near Tushar Library Sector B,<br />
          Bargawan, LDA Colony, Alambagh<br />
          Lucknow (226012)<br />
          Contact: 8004141087
        </address>
      </header>

      <table class="receipt-info-table">
        <tbody>
          <tr><th>Student Name</th><td>${escapeHtml(lead.studentName || "")}</td><th>Date</th><td>${formatDate(lead.enrolledDate || todayPlus(0))}</td></tr>
          <tr><th>Student ID</th><td>${escapeHtml(lead.studentId || "")}</td><th>Payment Mode</th><td>${escapeHtml(lead.paymentMode || "Cash")}</td></tr>
          <tr><th>Contact No.</th><td>${escapeHtml(lead.phone || "")}</td><th>Transaction ID</th><td>${escapeHtml(lead.transactionId || "")}</td></tr>
          <tr><th>Course</th><td>${escapeHtml(lead.course || "")}</td><th>Validity</th><td>${lead.validityDate || lead.idCardValidity ? formatDate(lead.validityDate || lead.idCardValidity) : "One Year"}</td></tr>
        </tbody>
      </table>

      <table class="receipt-course-table">
        <thead>
          <tr><th>S.No.</th><th>Course Name</th><th>Total Fee</th><th>Discount</th><th>Payable Amount</th></tr>
        </thead>
        <tbody>
          <tr><td>1</td><td>${escapeHtml(lead.course || "")}</td><td>Rs ${totalFee.toLocaleString("en-IN")}/-</td><td>Rs ${discount.toLocaleString("en-IN")}/-</td><td>Rs ${payable.toLocaleString("en-IN")}/-</td></tr>
          <tr><th colspan="4">Total (Rs.)</th><th>Rs ${payable.toLocaleString("en-IN")}/-</th></tr>
          <tr><th colspan="2">Total (in Words)</th><td colspan="3">${numberToWords(payable)} Rupees Only/-</td></tr>
        </tbody>
      </table>

      <table class="receipt-payment-table">
        <tbody>
          <tr><td>Payable Amount</td><td>Rs ${payable.toLocaleString("en-IN")}/-</td><td>Paid Date</td><td>${formatDate(lead.enrolledDate || todayPlus(0))}</td></tr>
          <tr><td>Paid Amount</td><td>Rs ${paid.toLocaleString("en-IN")}/-</td><td>Pending Amount</td><td>Rs ${pending.toLocaleString("en-IN")}/-</td></tr>
          ${paymentRows}
          ${installmentRows}
        </tbody>
      </table>

      <p class="receipt-note"><strong>Note:</strong> Please check name, contact number, course name, fee amount and due date properly. In case of any issue, get it rectified immediately.</p>
      <div class="receipt-signatures">
        <span>Student Sign</span>
        <span>Authorised Sign</span>
      </div>
    </article>
  `;
}

function getFeeReceiptPrintCss() {
  return `
    .fee-receipt { position: relative; width: 760px; margin: 0 auto; padding: 18px; border: 1px solid #111; background: #fff; }
    .receipt-watermark { position: absolute; inset: 40% auto auto 7%; transform: rotate(-32deg); font-size: 58px; font-weight: 800; color: rgba(0,0,0,.08); white-space: nowrap; pointer-events: none; }
    .receipt-head { display: grid; grid-template-columns: 120px 1fr 230px; align-items: center; gap: 12px; border: 1px solid #111; padding: 8px; }
    .receipt-head img { width: 88px; height: 88px; object-fit: contain; }
    .receipt-title { text-align: center; align-self: end; }
    .receipt-title h3 { margin: 0 0 4px; font-size: 16px; }
    .receipt-title span { font-size: 11px; font-weight: 700; }
    .receipt-head address { margin: 0; font-style: normal; font-size: 11px; line-height: 1.35; }
    .receipt-info-table, .receipt-course-table, .receipt-payment-table { width: 100%; border-collapse: collapse; margin-top: 18px; font-size: 12px; }
    .receipt-info-table th, .receipt-info-table td, .receipt-course-table th, .receipt-course-table td, .receipt-payment-table td { border: 1px solid #111; padding: 6px; text-align: left; vertical-align: top; }
    .receipt-course-table thead th { text-align: center; }
    .receipt-course-table td:first-child { text-align: center; width: 48px; }
    .receipt-note { margin: 28px 0 54px; font-size: 12px; line-height: 1.5; }
    .receipt-signatures { display: flex; justify-content: space-between; margin-top: 38px; font-size: 13px; }
  `;
}

function numberToWords(amount) {
  const number = Math.floor(Number(amount) || 0);
  if (number === 0) return "Zero";
  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  const underHundred = (value) => value < 20 ? ones[value] : `${tens[Math.floor(value / 10)]}${value % 10 ? ` ${ones[value % 10]}` : ""}`;
  const underThousand = (value) => {
    if (value < 100) return underHundred(value);
    return `${ones[Math.floor(value / 100)]} Hundred${value % 100 ? ` ${underHundred(value % 100)}` : ""}`;
  };
  const parts = [];
  let rest = number;
  const crore = Math.floor(rest / 10000000);
  if (crore) { parts.push(`${underThousand(crore)} Crore`); rest %= 10000000; }
  const lakh = Math.floor(rest / 100000);
  if (lakh) { parts.push(`${underThousand(lakh)} Lakh`); rest %= 100000; }
  const thousand = Math.floor(rest / 1000);
  if (thousand) { parts.push(`${underThousand(thousand)} Thousand`); rest %= 1000; }
  if (rest) parts.push(underThousand(rest));
  return parts.join(" ");
}

function openForm(id) {
  const lead = leads.find((item) => item.id === id);
  elements.form.reset();
  elements.form.dataset.studentPhoto = lead?.studentPhoto || "";
  document.querySelector("#leadId").value = lead?.id || "";
  document.querySelector("#studentId").value = lead?.studentId || "Auto generated after save";
  elements.formTitle.textContent = lead ? "Edit Record" : "New Enquiry";
  elements.deleteBtn.hidden = !lead;
  toggleAdvancedLeadFields(Boolean(lead));
  updateEnquiryPhotoText(lead?.studentPhoto ? "Photo saved" : "No photo selected");

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

function toggleAdvancedLeadFields(show) {
  document.querySelectorAll(".advanced-lead-field").forEach((field) => {
    field.classList.toggle("hidden", !show);
  });
}

function updateEnquiryPhoto(event) {
  const file = event.target.files?.[0];
  if (!file) {
    updateEnquiryPhotoText(elements.form.dataset.studentPhoto ? "Photo saved" : "No photo selected");
    return;
  }

  compressImageFile(file)
    .then((photo) => {
      elements.form.dataset.studentPhoto = photo;
      updateEnquiryPhotoText(file.name);
    })
    .catch(() => {
      alert("Photo read nahi ho pa rahi hai. Please JPG/PNG photo select karein.");
      event.target.value = "";
      updateEnquiryPhotoText(elements.form.dataset.studentPhoto ? "Photo saved" : "No photo selected");
    });
}

function updateEnquiryPhotoText(text) {
  const label = document.querySelector("#enquiryPhotoText");
  if (label) label.textContent = text;
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

function openPendingFeeScheduleDialog(id) {
  const lead = leads.find((item) => item.id === id);
  if (!lead) return;
  const pending = getPendingFee(lead);

  document.querySelector("#studentFeeScheduleLeadId").value = id;
  document.querySelector("#studentFeeScheduleSummary").innerHTML = `
    <span><strong>${escapeHtml(lead.studentName || "Student")}</strong></span>
    <span>Roll No. ${escapeHtml(lead.studentId || "-")}</span>
    <span>${escapeHtml(lead.course || "-")}</span>
    <span>Total: Rs ${getMoney(lead.totalFee || lead.fees).toLocaleString("en-IN")}</span>
    <span>Pending: Rs ${pending.toLocaleString("en-IN")}</span>
  `;
  document.querySelector("#studentPendingInstallmentList").innerHTML = "";
  addStudentPendingInstallmentRow({ amount: String(pending), date: lead.pendingFeeDate || todayPlus(7) });
  elements.studentFeeScheduleDialog.showModal();
}

function closeStudentFeeScheduleDialog() {
  elements.studentFeeScheduleDialog.close();
}

function addStudentPendingInstallmentRow(installment = {}) {
  const row = document.createElement("div");
  row.className = "pending-installment-row";
  row.innerHTML = `
    <div class="pending-fee-date-pair">
      <label>Pending fee<input class="student-pending-installment-amount" type="number" min="0" step="100" value="${escapeHtml(installment.amount || "")}" required /></label>
      <label>Pending date<input class="student-pending-installment-date" type="date" value="${escapeHtml(installment.date || "")}" required /></label>
    </div>
    <button class="small-button danger-lite" type="button">Remove</button>
  `;
  row.querySelector("button").addEventListener("click", () => row.remove());
  document.querySelector("#studentPendingInstallmentList").appendChild(row);
}

function saveStudentPendingFeeSchedule(event) {
  event.preventDefault();
  const lead = leads.find((item) => item.id === document.querySelector("#studentFeeScheduleLeadId").value);
  if (!lead) return;

  const installments = [...document.querySelectorAll("#studentPendingInstallmentList .pending-installment-row")]
    .map((row) => ({
      amount: row.querySelector(".student-pending-installment-amount").value,
      date: row.querySelector(".student-pending-installment-date").value,
      paymentMode: "Cash",
      transactionId: ""
    }))
    .filter((item) => getMoney(item.amount) > 0 && item.date);
  const pendingTotal = installments.reduce((total, item) => total + getMoney(item.amount), 0);

  if (!installments.length || pendingTotal <= 0) {
    alert("Please add pending fee amount and date.");
    return;
  }

  const currentPending = getPendingFee(lead);
  if (pendingTotal !== currentPending) {
    alert(`Schedule total current pending fee Rs ${currentPending.toLocaleString("en-IN")} ke equal hona chahiye.`);
    return;
  }

  lead.status = "enrolled";
  lead.feePlan = "oneTime";
  lead.pendingInstallments = installments;
  lead.pendingFee = String(pendingTotal);
  lead.pendingFeeDate = installments[0]?.date || "";
  lead.followupDate = lead.pendingFeeDate;
  lead.fees = lead.totalFee || lead.fees || "";
  lead.notes = mergeNotes(lead.notes, `Pending fee schedule added on ${formatDate(todayPlus(0))}`);

  persist();
  closeStudentFeeScheduleDialog();
  render();
  switchDesk("admission");
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
  switchDesk("demo");
}

function openScheduleForm(id, defaults = {}) {
  const schedule = schedules.find((item) => item.id === id);
  elements.scheduleForm.reset();
  populateScheduleOptions();
  document.querySelector("#scheduleId").value = schedule?.id || "";
  elements.scheduleFormTitle.textContent = schedule ? "Edit Class" : "Add Class";
  document.querySelector("#deleteScheduleBtn").hidden = !schedule;
  document.querySelector("#classDate").value = schedule?.classDate || defaults.classDate || elements.scheduleDate.value || todayPlus(1);
  document.querySelector("#classRoom").value = defaults.classRoom || "";

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

function openBatchPeriodsDialog(defaults = {}) {
  elements.batchPeriodsForm.reset();
  populateBatchPeriodsOptions();
  document.querySelector("#batchPeriodsDate").value = defaults.classDate || elements.scheduleDate.value || todayPlus(1);
  document.querySelector("#batchPeriodsRoom").value = defaults.classRoom || "";
  document.querySelector("#batchPeriodRows").innerHTML = "";
  addBatchPeriodRow({ start: "08:00", end: "09:00" });
  addBatchPeriodRow({ start: "09:00", end: "10:00" });
  addBatchPeriodRow({ start: "10:00", end: "11:00" });
  elements.batchPeriodsDialog.showModal();
}

function closeBatchPeriodsDialog() {
  elements.batchPeriodsDialog.close();
}

function populateBatchPeriodsOptions() {
  populateSelect("#batchPeriodsBatch", schedulerMasters.batches.map((batch) => batch.batchName), "Select batch");
  populateSelect("#batchPeriodsRoom", schedulerMasters.rooms.map((room) => room.roomName), "Select class");
}

function addBatchPeriodRow(period = {}) {
  const row = document.createElement("div");
  row.className = "batch-period-row";
  row.innerHTML = `
    <label>Start<input class="batch-period-start" type="time" value="${escapeHtml(period.start || "")}" required /></label>
    <label>End<input class="batch-period-end" type="time" value="${escapeHtml(period.end || "")}" required /></label>
    <label>Subject<input class="batch-period-subject" value="${escapeHtml(period.subject || "")}" required /></label>
    <label>Teacher<select class="batch-period-teacher" required></select></label>
    <label>Topic<input class="batch-period-topic" value="${escapeHtml(period.topic || "")}" /></label>
    <button class="small-button danger-lite" type="button">Remove</button>
  `;
  const teacherSelect = row.querySelector(".batch-period-teacher");
  teacherSelect.innerHTML = `<option value="">Select teacher</option>` + schedulerMasters.teachers
    .map((teacher) => teacher.teacherName)
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b))
    .map((name) => `<option value="${escapeHtml(name)}">${escapeHtml(name)}</option>`)
    .join("");
  if (period.teacher && schedulerMasters.teachers.some((teacher) => teacher.teacherName === period.teacher)) {
    teacherSelect.value = period.teacher;
  }
  row.querySelector("button").addEventListener("click", () => row.remove());
  document.querySelector("#batchPeriodRows").appendChild(row);
}

function saveBatchPeriods(event) {
  event.preventDefault();
  const classDate = document.querySelector("#batchPeriodsDate").value;
  const classBatch = document.querySelector("#batchPeriodsBatch").value;
  const classRoom = document.querySelector("#batchPeriodsRoom").value;
  const rows = [...document.querySelectorAll(".batch-period-row")];
  const newSchedules = rows
    .map((row) => {
      const teacherName = row.querySelector(".batch-period-teacher").value;
      const teacher = getTeacherByName(teacherName);
      return {
        id: createId(),
        classDate,
        classStartTime: row.querySelector(".batch-period-start").value,
        classEndTime: row.querySelector(".batch-period-end").value,
        teacherName,
        teacherPhone: teacher?.teacherPhone || "",
        classSubject: row.querySelector(".batch-period-subject").value.trim(),
        classTopic: row.querySelector(".batch-period-topic").value.trim(),
        classBatch,
        classRoom,
        classNotes: "",
        createdAt: new Date().toISOString()
      };
    })
    .filter((schedule) => schedule.classStartTime && schedule.classEndTime && schedule.teacherName && schedule.classSubject);

  if (!newSchedules.length) {
    alert("Please add at least one period.");
    return;
  }

  const workingSchedules = [...schedules];
  for (const schedule of newSchedules) {
    const conflict = findScheduleConflict(schedule, workingSchedules);
    if (conflict) {
      alert(conflict);
      return;
    }
    workingSchedules.push(schedule);
  }

  schedules = workingSchedules;
  elements.scheduleDate.value = classDate;
  persistSchedules();
  closeBatchPeriodsDialog();
  renderSchedules();
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

function findScheduleConflict(schedule, scheduleSet = schedules) {
  if (!schedule.classStartTime || !schedule.classEndTime) return "";

  const batch = getBatchByName(schedule.classBatch);
  const room = getRoomByName(schedule.classRoom);
  if (batch && room && getMoney(batch.batchStudentCount) > getMoney(room.roomCapacity)) {
    return `${schedule.classRoom} capacity is ${room.roomCapacity}, but ${schedule.classBatch} has ${batch.batchStudentCount} students. Please select a bigger class.`;
  }

  const sameDate = scheduleSet.filter((item) => item.id !== schedule.id && item.classDate === schedule.classDate);
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
    studentPhoto: elements.form.dataset.studentPhoto || previousLead?.studentPhoto || "",
    parentName: document.querySelector("#parentName").value.trim(),
    phone: document.querySelector("#phone").value.trim(),
    parentPhone: document.querySelector("#parentPhone").value.trim(),
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
    "Student Phone",
    "Parents Phone",
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
    lead.parentPhone || "",
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

function downloadDailyCallingExcel() {
  const reportDate = elements.reportDate.value || todayPlus(0);
  const workbookRows = getDailyCallingWorkbookRows(reportDate);
  if (!window.XLSX) {
    downloadCsv(`daily-calling-${reportDate}-enquiries.csv`, workbookRows.enquiries);
    alert("Excel library load nahi hui. Enquiries CSV download ho gayi. Page refresh karke phir try karein.");
    return;
  }

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(workbookRows.enquiries), "Enquiries");
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(workbookRows.demos), "Demo Students");
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(workbookRows.fees), "Pending Fees");
  XLSX.writeFile(workbook, `daily-calling-${reportDate}.xlsx`);
}

function shareDailyCallingWhatsApp() {
  const reportDate = elements.reportDate.value || todayPlus(0);
  const rows = getDailyCallingWorkbookRows(reportDate);
  const message = [
    "Please find the daily calling Excel.",
    "",
    `Date: ${formatDate(reportDate)}`,
    `Enquiries: ${Math.max(rows.enquiries.length - 1, 0)}`,
    `Demo Students: ${Math.max(rows.demos.length - 1, 0)}`,
    `Pending Fee Calls: ${Math.max(rows.fees.length - 1, 0)}`,
    "",
    "Download the Daily Calling Excel from software and attach it here.",
    "",
    settings.instituteName
  ].join("\n");
  downloadDailyCallingExcel();
  openWhatsApp(`https://wa.me/?text=${encodeURIComponent(message)}`);
}

function getDailyCallingWorkbookRows(reportDate) {
  return {
    enquiries: getCallingEnquiryRows(reportDate),
    demos: getCallingDemoRows(reportDate),
    fees: getCallingFeeRows(reportDate)
  };
}

function getCallingEnquiryRows(reportDate) {
  const rows = [[
    "Student ID", "Student Name", "Student Mobile", "Parents Mobile", "Course", "Source", "Last Follow-up Date", "Call Result",
    "Next Follow-up Date", "Demo Action", "Demo Subject", "Demo Date", "Demo Time", "Call Notes"
  ]];
  getAdmissionLeads()
    .filter((lead) => lead.status === "enquiry")
    .filter((lead) => !lead.followupDate || lead.followupDate <= reportDate)
    .sort((a, b) => (a.followupDate || "").localeCompare(b.followupDate || ""))
    .forEach((lead) => rows.push([
      lead.studentId || "", lead.studentName || "", lead.phone || "", lead.parentPhone || "", lead.course || "", lead.source || "",
      lead.followupDate || "", "", lead.followupDate || reportDate, "Call Done", "", reportDate, "", lead.notes || ""
    ]));
  return rows;
}

function getCallingDemoRows(reportDate) {
  const rows = [[
    "Student ID", "Student Name", "Student Mobile", "Parents Mobile", "Course", "Demo Day", "Demo History", "Call Result",
    "Today Demo Status", "Today Subject", "Today Demo Date", "Next Demo Subject", "Next Demo Date", "Next Demo Time",
    "Next Follow-up Date", "Enrollment Status", "Call Notes"
  ]];
  getAdmissionLeads()
    .filter((lead) => lead.status === "demo")
    .sort((a, b) => (a.followupDate || "").localeCompare(b.followupDate || ""))
    .forEach((lead) => {
      const groups = buildDemoDayGroups(lead);
      rows.push([
        lead.studentId || "", lead.studentName || "", lead.phone || "", lead.parentPhone || "", lead.course || "",
        groups.length ? `Day ${groups.length}` : "Day 1",
        formatDemoHistoryText(lead), "", "Present", "", reportDate, "", todayPlusFrom(reportDate, 1), "", lead.followupDate || reportDate, "", lead.notes || ""
      ]);
    });
  return rows;
}

function getCallingFeeRows(reportDate) {
  const rows = [[
    "Student ID", "Student Name", "Student Mobile", "Parents Mobile", "Course", "Total Fee", "Discount", "Deposit", "Pending Fee",
    "Pending Date", "Reminder Type", "Call Result", "Fee Deposit Today", "New Pending Date", "Next Follow-up Date", "Call Notes"
  ]];
  getAdmissionLeads()
    .filter((lead) => lead.status === "enrolled" && hasFeePending(lead))
    .sort((a, b) => (getFeeDueDate(a) || "").localeCompare(getFeeDueDate(b) || ""))
    .forEach((lead) => {
      const dueDate = getFeeDueDate(lead);
      rows.push([
        lead.studentId || "", lead.studentName || "", lead.phone || "", lead.parentPhone || "", lead.course || "",
        lead.totalFee || lead.fees || "", lead.discount || "", lead.feeDeposit || lead.monthlyFeeDeposit || "",
        getPendingFee(lead), dueDate || "", dueDate === reportDate ? "Due today" : dueDate === todayPlusFrom(reportDate, 1) ? "Due tomorrow" : "Pending",
        "", "", dueDate || "", dueDate || reportDate, lead.notes || ""
      ]);
    });
  return rows;
}

function formatDemoHistoryText(lead) {
  const groups = buildDemoDayGroups(lead);
  if (!groups.length) return "";
  return groups.map((group, index) => {
    const subjects = group.slots.map((slot) => `${slot.subject} ${formatTime(slot.time)}`).join(", ");
    return `Day ${index + 1} (${formatDate(group.date)}): ${subjects}`;
  }).join(" | ");
}

function importDailyCallingExcel(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  if (!window.XLSX) {
    alert("Excel library load nahi hui. Page refresh karke phir upload karein.");
    event.target.value = "";
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    try {
      const workbook = XLSX.read(reader.result, { type: "array" });
      const result = {
        enquiries: applyCallingRows(workbook, "Enquiries", applyEnquiryCallingUpdate),
        demos: applyCallingRows(workbook, "Demo Students", applyDemoCallingUpdate),
        fees: applyCallingRows(workbook, "Pending Fees", applyFeeCallingUpdate)
      };
      persist();
      render();
      event.target.value = "";
      alert(`Calling Excel uploaded.\nEnquiries updated: ${result.enquiries}\nDemo updated: ${result.demos}\nFee updated: ${result.fees}`);
    } catch (error) {
      alert(`Calling Excel upload failed: ${error.message}`);
      event.target.value = "";
    }
  };
  reader.readAsArrayBuffer(file);
}

function applyCallingRows(workbook, sheetName, updater) {
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) return 0;
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
  let count = 0;
  rows.forEach((row) => {
    const id = String(row["Student ID"] || "").trim();
    if (!id) return;
    const lead = leads.find((item) => String(item.studentId || "") === id);
    if (!lead) return;
    updater(lead, row);
    count += 1;
  });
  return count;
}

function applyEnquiryCallingUpdate(lead, row) {
  const nextFollowup = normalizeDateInput(row["Next Follow-up Date"]);
  const demoDate = normalizeDateInput(row["Demo Date"]);
  const demoTime = normalizeTimeInput(row["Demo Time"]);
  const demoSubject = String(row["Demo Subject"] || "").trim();
  const action = String(row["Demo Action"] || "").toLowerCase();
  const notes = buildCallingNote(row["Call Result"], row["Call Notes"]);

  if (nextFollowup) lead.followupDate = nextFollowup;
  if (notes) lead.notes = mergeNotes(lead.notes, notes);
  if ((action.includes("demo") || demoSubject) && demoDate && demoTime && demoSubject) {
    lead.status = "demo";
    updateLeadDemoFields(lead, [...getLeadDemoSlots(lead), { subject: demoSubject, date: demoDate, time: demoTime }]);
  }
}

function applyDemoCallingUpdate(lead, row) {
  const todaySubject = String(row["Today Subject"] || "").trim();
  const todayDate = normalizeDateInput(row["Today Demo Date"]);
  const nextSubject = String(row["Next Demo Subject"] || "").trim();
  const nextDate = normalizeDateInput(row["Next Demo Date"]);
  const nextTime = normalizeTimeInput(row["Next Demo Time"]);
  const nextFollowup = normalizeDateInput(row["Next Follow-up Date"]);
  const enrollStatus = String(row["Enrollment Status"] || "").toLowerCase();
  const notes = buildCallingNote(row["Today Demo Status"] || row["Call Result"], row["Call Notes"]);

  if (notes) lead.notes = mergeNotes(lead.notes, notes);
  if (nextFollowup) lead.followupDate = nextFollowup;
  if (todaySubject && todayDate) {
    lead.todayDemoUpdate = `${formatDate(todayDate)} - ${todaySubject} - ${row["Today Demo Status"] || ""}`;
  }
  if (nextSubject && nextDate && nextTime) {
    updateLeadDemoFields(lead, [...getLeadDemoSlots(lead), { subject: nextSubject, date: nextDate, time: nextTime }]);
    lead.followupDate = nextDate;
  }
  if (enrollStatus.includes("enroll")) {
    lead.status = "enrolled";
    lead.enrolledDate = lead.enrolledDate || todayPlus(0);
    lead.feePlan = lead.feePlan || "oneTime";
  }
}

function applyFeeCallingUpdate(lead, row) {
  const paidToday = getMoney(row["Fee Deposit Today"]);
  const newPendingDate = normalizeDateInput(row["New Pending Date"]);
  const nextFollowup = normalizeDateInput(row["Next Follow-up Date"]);
  const notes = buildCallingNote(row["Call Result"], row["Call Notes"]);

  if (paidToday > 0) {
    if (isMonthlyFeeStudent(lead)) {
      lead.monthlyFeeDeposit = String(getMoney(lead.monthlyFeeDeposit) + paidToday);
    } else {
      lead.feeDeposit = String(getMoney(lead.feeDeposit) + paidToday);
    }
    lead.pendingFee = calculatePendingFee(lead);
  }
  if (newPendingDate) {
    if (isMonthlyFeeStudent(lead)) lead.monthlyDueDate = newPendingDate;
    else lead.pendingFeeDate = newPendingDate;
  }
  if (nextFollowup) lead.followupDate = nextFollowup;
  if (notes) lead.notes = mergeNotes(lead.notes, notes);
}

function buildCallingNote(result, note) {
  const parts = [result, note].map((item) => String(item || "").trim()).filter(Boolean);
  return parts.length ? `Calling ${formatDate(todayPlus(0))}: ${parts.join(" - ")}` : "";
}

function mergeNotes(existing, addition) {
  if (!addition) return existing || "";
  return existing ? `${existing}\n${addition}` : addition;
}

function todayPlusFrom(date, days) {
  const next = new Date(`${date}T00:00:00`);
  next.setDate(next.getDate() + days);
  return next.toISOString().slice(0, 10);
}

function normalizeDateInput(value) {
  if (!value) return "";
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString().slice(0, 10);
  if (typeof value === "number") {
    const date = XLSX?.SSF?.parse_date_code ? XLSX.SSF.parse_date_code(value) : null;
    if (date) return `${date.y}-${String(date.m).padStart(2, "0")}-${String(date.d).padStart(2, "0")}`;
  }
  const text = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
  const slash = text.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
  if (slash) {
    const year = slash[3].length === 2 ? `20${slash[3]}` : slash[3];
    return `${year}-${slash[2].padStart(2, "0")}-${slash[1].padStart(2, "0")}`;
  }
  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? "" : parsed.toISOString().slice(0, 10);
}

function normalizeTimeInput(value) {
  if (!value) return "";
  if (typeof value === "number") {
    const totalMinutes = Math.round(value * 24 * 60);
    return `${String(Math.floor(totalMinutes / 60) % 24).padStart(2, "0")}:${String(totalMinutes % 60).padStart(2, "0")}`;
  }
  const text = String(value).trim().toLowerCase();
  if (/^\d{1,2}:\d{2}$/.test(text)) return text.length === 4 ? `0${text}` : text;
  const match = text.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)$/);
  if (!match) return text;
  let hour = Number(match[1]);
  const minute = match[2] || "00";
  if (match[3] === "pm" && hour < 12) hour += 12;
  if (match[3] === "am" && hour === 12) hour = 0;
  return `${String(hour).padStart(2, "0")}:${minute}`;
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

function hasPendingFeeSchedule(lead) {
  if (Array.isArray(lead.pendingInstallments) && lead.pendingInstallments.some((item) => getMoney(item.amount) > 0 && item.date)) {
    return true;
  }
  return Boolean(lead.pendingFeeDate);
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
