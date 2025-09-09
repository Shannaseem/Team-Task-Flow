import {
  showMessageWithIcon,
  getToken,
  confirmAction,
  API_URL,
  logout,
  initializeModalListeners,
} from "./utils.js";

let allUsers = [];
let currentUser = null;
let tenantId = null;
let ws = null;
let currentTasks = [];
let wsRetryCount = 0;
const MAX_WS_RETRIES = 3;
const WS_RETRY_BASE_DELAY = 1000; // 1 second

// Endpoints
const USERS_ENDPOINT = `${API_URL}/users`;
const TENANT_ENDPOINT = `${API_URL}/tenants/me`;
const TASKS_ENDPOINT = `${API_URL}/tasks`;

// DOM Elements for Loading
const loadingScreen = document.querySelector("#loading-screen");
const mainContent = document.querySelector(".main-content");

// Status mappings
const statusMap = {
  "To Do": "todo",
  "In Progress": "in_progress",
  Done: "done",
};
const reverseStatusMap = {
  todo: "To Do",
  in_progress: "In Progress",
  done: "Done",
};

// Validate Elements on Load
function validateElements() {
  if (!loadingScreen) {
    console.warn("Warning: #loading-screen element not found in HTML.");
  }
  if (!mainContent) {
    console.warn("Warning: .main-content element not found in HTML.");
  }
  if (!document.getElementById("members-list")) {
    console.warn("Warning: #members-list element not found.");
  }
  if (!document.getElementById("settings-form")) {
    console.warn("Warning: #settings-form element not found.");
  }
  if (!document.getElementById("task-form")) {
    console.warn("Warning: #task-form element not found.");
  }
  const columns = {
    todo: document.getElementById("todo-column"),
    in_progress: document.getElementById("in-progress-column"),
    done: document.getElementById("done-column"),
  };
  if (!columns.todo) console.warn("Warning: #todo-column not found.");
  if (!columns.in_progress)
    console.warn("Warning: #in-progress-column not found.");
  if (!columns.done) console.warn("Warning: #done-column not found.");
}

// Show Loading with Null Check
function showLoading() {
  if (loadingScreen) {
    loadingScreen.style.display = "flex";
  }
  if (mainContent) {
    mainContent.style.display = "none";
  }
}

// Hide Loading with Null Check
function hideLoading() {
  if (loadingScreen) {
    loadingScreen.style.display = "none";
  }
  if (mainContent) {
    mainContent.style.display = "block";
  }
}

