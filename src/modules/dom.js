

import { format, parseISO, isValid } from "date-fns";

function escapeHTML(value = "") {
  return String(value).replace(/[&<>"']/g, (character) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };

    return entities[character];
  });
}

function getAllTasks(projects) {
  return projects.flatMap((project) =>
    project.tasks.map((task) => ({
      ...task,
      projectId: project.id,
      projectName: project.name,
    }))
  );
}

function getLocalDate() {
  return format(new Date(), "yyyy-MM-dd");
}

function formatTaskDate(date) {
  if (!date) return "Sin fecha";

  const parsedDate = parseISO(date);

  if (!isValid(parsedDate)) return date;

  return format(parsedDate, "dd/MM/yyyy");
}

function getViewTasks(projects, currentView, selectedProjectId) {
  const allTasks = getAllTasks(projects);
  const today = getLocalDate();

  if (currentView === "project") {
    return allTasks.filter(
      (task) => task.projectId === selectedProjectId
    );
  }

  if (currentView === "today") {
    return allTasks.filter(
      (task) => task.dueDate === today && !task.completed
    );
  }

  if (currentView === "upcoming") {
    return allTasks.filter(
      (task) => task.dueDate > today && !task.completed
    );
  }

  if (currentView === "completed") {
    return allTasks.filter((task) => task.completed);
  }

  return allTasks.filter((task) => !task.completed);
}

function sortTasks(tasks, sortBy) {
  const priorityOrder = {
    high: 1,
    medium: 2,
    low: 3,
  };

  const sortedTasks = [...tasks];

  if (sortBy === "date") {
    sortedTasks.sort((a, b) => {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;

      return a.dueDate.localeCompare(b.dueDate);
    });
  }

  if (sortBy === "priority") {
    sortedTasks.sort(
      (a, b) =>
        priorityOrder[a.priority] - priorityOrder[b.priority]
    );
  }

  if (sortBy === "newest") {
    sortedTasks.sort(
      (a, b) =>
        new Date(b.createdAt) - new Date(a.createdAt)
    );
  }

  return sortedTasks;
}

function renderTask(task) {
  const priorityLabels = {
    low: "Baja",
    medium: "Media",
    high: "Alta",
  };

  return `
    <article class="task-card ${task.completed ? "completed" : ""}">
      <label class="task-checkbox">
        <input
          type="checkbox"
          data-action="toggle-task"
          data-task-id="${escapeHTML(task.id)}"
          ${task.completed ? "checked" : ""}
        >
        <span></span>
      </label>

      <div class="task-info">
        <h3>${escapeHTML(task.title)}</h3>

        ${
          task.description
            ? `<p>${escapeHTML(task.description)}</p>`
            : ""
        }

        <div class="task-meta">
          <span class="priority priority-${escapeHTML(task.priority)}">
            ${priorityLabels[task.priority]}
          </span>

          <span class="task-date">
            ${formatTaskDate(task.dueDate)}
          </span>

          <span class="task-project">
            ${escapeHTML(task.projectName)}
          </span>
        </div>
      </div>

      <div class="task-actions">
        <button
          type="button"
          data-action="edit-task"
          data-task-id="${escapeHTML(task.id)}"
        >Editar</button>

        <button
          type="button"
          data-action="delete-task"
          data-task-id="${escapeHTML(task.id)}"
        >Eliminar</button>
      </div>
    </article>
  `;
}

