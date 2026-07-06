// auth.js — very small session helper backed by localStorage + JWT from the API
const auth = {
  getToken: () => localStorage.getItem("ff_token"),
  getUser: () => {
    const raw = localStorage.getItem("ff_user");
    return raw ? JSON.parse(raw) : null;
  },
  isLoggedIn: () => !!localStorage.getItem("ff_token"),
  setSession: (token, user) => {
    localStorage.setItem("ff_token", token);
    localStorage.setItem("ff_user", JSON.stringify(user));
  },
  clearSession: () => {
    localStorage.removeItem("ff_token");
    localStorage.removeItem("ff_user");
  },
  // The cart is keyed by user id when logged in, or a persistent guest id otherwise.
  cartOwnerId: () => {
    const user = auth.getUser();
    if (user) return user.id;
    let guestId = localStorage.getItem("ff_guest_id");
    if (!guestId) {
      guestId = "guest-" + Math.random().toString(36).slice(2, 12);
      localStorage.setItem("ff_guest_id", guestId);
    }
    return guestId;
  }
};