// Fetch current user
async function fetchCurrentUser() {
  const token = getToken();
  if (!token) {
    logout();
    return null;
  }
  try {
    const response = await fetch(`${API_URL}/users/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      if (response.status === 401) {
        logout();
        return;
      }
      throw new Error("Failed to fetch current user.");
    }
    currentUser = await response.json();
    const userEmailEl = document.getElementById("user-email");
    if (userEmailEl) {
      userEmailEl.textContent = currentUser.email;
    } else {
      console.warn("Warning: #user-email element not found.");
    }
  } catch (error) {
    console.error("Error fetching current user:", error);
    throw error;
  }
}

// Fetch tenant details
async function fetchTenant() {
  const token = getToken();
  try {
    const response = await fetch(TENANT_ENDPOINT, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      throw new Error("Failed to fetch tenant details.");
    }
    const tenantData = await response.json();
    tenantId = tenantData.id;
    const tenantNameEl = document.getElementById("tenant-name");
    if (tenantNameEl) {
      tenantNameEl.textContent = tenantData.name;
    } else {
      console.warn("Warning: #tenant-name element not found.");
    }
  } catch (error) {
    console.error("Error fetching tenant:", error);
    showMessageWithIcon("Error", "Failed to load team details.", "error");
    throw error;
  }
}

// Fetch users and render in members modal
async function fetchUsers() {
  const token = getToken();
  try {
    const response = await fetch(USERS_ENDPOINT, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      throw new Error("Failed to fetch users.");
    }
    const data = await response.json();
    allUsers = Array.isArray(data) ? data : data.members || [];
    renderUsers();
    populateAssignedUserDropdown();
  } catch (error) {
    console.error("Error fetching users:", error);
    showMessageWithIcon("Error", "Failed to load team members.", "error");
  }
}

// Render users in Team Members modal
function renderUsers() {
  const membersList = document.getElementById("members-list");
  if (!membersList) return;
  membersList.innerHTML = "";
  allUsers.forEach((user) => {
    const li = document.createElement("li");
    li.className = "member-item";
    li.innerHTML = `
      <div class="member-details">
        <span class="member-email">${user.email}</span>
        <span class="member-role">${
          user.role.charAt(0).toUpperCase() + user.role.slice(1)
        }</span>
      </div>
    `;
    membersList.appendChild(li);
  });
}

// Populate assigned user dropdown
function populateAssignedUserDropdown() {
  const assignedUserSelect = document.getElementById("assigned-user");
  if (assignedUserSelect) {
    assignedUserSelect.innerHTML = '<option value="">Unassigned</option>';
    allUsers.forEach((user) => {
      const option = document.createElement("option");
      option.value = user.id;
      option.textContent = user.email;
      assignedUserSelect.appendChild(option);
    });
  }
}

// Fetch and render tasks
async function fetchAndRenderTasks(isMyTasks = false) {
  const token = getToken();
  if (!token) {
    logout();
    return;
  }
  try {
    showLoading();
    const url = isMyTasks
      ? `${TASKS_ENDPOINT}?assigned_to_me=true`
      : TASKS_ENDPOINT;
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to fetch tasks.");
    }
    const data = await response.json();
    currentTasks = Array.isArray(data) ? data : data.tasks || [];
    renderTasks(currentTasks);
    updateSummaryCounts();
  } catch (error) {
    console.error("Error fetching tasks:", error);
    showMessageWithIcon(
      "Error",
      `Failed to load tasks: ${error.message}`,
      "error"
    );
  } finally {
    hideLoading();
  }
}

// Render tasks in columns
function renderTasks(tasks) {
  const columns = {
    todo: document.getElementById("todo-column"),
    in_progress: document.getElementById("in-progress-column"),
    done: document.getElementById("done-column"),
  };

  if (!columns.todo || !columns.in_progress || !columns.done) {
    console.warn("Warning: One or more task column elements not found.");
    if (!columns.todo) console.warn("Missing: #todo-column");
    if (!columns.in_progress) console.warn("Missing: #in-progress-column");
    if (!columns.done) console.warn("Missing: #done-column");
    showMessageWithIcon(
      "Error",
      "Task board columns are missing. Please check the page structure.",
      "error"
    );
    return;
  }

  Object.values(columns).forEach((col) => {
    if (col) col.innerHTML = "";
  });

  tasks.forEach((task) => {
    const taskCard = document.createElement("div");
    taskCard.className = "task-card";
    taskCard.dataset.taskId = task.id;
    taskCard.draggable = true;
    taskCard.innerHTML = `
      <h3>${task.title || "No Title"}</h3>
      <p>${task.description || ""}</p>
      <p>Assigned: ${
        allUsers.find((u) => u.id === task.assigned_to)?.email || "Unassigned"
      }</p>
      <p>Status: ${reverseStatusMap[task.status] || task.status}</p>
      <p>Due: ${task.due_date || "N/A"}</p>
      <p>Priority: ${task.priority || "N/A"}</p>
      <button class="btn btn-primary" onclick="handleEditTask(event)" data-task-id="${
        task.id
      }">Edit</button>
      <button class="btn btn-danger" onclick="handleDeleteTask(event)" data-task-id="${
        task.id
      }">Delete</button>
    `;
    const statusKey = statusMap[task.status] || task.status || "todo";
    if (columns[statusKey]) {
      columns[statusKey].appendChild(taskCard);
    } else {
      console.warn(`Warning: No column found for task status ${task.status}`);
    }
  });

  // Re-attach drag-and-drop listeners to newly created task cards
  setupDragAndDrop();
}

// Update summary counts
function updateSummaryCounts() {
  const counts = {
    total: currentTasks.length,
    todo: currentTasks.filter((t) => t.status === "todo").length,
    in_progress: currentTasks.filter((t) => t.status === "in_progress").length,
    done: currentTasks.filter((t) => t.status === "done").length,
  };
  const totalEl = document.getElementById("total-tasks-count");
  const todoEl = document.getElementById("todo-count");
  const inProgressEl = document.getElementById("in-progress-count");
  const doneEl = document.getElementById("done-count");
  if (totalEl) totalEl.textContent = counts.total;
  if (todoEl) todoEl.textContent = counts.todo;
  if (inProgressEl) inProgressEl.textContent = counts.in_progress;
  if (doneEl) doneEl.textContent = counts.done;
}

// Search tasks
function setupSearchListener() {
  const searchInput = document.getElementById("search-tasks");
  if (searchInput) {
    searchInput.addEventListener("input", () => {
      const query = searchInput.value.toLowerCase();
      const filteredTasks = currentTasks.filter(
        (task) =>
          task.title?.toLowerCase().includes(query) ||
          (task.description && task.description.toLowerCase().includes(query))
      );
      renderTasks(filteredTasks);
    });
  }
}

// Open task modal
function openTaskModal(taskId = null) {
  const taskModal = document.getElementById("task-modal-overlay");
  const taskForm = document.getElementById("task-form");
  const taskModalTitle = document.getElementById("task-modal-title");
  const taskIdInput = document.getElementById("task-id");
  const taskTitleInput = document.getElementById("task-title");
  const taskDescInput = document.getElementById("task-description");
  const assignedUserSelect = document.getElementById("assigned-user");
  const taskStatusSelect = document.getElementById("task-status");
  const dueDateInput = document.getElementById("due-date");
  const prioritySelect = document.getElementById("priority");

  if (
    !taskModal ||
    !taskForm ||
    !taskModalTitle ||
    !taskIdInput ||
    !taskTitleInput ||
    !taskDescInput ||
    !assignedUserSelect ||
    !taskStatusSelect ||
    !dueDateInput ||
    !prioritySelect
  ) {
    console.warn("Warning: Task modal elements not found.");
    showMessageWithIcon(
      "Error",
      "Task modal is missing required elements.",
      "error"
    );
    return;
  }

  taskModalTitle.textContent = taskId ? "Edit Task" : "Create New Task";
  taskIdInput.value = taskId || "";
  taskTitleInput.value = "";
  taskDescInput.value = "";
  assignedUserSelect.value = "";
  taskStatusSelect.value = "To Do";
  dueDateInput.value = "";
  prioritySelect.value = "Low";

  if (taskId) {
    const task = currentTasks.find((t) => t.id === parseInt(taskId));
    if (task) {
      taskTitleInput.value = task.title || "";
      taskDescInput.value = task.description || "";
      assignedUserSelect.value = task.assigned_to || "";
      taskStatusSelect.value = reverseStatusMap[task.status] || "To Do";
      dueDateInput.value = task.due_date || "";
      prioritySelect.value = task.priority || "Low";
    }
  }
  taskModal.style.display = "flex";
}

// Handle task form submission
async function handleTaskFormSubmit(e) {
  e.preventDefault();
  const taskId = document.getElementById("task-id").value;
  const taskTitle = document.getElementById("task-title").value.trim();
  const taskDesc = document.getElementById("task-description").value.trim();
  const assignedUser = document.getElementById("assigned-user").value;
  const taskStatus = document.getElementById("task-status").value;
  const dueDate = document.getElementById("due-date").value;
  const priority = document.getElementById("priority").value;
  const taskModal = document.getElementById("task-modal-overlay");

  if (!taskTitle) {
    showMessageWithIcon("Error", "Task title is required.", "error");
    return;
  }

  const isEdit = !!taskId;
  const url = isEdit ? `${TASKS_ENDPOINT}/${taskId}` : TASKS_ENDPOINT;
  const method = isEdit ? "PUT" : "POST";
  const payload = {
    title: taskTitle || null,
    description: taskDesc || null,
    assigned_to: assignedUser ? parseInt(assignedUser) : null,
    status: statusMap[taskStatus] || "todo",
    due_date: dueDate || null,
    priority: priority || null,
  };

  try {
    showLoading();
    const token = getToken();
    if (!token) {
      logout();
      return;
    }
    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    if (response.ok) {
      showMessageWithIcon(
        "Success",
        `Task ${isEdit ? "updated" : "created"} successfully!`,
        "success"
      );
      if (taskModal) taskModal.style.display = "none";
      await fetchAndRenderTasks(
        document.getElementById("my-tasks-btn")?.classList.contains("active") ||
          false
      );
    } else {
      const errorData = await response.json();
      console.error("Task submit error:", errorData);
      showMessageWithIcon(
        "Error",
        errorData.detail || `Failed to ${isEdit ? "update" : "create"} task.`,
        "error"
      );
    }
  } catch (error) {
    console.error("Task form submission error:", error);
    showMessageWithIcon(
      "Error",
      `An unexpected error occurred: ${error.message}`,
      "error"
    );
  } finally {
    hideLoading();
  }
}

// Handle invite form submission
async function handleInviteFormSubmit(e) {
  e.preventDefault();
  const email = document.getElementById("invite-email")?.value?.trim();
  const inviteModal = document.getElementById("invite-modal");

  if (!email || !email.match(/^\S+@\S+\.\S+$/)) {
    showMessageWithIcon(
      "Error",
      "Please enter a valid email address.",
      "error"
    );
    return;
  }

  try {
    showLoading();
    const token = getToken();
    if (!token) {
      logout();
      return;
    }
    const response = await fetch(`${API_URL}/users/invite`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ email }),
    });
    if (response.ok) {
      showMessageWithIcon("Success", `Invitation sent to ${email}.`, "success");
      if (inviteModal) inviteModal.style.display = "none";
      document.getElementById("invite-form")?.reset();
      await fetchUsers();
    } else {
      const errorData = await response.json();
      showMessageWithIcon(
        "Error",
        errorData.detail || "Failed to send invitation.",
        "error"
      );
    }
  } catch (error) {
    console.error("Invite error:", error);
    showMessageWithIcon(
      "Error",
      `An unexpected error occurred: ${error.message}`,
      "error"
    );
  } finally {
    hideLoading();
  }
}

// Handle settings form submission
async function handleSettingsFormSubmit(e) {
  e.preventDefault();
  if (currentUser?.role !== "admin") {
    showMessageWithIcon(
      "Error",
      "Only admins can update team settings.",
      "error"
    );
    document.getElementById("settings-admin-message").style.display = "block";
    return;
  }
  const tenantName = document.getElementById("tenant-name-input")?.value.trim();
  const timezone = document.getElementById("timezone")?.value;
  const settingsModal = document.getElementById("settings-modal");

  if (!tenantName) {
    showMessageWithIcon("Error", "Team name cannot be empty.", "error");
    return;
  }

  try {
    showLoading();
    const token = getToken();
    if (!token) {
      logout();
      return;
    }
    const response = await fetch(TENANT_ENDPOINT, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name: tenantName, timezone: timezone || null }),
    });
    if (response.ok) {
      showMessageWithIcon(
        "Success",
        "Team settings updated successfully!",
        "success"
      );
      if (settingsModal) settingsModal.style.display = "none";
      await fetchTenant();
    } else {
      const errorData = await response.json();
      showMessageWithIcon(
        "Error",
        errorData.detail || "Failed to update team settings.",
        "error"
      );
    }
  } catch (error) {
    console.error("Settings update error:", error);
    showMessageWithIcon(
      "Error",
      `An unexpected error occurred: ${error.message}`,
      "error"
    );
  } finally {
    hideLoading();
  }
}

// Handle delete task
async function handleDeleteTask(e) {
  const taskId = e.target.dataset.taskId;
  if (!taskId) {
    showMessageWithIcon("Error", "Invalid task ID.", "error");
    return;
  }

  confirmAction(
    "Delete Task",
    "Are you sure you want to delete this task? This action cannot be undone.",
    async () => {
      try {
        showLoading();
        const token = getToken();
        if (!token) {
          logout();
          return;
        }
        const response = await fetch(`${TASKS_ENDPOINT}/${taskId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok || response.status === 204) {
          showMessageWithIcon(
            "Success",
            "Task deleted successfully!",
            "success"
          );
          await fetchAndRenderTasks(
            document
              .getElementById("my-tasks-btn")
              ?.classList.contains("active") || false
          );
        } else {
          const errorData = await response.json();
          console.error("Delete task error:", errorData);
          showMessageWithIcon(
            "Error",
            errorData.detail || "Failed to delete task.",
            "error"
          );
        }
      } catch (error) {
        console.error("Delete task error:", error);
        showMessageWithIcon(
          "Error",
          `An unexpected error occurred: ${error.message}`,
          "error"
        );
      } finally {
        hideLoading();
      }
    }
  );
}

