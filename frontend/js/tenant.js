// js/tenant.js

import {
  showMessage,
  showConfirm,
  getToken,
  logout,
  API_URL,
  showMessageWithIcon,
} from "./utils.js";

// Page load par token check karein
const token = getToken();
if (!token) {
  logout();
}

// ------------------ State Variables ------------------
let currentEditTaskId = null;
let currentTasks = [];
let allUsers = [];
let current_user_id = null;
let current_user_role = null;
let draggedTask = null; // Drag-and-drop ke liye naya variable

const TASKS_ENDPOINT = `${API_URL}/tasks`;
const USERS_ENDPOINT = `${API_URL}/users`;
const TENANT_ENDPOINT = `${API_URL}/tenants/me`;
const USER_ME_ENDPOINT = `${API_URL}/users/me`;
const INVITE_ENDPOINT = `${API_URL}/users/invite`;

// ------------------ DOM Elements ------------------
// Wrap all DOM-related code in a DOMContentLoaded listener
document.addEventListener("DOMContentLoaded", () => {
  const userEmailEl = document.getElementById("user-email");
  const tenantNameEl = document.getElementById("tenant-name");
  const logoutButton = document.getElementById("logout-button");
  const taskModalOverlay = document.getElementById("task-modal-overlay");
  const taskModalTitle = document.getElementById("task-modal-title");
  const taskForm = document.getElementById("task-form");
  const taskIdInput = document.getElementById("task-id-input");
  const taskTitleInput = document.getElementById("task-title");
  const taskDescriptionInput = document.getElementById("task-description");
  const taskStatusInput = document.getElementById("task-status");
  const assignedUserInput = document.getElementById("assigned-user");
  const createTaskBtn = document.getElementById("create-task-btn");
  const taskModalCloseBtn = document.getElementById("task-modal-close-btn");
  const kanbanColumns = document.querySelectorAll(".kanban-column");
  const allTasksLink = document.getElementById("all-tasks-link");
  const myTasksLink = document.getElementById("my-tasks-link");
  const inviteLink = document.getElementById("invite-link");
  const settingsLink = document.getElementById("settings-link");
  const currentViewTitle = document.getElementById("current-view-title");

  // Naye DOM elements
  const totalMembersCountEl = document.getElementById("total-members-count");
  const viewMembersBtn = document.getElementById("view-members-btn");
  const membersModalOverlay = document.getElementById("members-modal-overlay");
  const membersListEl = document.getElementById("members-list");
  const membersModalCountEl = document.getElementById("members-modal-count");
  const membersModalCloseBtn = document.getElementById(
    "members-modal-close-btn"
  );
  const tenantNameSettingsInput = document.getElementById("tenant-name");
  const tenantForm = document.getElementById("tenant-form");

  // Initial data fetch and render
  fetchAndRenderDashboard();

  // ------------------ Event Listeners ------------------

  // Task Modal Handlers
  createTaskBtn?.addEventListener("click", () => {
    showTaskModal("Create New Task");
  });

  taskModalCloseBtn?.addEventListener("click", hideTaskModal);

  taskForm?.addEventListener("submit", handleTaskFormSubmit);

  // Navigational links
  if (logoutButton) {
    logoutButton.addEventListener("click", (e) => {
      e.preventDefault();
      logout();
    });
  }

  if (inviteLink) {
    inviteLink.addEventListener("click", (e) => {
      e.preventDefault();
      window.location.href = "invite-user.html";
    });
  }

  if (settingsLink) {
    settingsLink.addEventListener("click", (e) => {
      e.preventDefault();
      window.location.href = "tenant-settings.html";
    });
  }

  // New: Members modal handlers
  if (viewMembersBtn) {
    viewMembersBtn.addEventListener("click", () => {
      fetchAndRenderUsersInModal();
    });
  }

  if (membersModalCloseBtn) {
    membersModalCloseBtn.addEventListener("click", () => {
      membersModalOverlay.style.display = "none";
    });
  }

  // Tenant settings form handler
  if (tenantForm) {
    tenantForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const newTenantName = tenantNameSettingsInput.value.trim();

      if (!newTenantName) {
        showMessageWithIcon("Error", "Team name cannot be empty.", "error");
        return;
      }

      try {
        const response = await fetch(TENANT_ENDPOINT, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ name: newTenantName }),
        });

        const data = await response.json();

        if (response.ok) {
          showMessageWithIcon(
            "Success",
            "Team name updated successfully!",
            "success"
          );
          // Update the tenant name in the dashboard view as well
          const dashboardTenantName =
            document.getElementById("tenant-name") || tenantNameEl;
          if (dashboardTenantName) {
            dashboardTenantName.textContent = newTenantName;
          }
        } else {
          showMessageWithIcon(
            "Update Failed",
            data.detail || "Failed to update team name.",
            "error"
          );
        }
      } catch (error) {
        console.error("Update error:", error);
        showMessageWithIcon(
          "Error",
          "An unexpected error occurred. Please try again.",
          "error"
        );
      }
    });
  }

  // Load tenant name on settings page
  if (document.title === "Tenant Settings") {
    fetchTenantDetails();
  }

  // --- Task Drag and Drop Handlers (Already existed, not changed) ---
  let draggedTask = null; // Drag-and-drop ke liye naya variable

  function handleDragStart(e) {
    draggedTask = e.target;
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", e.target.dataset.id);
  }

  function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }

  function handleDrop(e) {
    e.preventDefault();
    const newStatus = e.currentTarget.dataset.status;
    if (newStatus && draggedTask) {
      const taskId = draggedTask.dataset.id;
      updateTaskStatus(taskId, newStatus);
    }
  }

  function handleDragEnd(e) {
    draggedTask = null;
  }

  // Drag and Drop listeners
  kanbanColumns.forEach((column) => {
    column.addEventListener("dragover", handleDragOver);
    column.addEventListener("drop", handleDrop);
  });

  document.addEventListener("dragstart", (e) => {
    if (e.target.classList.contains("task-card")) {
      handleDragStart(e);
    }
  });

  document.addEventListener("dragend", handleDragEnd);
});

