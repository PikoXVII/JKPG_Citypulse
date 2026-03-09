(async function () {
  const form = document.querySelector('[data-filters]');
  const listEl = document.querySelector('[data-venues]');
  const resultsInfo = document.querySelector('[data-results-info]');
  const resetBtn = document.querySelector('[data-reset-filters]');
  if (!form || !listEl) return;

  const q = form.querySelector('input[name=q]');
  const category = form.querySelector('select[name=category]');
  const district = form.querySelector('select[name=district]');
  const sort = form.querySelector('select[name=sort]');

  const url = new URL(location.href);
  if (url.searchParams.get('q')) q.value = url.searchParams.get('q');
  if (url.searchParams.get('category')) category.value = url.searchParams.get('category');
  if (url.searchParams.get('district')) district.value = url.searchParams.get('district');
  if (url.searchParams.get('sort')) sort.value = url.searchParams.get('sort');

  try {
    const meta = await API.listVenueMeta();
    fillSelect(category, 'Alla kategorier', meta.categories || [], url.searchParams.get('category'));
    fillSelect(district, 'Alla stadsdelar', meta.districts || [], url.searchParams.get('district'));
  } catch (err) {
    console.error('Kunde inte ladda filter-data:', err);
  }

  async function load() {
    listEl.innerHTML = '<p class="p">Laddar venues…</p>';

    try {
      const params = {
        q: q.value.trim(),
        category: category.value,
        district: district.value,
        sort: sort.value
      };

      updateUrl(params);
      const venues = await API.listVenues(params);

      if (resultsInfo) {
        resultsInfo.textContent = `${venues.length} venue${venues.length === 1 ? '' : 's'} hittades.`;
      }

      if (venues.length === 0) {
        listEl.innerHTML = '<p class="p">Inga träffar. Prova andra filter.</p>';
        return;
      }

      listEl.innerHTML = venues
        .map(
          (v) => `
          <div class="venueRow">
            <div class="venueMetaStack">
              <h3>${escapeHtml(v.name)}</h3>

              <div class="venueTags">
                <span class="tag">${escapeHtml(v.category)}</span>
                <span class="tag">${escapeHtml(v.district)}</span>
              </div>

              <p class="venueText">
                ${escapeHtml(v.name)} är en venue i ${escapeHtml(v.district)}.
                Kategori: ${escapeHtml(v.category)}.
              </p>

              ${
                v.website
                  ? `<a class="venueWebsite" href="${escapeAttr(v.website)}" target="_blank" rel="noreferrer">Webbplats →</a>`
                  : ''
              }
            </div>
          </div>
        `
        )
        .join('');

    } catch (err) {
      listEl.innerHTML = `<p class="p">Kunde inte ladda venues (${escapeHtml(err.message)})</p>`;
    }
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    load();
  });

  [category, district, sort].forEach((el) => el.addEventListener('change', load));
  q.addEventListener('input', debounce(load, 300));

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      form.reset();
      load();
    });
  }

  load();

  function fillSelect(select, placeholder, values, selectedValue) {
    select.innerHTML = [
      `<option value="">${escapeHtml(placeholder)}</option>`,
      ...values.map((value) => `<option value="${escapeAttr(value)}">${escapeHtml(value)}</option>`)
    ].join('');

    if (selectedValue && values.includes(selectedValue)) {
      select.value = selectedValue;
    }
  }

  function updateUrl(params) {
    const next = new URL(location.href);

    Object.entries(params).forEach(([key, value]) => {
      if (value) next.searchParams.set(key, value);
      else next.searchParams.delete(key);
    });

    history.replaceState({}, '', `${next.pathname}?${next.searchParams.toString()}`.replace(/\?$/, ''));
  }

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
    return String(str)
      .replaceAll('&', '&amp;')
      .replaceAll('"', '&quot;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;');
  }

})();