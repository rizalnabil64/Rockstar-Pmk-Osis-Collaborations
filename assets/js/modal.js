function formatRating(rating) {
  return Number(rating).toFixed(1);
}

function renderStars(rating) {
  const fullStars = Math.floor(rating / 2);
  const hasHalf = rating / 2 - fullStars >= 0.5;
  const stars = [];

  for (let index = 0; index < 5; index += 1) {
    if (index < fullStars) stars.push('<i class="bi bi-star-fill"></i>');
    else if (index === fullStars && hasHalf) stars.push('<i class="bi bi-star-half"></i>');
    else stars.push('<i class="bi bi-star"></i>');
  }

  return `<span class="stars" aria-label="Rating ${formatRating(rating)} out of 10">${stars.join('')}</span>`;
}

function getGames() {
  return Array.isArray(window.RS_GAMES) ? window.RS_GAMES : [];
}

function createGameCard(game) {
  return `
    <article class="game-card ${game.large ? 'is-large' : ''} reveal" role="button" tabindex="0" data-bs-toggle="modal" data-bs-target="#modal-${game.id}">
      <img class="game-card-img" src="${game.image}" alt="${game.title}" loading="lazy" />
      <div class="game-card-content">
        <span class="game-badge">${game.badge}</span>
        <span class="pmk-edition-badge"><i class="bi bi-patch-check-fill"></i> ${game.collaborationBadge || 'Rockstar × PMK'}</span>
        <h3>${game.title}</h3>
        <div class="game-meta">
          <span>${game.genre}</span>
          <span>|</span>
          <span>${game.year}</span>
        </div>
        <div class="d-flex align-items-center gap-2 mt-3">
          ${renderStars(game.rating)}
          <span class="rating-chip">${formatRating(game.rating)} / 10</span>
        </div>
        <span class="card-action">View details <i class="bi bi-arrow-right"></i></span>
      </div>
    </article>
  `;
}

function createTableRow(game, index) {
  return `
    <tr>
      <td class="text-secondary fw-bold">${String(index + 1).padStart(2, '0')}</td>
      <td>
        <div class="table-game-title">${game.title}</div>
        <div class="table-game-sub">${game.originalTitle || game.shortTitle}</div>
      </td>
      <td><span class="table-badge">${game.genre}</span><br><span class="pmk-edition-badge mt-2">PMK Exclusive</span></td>
      <td>${game.year}</td>
      <td><span class="rating-chip">${formatRating(game.rating)}</span></td>
      <td class="text-end">
        <button class="btn-table-action" type="button" data-bs-toggle="modal" data-bs-target="#modal-${game.id}">
          <i class="bi bi-eye"></i> Detail
        </button>
      </td>
    </tr>
  `;
}

function createModal(game) {
  return `
    <div class="modal fade rs-modal" id="modal-${game.id}" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable">
        <div class="modal-content">
          <div class="modal-visual">
            <img src="${game.image}" alt="${game.title}" />
            <button type="button" class="modal-close-rs" data-bs-dismiss="modal" aria-label="Close"><i class="bi bi-x-lg"></i></button>
            <div class="modal-visual-content">
              <span class="game-badge">${game.badge}</span>
              <span class="pmk-edition-badge"><i class="bi bi-patch-check-fill"></i> ${game.collaborationBadge || 'Rockstar × PMK'}</span>
              <h2>${game.title}</h2>
              <div class="d-flex flex-wrap gap-2 align-items-center">
                ${renderStars(game.rating)}
                <span class="rating-chip">${formatRating(game.rating)} / 10</span>
                <span class="rating-chip">${game.genre}</span>
              </div>
            </div>
          </div>
          <div class="modal-body p-4 p-lg-5">
            <p class="section-lead mb-4">${game.description}</p>
            <div class="modal-info-grid mb-4">
              <div class="modal-info-item"><span>Year</span><strong>${game.year}</strong></div>
              <div class="modal-info-item"><span>Developer</span><strong>${game.developer}</strong></div>
              <div class="modal-info-item"><span>Setting</span><strong>${game.setting}</strong></div>
              <div class="modal-info-item"><span>Platforms</span><strong>${game.platforms.slice(0, 2).join(' | ')}</strong></div>
            </div>
            <h3 class="h5 text-white text-uppercase fw-bold mb-3">Official Collaboration Editions</h3>
            <ul class="edition-list p-0 m-0 mb-4">
              ${game.editions.map((edition) => `<li>${edition}</li>`).join('')}
            </ul>
            <h3 class="h5 text-white text-uppercase fw-bold mb-3">Collaboration Highlights</h3>
            <div class="d-flex flex-wrap gap-2">
              ${game.highlights.map((highlight) => `<span class="rating-chip">${highlight}</span>`).join('')}
            </div>
          </div>
          <div class="modal-footer border-0 p-4 pt-0 d-flex justify-content-between gap-3 flex-wrap">
            <button type="button" class="btn btn-rs-ghost" data-bs-dismiss="modal"><i class="bi bi-arrow-left"></i> Back</button>
            <a href="pemesanan.html?game=${encodeURIComponent(game.id)}" class="btn btn-rs-primary"><i class="bi bi-bag-check"></i> Order Game</a>
          </div>
        </div>
      </div>
    </div>
  `;
}

function initGameShowcase() {
  const games = getGames();
  const featuredRoot = document.getElementById('featuredGames');
  const tableRoot = document.getElementById('catalogTable');
  const modalRoot = document.getElementById('modalRoot');

  if (featuredRoot) featuredRoot.innerHTML = games.filter((game) => game.featured).map(createGameCard).join('');
  if (tableRoot) tableRoot.innerHTML = games.map(createTableRow).join('');
  if (modalRoot) modalRoot.innerHTML = games.map(createModal).join('');

  if (featuredRoot && typeof initReveal === 'function') initReveal();
}
