
import {
  createTask,
  updateTask,
  toggleTaskCompletion,
} from "./task.js";

import {
  createProject,
  addTaskToProject,
  removeTaskFromProject,
} from "./project.js";

import { saveData, loadData } from "./storage.js";
import { renderApp } from "./dom.js";

let state = {
  projects: [],
  currentView: "all",
  selectedProjectId: null,
  searchTerm: "",
  sortBy: "date",
};

function saveState() {
  saveData({
    projects: state.projects,
  });
}

function refreshApp() {
  renderApp(state);
}

function findTask(taskId) {
  for (const project of state.projects) {
    const task = project.tasks.find(
      (item) => item.id === taskId
    );

    if (task) {
      return { task, project };
    }
  }

  return null;
}

function openTaskDialog(task = null) {
  const dialog = document.querySelector("#task-dialog");
  const form = document.querySelector("#task-form");

  form.reset();

  form.elements.namedItem("taskId").value = task?.id || "";
  form.elements.namedItem("title").value = task?.title || "";

  form.elements.namedItem("description").value =
    task?.description || "";

  form.elements.namedItem("dueDate").value =
    task?.dueDate || "";

  form.elements.namedItem("priority").value =
    task?.priority || "medium";

  const projectSelect = form.elements.namedItem("projectId");

  projectSelect.value =
    task?.projectId ||
    state.selectedProjectId ||
    state.projects[0].id;

  document.querySelector("#task-dialog-title").textContent =
    task ? "Editar tarea" : "Nueva tarea";

  dialog.showModal();
}

function handleTaskSubmit(form) {
  const formData = new FormData(form);

  const taskId = formData.get("taskId");
  const projectId = formData.get("projectId");

  const taskData = {
    title: formData.get("title"),
    description: formData.get("description"),
    dueDate: formData.get("dueDate"),
    priority: formData.get("priority"),
  };

  const targetProject = state.projects.find(
    (project) => project.id === projectId
  );

  if (!targetProject) {
    throw new Error("No se encontró el proyecto seleccionado.");
  }

  if (taskId) {
    const result = findTask(taskId);

    if (!result) {
      throw new Error("No se encontró la tarea.");
    }

    const updatedTask = updateTask(result.task, taskData);

    if (result.project.id === projectId) {
      state.projects = state.projects.map((project) =>
        project.id === projectId
          ? {
              ...project,
              tasks: project.tasks.map((task) =>
                task.id === taskId ? updatedTask : task
              ),
            }
          : project
      );
    } else {
      state.projects = state.projects.map((project) =>
        project.id === result.project.id
          ? removeTaskFromProject(project, taskId)
          : project
      );

      state.projects = state.projects.map((project) =>
        project.id === projectId
          ? addTaskToProject(project, updatedTask)
          : project
      );
    }
  } else {
    const newTask = createTask(taskData);

    state.projects = state.projects.map((project) =>
      project.id === projectId
        ? addTaskToProject(project, newTask)
        : project
    );
  }

  saveState();

  document.querySelector("#task-dialog").close();

  refreshApp();
}

function handleProjectSubmit(form) {
  const formData = new FormData(form);

  const projectName = formData.get("name").trim();

  const duplicate = state.projects.some(
    (project) =>
      project.name.toLowerCase() === projectName.toLowerCase()
  );

  if (duplicate) {
    throw new Error("Ya existe un proyecto con ese nombre.");
  }

  const project = createProject(
    projectName,
    formData.get("description")
  );

  state.projects = [...state.projects, project];

  state.currentView = "project";
  state.selectedProjectId = project.id;

  saveState();

  document.querySelector("#project-dialog").close();

  refreshApp();
}

