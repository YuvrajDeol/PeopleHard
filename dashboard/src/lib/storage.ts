import { Course } from "./cgpa";

/**
 * Safely accesses localStorage in Next.js (SSR safe).
 */
export function getLocalStorageItem<T>(key: string, defaultValue: T): T {
  if (typeof window === "undefined") {
    return defaultValue;
  }
  try {
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error reading localStorage key "${key}":`, error);
    return defaultValue;
  }
}

export function setLocalStorageItem<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error writing localStorage key "${key}":`, error);
  }
}

export function removeLocalStorageItem(key: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(key);
  } catch (error) {
    console.error(`Error removing localStorage key "${key}":`, error);
  }
}

// Keys
export const STORAGE_KEYS = {
  COURSES: "peoplehardCourses",
  CREDITS: "peoplehardCredits",
  SETTINGS: "peoplehardSettings",
};

// Strongly typed helpers
export function getStoredCourses(): Record<string, Course> {
  return getLocalStorageItem<Record<string, Course>>(STORAGE_KEYS.COURSES, {});
}

export function setStoredCourses(courses: Record<string, Course>): void {
  setLocalStorageItem(STORAGE_KEYS.COURSES, courses);
}

export function getStoredCredits(): Record<string, number> {
  return getLocalStorageItem<Record<string, number>>(STORAGE_KEYS.CREDITS, {});
}

export function setStoredCredits(credits: Record<string, number>): void {
  setLocalStorageItem(STORAGE_KEYS.CREDITS, credits);
}

export function resetAllStoredData(): void {
  removeLocalStorageItem(STORAGE_KEYS.COURSES);
  removeLocalStorageItem(STORAGE_KEYS.CREDITS);
  removeLocalStorageItem(STORAGE_KEYS.SETTINGS);
}
