(async function () {
  const loginForm = document.querySelector('[data-login-form]');
  const adminArea = document.querySelector('[data-admin]');
  const msg = document.querySelector('[data-msg]');
  const logoutBtn = document.querySelector('[data-logout]');

  const venueForm = document.querySelector('[data-venue-form]');
  const venueList = document.querySelector('[data-admin-venues]');

  const eventForm = document.querySelector('[data-event-form]');

  function setMessage(text) {
    if (!msg) return;
    msg.textContent = text || '';
  }

  function showAdmin(show) {
    if (loginForm) loginForm.style.display = show ? 'none' : 'block';
    if (adminArea) adminArea.style.display = show ? 'block' : 'none';
  }

  showAdmin(Boolean(API.token));

  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      API.token = null;
      setMessage('Du är utloggad.');
      showAdmin(false);
    });
  }

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      setMessage('');

      const email = loginForm.querySelector('input[name=email]').value.trim();
      const password = loginForm.querySelector('input[name=password]').value;

      try {
        const res = await API.login(email, password);
        API.token = res.token;
        showAdmin(true);
        setMessage('Inloggad!');
        await refreshVenues();
      } catch (err) {
        setMessage(err.message);
      }
    });
  }

  async function refreshVenues() {
    if (!venueList) return;
    venueList.innerHTML = '<p class="p">Laddar…</p>';
    try {
      const venues = await API.listVenues({ sort: 'name' });
      venueList.innerHTML = venues
        .map(
          (v) => `
        <div class="panel" style="margin-top:12px">
          <div style="display:flex; justify-content:space-between; gap:10px; align-items:flex-start">
            <div>
              <div style="font-weight:900">${escapeHtml(v.name)}</div>
              <div class="small">${escapeHtml(v.category)} • ${escapeHtml(v.district)} • #${v.id}</div>
            </div>
            <div class="btnRow" style="margin-top:0">
              <button class="btn alt" data-edit="${v.id}">Redigera</button>
              <button class="btn" data-delete="${v.id}">Ta bort</button>
            </div>
          </div>
        </div>
      `
        )
        .join('');

      venueList.querySelectorAll('[data-delete]').forEach((btn) => {
        btn.addEventListener('click', async () => {
          const id = btn.getAttribute('data-delete');
          if (!confirm('Ta bort venue?')) return;
          try {
            await API.deleteVenue(id);
            await refreshVenues();
          } catch (err) {
            setMessage(err.message);
          }
        });
      });

      venueList.querySelectorAll('[data-edit]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const id = Number(btn.getAttribute('data-edit'));
          const v = venues.find((x) => x.id === id);
          if (!v) return;
          fillVenueForm(v);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        });
      });
    } catch (err) {
      venueList.innerHTML = `<p class="p">Fel: ${escapeHtml(err.message)}</p>`;
    }
  }

  function fillVenueForm(v) {
    venueForm.querySelector('input[name=id]').value = v.id;
    venueForm.querySelector('input[name=name]').value = v.name || '';
    venueForm.querySelector('select[name=category]').value = v.category || '';
    venueForm.querySelector('select[name=district]').value = v.district || '';
    venueForm.querySelector('input[name=address]').value = v.address || '';
    venueForm.querySelector('input[name=phone]').value = v.phone || '';
    venueForm.querySelector('input[name=website]').value = v.website || '';
    venueForm.querySelector('input[name=image_url]').value = v.image_url || '';
    venueForm.querySelector('textarea[name=description]').value = v.description || '';
  }

  function clearVenueForm() {
    venueForm.reset();
    venueForm.querySelector('input[name=id]').value = '';
  }

  if (venueForm) {
    venueForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      setMessage('');

      const payload = {
        name: venueForm.querySelector('input[name=name]').value.trim(),
        category: venueForm.querySelector('select[name=category]').value,
        district: venueForm.querySelector('select[name=district]').value,
        address: venueForm.querySelector('input[name=address]').value.trim(),
        phone: venueForm.querySelector('input[name=phone]').value.trim(),
        website: venueForm.querySelector('input[name=website]').value.trim(),
        image_url: venueForm.querySelector('input[name=image_url]').value.trim(),
        description: venueForm.querySelector('textarea[name=description]').value.trim(),
      };

      const id = venueForm.querySelector('input[name=id]').value;

      try {
        if (id) await API.updateVenue(id, payload);
        else await API.createVenue(payload);
        clearVenueForm();
        await refreshVenues();
        setMessage('Sparat!');
      } catch (err) {
        setMessage(err.message);
      }
    });

    const clearBtn = venueForm.querySelector('[data-clear]');
    if (clearBtn) clearBtn.addEventListener('click', (e) => { e.preventDefault(); clearVenueForm(); });
  }

  if (eventForm) {
    eventForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      setMessage('');

      const payload = {
        title: eventForm.querySelector('input[name=title]').value.trim(),
        start_date: eventForm.querySelector('input[name=start_date]').value,
        end_date: eventForm.querySelector('input[name=end_date]').value || null,
        district: eventForm.querySelector('input[name=district]').value.trim(),
        image_url: eventForm.querySelector('input[name=image_url]').value.trim(),
        description: eventForm.querySelector('textarea[name=description]').value.trim(),
      };

      try {
        await API.createEvent(payload);
        eventForm.reset();
        setMessage('Event skapat!');
      } catch (err) {
        setMessage(err.message);
      }
    });
  }

  if (API.token) {
    await refreshVenues();
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
