function initLoader() {
  const loader = document.getElementById('page-loader');
  if (!loader) return;

  const label = loader.dataset.loaderText;
  const text = loader.querySelector('p');
  if (label && text) text.textContent = label;

  const hideLoader = () => loader.classList.add('loaded');
  if (document.readyState === 'complete') {
    window.setTimeout(hideLoader, 450);
  } else {
    window.addEventListener('load', () => window.setTimeout(hideLoader, 450), { once: true });
  }
}
