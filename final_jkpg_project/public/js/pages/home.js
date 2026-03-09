(async function () {
  const listEl = document.querySelector('[data-venue-list]');
  if (!listEl) return;

  try {
    const venues = await API.listVenues({ sort: 'newest' });
    const top = venues.slice(0, 6);

    if (!top.length) {
      listEl.innerHTML = '<p class="p">Inga venues finns i databasen ännu.</p>';
      return;
    }

    listEl.innerHTML = top
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