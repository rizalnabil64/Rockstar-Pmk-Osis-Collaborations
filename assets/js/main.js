async function loadComponent(slot, path) {
  const target = document.querySelector(`[data-component="${slot}"]`);
  if (!target) return;

  try {
    const response = await fetch(path);
    if (!response.ok) throw new Error(`Unable to load ${path}`);
    target.innerHTML = await response.text();
  } catch (error) {
    console.warn(error.message);
    target.innerHTML = `<div class="component-error">Component ${slot} gagal dimuat. Jalankan project melalui Live Server atau local server.</div>`;
  }
}

function runInitializer(name) {
  const initializer = window[name];
  if (typeof initializer === 'function') initializer();
}

async function bootstrapApp() {
  await Promise.all([
    loadComponent('navbar', 'components/navbar.html'),
    loadComponent('collaboration-banner', 'components/collaboration-banner.html'),
    loadComponent('student-benefit-section', 'components/student-benefit-section.html'),
    loadComponent('academy-section', 'components/academy-section.html'),
    loadComponent('scholarship-section', 'components/scholarship-section.html'),
    loadComponent('footer', 'components/footer.html'),
    loadComponent('modals', 'components/modals.html')
  ]);

  runInitializer('initNavbar');
  runInitializer('initLoader');
  runInitializer('initReveal');
  runInitializer('initGameShowcase');
  runInitializer('initCollaboration');
  runInitializer('initAcademy');
  runInitializer('initScholarship');
  runInitializer('initOrderForm');
  runInitializer('initAnimations');
}

document.addEventListener('DOMContentLoaded', bootstrapApp);
