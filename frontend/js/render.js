// render.js — shared card templates so shop/home/farmer pages stay consistent
function productCardHtml(p) {
  const icon = (p.category && p.category.slug && CATEGORY_ICONS[p.category.slug]) || "🌾";
  return `
    <a class="card product-card" href="product.html?id=${p.id}">
      <div class="card-media">
        ${p.farmFreshToday ? `<span class="badge fresh">Farm Fresh Today</span>` : `<span class="badge">${timeAgoLabel(p.harvestedOn)}</span>`}
        <span style="font-size:2.6rem">${icon}</span>
      </div>
      <div class="card-body">
        <span class="cat">${p.category ? p.category.name : ""}</span>
        <h3>${p.name}</h3>
        <p class="desc">${p.shortDescription}</p>
        <div class="card-foot">
          <span class="price">${money(p.price)} <span class="unit">/ ${p.unit}</span></span>
          <button class="btn btn-primary btn-sm" onclick="event.preventDefault(); quickAdd('${p.id}', this)">Add</button>
        </div>
      </div>
    </a>
  `;
}

const CATEGORY_ICONS = {
  fruits: "🍓", vegetables: "🥬", grains: "🌾", spices: "🌿",
  "oils-honey": "🍯", preserves: "🫙", sweets: "🍬", garden: "🌱", gifts: "🎁"
};

function farmerCardHtml(f) {
  const initials = f.name.split(" ").map((n) => n[0]).join("").slice(0, 2);
  return `
    <a class="card farmer-card" href="farmer.html?id=${f.id}">
      <div class="top">
        <div class="avatar">${initials}</div>
        <div>
          <h3 style="margin:0">${f.name}</h3>
          <div class="loc">${f.village}, ${f.state}</div>
        </div>
      </div>
      <p class="story">${f.story.slice(0, 110)}${f.story.length > 110 ? "…" : ""}</p>
      <div class="chip-row">
        ${f.specialties.map((s) => `<span class="chip">${s}</span>`).join("")}
      </div>
      <div style="margin-top:14px; font-family: var(--font-mono); font-size:0.78rem; color: var(--ink-soft);">
        ★ ${f.rating} &nbsp;·&nbsp; ${f.yearsFarming} yrs farming &nbsp;·&nbsp; ${f.totalOrders}+ orders fulfilled
      </div>
    </a>
  `;
}

function categoryCardHtml(c) {
  return `
    <a class="category-card" href="shop.html?category=${c.slug}">
      <div class="glyph">${c.icon}</div>
      <h4>${c.name}</h4>
    </a>
  `;
}

function passportHtml(product, farmer) {
  return `
    <div class="passport">
      <div class="stamp-title">
        <span>Harvest Passport · #${product.id.toUpperCase()}</span>
        <span class="rotated">Verified</span>
      </div>
      <div class="perf"></div>
      <dl>
        <dt>Farmer</dt><dd>${farmer ? farmer.name : "—"}</dd>
        <dt>Village</dt><dd>${farmer ? `${farmer.village}, ${farmer.state}` : "—"}</dd>
        <dt>Harvested</dt><dd>${product.harvestedOn}</dd>
        <dt>Method</dt><dd>${product.cultivationMethod}</dd>
        <dt>Certified</dt><dd>${(product.qualityCertifications || []).join(", ") || "—"}</dd>
      </dl>
    </div>
  `;
}

async function quickAdd(productId, btnEl) {
  const original = btnEl.textContent;
  btnEl.textContent = "…";
  btnEl.disabled = true;
  try {
    await api.addToCart(auth.cartOwnerId(), productId, 1);
    await refreshCartBadge();
    btnEl.textContent = "Added ✓";
    setTimeout(() => { btnEl.textContent = original; btnEl.disabled = false; }, 1200);
  } catch (e) {
    btnEl.textContent = "Error";
    setTimeout(() => { btnEl.textContent = original; btnEl.disabled = false; }, 1200);
  }
}
