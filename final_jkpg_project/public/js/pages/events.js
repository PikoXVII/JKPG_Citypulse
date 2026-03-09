(async function () {
  const grid = document.querySelector('[data-events]');
  if (!grid) return;

  try {
    const events = await API.listEvents();

    grid.innerHTML = events
      .map((e) => {
        const start = formatDate(e.start_date);
        const end = e.end_date ? formatDate(e.end_date) : null;
        const dateLine = end ? `${start} – ${end}` : start;
        const day = (e.start_date || '').slice(8, 10);

        return `
          <div class="card">
            <div class="cardTop" style="height:240px; position:relative;">
              <img src="${e.image_url || '/assets/event-1.svg'}" alt="" style="width:100%;height:100%;object-fit:cover;">
              <div style="position:absolute; left:14px; bottom:14px; background:var(--black); color:var(--white); padding:10px 12px; font-weight:900; line-height:1">
                <div style="font-size:28px">${escapeHtml(day)}</div>
                <div style="font-size:10px; opacity:.9; text-transform:uppercase; letter-spacing:.06em">start</div>
              </div>
            </div>
            <div class="cardBody">
              <h3 style="margin:0; font-weight:900">${escapeHtml(e.title)}</h3>
              <p class="small" style="margin:8px 0 0">${escapeHtml(dateLine)}${e.district ? ' • ' + escapeHtml(e.district) : ''}</p>
              <p style="margin:10px 0 16px; line-height:1.6">${escapeHtml(e.description || '')}</p>
            </div>
            <div class="cardBar"><span>Mer</span><span>→</span></div>
          </div>
        `;
      })
      .join('');
  } catch (err) {
    grid.innerHTML = `<p class="p">Kunde inte ladda event. (${escapeHtml(err.message)})</p>`;
  }

  function formatDate(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleDateString('sv-SE', { day: '2-digit', month: 'short', year: 'numeric' });
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
