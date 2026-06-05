const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function request(path: string, options: RequestInit = {}) {
  const url = `${API_URL}${path}`;
  const token =
    typeof window !== "undefined" ? localStorage.getItem("access_token") : null;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(url, { ...options, headers });
  const data = await res.json();
  if (!res.ok) throw { status: res.status, ...data };
  return data;
}

// ─── Portal API (Company Dashboard) ─────────────────────────────────
export const portalRegister = (body: {
  name: string;
  contact_email: string;
  password: string;
}) => request("/api/portal/register/", { method: "POST", body: JSON.stringify(body) });

export const portalLogin = (body: { email: string; password: string }) =>
  request("/api/portal/login/", { method: "POST", body: JSON.stringify(body) });

export const portalProfile = () => request("/api/portal/profile/");

export const portalUpdateProfile = (body: Record<string, unknown>) =>
  request("/api/portal/profile/", { method: "PATCH", body: JSON.stringify(body) });

export const portalUsage = () => request("/api/portal/usage/");

// ─── Demo API (API-key authenticated) ─────────────────────────────
async function demoRequest(
  path: string,
  clientId: string,
  secretKey: string,
  options: RequestInit = {}
) {
  const url = `${API_URL}${path}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Client-ID": clientId,
    "X-Secret-Key": secretKey,
    ...(options.headers as Record<string, string>),
  };
  const res = await fetch(url, { ...options, headers });
  const data = await res.json();
  if (!res.ok) throw { status: res.status, ...data };
  return data;
}

export const demoGetUserOrders = (
  userId: string,
  clientId: string,
  secretKey: string
) => demoRequest(`/api/v1/users/${encodeURIComponent(userId)}/orders/`, clientId, secretKey);

export const demoGetChatHistory = (
  userId: string,
  clientId: string,
  secretKey: string
) => demoRequest(`/api/v1/chat/history/?user_id=${encodeURIComponent(userId)}`, clientId, secretKey);

// Products (public)
export const searchProducts = (q: string) =>
  request(`/api/catalog/search/?q=${encodeURIComponent(q)}`);

// ─── Merchant API (JWT authenticated) ──────────────────────────────
async function merchantRequest(path: string, options: RequestInit = {}) {
  const url = `${API_URL}${path}`;
  const token =
    typeof window !== "undefined" ? localStorage.getItem("merchant_token") : null;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(url, { ...options, headers });
  const data = await res.json();
  if (!res.ok) throw { status: res.status, ...data };
  return data;
}

export const merchantLogin = (body: { email: string; password: string }) =>
  merchantRequest("/api/merchant/login/", { method: "POST", body: JSON.stringify(body) });

export const getMerchantProfile = () => merchantRequest("/api/merchant/profile/");

export const updateMerchantProfile = (body: Record<string, unknown>) =>
  merchantRequest("/api/merchant/profile/", { method: "PATCH", body: JSON.stringify(body) });

export const getMerchantProducts = (page = 1) =>
  merchantRequest(`/api/catalog/merchant/products/?page=${page}`);

export const getMerchantOrders = () => merchantRequest("/api/orders/merchant/");

export const getMerchantDashboardStats = () => merchantRequest("/api/merchant/dashboard/stats/");

export const getMerchantConnections = () => merchantRequest("/api/merchant/connections/");

export const connectShopify = (body: { shop_domain: string; admin_access_token: string }) =>
  merchantRequest("/api/merchant/shopify/connect/", {
    method: "POST",
    body: JSON.stringify(body),
  });
