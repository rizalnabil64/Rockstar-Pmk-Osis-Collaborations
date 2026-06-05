function initNavbar() {
  const navbar = document.getElementById('rsNavbar');
  const drawer = document.getElementById('mobileDrawer');
  const openBtn = document.getElementById('mobileMenuOpen');
  const closeBtn = document.getElementById('mobileMenuClose');
  const links = document.querySelectorAll('.mobile-link');
  const navLinks = document.querySelectorAll('.nav-link-rs');

  const toggleScrolled = () => {
    if (!navbar) return;
    navbar.classList.toggle('is-scrolled', window.scrollY > 24 || document.body.dataset.page === 'order');
  };

  const syncActiveLink = () => {
    const page = document.body.dataset.page;
    const hash = window.location.hash;

    navLinks.forEach((link) => {
      const href = link.getAttribute('href') || '';
      const isOrder = page === 'order' && href.includes('pemesanan.html');
      const isHome = page === 'home' && (href === 'index.html' || href === './index.html');
      const isHash = page === 'home' && hash && href.endsWith(hash);
      link.classList.toggle('is-active', isOrder || isHash || (!hash && isHome));
    });
  };

  const openDrawer = () => {
    drawer?.classList.add('is-open');
    drawer?.setAttribute('aria-hidden', 'false');
    openBtn?.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  };

  const closeDrawer = () => {
    drawer?.classList.remove('is-open');
    drawer?.setAttribute('aria-hidden', 'true');
    openBtn?.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  };

  openBtn?.addEventListener('click', openDrawer);
  closeBtn?.addEventListener('click', closeDrawer);
  links.forEach((link) => link.addEventListener('click', closeDrawer));
  window.addEventListener('scroll', toggleScrolled, { passive: true });
  window.addEventListener('hashchange', syncActiveLink);
  toggleScrolled();
  syncActiveLink();
}