// Handle edit task
function handleEditTask(e) {
  e.stopPropagation();
  const taskId = e.target.dataset.taskId;
  if (taskId) {
    openTaskModal(parseInt(taskId, 10));
  } else {
    showMessageWithIcon("Error", "Invalid task ID.", "error");
  }
}

// Setup drag and drop
function setupDragAndDrop() {
  const taskCards = document.querySelectorAll(".task-card");
  const taskColumns = document.querySelectorAll(".tasks-column");

  taskCards.forEach((card) => {
    card.addEventListener("dragstart", dragStart);
  });

  taskColumns.forEach((column) => {
    column.addEventListener("dragover", dragOver);
    column.addEventListener("drop", drop);
    column.addEventListener("dragleave", dragLeave);
  });
}

let draggedTask = null;

function dragStart(e) {
  draggedTask = e.target;
  e.dataTransfer.setData("text/plain", draggedTask.dataset.taskId);
  setTimeout(() => {
    if (draggedTask) draggedTask.style.display = "none";
  }, 0);
}

function dragOver(e) {
  e.preventDefault();
  const column = e.currentTarget;
  if (column) column.classList.add("drag-over");
}

function dragLeave(e) {
  const column = e.currentTarget;
  if (column) column.classList.remove("drag-over");
}

async function drop(e) {
  e.preventDefault();
  const currentTarget = e.currentTarget;
  if (currentTarget) currentTarget.classList.remove("drag-over");

  if (draggedTask) {
    draggedTask.style.display = "block";
  }

  const taskId = e.dataTransfer.getData("text/plain");
  const newStatus = statusMap[currentTarget.parentElement?.dataset.status];
  if (!taskId || !newStatus) {
    showMessageWithIcon("Error", "Invalid task or status.", "error");
    return;
  }

  try {
    showLoading();
    const token = getToken();
    if (!token) {
      logout();
      return;
    }
    const response = await fetch(`${TASKS_ENDPOINT}/${taskId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status: newStatus }),
    });
    if (response.ok) {
      showMessageWithIcon("Success", "Task status updated!", "success");
      await fetchAndRenderTasks(
        document.getElementById("my-tasks-btn")?.classList.contains("active") ||
          false
      );
    } else {
      const errorData = await response.json();
      showMessageWithIcon(
        "Error",
        errorData.detail || "Failed to update task status.",
        "error"
      );
    }
  } catch (error) {
    console.error("Drag and drop update error:", error);
    showMessageWithIcon(
      "Error",
      `An unexpected error occurred: ${error.message}`,
      "error"
    );
  } finally {
    hideLoading();
  }
}

// Setup event listeners
function setupEventListeners() {
  const createTaskBtn = document.getElementById("create-task-btn");
  const myTasksBtn = document.getElementById("my-tasks-btn");
  const allTasksBtn = document.getElementById("dashboard-btn");
  const teamMembersBtn = document.getElementById("team-members-btn");
  const settingsBtn = document.getElementById("settings-btn");
  const logoutBtn = document.getElementById("logout-button");
  const logoutBtnFooter = document.getElementById("logout-button-footer");
  const taskForm = document.getElementById("task-form");
  const inviteForm = document.getElementById("invite-form");
  const settingsForm = document.getElementById("settings-form");
  const inviteUserBtn = document.getElementById("invite-user-btn");
  const taskCancelBtn = document.getElementById("task-cancel-btn");
  const inviteCancelBtn = document.getElementById("invite-cancel-btn");
  const settingsCancelBtn = document.getElementById("settings-cancel-btn");

  if (createTaskBtn) {
    createTaskBtn.addEventListener("click", () => openTaskModal());
  }
  if (myTasksBtn) {
    myTasksBtn.addEventListener("click", () => {
      myTasksBtn.classList.add("active");
      allTasksBtn?.classList.remove("active");
      fetchAndRenderTasks(true);
    });
  }
  if (allTasksBtn) {
    allTasksBtn.addEventListener("click", () => {
      allTasksBtn.classList.add("active");
      myTasksBtn?.classList.remove("active");
      fetchAndRenderTasks(false);
    });
  }
  if (teamMembersBtn) {
    teamMembersBtn.addEventListener("click", () => {
      const membersModal = document.getElementById("members-modal");
      if (membersModal) {
        membersModal.style.display = "flex";
        fetchUsers();
      }
    });
  }
  if (settingsBtn) {
    settingsBtn.addEventListener("click", async () => {
      const settingsModal = document.getElementById("settings-modal");
      const tenantNameInput = document.getElementById("tenant-name-input");
      const adminMessage = document.getElementById("settings-admin-message");
      if (tenantNameInput && adminMessage && settingsModal) {
        await fetchTenant();
        tenantNameInput.value =
          document.getElementById("tenant-name")?.textContent || "";
        adminMessage.style.display =
          currentUser?.role !== "admin" ? "block" : "none";
        settingsModal.style.display = "flex";
      }
    });
  }
  if (logoutBtn) {
    logoutBtn.addEventListener("click", logout);
  }
  if (logoutBtnFooter) {
    logoutBtnFooter.addEventListener("click", logout);
  }
  if (taskForm) {
    taskForm.addEventListener("submit", handleTaskFormSubmit);
  }
  if (inviteForm) {
    inviteForm.addEventListener("submit", handleInviteFormSubmit);
  }
  if (settingsForm) {
    settingsForm.addEventListener("submit", handleSettingsFormSubmit);
  }
  if (inviteUserBtn) {
    inviteUserBtn.addEventListener("click", () => {
      const inviteModal = document.getElementById("invite-modal");
      if (inviteModal) inviteModal.style.display = "flex";
    });
  }
  if (taskCancelBtn) {
    taskCancelBtn.addEventListener("click", () => {
      const taskModal = document.getElementById("task-modal-overlay");
      if (taskModal) taskModal.style.display = "none";
    });
  }
  if (inviteCancelBtn) {
    inviteCancelBtn.addEventListener("click", () => {
      const inviteModal = document.getElementById("invite-modal");
      if (inviteModal) inviteModal.style.display = "none";
    });
  }
  if (settingsCancelBtn) {
    settingsCancelBtn.addEventListener("click", () => {
      const settingsModal = document.getElementById("settings-modal");
      if (settingsModal) settingsModal.style.display = "none";
    });
  }
  setupSearchListener();
  setupDragAndDrop();
}

// Event Listeners
document.addEventListener("DOMContentLoaded", async () => {
  console.log("Token in dashboard.js:", getToken());
  validateElements();
  const token = getToken();
  if (!token) {
    logout();
    return;
  }
  try {
    showLoading();
    await fetchCurrentUser();
    await fetchTenant();
    await fetchUsers();
    await fetchAndRenderTasks(false);
    setupEventListeners();
    initializeModalListeners();
    hideLoading();
  } catch (error) {
    console.error("Initialization error:", error);
    showMessageWithIcon(
      "Error",
      `Failed to initialize the dashboard: ${error.message}`,
      "error"
    );
    hideLoading();
  }
});

// Global handlers
window.handleEditTask = handleEditTask;
window.handleDeleteTask = handleDeleteTask;
