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
export const getResearchData = async () => {
  // The API returns total_records, so we can fetch them all in one go
  // by setting a large enough limit. This avoids pagination issues.
  const response = await fetch("https://api-research-team-1094890588015.us-central1.run.app/?limit=10000");
  if (!response.ok) {
    throw new Error("Failed to fetch research data");
  }
  // The response already contains the `data` array, so we can return it directly.
  return response.json();
};