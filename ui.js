(() => {
  const doc = document;
  const body = doc.body;
  if (!body) return;

  const main = doc.querySelector('main');
  if (main) {
    if (!main.id) main.id = 'main-content';
    main.setAttribute('tabindex', '-1');

    const skip = doc.createElement('a');
    skip.className = 'ui-skip-link';
    skip.href = '#' + main.id;
    skip.textContent = '本文へ移動';
    body.prepend(skip);
  }

  const active = [...doc.querySelectorAll('header nav a')].find((link) => {
    const href = link.getAttribute('href');
    return href && location.pathname.endsWith(href);
  });
  if (active) active.setAttribute('aria-current', 'page');

  const progress = doc.createElement('div');
  progress.className = 'ui-scroll-progress';
  progress.setAttribute('aria-hidden', 'true');
  body.appendChild(progress);

  const topButton = doc.createElement('button');
  topButton.className = 'ui-back-to-top';
  topButton.type = 'button';
  topButton.setAttribute('aria-label', 'ページ上部へ戻る');
  topButton.textContent = '↑';
  body.appendChild(topButton);

  const update = () => {
    const scrollTop = window.scrollY || doc.documentElement.scrollTop;
    const max = Math.max(1, doc.documentElement.scrollHeight - window.innerHeight);
    progress.style.width = Math.min(100, Math.max(0, (scrollTop / max) * 100)) + '%';
    topButton.classList.toggle('is-visible', scrollTop > Math.max(420, window.innerHeight * .7));
  };

  topButton.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  });

  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  update();
})();
