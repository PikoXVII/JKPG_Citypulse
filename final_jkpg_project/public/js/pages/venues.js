(async function () {
  const form = document.querySelector('[data-filters]');
  const listEl = document.querySelector('[data-venues]');
  if (!form || !listEl) return;

  const q = form.querySelector('input[name=q]');
  const category = form.querySelector('select[name=category]');
  const district = form.querySelector('select[name=district]');
  const sort = form.querySelector('select[name=sort]');

  // support links like /venues.html?category=Äta
  const url = new URL(location.href);
  if (url.searchParams.get('category')) category.value = url.searchParams.get('category');
  if (url.searchParams.get('district')) district.value = url.searchParams.get('district');

  async function load() {
    listEl.innerHTML = '<p class="p">Laddar…</p>';
    try {
      const venues = await API.listVenues({
        q: q.value.trim() || undefined,
        category: category.value || undefined,
        district: district.value || undefined,
        sort: sort.value || undefined,
      });

      if (venues.length === 0) {
        listEl.innerHTML = '<p class="p">Inga träffar. Prova andra filter.</p>';
        return;
      }

      listEl.innerHTML = venues
        .map(
          (v) => `
          <div class="venueRow">
            <div class="venueImg"><img alt="" src="${v.image_url || '/assets/venue-placeholder.svg'}"></div>
            <div class="venueMeta">
              <h3>${escapeHtml(v.name)}</h3>
              <div class="venueTags">
                <span class="tag">${escapeHtml(v.category)}</span>
                <span class="tag">${escapeHtml(v.district)}</span>
              </div>
              <p>${escapeHtml(v.description || '')}</p>
              <p class="small">${escapeHtml(v.address || '')}${v.phone ? ' • ' + escapeHtml(v.phone) : ''}</p>
              ${v.website ? `<p class="small"><a href="${escapeAttr(v.website)}" target="_blank" rel="noreferrer">Webbplats →</a></p>` : ''}
            </div>
          </div>
        `
        )
        .join('');
    } catch (err) {
      listEl.innerHTML = `<p class="p">Kunde inte ladda venues. (${escapeHtml(err.message)})</p>`;
    }
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    load();
  });
  [q, category, district, sort].forEach((el) => el.addEventListener('change', load));
  q.addEventListener('input', debounce(load, 350));

  load();

  function debounce(fn, ms) {
    let t;
    return function () {
      clearTimeout(t);
      t = setTimeout(fn, ms);
    };
  }

  function escapeHtml(str) {
    return String(str)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }
  function escapeAttr(str) {
    return String(str).replaceAll('"', '%22');
  }
})();
