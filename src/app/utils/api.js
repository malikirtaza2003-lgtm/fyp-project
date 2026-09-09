import { getAuthToken } from "./auth";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "/api";
const SOCKET_URL = import.meta.env.VITE_API_BASE_URL?.replace("/api", "") ?? (typeof window !== "undefined" ? window.location.origin : "http://localhost:5001");

const CACHE_KEYS = {
  users: "wf_cache_users",
  tasks: "wf_cache_tasks",
  projects: "wf_cache_projects",
  attendance: "wf_cache_attendance",
  leaves: "wf_cache_leaves",
  departments: "wf_cache_departments",
  meetings: "wf_cache_meetings",
};

function readCache(key, fallback = []) {
  if (typeof window === "undefined") {
    return fallback;
  }

  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeCache(key, value) {
  if (typeof window === "undefined") {
    return value;
  }

  localStorage.setItem(key, JSON.stringify(value));
  return value;
}

async function request(path, { method = "GET", body, auth = true, headers = {} } = {}) {
  const requestHeaders = {
    ...headers,
  };

  if (!(body instanceof FormData)) {
    requestHeaders["Content-Type"] = "application/json";
  }

  if (auth) {
    const token = getAuthToken();
    // Use the stored token, or a demo fallback if we're in a demo/dev state
    const activeToken = token || "demo-token";
    requestHeaders.Authorization = `Bearer ${activeToken}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers: requestHeaders,
    body: body instanceof FormData ? body : body !== undefined ? JSON.stringify(body) : undefined,
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem("wf_auth_token");
      localStorage.removeItem("wf_auth_user");
    }
    throw new Error(payload?.message ?? `Request failed (${response.status})`);
  }

  return payload;
}

export function getCachedUsers(fallback = []) {
  return readCache(CACHE_KEYS.users, fallback);
}

export function getCachedTasks(fallback = []) {
  return readCache(CACHE_KEYS.tasks, fallback);
}

export function getCachedProjects(fallback = []) {
  return readCache(CACHE_KEYS.projects, fallback);
}

export function getCachedAttendance(fallback = []) {
  return readCache(CACHE_KEYS.attendance, fallback);
}

export function getCachedLeaves(fallback = []) {
  return readCache(CACHE_KEYS.leaves, fallback);
}

export function getCachedDepartments(fallback = []) {
  return readCache(CACHE_KEYS.departments, fallback);
}

export function getCachedMeetings(fallback = []) {
  return readCache(CACHE_KEYS.meetings, fallback);
}

export function clearResourceCache() {
  if (typeof window === "undefined") {
    return;
  }

  Object.values(CACHE_KEYS).forEach((key) => localStorage.removeItem(key));
}

export async function login(payload) {
  return request("/auth/login", { method: "POST", auth: false, body: payload });
}

export async function register(payload) {
  return request("/auth/register", { method: "POST", auth: false, body: payload });
}

export async function fetchCurrentUser() {
  return request("/auth/me");
}

export async function updateMe(payload) {
  return request("/users/me", { method: "PATCH", body: payload });
}

export async function fetchUsers() {
  const payload = await request("/users");
  const users = payload?.users || [];
  writeCache(CACHE_KEYS.users, users);
  return users;
}

export async function createUser(payload) {
  const response = await request("/users", { method: "POST", body: payload });
  await fetchUsers();
  return response.user;
}

export async function updateUser(id, payload) {
  const response = await request(`/users/${id}`, { method: "PATCH", body: payload });
  await fetchUsers();
  return response.user;
}

export async function deleteUser(id) {
  const response = await request(`/users/${id}`, { method: "DELETE" });
  await fetchUsers();
  return response;
}

export async function fetchTasks() {
  const payload = await request("/tasks");
  const tasks = payload?.tasks || [];
  writeCache(CACHE_KEYS.tasks, tasks);
  return tasks;
}

export async function createTask(payload) {
  const response = await request("/tasks", { method: "POST", body: payload });
  await fetchTasks();
  return response.task;
}

export async function updateTask(id, payload) {
  const response = await request(`/tasks/${id}`, { method: "PUT", body: payload });
  await fetchTasks();
  return response.task;
}

export async function deleteTask(id) {
  const response = await request(`/tasks/${id}`, { method: "DELETE" });
  await fetchTasks();
  return response;
}

export async function fetchProjects() {
  const payload = await request("/projects");
  const projects = payload?.projects || [];
  writeCache(CACHE_KEYS.projects, projects);
  return projects;
}

export async function createProject(payload) {
  const response = await request("/projects", { method: "POST", body: payload });
  await fetchProjects();
  return response.project;
}

export async function updateProject(id, payload) {
  const response = await request(`/projects/${id}`, { method: "PUT", body: payload });
  await fetchProjects();
  return response.project;
}

export async function deleteProject(id) {
  const response = await request(`/projects/${id}`, { method: "DELETE" });
  await fetchProjects();
  return response;
}

export async function fetchAttendance() {
  const payload = await request("/attendance");
  const attendance = payload?.attendance || [];
  writeCache(CACHE_KEYS.attendance, attendance);
  return attendance;
}

export async function saveAttendance(payload) {
  const response = await request("/attendance", { method: "POST", body: payload });
  await fetchAttendance();
  return response.attendance;
}

export async function updateAttendance(id, payload) {
  const response = await request(`/attendance/${id}`, { method: "PUT", body: payload });
  await fetchAttendance();
  return response.attendance;
}

export async function deleteAttendance(id) {
  const response = await request(`/attendance/${id}`, { method: "DELETE" });
  await fetchAttendance();
  return response;
}

export async function checkIn() {
  const response = await request("/attendance/check-in", { method: "POST" });
  await fetchAttendance();
  return response.attendance;
}

export async function startBreak() {
  const response = await request("/attendance/break", { method: "POST" });
  await fetchAttendance();
  return response.attendance;
}

export async function resumeFromBreak() {
  const response = await request("/attendance/resume", { method: "POST" });
  await fetchAttendance();
  return response.attendance;
}

export async function checkOut() {
  const response = await request("/attendance/check-out", { method: "POST" });
  await fetchAttendance();
  return response.attendance;
}

export async function fetchLeaves() {
  const payload = await request("/leaves");
  const leaves = payload?.leaves || [];
  writeCache(CACHE_KEYS.leaves, leaves);
  return leaves;
}

export async function createLeave(payload) {
  const response = await request("/leaves", { method: "POST", body: payload });
  await fetchLeaves();
  return response.leave;
}

export async function updateLeave(id, payload) {
  const response = await request(`/leaves/${id}`, { method: "PUT", body: payload });
  await fetchLeaves();
  return response.leave;
}

export async function deleteLeave(id) {
  const response = await request(`/leaves/${id}`, { method: "DELETE" });
  await fetchLeaves();
  return response;
}

export async function approveLeave(id) {
  const response = await request(`/leaves/${id}/approve`, { method: "PATCH" });
  await fetchLeaves();
  return response.leave;
}

export async function rejectLeave(id) {
  const response = await request(`/leaves/${id}/reject`, { method: "PATCH" });
  await fetchLeaves();
  return response.leave;
}

export async function fetchDepartments() {
  const payload = await request("/departments");
  writeCache(CACHE_KEYS.departments, payload.departments ?? []);
  return payload.departments ?? [];
}

export async function createDepartment(payload) {
  const response = await request("/departments", { method: "POST", body: payload });
  await fetchDepartments();
  return response.department;
}

export async function updateDepartment(id, payload) {
  const response = await request(`/departments/${id}`, { method: "PUT", body: payload });
  await fetchDepartments();
  return response.department;
}

export async function deleteDepartment(id) {
  const response = await request(`/departments/${id}`, { method: "DELETE" });
  await fetchDepartments();
  return response;
}

export async function fetchMeetings() {
  const payload = await request("/meetings");
  writeCache(CACHE_KEYS.meetings, payload.meetings ?? []);
  return payload.meetings ?? [];
}

export async function createMeeting(payload) {
  const response = await request("/meetings", { method: "POST", body: payload });
  await fetchMeetings();
  return response.meeting;
}

export async function updateMeeting(id, payload) {
  const response = await request(`/meetings/${id}`, { method: "PUT", body: payload });
  await fetchMeetings();
  return response.meeting;
}

export async function fetchSettings() {
  const payload = await request("/settings");
  return payload.settings ?? payload;
}

export async function updateSettings(settings) {
  const payload = await request("/settings", { method: "PUT", body: { settings } });
  return payload.settings ?? payload;
}

export async function fetchAnnouncements() {
  return request("/announcements");
}

export async function fetchNotifications() {
  return request("/notifications");
}

export async function createNotification(payload) {
  return request("/notifications", { method: "POST", body: payload });
}

export async function markNotificationsAsRead() {
  return request("/notifications/read-all", { method: "PATCH" });
}

export async function createAnnouncement(payload) {
  return request("/announcements", { method: "POST", body: payload });
}

export async function markAnnouncementAsViewed(id) {
  return request(`/announcements/${id}/view`, { method: "PATCH" });
}
export async function fetchChatMessages(chatId) {
  const payload = await request(`/chat/${chatId}`);
  return payload.messages ?? [];
}

export async function sendChatMessage(chatId, payload) {
  const response = await request(`/chat/${chatId}`, { method: "POST", body: payload });
  return response.chatMessage;
}

export async function updateChatReaction(messageId, emoji) {
  const response = await request(`/chat/react/${messageId}`, { method: "POST", body: { emoji } });
  return response.chatMessage;
}

export { request, writeCache };
