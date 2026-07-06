// layout.js — injects the shared header/footer and keeps the cart badge live.
function renderHeader(activePage) {
  const user = auth.getUser();
  const accountHref = user ? "account.html" : "login.html";
  const accountLabel = user ? user.name.split(" ")[0] : "Account";

  const nav = [
    ["index.html", "Home"],
    ["shop.html", "Shop"],
    ["farmers.html", "Our Farmers"],
    ["wholesale.html", "Wholesale"],
    ["about.html", "Our Story"]
  ];

  const navHtml = nav
    .map(([href, label]) => `<a href="${href}" class="${activePage === href ? "active" : ""}">${label}</a>`)
    .join("");

  document.getElementById("site-header").innerHTML = `
    <div class="header-inner">
      <a href="index.html" class="logo"><span class="logo-mark">F&F</span> Farm &amp; Family</a>
      <nav class="main-nav">${navHtml}</nav>
      <div class="header-actions">
        <a href="${accountHref}" class="icon-btn" title="Account">👤</a>
        <a href="cart.html" class="icon-btn" title="Cart">🛍️<span class="cart-count" id="cart-count">0</span></a>
      </div>
    </div>
  `;
  refreshCartBadge();
}

function renderFooter() {
  document.getElementById("site-footer").innerHTML = `
    <div class="container footer-grid">
      <div>
        <div class="logo" style="color:var(--turmeric-light); margin-bottom:12px;"><span class="logo-mark">F&F</span> Farm &amp; Family</div>
        <p>Real village farms, direct to your table — with the harvest date, the farmer's name, and the full journey behind every product.</p>
      </div>
      <div>
        <h4>Shop</h4>
        <a href="shop.html">All Products</a>
        <a href="shop.html?fresh=true">Farm Fresh Today</a>
        <a href="farmers.html">Meet Our Farmers</a>
        <a href="wholesale.html">Wholesale Portal</a>
      </div>
      <div>
        <h4>Company</h4>
        <a href="about.html">Our Story</a>
        <a href="about.html#trust">Traceability</a>
        <a href="wholesale.html">Partner With Us</a>
      </div>
      <div>
        <h4>Support</h4>
        <a href="account.html">Track an Order</a>
        <a href="mailto:hello@farmandfamily.in">hello@farmandfamily.in</a>
        <a href="tel:+911234567890">+91 12345 67890</a>
      </div>
    </div>
    <div class="container footer-bottom">
      <span>© ${new Date().getFullYear()} Farm &amp; Family. Grown with care across India.</span>
      <span>Made for farmers, families, and everyone in between.</span>
    </div>
  `;
}

async function refreshCartBadge() {
  const el = document.getElementById("cart-count");
  if (!el) return;
  try {
    const { items } = await api.getCart(auth.cartOwnerId());
    const count = items.reduce((sum, i) => sum + i.quantity, 0);
    el.textContent = count;
    el.style.display = count > 0 ? "flex" : "none";
  } catch (e) {
    el.style.display = "none";
  }
}

function money(n) {
  return "₹" + Number(n).toLocaleString("en-IN");
}

function timeAgoLabel(dateStr) {
  const days = Math.round((Date.now() - new Date(dateStr).getTime()) / 86400000);
  if (days <= 0) return "Harvested today";
  if (days === 1) return "Harvested yesterday";
  return `Harvested ${days} days ago`;
}
