let devices = [];
let activeDeviceId = null;

const searchInput = document.getElementById("search-input");
const resultsList = document.getElementById("results-list");
const devicePlaceholder = document.getElementById("device-placeholder");
const deviceDetail = document.getElementById("device-detail");

async function loadDevices() {
  try {
    const res = await fetch("data/devices.json");
    if (!res.ok) {
      throw new Error("Failed to load devices.json");
    }
    devices = await res.json();
    renderResults("");
  } catch (err) {
    console.error(err);
    resultsList.innerHTML = "<li class='result-item'>Could not load device data.</li>";
  }
}

function normalize(text) {
  return text.toLowerCase();
}

function filterDevices(query) {
  const q = normalize(query.trim());
  if (!q) return devices;
  return devices.filter((d) => {
    const haystack = [
      d.name,
      d.brand,
      d.category,
      d.id
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return haystack.includes(q);
  });
}

function renderResults(query) {
  const filtered = filterDevices(query);
  resultsList.innerHTML = "";

  if (!filtered.length) {
    const li = document.createElement("li");
    li.className = "result-item";
    li.textContent = "No devices found. Try a different model or brand.";
    resultsList.appendChild(li);
    return;
  }

  filtered.forEach((device) => {
    const li = document.createElement("li");
    li.className = "result-item";
    li.dataset.id = device.id;

    if (device.id === activeDeviceId) {
      li.classList.add("active");
    }

    const name = document.createElement("div");
    name.className = "result-name";
    name.textContent = device.name;

    const meta = document.createElement("div");
    meta.className = "result-meta";
    meta.textContent = [device.brand, device.category].filter(Boolean).join(" · ");

    li.appendChild(name);
    li.appendChild(meta);
    li.addEventListener("click", () => selectDevice(device.id));
    resultsList.appendChild(li);
  });
}

function selectDevice(id) {
  const device = devices.find((d) => d.id === id);
  if (!device) return;

  activeDeviceId = id;

  // Update active classes on list items
  document
    .querySelectorAll(".result-item")
    .forEach((el) => el.classList.toggle("active", el.dataset.id === id));

  devicePlaceholder.classList.add("hidden");
  deviceDetail.classList.remove("hidden");
  renderDeviceDetail(device);
}

function renderDeviceDetail(device) {
  const portsHtml = device.ports
    .map((port) => {
      const metaParts = [];
      if (port.type) metaParts.push(port.type);
      if (port.position) metaParts.push(port.position);
      if (port.color) metaParts.push(`usually ${port.color}`);
      const metaText = metaParts.join(" · ");

      return `
        <li class="port-item">
          <span class="port-label">${port.label}</span>
          <span class="port-meta">${metaText}</span>
          ${
            port.script
              ? `<div class="quick-script"><strong>Call script:</strong>${port.script}</div>`
              : ""
          }
        </li>
      `;
    })
    .join("");

  const imagesHtml = (device.images || [])
    .map(
      (img) => `
      <figure>
        <img src="${img.file}" alt="${img.label}" loading="lazy" />
        <figcaption class="image-caption">${img.label}</figcaption>
      </figure>
    `
    )
    .join("");

  deviceDetail.innerHTML = `
    <div>
      <div class="device-header">
        <h2>${device.name}</h2>
        <span>${[device.brand, device.category].filter(Boolean).join(" · ")}</span>
        ${device.summary ? `<p class="device-summary">${device.summary}</p>` : ""}
      </div>
      <div class="device-images">
        ${imagesHtml || "<p class='device-summary'>Images for this device are coming soon.</p>"}
      </div>
    </div>
    <aside>
      <div class="ports-card">
        <h3 class="ports-title">Key ports</h3>
        <ul class="port-list">
          ${portsHtml || "<li class='port-item'>No port data available yet.</li>"}
        </ul>
      </div>
    </aside>
  `;
}

// Wire up events
searchInput.addEventListener("input", (e) => {
  renderResults(e.target.value);
});

// Load initial data
loadDevices();
