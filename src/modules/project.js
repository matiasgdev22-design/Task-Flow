
export function createProject(name, description = "") {
  if (typeof name !== "string" || !name.trim()) {
    throw new Error("El proyecto necesita un nombre.");
  }

  return {
    id: crypto.randomUUID(),
    name: name.trim(),
    description: description.trim(),
    tasks: [],
    createdAt: new Date().toISOString(),
  };
}

export function addTaskToProject(project, task) {
  const taskAlreadyExists = project.tasks.some(
    (existingTask) => existingTask.id === task.id
  );

  if (taskAlreadyExists) {
    return project;
  }

  return {
    ...project,
    tasks: [...project.tasks, task],
  };
}

export function removeTaskFromProject(project, taskId) {
  return {
    ...project,
    tasks: project.tasks.filter(
      (task) => task.id !== taskId
    ),
  };
}

export function renameProject(project, newName) {
  if (typeof newName !== "string" || !newName.trim()) {
    throw new Error("El proyecto necesita un nombre válido.");
  }

  return {
    ...project,
    name: newName.trim(),
  };
}

