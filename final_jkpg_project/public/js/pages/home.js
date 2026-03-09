(async function () {
  const listEl = document.querySelector('[data-venue-list]');
  if (!listEl) return;

  try {
    const venues = await API.listVenues({ sort: 'new' });
    const top = venues.slice(0, 6);

    listEl.innerHTML = top
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
        </div>
      </div>
    `
      )
      .join('');
  } catch (err) {
    listEl.innerHTML = `<p class="p">Kunde inte ladda venues just nu. (${escapeHtml(err.message)})</p>`;
  }

  function escapeHtml(str) {
    return String(str)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }
})();
