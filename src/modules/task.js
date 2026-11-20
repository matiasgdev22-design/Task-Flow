
import { format, isValid, parseISO } from "date-fns";

const VALID_PRIORITIES = ["low", "medium", "high"];

export function createTask({
  title,
  description = "",
  dueDate = "",
  priority = "medium",
  completed = false,
} = {}) {
  if (typeof title !== "string" || !title.trim()) {
    throw new Error("La tarea necesita un título.");
  }

  if (!VALID_PRIORITIES.includes(priority)) {
    throw new Error("La prioridad seleccionada no es válida.");
  }

  if (typeof dueDate !== "string") {
    throw new Error("La fecha debe ser un texto válido.");
  }

  if (dueDate) {
    const parsedDate = parseISO(dueDate);

    if (!isValid(parsedDate) || format(parsedDate, "yyyy-MM-dd") !== dueDate) {
      throw new Error("La fecha de vencimiento no es válida.");
    }
  }

  return {
    id: crypto.randomUUID(),
    title: title.trim(),
    description: description.trim(),
    dueDate,
    priority,
    completed,
    createdAt: new Date().toISOString(),
  };
}

export function updateTask(task, updates) {
  const updatedTask = {
    ...task,
    ...updates,
    id: task.id,
    createdAt: task.createdAt,
  };

  if (typeof updatedTask.title !== "string" || !updatedTask.title.trim()) {
    throw new Error("El título no puede estar vacío.");
  }

  if (!VALID_PRIORITIES.includes(updatedTask.priority)) {
    throw new Error("La prioridad seleccionada no es válida.");
  }

  if (typeof updatedTask.dueDate !== "string") {
    throw new Error("La fecha debe ser un texto válido.");
  }

  if (updatedTask.dueDate) {
    const parsedDate = parseISO(updatedTask.dueDate);

    if (!isValid(parsedDate) || format(parsedDate, "yyyy-MM-dd") !== updatedTask.dueDate) {
      throw new Error("La fecha de vencimiento no es válida.");
    }
  }

  return {
    ...updatedTask,
    title: updatedTask.title.trim(),
    description: updatedTask.description.trim(),
  };
}

export function toggleTaskCompletion(task) {
  return {
    ...task,
    completed: !task.completed,
  };
}