export function renderApp({
  projects,
  currentView,
  selectedProjectId,
  searchTerm = "",
  sortBy = "date",
}) {
  const allTasks = getAllTasks(projects);

  let visibleTasks = getViewTasks(
    projects,
    currentView,
    selectedProjectId
  );

  const normalizedSearch = searchTerm.trim().toLowerCase();

  if (normalizedSearch) {
    visibleTasks = visibleTasks.filter((task) =>
      `${task.title} ${task.description} ${task.projectName}`
        .toLowerCase()
        .includes(normalizedSearch)
    );
  }

  visibleTasks = sortTasks(visibleTasks, sortBy);

  const selectedProject = projects.find(
    (project) => project.id === selectedProjectId
  );

  const viewTitles = {
    all: "Todas las tareas",
    today: "Tareas de hoy",
    upcoming: "Próximas tareas",
    completed: "Tareas completadas",
    project: selectedProject?.name || "Proyecto",
  };

  const completedCount = allTasks.filter(
    (task) => task.completed
  ).length;

  const title = viewTitles[currentView] || "TaskFlow";

  const projectOptions = projects
    .map(
      (project) => `
        <option value="${escapeHTML(project.id)}">
          ${escapeHTML(project.name)}
        </option>
      `
    )
    .join("");

  const projectButtons = projects
    .map(
      (project) => `
        <div class="project-item">
          <button
            class="project-link ${
              selectedProjectId === project.id ? "active" : ""
            }"
            data-action="select-project"
            data-project-id="${escapeHTML(project.id)}"
          >
            <span class="project-dot"></span>
            <span>${escapeHTML(project.name)}</span>
            <span class="project-count">${project.tasks.length}</span>
          </button>

          ${
            project.name !== "Inbox"
              ? `
                <button
                  class="delete-project-button"
                  data-action="delete-project"
                  data-project-id="${escapeHTML(project.id)}"
                  aria-label="Eliminar proyecto ${escapeHTML(project.name)}"
                  title="Eliminar proyecto"
                >×</button>
              `
              : ""
          }
        </div>
      `
    )
    .join("");

  const taskContent = visibleTasks.length
    ? visibleTasks.map(renderTask).join("")
    : `
      <div class="empty-state">
        <div class="empty-icon">✓</div>
        <h3>No hay tareas por aquí</h3>
        <p>Agregá una nueva tarea para comenzar.</p>
      </div>
    `;

  document.querySelector("#app").innerHTML = `
    <div class="app-layout">

      <aside class="sidebar">
        <div class="brand">
          <div class="brand-icon">T</div>
          <span>TaskFlow</span>
        </div>

        <div class="sidebar-section">
          <p class="sidebar-label">GENERAL</p>

          <button
            class="nav-link ${currentView === "all" ? "active" : ""}"
            data-action="select-view"
            data-view="all"
          >▦ Todas las tareas</button>

          <button
            class="nav-link ${currentView === "today" ? "active" : ""}"
            data-action="select-view"
            data-view="today"
          >◷ Hoy</button>

          <button
            class="nav-link ${currentView === "upcoming" ? "active" : ""}"
            data-action="select-view"
            data-view="upcoming"
          >▣ Próximas</button>

          <button
            class="nav-link ${currentView === "completed" ? "active" : ""}"
            data-action="select-view"
            data-view="completed"
          >✓ Completadas</button>
        </div>

        <div class="sidebar-section">
          <div class="section-heading">
            <p class="sidebar-label">MIS PROYECTOS</p>

            <button
              class="add-project-button"
              data-action="new-project"
              aria-label="Crear proyecto"
            >+</button>
          </div>

          <div class="project-list">
            ${projectButtons}
          </div>
        </div>

        <div class="sidebar-footer">
          <p>Organizá tu día.</p>
          <span>TaskFlow · Productivity</span>
        </div>
      </aside>

      <main class="main-content">
        <header class="topbar">
          <div>
            <p class="welcome-text">TU ESPACIO DE PRODUCTIVIDAD</p>
            <h1>${escapeHTML(title)}</h1>
          </div>

          <button
            class="primary-button"
            data-action="new-task"
          >+ Nueva tarea</button>
        </header>

        <section class="stats-grid">
          <article class="stat-card">
            <span>Total de tareas</span>
            <strong>${allTasks.length}</strong>
          </article>

          <article class="stat-card">
            <span>Completadas</span>
            <strong>${completedCount}</strong>
          </article>

          <article class="stat-card">
            <span>Pendientes</span>
            <strong>${allTasks.length - completedCount}</strong>
          </article>
        </section>

        <section class="tasks-section">
          <div class="tasks-toolbar">
            <input
              type="search"
              id="task-search"
              placeholder="Buscar tareas..."
              value="${escapeHTML(searchTerm)}"
              aria-label="Buscar tareas"
            >

            <select id="task-sort" aria-label="Ordenar tareas">
              <option value="date" ${sortBy === "date" ? "selected" : ""}>
                Ordenar por fecha
              </option>

              <option value="priority" ${sortBy === "priority" ? "selected" : ""}>
                Ordenar por prioridad
              </option>

              <option value="newest" ${sortBy === "newest" ? "selected" : ""}>
                Más recientes
              </option>
            </select>
          </div>

          <div class="tasks-heading">
            <div>
              <h2>${escapeHTML(title)}</h2>
              <p>${visibleTasks.length} tareas encontradas</p>
            </div>
          </div>

          <div class="task-list">
            ${taskContent}
          </div>
        </section>
      </main>
    </div>

    <dialog id="task-dialog" class="app-dialog">
      <form id="task-form">
        <div class="dialog-heading">
          <h2 id="task-dialog-title">Nueva tarea</h2>
          <button type="button" data-action="close-dialog">×</button>
        </div>

        <input type="hidden" name="taskId">

        <label>
          Título
          <input
            type="text"
            name="title"
            placeholder="¿Qué necesitás hacer?"
            required
            maxlength="100"
          >
        </label>

        <label>
          Descripción
          <textarea
            name="description"
            placeholder="Agregá algunos detalles..."
            rows="3"
            maxlength="500"
          ></textarea>
        </label>

        <label>
          Proyecto
          <select name="projectId" required>
            ${projectOptions}
          </select>
        </label>

        <label>
          Fecha de vencimiento
          <input type="date" name="dueDate">
        </label>

        <label>
          Prioridad
          <select name="priority">
            <option value="low">Baja</option>
            <option value="medium" selected>Media</option>
            <option value="high">Alta</option>
          </select>
        </label>

        <div class="dialog-actions">
          <button type="button" data-action="close-dialog">
            Cancelar
          </button>

          <button type="submit" class="primary-button">
            Guardar tarea
          </button>
        </div>
      </form>
    </dialog>

    <dialog id="project-dialog" class="app-dialog">
      <form id="project-form">
        <div class="dialog-heading">
          <h2>Nuevo proyecto</h2>
          <button type="button" data-action="close-dialog">×</button>
        </div>

        <label>
          Nombre del proyecto
          <input
            type="text"
            name="name"
            placeholder="Ej: Estudios"
            required
            maxlength="50"
          >
        </label>

        <label>
          Descripción
          <textarea
            name="description"
            placeholder="¿De qué trata este proyecto?"
            rows="3"
            maxlength="300"
          ></textarea>
        </label>

        <div class="dialog-actions">
          <button type="button" data-action="close-dialog">
            Cancelar
          </button>

          <button type="submit" class="primary-button">
            Crear proyecto
          </button>
        </div>
      </form>
    </dialog>
  `;
}
