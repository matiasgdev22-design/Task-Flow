
const STORAGE_KEY = "taskflow-data";

export function saveData(data) {
  try {
    const serializedData = JSON.stringify(data);

    localStorage.setItem(STORAGE_KEY, serializedData);

    return true;
  } catch (error) {
    console.error("Error al guardar los datos:", error);

    return false;
  }
}

export function loadData() {
  try {
    const savedData = localStorage.getItem(STORAGE_KEY);

    if (!savedData) {
      return null;
    }

    return JSON.parse(savedData);
  } catch (error) {
    console.error("Error al recuperar los datos:", error);

    return null;
  }
}

export function clearData() {
  localStorage.removeItem(STORAGE_KEY);
}
