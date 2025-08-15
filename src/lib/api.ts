const API_URL = import.meta.env.VITE_API_URL;

const authFetch = async (url: string, options: RequestInit = {}) => {
  const token = localStorage.getItem("token");
  const headers = {
    ...options.headers,
    Authorization: `Bearer ${token}`,
  };
  const response = await fetch(url, { ...options, headers });
  if (!response.ok) {
    throw new Error("Request failed");
  }
  return response.json();
};

export const uploadFile = async (formData: FormData) => {
  const response = await fetch(`${API_URL}/upload`, {
    method: "POST",
    body: formData,
  });
  if (!response.ok) {
    throw new Error("API upload failed");
  }
  return response.json();
};

export const getFiles = async (status: "pending" | "approved" | "rejected") => {
  const response = await fetch(`${API_URL}/files?status_folder=${status}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${status} files`);
  }
  return response.json();
};

export const approveFile = async (objectName: string) => {
  return authFetch(`${API_URL}/approve?object_name=${objectName}&approver=jason`, {
    method: "POST",
  });
};

export const rejectFile = async (objectName: string, feedback: string) => {
  return authFetch(`${API_URL}/reject?object_name=${objectName}&rejector=jason&feedback=${encodeURIComponent(feedback)}`, {
    method: "POST",
  });
};