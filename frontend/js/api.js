// api.js — thin fetch wrapper for the Farm & Family backend.
// Same origin in production (backend serves the frontend); override via
// window.API_BASE if you ever split them onto different hosts.
const API_BASE = window.API_BASE || "/api";

async function apiRequest(path, { method = "GET", body, auth = false } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (auth) {
    const token = localStorage.getItem("ff_token");
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });
  let data = null;
  try { data = await res.json(); } catch (e) { /* no body */ }
  if (!res.ok) {
    const message = (data && data.error) || `Request failed (${res.status})`;
    throw new Error(message);
  }
  return data;
}

const api = {
  // products
  getProducts: (params = {}) => apiRequest(`/products?${new URLSearchParams(params)}`),
  getFarmFreshToday: () => apiRequest(`/products/farm-fresh-today`),
  getProduct: (id) => apiRequest(`/products/${id}`),
  getTrace: (id) => apiRequest(`/products/${id}/trace`),
  postReview: (id, payload) => apiRequest(`/products/${id}/reviews`, { method: "POST", body: payload, auth: true }),

  // categories
  getCategories: () => apiRequest(`/categories`),

  // farmers
  getFarmers: () => apiRequest(`/farmers`),
  getFarmer: (id) => apiRequest(`/farmers/${id}`),
  getFarmerDashboard: (id) => apiRequest(`/farmers/${id}/dashboard`, { auth: true }),

  // auth
  register: (payload) => apiRequest(`/auth/register`, { method: "POST", body: payload }),
  login: (payload) => apiRequest(`/auth/login`, { method: "POST", body: payload }),
  me: () => apiRequest(`/auth/me`, { auth: true }),

  // cart
  getCart: (ownerId) => apiRequest(`/cart/${ownerId}`),
  addToCart: (ownerId, productId, quantity = 1) => apiRequest(`/cart/${ownerId}`, { method: "POST", body: { productId, quantity } }),
  updateCartItem: (ownerId, productId, quantity) => apiRequest(`/cart/${ownerId}/${productId}`, { method: "PUT", body: { quantity } }),
  removeCartItem: (ownerId, productId) => apiRequest(`/cart/${ownerId}/${productId}`, { method: "DELETE" }),

  // orders
  placeOrder: (payload) => apiRequest(`/orders`, { method: "POST", body: payload, auth: true }),
  myOrders: () => apiRequest(`/orders/mine`, { auth: true }),
  getOrder: (id) => apiRequest(`/orders/${id}`, { auth: true }),

  // wholesale
  getWholesalePricing: (productId) => apiRequest(`/wholesale/pricing/${productId}`),
  submitWholesaleInquiry: (payload) => apiRequest(`/wholesale/inquiry`, { method: "POST", body: payload }),

  // ai
  aiSearch: (query) => apiRequest(`/ai/search`, { method: "POST", body: { query } }),
  nutritionAssistant: (query, dietaryPreferences = []) => apiRequest(`/ai/nutrition-assistant`, { method: "POST", body: { query, dietaryPreferences } }),
  getRecommendations: (userId) => apiRequest(`/ai/recommendations/${userId}`),

  // newsletter
  subscribe: (email, interests = []) => apiRequest(`/newsletter/subscribe`, { method: "POST", body: { email, interests } })
};
