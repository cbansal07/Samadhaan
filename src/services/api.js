const API_URL = '/api';

const buildUrl = (endpoint) =>
  `${API_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

// Custom Error class to hold the server's response data
class ApiError extends Error {
  constructor(message, data) {
    super(message);
    this.name = 'ApiError';
    this.data = data; // This will hold the full JSON response from the server
  }
}

async function request(endpoint, options = {}) {
  const res = await fetch(buildUrl(endpoint), {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { msg: text || "Non-JSON response from server" };
  }

  if (!res.ok) {
    // The backend uses 'msg' for error details. Use that for the error message.
    const errorMessage = data?.msg || `Request failed with status ${res.status}`;
    throw new ApiError(errorMessage, data);
  }

  return data;
}

export const registerUser = (userData) => {
  console.log("Attempting to register user:", userData);
  return request("/users/register", {
    method: "POST",
    body: JSON.stringify(userData),
  });
};

export const loginUser = (userData) => {
  return request("/users/login", {
    method: "POST",
    body: JSON.stringify(userData),
  });
};

export const getGrievances = (userId) => {
  const endpoint = userId ? `/grievances?userId=${userId}` : "/grievances";
  return request(endpoint);
};

export const createGrievance = (grievanceData, token) => {
  return request("/grievances", {
    method: "POST",
    headers: { "x-auth-token": token },
    body: JSON.stringify(grievanceData),
  });
};

export const deleteGrievance = (id, token) => {
  return request(`/grievances/${id}`, {
    method: "DELETE",
    headers: { "x-auth-token": token },
  });
};

export const updateGrievance = (id, grievanceData, token) => {
  return request(`/grievances/${id}`, {
    method: "PUT",
    headers: { "x-auth-token": token },
    body: JSON.stringify(grievanceData),
  });
};
