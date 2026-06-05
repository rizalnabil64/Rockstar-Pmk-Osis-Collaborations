function initAcademy() {
  const progressItems = document.querySelectorAll('[data-academy-progress]');
  if (!progressItems.length) return;

  const activateProgress = (item) => {
    const fill = item.querySelector('.academy-progress-fill');
    const target = Number(item.dataset.academyProgress || 0);
    if (fill) fill.style.width = `${Math.min(Math.max(target, 0), 100)}%`;
  };

  if (!('IntersectionObserver' in window)) {
    progressItems.forEach(activateProgress);
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      activateProgress(entry.target);
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.35 });

  progressItems.forEach((item) => observer.observe(item));
}
