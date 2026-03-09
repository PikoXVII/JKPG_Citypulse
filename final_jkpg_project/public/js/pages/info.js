(function () {
  const items = document.querySelectorAll('[data-accordion-item]');
  items.forEach((item) => {
    const btn = item.querySelector('button');
    const body = item.querySelector('[data-body]');
    if (!btn || !body) return;

    btn.addEventListener('click', () => {
      const open = body.style.display === 'block';
      items.forEach((i) => {
        const b = i.querySelector('[data-body]');
        if (b) b.style.display = 'none';
      });
      body.style.display = open ? 'none' : 'block';
    });
  });
})();
