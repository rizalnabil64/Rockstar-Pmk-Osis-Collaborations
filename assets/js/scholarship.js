function initScholarship() {
  const trackers = document.querySelectorAll('[data-scholarship-progress]');
  if (!trackers.length) return;

  const activateTracker = (tracker) => {
    const fill = tracker.querySelector('.funding-fill');
    const target = Number(tracker.dataset.scholarshipProgress || 0);
    if (fill) fill.style.width = `${Math.min(Math.max(target, 0), 100)}%`;
  };

  if (!('IntersectionObserver' in window)) {
    trackers.forEach(activateTracker);
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      activateTracker(entry.target);
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.45 });

  trackers.forEach((tracker) => observer.observe(tracker));
}