// ------------------ Functions ------------------
async function fetchUserAndTenantData() {
  try {
    const userResponse = await fetch(USER_ME_ENDPOINT, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const tenantResponse = await fetch(TENANT_ENDPOINT, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!userResponse.ok || !tenantResponse.ok) {
      if (userResponse.status === 401 || tenantResponse.status === 401) {
        logout();
        return;
      }
      throw new Error("Failed to fetch user or tenant data.");
    }

    const userData = await userResponse.json();
    const tenantData = await tenantResponse.json();

    return { user: userData, tenant: tenantData };
  } catch (error) {
    console.error("Error fetching initial data:", error);
    showMessageWithIcon(
      "Error",
      "Failed to load user and team data. Please try again later.",
      "error"
    );
    return null;
  }
}

async function fetchAndRenderDashboard() {
  const data = await fetchUserAndTenantData();
  if (!data) return;

  const { user, tenant } = data;
  current_user_id = user.id;
  current_user_role = user.role;
  document.getElementById("user-email").textContent = user.email;
  document.getElementById("tenant-name").textContent = tenant.name;

  // Sirf admin ko invite link dikhayein
  const inviteLink = document.getElementById("invite-link");
  if (inviteLink) {
    inviteLink.style.display = current_user_role === "admin" ? "block" : "none";
  }

  await fetchAndRenderTasks();
  await fetchAndRenderUsers();
}

async function fetchAndRenderTasks() {
  try {
    const response = await fetch(TASKS_ENDPOINT, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error("Failed to fetch tasks.");

    currentTasks = await response.json();
    renderTasks(currentTasks);
  } catch (error) {
    console.error("Error fetching tasks:", error);
    showMessageWithIcon("Error", "Failed to load tasks.", "error");
  }
}

async function fetchAndRenderUsers() {
  try {
    const response = await fetch(USERS_ENDPOINT, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error("Failed to fetch users.");

    allUsers = await response.json();
    renderUserDropdown(allUsers);

    // Naye change: Members ki ginti dikhayein
    const totalMembersCountEl = document.getElementById("total-members-count");
    if (totalMembersCountEl) {
      totalMembersCountEl.textContent = allUsers.length;
    }
  } catch (error) {
    console.error("Error fetching users:", error);
  }
}

async function fetchAndRenderUsersInModal() {
  try {
    const response = await fetch(USERS_ENDPOINT, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error("Failed to fetch users.");

    const users = await response.json();
    renderUsersInModal(users);
  } catch (error) {
    console.error("Error fetching users for modal:", error);
    showMessageWithIcon("Error", "Failed to load members list.", "error");
  }
}

function renderUsersInModal(users) {
  const membersListEl = document.getElementById("members-list");
  const membersModalCountEl = document.getElementById("members-modal-count");
  const membersModalOverlay = document.getElementById("members-modal-overlay");

  membersListEl.innerHTML = "";
  membersModalCountEl.textContent = users.length;

  users.forEach((user) => {
    const listItem = document.createElement("li");
    listItem.innerHTML = `
      <span class="email">${user.email}</span>
      <span class="role ${user.role}">${user.role}</span>
    `;

    // Sirf admin ko remove button dikhayein
    if (current_user_role === "admin" && user.id !== current_user_id) {
      const removeBtn = document.createElement("button");
      removeBtn.textContent = "Remove";
      removeBtn.classList.add("btn", "btn-sm", "btn-danger");
      removeBtn.addEventListener("click", () => handleRemoveUser(user.id));
      listItem.appendChild(removeBtn);
    }

    membersListEl.appendChild(listItem);
  });

  membersModalOverlay.style.display = "flex";
}

async function handleRemoveUser(userId) {
  showConfirm(
    "Confirm Removal",
    "Are you sure you want to remove this user from the team?",
    async () => {
      try {
        const response = await fetch(
          `${USERS_ENDPOINT}/remove_user/${userId}`,
          {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const data = await response.json();

        if (response.ok) {
          showMessageWithIcon(
            "Success!",
            "User has been removed successfully.",
            "success"
          );
          // Refresh the members list and dashboard
          await fetchAndRenderUsersInModal();
          await fetchAndRenderDashboard();
        } else {
          showMessageWithIcon(
            "Removal Failed",
            data.detail || "Failed to remove user.",
            "error"
          );
        }
      } catch (error) {
        console.error("Removal error:", error);
        showMessageWithIcon(
          "Error",
          "An unexpected error occurred. Please try again.",
          "error"
        );
      }
    }
  );
}

function renderTasks(tasks) {
  const todoList = document.getElementById("todo-list");
  const inProgressList = document.getElementById("in-progress-list");
  const doneList = document.getElementById("done-list");

  // Clear existing tasks
  todoList.innerHTML = "";
  inProgressList.innerHTML = "";
  doneList.innerHTML = "";

  const todoCount = document.getElementById("todo-count");
  const inProgressCount = document.getElementById("in-progress-count");
  const doneCount = document.getElementById("done-count");
  const totalTasksCount = document.getElementById("total-tasks-count");
  const myTasksCount = document.getElementById("my-tasks-count");
  let myTasksTotal = 0;

  let todoTotal = 0;
  let inProgressTotal = 0;
  let doneTotal = 0;

  if (tasks.length === 0) {
    todoList.innerHTML = `<p class="no-tasks-message">No tasks in this column.</p>`;
    inProgressList.innerHTML = `<p class="no-tasks-message">No tasks in this column.</p>`;
    doneList.innerHTML = `<p class="no-tasks-message">No tasks in this column.</p>`;
  }

  tasks.forEach((task) => {
    const taskCard = createTaskCard(task);
    if (task.status === "todo") {
      todoList.appendChild(taskCard);
      todoTotal++;
    } else if (task.status === "in_progress") {
      inProgressList.appendChild(taskCard);
      inProgressTotal++;
    } else if (task.status === "done") {
      doneList.appendChild(taskCard);
      doneTotal++;
    }

    if (task.assigned_user_id === current_user_id) {
      myTasksTotal++;
    }
  });

  todoCount.textContent = todoTotal;
  inProgressCount.textContent = inProgressTotal;
  doneCount.textContent = doneTotal;
  totalTasksCount.textContent = tasks.length;
  myTasksCount.textContent = myTasksTotal;
}

function createTaskCard(task) {
  const card = document.createElement("div");
  card.classList.add("task-card");
  card.setAttribute("draggable", "true");
  card.dataset.id = task.id;

  const assignedUser =
    allUsers.find((user) => user.id === task.assigned_user_id) || null;
  const assignedUserName = assignedUser
    ? assignedUser.email.split("@")[0]
    : "Unassigned";

  card.innerHTML = `
    <div class="task-actions">
        <button class="edit-btn" data-id="${
          task.id
        }"><i class="fas fa-edit"></i></button>
        <button class="delete-btn" data-id="${
          task.id
        }"><i class="fas fa-trash-alt"></i></button>
    </div>
    <div class="task-title">${task.title}</div>
    <div class="task-description">${task.description || ""}</div>
    <div class="task-meta">
        <span class="task-assigned-user"><i class="fas fa-user-circle"></i> ${assignedUserName}</span>
    </div>
  `;

  // Add event listeners for edit and delete buttons
  card
    .querySelector(".edit-btn")
    .addEventListener("click", (e) => showTaskModal("Edit Task", task.id));
  card
    .querySelector(".delete-btn")
    .addEventListener("click", (e) => handleDeleteTask(task.id));

  return card;
}

function showTaskModal(title, taskId = null) {
  const taskModalOverlay = document.getElementById("task-modal-overlay");
  const taskModalTitle = document.getElementById("task-modal-title");
  const taskIdInput = document.getElementById("task-id-input");
  const taskTitleInput = document.getElementById("task-title");
  const taskDescriptionInput = document.getElementById("task-description");
  const taskStatusInput = document.getElementById("task-status");
  const assignedUserInput = document.getElementById("assigned-user");

  taskModalTitle.textContent = title;
  currentEditTaskId = taskId;

  if (taskId) {
    const task = currentTasks.find((t) => t.id === taskId);
    if (task) {
      taskIdInput.value = task.id;
      taskTitleInput.value = task.title;
      taskDescriptionInput.value = task.description;
      taskStatusInput.value = task.status;
      assignedUserInput.value = task.assigned_user_id;
    }
  } else {
    // Reset form for creation
    taskIdInput.value = "";
    taskTitleInput.value = "";
    taskDescriptionInput.value = "";
    taskStatusInput.value = "todo";
    assignedUserInput.value = "";
  }

  taskModalOverlay.style.display = "flex";
}

function hideTaskModal() {
  const taskModalOverlay = document.getElementById("task-modal-overlay");
  const taskForm = document.getElementById("task-form");
  taskModalOverlay.style.display = "none";
  taskForm.reset();
  currentEditTaskId = null;
}

async function handleTaskFormSubmit(e) {
  e.preventDefault();
  const taskTitleInput = document.getElementById("task-title");
  const taskDescriptionInput = document.getElementById("task-description");
  const taskStatusInput = document.getElementById("task-status");
  const assignedUserInput = document.getElementById("assigned-user");
  const taskId = currentEditTaskId;

  const taskData = {
    title: taskTitleInput.value,
    description: taskDescriptionInput.value,
    status: taskStatusInput.value,
    assigned_user_id: assignedUserInput.value
      ? parseInt(assignedUserInput.value)
      : null,
  };

  try {
    let url = TASKS_ENDPOINT;
    let method = "POST";
    if (taskId) {
      url += `/${taskId}`;
      method = "PUT";
    }

    const response = await fetch(url, {
      method: method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(taskData),
    });

    const data = await response.json();

    if (response.ok) {
      hideTaskModal();
      showMessageWithIcon(
        "Success!",
        `Task successfully ${taskId ? "updated" : "created"}.`,
        "success"
      );
      await fetchAndRenderTasks();
    } else {
      showMessageWithIcon(
        "Operation Failed",
        data.detail || "Failed to save task.",
        "error"
      );
    }
  } catch (error) {
    console.error("Task form submission error:", error);
    showMessageWithIcon(
      "Error",
      "An unexpected error occurred. Please try again.",
      "error"
    );
  }
}

async function updateTaskStatus(taskId, newStatus) {
  try {
    const response = await fetch(
      `${TASKS_ENDPOINT}/update_status/${taskId}/${newStatus}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.detail || "Failed to update task status.");
    }

    showMessageWithIcon("Success!", "Task status updated.", "success");
    await fetchAndRenderTasks();
  } catch (error) {
    console.error("Status update error:", error);
    showMessageWithIcon("Error", error.message, "error");
  }
}

async function handleDeleteTask(taskId) {
  showConfirm(
    "Confirm Deletion",
    "Are you sure you want to delete this task?",
    async () => {
      try {
        const response = await fetch(`${TASKS_ENDPOINT}/${taskId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.detail || "Failed to delete task.");
        }

        showMessageWithIcon(
          "Success!",
          "Task deleted successfully.",
          "success"
        );
        await fetchAndRenderTasks();
      } catch (error) {
        console.error("Deletion error:", error);
        showMessageWithIcon("Error", error.message, "error");
      }
    }
  );
}

function renderUserDropdown(users) {
  const assignedUserInput = document.getElementById("assigned-user");
  assignedUserInput.innerHTML = '<option value="">Unassigned</option>'; // Default option
  users.forEach((user) => {
    const option = document.createElement("option");
    option.value = user.id;
    option.textContent = user.email.split("@")[0]; // Use the part before @ for display
    assignedUserInput.appendChild(option);
  });
}

async function fetchTenantDetails() {
  const tenantNameInput = document.getElementById("tenant-name");
  if (!tenantNameInput) return;

  try {
    const response = await fetch(TENANT_ENDPOINT, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json();
    if (response.ok) {
      tenantNameInput.value = data.name;
    } else {
      showMessageWithIcon("Error", "Failed to load team settings.", "error");
    }
  } catch (error) {
    console.error("Error fetching tenant details:", error);
    showMessageWithIcon(
      "Error",
      "An unexpected error occurred. Please try again.",
      "error"
    );
  }
}
