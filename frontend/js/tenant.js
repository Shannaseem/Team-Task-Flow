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
let currentUser = null;
let tenantId = null;
let draggedTask = null;

const TASKS_ENDPOINT = `${API_URL}/tasks`;
const USERS_ENDPOINT = `${API_URL}/users`;
const TENANT_ENDPOINT = `${API_URL}/tenants/me`;
const USER_ME_ENDPOINT = `${API_URL}/users/me`;

// ------------------ DOM Elements ------------------
// Wrap all DOM-related code in a DOMContentLoaded listener
document.addEventListener("DOMContentLoaded", async () => {
  const userEmailEl = document.getElementById("user-email");
  const tenantNameEl = document.getElementById("tenant-name");
  const logoutButton = document.getElementById("logout-button");
  const taskModalOverlay = document.getElementById("task-modal-overlay");
  const taskModalTitle = document.getElementById("task-modal-title");
  const taskForm = document.getElementById("task-form");
  const taskIdInput = document.getElementById("task-id");
  const taskTitleInput = document.getElementById("task-title");
  const taskDescInput = document.getElementById("task-description");
  const assignedUserSelect = document.getElementById("assigned-user");
  const myTasksLink = document.getElementById("my-tasks-link");
  const allTasksLink = document.getElementById("all-tasks-link");

  // Initial data fetch
  try {
    await fetchCurrentUser();
    await fetchTenant();
    await fetchUsers();
    await fetchAndRenderTasks();
  } catch (error) {
    console.error("Initialization error:", error);
    showMessageWithIcon(
      "Error",
      "Failed to initialize the tenant page. Please check your network and try again.",
      "error"
    );
  }

  // Event Listeners
  if (logoutButton) {
    logoutButton.addEventListener("click", () => {
      showConfirm("Logout", "Are you sure you want to log out?", logout);
    });
  }
  if (document.getElementById("create-task-btn")) {
    document
      .getElementById("create-task-btn")
      .addEventListener("click", openCreateTaskModal);
  }
  if (taskForm) {
    taskForm.addEventListener("submit", handleTaskFormSubmit);
  }
  if (myTasksLink) {
    myTasksLink.addEventListener("click", () => {
      myTasksLink.classList.add("active");
      if (allTasksLink) {
        allTasksLink.classList.remove("active");
      }
      fetchAndRenderTasks(true);
    });
  }
  if (allTasksLink) {
    allTasksLink.addEventListener("click", () => {
      allTasksLink.classList.add("active");
      if (myTasksLink) {
        myTasksLink.classList.remove("active");
      }
      fetchAndRenderTasks(false);
    });
  }

  // Drag and drop events for status columns
  document.querySelectorAll(".task-column").forEach((column) => {
    if (column) {
      column.addEventListener("dragover", handleDragOver);
      column.addEventListener("drop", handleDrop);
    }
  });
});

