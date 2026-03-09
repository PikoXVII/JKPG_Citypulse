(function () {
  const nav = document.querySelector('.nav');
  const btn = document.querySelector('[data-hamburger]');
  const panel = document.querySelector('[data-mobile-panel]');

  function onScroll() {
    if (!nav) return;
    nav.classList.toggle('is-solid', window.scrollY > 20);
  }
  window.addEventListener('scroll', onScroll);
  onScroll();

  if (btn && panel) {
    btn.addEventListener('click', () => {
      const open = panel.style.display === 'block';
      panel.style.display = open ? 'none' : 'block';
    });

    panel.querySelectorAll('a').forEach((a) => {
      a.addEventListener('click', () => (panel.style.display = 'none'));
    });
  }

  const year = document.querySelector('[data-year]');
  if (year) year.textContent = new Date().getFullYear();
})();
