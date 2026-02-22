(function () {
  const yrEl = document.getElementById("yr");
  if (yrEl) yrEl.textContent = String(new Date().getFullYear());

  const qEl = document.getElementById("q");
  const btnEl = document.getElementById("qBtn");
  const outEl = document.getElementById("results");
  const countEl = document.getElementById("resultCount");

  if (!qEl || !btnEl || !outEl) return;

  const data = Array.isArray(window.PP_IDX) ? window.PP_IDX : [];

  const norm = (s) =>
    String(s || "")
      .toLowerCase()
      .replace(/[^a-z0-9\-\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

  const score = (row, q) => {
    const qt = norm(q);
    if (!qt) return 0;

    const t = norm(row.t);
    const d = norm(row.d);
    const ks = Array.isArray(row.k) ? row.k.map(norm).join(" ") : "";

    let n = 0;

    if (t.includes(qt)) n += 8;
    if (ks.includes(qt)) n += 5;
    if (d.includes(qt)) n += 3;

    const parts = qt.split(" ");
    for (let i = 0; i < parts.length; i += 1) {
      const p = parts[i];
      if (!p) continue;
      if (t.includes(p)) n += 2;
      if (ks.includes(p)) n += 1;
      if (d.includes(p)) n += 1;
    }

    return n;
  };

  const render = (rows, q) => {
    const qt = norm(q);
    if (!qt) {
      outEl.innerHTML = "";
      if (countEl) countEl.textContent = "";
      return;
    }

    const ranked = rows
      .map((r) => ({ r, s: score(r, qt) }))
      .filter((x) => x.s > 0)
      .sort((a, b) => b.s - a.s)
      .slice(0, 20);

    if (countEl) countEl.textContent = ranked.length ? `${ranked.length} results` : "No results";

    if (!ranked.length) {
      outEl.innerHTML =
        '<div class="result"><div class="title">No match</div><div class="desc">Try a model number, brand name, or port type.</div></div>';
      return;
    }

    outEl.innerHTML = ranked
      .map((x) => {
        const r = x.r;
        const badges = (Array.isArray(r.k) ? r.k.slice(0, 6) : [])
          .map((b) => `<span class="badge">${String(b)}</span>`)
          .join("");
        return `
          <a class="result" href="${r.u}">
            <div class="title">${r.t}</div>
            <div class="desc">${r.d || ""}</div>
            <div class="badges">${badges}</div>
          </a>
        `;
      })
      .join("");
  };

  const run = () => render(data, qEl.value);

  btnEl.addEventListener("click", run);
  qEl.addEventListener("keydown", (e) => {
    if (e.key === "Enter") run();
  });
  qEl.addEventListener("input", () => {
    const v = norm(qEl.value);
    if (!v) {
      outEl.innerHTML = "";
      if (countEl) countEl.textContent = "";
    }
  });
})();
