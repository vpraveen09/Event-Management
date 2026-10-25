const BASE_URL = "/api";

async function request(path, { method = "GET", body, token } = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 204) return null;

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(data?.error || `Request failed with status ${res.status}`);
  }
  return data;
}

export const api = {
  register: (payload) => request("/auth/register", { method: "POST", body: payload }),
  login: (payload) => request("/auth/login", { method: "POST", body: payload }),

  listClients: (token) => request("/clients", { token }),
  createClient: (payload, token) => request("/clients", { method: "POST", body: payload, token }),
  updateClient: (id, payload, token) => request(`/clients/${id}`, { method: "PUT", body: payload, token }),
  deleteClient: (id, token) => request(`/clients/${id}`, { method: "DELETE", token }),

  listEvents: (token) => request("/events", { token }),
  createEvent: (payload, token) => request("/events", { method: "POST", body: payload, token }),
  updateEvent: (id, payload, token) => request(`/events/${id}`, { method: "PUT", body: payload, token }),
  deleteEvent: (id, token) => request(`/events/${id}`, { method: "DELETE", token }),
  listStatusChanges: (token) => request("/events/status-changes", { token }),
  listEventDecorationImages: (eventId, token) => request(`/events/${eventId}/decoration-images`, { token }),
  addEventDecorationImage: (eventId, sceneryImageId, token) =>
    request(`/events/${eventId}/decoration-images`, { method: "POST", body: { scenery_image_id: sceneryImageId }, token }),
  removeEventDecorationImage: (eventId, sceneryImageId, token) =>
    request(`/events/${eventId}/decoration-images/${sceneryImageId}`, { method: "DELETE", token }),

  listVendors: (token) => request("/vendors", { token }),
  createVendor: (payload, token) => request("/vendors", { method: "POST", body: payload, token }),
  updateVendor: (id, payload, token) => request(`/vendors/${id}`, { method: "PUT", body: payload, token }),
  deleteVendor: (id, token) => request(`/vendors/${id}`, { method: "DELETE", token }),

  getSettings: (token) => request("/settings", { token }),
  updateSettings: (payload, token) => request("/settings", { method: "PUT", body: payload, token }),

  listUsers: (token) => request("/users", { token }),
  createUser: (payload, token) => request("/users", { method: "POST", body: payload, token }),
  updateUserRole: (id, role, token) => request(`/users/${id}`, { method: "PATCH", body: { role }, token }),
  deleteUser: (id, token) => request(`/users/${id}`, { method: "DELETE", token }),
  resetUserPassword: (id, password, token) =>
    request(`/users/${id}/reset-password`, { method: "POST", body: { password }, token }),
  changePassword: (payload, token) => request("/auth/change-password", { method: "POST", body: payload, token }),

  listTasks: (eventId, token) => request(`/tasks?event_id=${eventId}`, { token }),
  createTask: (payload, token) => request("/tasks", { method: "POST", body: payload, token }),
  updateTask: (id, payload, token) => request(`/tasks/${id}`, { method: "PATCH", body: payload, token }),
  deleteTask: (id, token) => request(`/tasks/${id}`, { method: "DELETE", token }),

  listSessions: (eventId, token) => request(`/sessions?event_id=${eventId}`, { token }),
  createSession: (payload, token) => request("/sessions", { method: "POST", body: payload, token }),
  updateSession: (id, payload, token) => request(`/sessions/${id}`, { method: "PATCH", body: payload, token }),
  deleteSession: (id, token) => request(`/sessions/${id}`, { method: "DELETE", token }),

  listAttachments: (entityType, entityId, token) =>
    request(`/attachments?entity_type=${entityType}&entity_id=${entityId}`, { token }),
  createAttachment: (payload, token) => request("/attachments", { method: "POST", body: payload, token }),
  deleteAttachment: (id, token) => request(`/attachments/${id}`, { method: "DELETE", token }),
  downloadAttachment: (id, token) => request(`/attachments/${id}/download`, { token }),

  listScenery: (token) => request("/scenery", { token }),
  createScenery: (payload, token) => request("/scenery", { method: "POST", body: payload, token }),
  deleteScenery: (id, token) => request(`/scenery/${id}`, { method: "DELETE", token }),
};