// ------------------ Functions ------------------
async function fetchCurrentUser() {
  try {
    const response = await fetch(USER_ME_ENDPOINT, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    if (!response.ok) {
      throw new Error("User fetch failed");
    }
    const user = await response.json();
    currentUser = user;
    tenantId = user.tenant_id;
    const userEmailEl = document.getElementById("user-email");
    if (userEmailEl) {
      userEmailEl.textContent = user.email;
    }
  } catch (error) {
    console.error("Error fetching current user:", error);
    logout();
  }
}

async function fetchTenant() {
  try {
    const response = await fetch(TENANT_ENDPOINT, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    if (!response.ok) {
      throw new Error("Tenant fetch failed");
    }
    const tenant = await response.json();
    const tenantNameEl = document.getElementById("tenant-name");
    if (tenantNameEl) {
      tenantNameEl.textContent = tenant.name;
    }
  } catch (error) {
    console.error("Error fetching tenant details:", error);
    showMessageWithIcon("Error", "Failed to load tenant details.", "error");
  }
}

async function fetchUsers() {
  try {
    const response = await fetch(`${USERS_ENDPOINT}/members`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    if (!response.ok) {
      throw new Error("Users fetch failed");
    }
    const data = await response.json();
    allUsers = data.members;
    renderAssignedUsers();
  } catch (error) {
    console.error("Error fetching users:", error);
    showMessageWithIcon("Error", "Failed to load team members.", "error");
  }
}

function renderAssignedUsers() {
  const assignedUserSelect = document.getElementById("assigned-user");
  if (assignedUserSelect) {
    assignedUserSelect.innerHTML =
      `<option value="">Unassigned</option>` +
      allUsers
        .map((user) => `<option value="${user.id}">${user.email}</option>`)
        .join("");
  }
}

async function fetchAndRenderTasks(isMyTasks = false) {
  const myTasksQuery = isMyTasks ? "?is_my_tasks=true" : "";
  try {
    const token = getToken();
    const response = await fetch(`${TASKS_ENDPOINT}/${myTasksQuery}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      throw new Error("Failed to fetch tasks.");
    }
    currentTasks = await response.json();
    renderTasks(currentTasks);
  } catch (error) {
    console.error("Error fetching tasks:", error);
    showMessageWithIcon("Error", "Failed to load tasks.", "error");
  }
}

function renderTasks(tasks) {
  const todoColumn = document.getElementById("todo-column");
  const inProgressColumn = document.getElementById("in-progress-column");
  const doneColumn = document.getElementById("done-column");

  // Clear existing tasks
  [todoColumn, inProgressColumn, doneColumn].forEach((col) => {
    if (col) {
      col.innerHTML = "";
    }
  });

  tasks.forEach((task) => {
    const taskCard = createTaskCard(task);
    if (task.status === "todo" && todoColumn) {
      todoColumn.appendChild(taskCard);
    } else if (task.status === "in_progress" && inProgressColumn) {
      inProgressColumn.appendChild(taskCard);
    } else if (task.status === "done" && doneColumn) {
      doneColumn.appendChild(taskCard);
    }
  });
}

function createTaskCard(task) {
  const card = document.createElement("div");
  card.className = "task-card";
  card.draggable = true;
  card.dataset.taskId = task.id;
  card.dataset.status = task.status;

  const assignee = allUsers.find((user) => user.id === task.assigned_user_id);
  const assigneeName = assignee ? assignee.email : "Unassigned";

  card.innerHTML = `
    <h3>${task.title}</h3>
    <p>${task.description || "No description"}</p>
    <div class="task-meta">
      <span class="task-priority priority-${task.priority}">Priority: ${
    task.priority || "N/A"
  }</span>
      <span class="task-due-date">Due: ${
        task.due_date ? new Date(task.due_date).toLocaleDateString() : "N/A"
      }</span>
    </div>
    <div class="task-assignee">Assigned to: ${assigneeName}</div>
    <div class="task-actions">
      <button class="edit-task-btn" data-task-id="${task.id}">Edit</button>
      <button class="delete-task-btn" data-task-id="${task.id}">Delete</button>
    </div>
  `;

  // Add drag and drop listeners
  card.addEventListener("dragstart", handleDragStart);
  card.addEventListener("dragend", handleDragEnd);

  // Add event listeners for edit and delete buttons
  card
    .querySelector(".edit-task-btn")
    .addEventListener("click", () =>
      openEditTaskModal({ target: { dataset: { taskId: task.id } } })
    );
  card
    .querySelector(".delete-task-btn")
    .addEventListener("click", () =>
      handleDeleteTask({ target: { dataset: { taskId: task.id } } })
    );

  return card;
}

function handleDragStart(e) {
  draggedTask = e.target;
  e.dataTransfer.effectAllowed = "move";
  e.dataTransfer.setData("text/plain", e.target.dataset.taskId);
  setTimeout(() => e.target.classList.add("dragging"), 0);
}

function handleDragEnd(e) {
  draggedTask.classList.remove("dragging");
  draggedTask = null;
}

function handleDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = "move";
}

async function handleDrop(e) {
  e.preventDefault();
  const taskId = e.dataTransfer.getData("text/plain");
  const newStatus = e.currentTarget.dataset.status;

  if (!taskId || !newStatus) return;

  try {
    const response = await fetch(
      `${TASKS_ENDPOINT}/update_status/${taskId}/${newStatus}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      }
    );
    if (response.ok) {
      // Update local state
      const task = currentTasks.find((t) => t.id == taskId);
      if (task) {
        task.status = newStatus;
        const myTasksLink = document.getElementById("my-tasks-link");
        fetchAndRenderTasks(
          myTasksLink && myTasksLink.classList.contains("active")
        );
      }
      showMessageWithIcon("Success", "Task status updated!", "success");
    } else {
      const errorData = await response.json();
      showMessageWithIcon(
        "Error",
        errorData.detail || "Failed to update task status.",
        "error"
      );
    }
  } catch (error) {
    console.error("Status update error:", error);
    showMessageWithIcon(
      "Error",
      "An unexpected error occurred while updating task status.",
      "error"
    );
  }
}

function openCreateTaskModal() {
  const taskModalTitle = document.getElementById("task-modal-title");
  const taskForm = document.getElementById("task-form");
  const taskIdInput = document.getElementById("task-id");
  const taskModalOverlay = document.getElementById("task-modal-overlay");

  if (taskModalTitle) {
    taskModalTitle.textContent = "Create New Task";
  }
  if (taskForm) {
    taskForm.reset();
  }
  if (taskIdInput) {
    taskIdInput.value = "";
  }
  if (taskModalOverlay) {
    taskModalOverlay.style.display = "flex";
  }
}

function openEditTaskModal(e) {
  const taskId = e.target.dataset.taskId;
  const task = currentTasks.find((t) => t.id == taskId);

  if (task) {
    const taskModalTitle = document.getElementById("task-modal-title");
    const taskIdInput = document.getElementById("task-id");
    const taskTitleInput = document.getElementById("task-title");
    const taskDescInput = document.getElementById("task-description");
    const assignedUserSelect = document.getElementById("assigned-user");
    const taskModalOverlay = document.getElementById("task-modal-overlay");

    if (taskModalTitle) {
      taskModalTitle.textContent = "Edit Task";
    }
    if (taskIdInput) {
      taskIdInput.value = task.id;
    }
    if (taskTitleInput) {
      taskTitleInput.value = task.title;
    }
    if (taskDescInput) {
      taskDescInput.value = task.description || "";
    }
    if (assignedUserSelect) {
      assignedUserSelect.value = task.assigned_user_id || "";
    }
    if (taskModalOverlay) {
      taskModalOverlay.style.display = "flex";
    }
  }
}

async function handleTaskFormSubmit(e) {
  e.preventDefault();
  const taskIdInput = document.getElementById("task-id");
  const taskTitleInput = document.getElementById("task-title");
  const taskDescInput = document.getElementById("task-description");
  const assignedUserSelect = document.getElementById("assigned-user");
  const taskModalOverlay = document.getElementById("task-modal-overlay");

  const taskId = taskIdInput ? taskIdInput.value : "";
  const isEdit = !!taskId;
  const url = isEdit ? `${TASKS_ENDPOINT}/${taskId}` : TASKS_ENDPOINT;
  const method = isEdit ? "PUT" : "POST";

  const body = {
    title: taskTitleInput ? taskTitleInput.value : "",
    description: taskDescInput ? taskDescInput.value : "",
    assigned_user_id: assignedUserSelect
      ? assignedUserSelect.value || null
      : null,
  };

  try {
    const response = await fetch(url, {
      method: method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify(body),
    });

    if (response.ok) {
      if (taskModalOverlay) {
        taskModalOverlay.style.display = "none";
      }
      showMessageWithIcon(
        "Success",
        `Task ${isEdit ? "updated" : "created"} successfully!`,
        "success"
      );
      const myTasksLink = document.getElementById("my-tasks-link");
      fetchAndRenderTasks(
        myTasksLink && myTasksLink.classList.contains("active")
      );
    } else {
      const errorData = await response.json();
      showMessageWithIcon(
        "Error",
        errorData.detail || `Failed to ${isEdit ? "update" : "create"} task.`,
        "error"
      );
    }
  } catch (error) {
    console.error("Task form submission error:", error);
    showMessageWithIcon("Error", "An unexpected error occurred.", "error");
  }
}

async function handleDeleteTask(e) {
  const taskId = e.target.dataset.taskId;
  showConfirm(
    "Delete Task",
    "Are you sure you want to delete this task?",
    async () => {
      try {
        const response = await fetch(`${TASKS_ENDPOINT}/${taskId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${getToken()}` },
        });
        if (response.ok) {
          showMessageWithIcon("Success", "Task deleted!", "success");
          const myTasksLink = document.getElementById("my-tasks-link");
          fetchAndRenderTasks(
            myTasksLink && myTasksLink.classList.contains("active")
          );
        } else {
          const errorData = await response.json();
          showMessageWithIcon(
            "Error",
            errorData.detail || "Failed to delete task.",
            "error"
          );
        }
      } catch (error) {
        console.error("Delete task error:", error);
        showMessageWithIcon("Error", "An unexpected error occurred.", "error");
      }
    }
  );
}