function handleProjectDelete(projectId) {
  const project = state.projects.find(
    (item) => item.id === projectId
  );

  if (!project) return;

  if (project.name === "Inbox") {
    alert("No podés eliminar el proyecto principal Inbox.");
    return;
  }

  const confirmed = window.confirm(
    `¿Eliminar "${project.name}"? Sus tareas se trasladarán a Inbox.`
  );

  if (!confirmed) return;

  const inbox = state.projects.find(
    (item) => item.name === "Inbox"
  );

  if (!inbox) {
    alert("No se encontró el proyecto Inbox.");
    return;
  }

  const remainingProjects = state.projects
    .filter((item) => item.id !== projectId)
    .map((item) =>
      item.id === inbox.id
        ? {
            ...item,
            tasks: [
              ...item.tasks,
              ...project.tasks.filter(
                (task) =>
                  !item.tasks.some(
                    (existing) => existing.id === task.id
                  )
              ),
            ],
          }
        : item
    );

  state.projects = remainingProjects;

  if (state.selectedProjectId === projectId) {
    state.currentView = "all";
    state.selectedProjectId = null;
  }

  saveState();
  refreshApp();
}

function handleClick(event) {
  const button = event.target.closest("[data-action]");

  if (!button) return;

  const action = button.dataset.action;

  switch (action) {
    case "new-task":
      openTaskDialog();
      break;

    case "new-project":
      document.querySelector("#project-form").reset();
      document.querySelector("#project-dialog").showModal();
      break;

    case "close-dialog":
      button.closest("dialog").close();
      break;

    case "select-view":
      state.currentView = button.dataset.view;
      state.selectedProjectId = null;
      refreshApp();
      break;

    case "select-project":
      state.currentView = "project";
      state.selectedProjectId = button.dataset.projectId;
      refreshApp();
      break;

    case "edit-task": {
      const result = findTask(button.dataset.taskId);

      if (result) {
        openTaskDialog({
          ...result.task,
          projectId: result.project.id,
        });
      }

      break;
    }

    case "delete-task": {
      const taskId = button.dataset.taskId;

      if (!window.confirm("¿Querés eliminar esta tarea?")) {
        break;
      }

      state.projects = state.projects.map((project) =>
        removeTaskFromProject(project, taskId)
      );

      saveState();
      refreshApp();
      break;
    }

    case "delete-project":
      handleProjectDelete(button.dataset.projectId);
      break;
  }
}

function handleChange(event) {
  if (event.target.dataset.action === "toggle-task") {
    const result = findTask(event.target.dataset.taskId);

    if (!result) return;

    const updatedTask = toggleTaskCompletion(result.task);

    state.projects = state.projects.map((project) =>
      project.id === result.project.id
        ? {
            ...project,
            tasks: project.tasks.map((task) =>
              task.id === updatedTask.id ? updatedTask : task
            ),
          }
        : project
    );

    saveState();
    refreshApp();
    return;
  }

  if (event.target.id === "task-sort") {
    state.sortBy = event.target.value;
    refreshApp();
  }
}

function handleInput(event) {
  if (event.target.id !== "task-search") return;

  state.searchTerm = event.target.value;

  const cursorPosition = event.target.selectionStart;

  refreshApp();

  const searchInput = document.querySelector("#task-search");

  searchInput.focus();
  searchInput.setSelectionRange(cursorPosition, cursorPosition);
}

function handleSubmit(event) {
  if (
    event.target.id !== "task-form" &&
    event.target.id !== "project-form"
  ) {
    return;
  }

  event.preventDefault();

  try {
    if (event.target.id === "task-form") {
      handleTaskSubmit(event.target);
    }

    if (event.target.id === "project-form") {
      handleProjectSubmit(event.target);
    }
  } catch (error) {
    alert(error.message);
  }
}

export function initializeApp() {
  const app = document.querySelector("#app");

  if (!app) {
    throw new Error("No se encontró el contenedor principal.");
  }

  const savedData = loadData();

  if (savedData && Array.isArray(savedData.projects)) {
    state.projects = savedData.projects;
  }

  if (state.projects.length === 0) {
    const inbox = createProject(
      "Inbox",
      "Tus tareas generales"
    );

    state.projects = [inbox];
    saveState();
  }

  state.currentView = "all";
  state.selectedProjectId = null;

  app.addEventListener("click", handleClick);
  app.addEventListener("change", handleChange);
  app.addEventListener("input", handleInput);
  app.addEventListener("submit", handleSubmit);

  refreshApp();
}



