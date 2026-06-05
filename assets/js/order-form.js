function rupiah(value) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(value || 0);
}

function initOrderForm() {
  if (document.body.dataset.page !== 'order') return;

  const games = Array.isArray(window.RS_GAMES) ? window.RS_GAMES : [];
  const upgrades = window.RS_EDITION_UPGRADES || {};
  const form = document.getElementById('orderForm');
  const gameSelect = document.getElementById('gameSelect');
  const editionSelect = document.getElementById('editionSelect');
  const platformSelect = document.getElementById('platformSelect');
  const quantityInput = document.getElementById('quantityInput');
  const qtyMinus = document.getElementById('qtyMinus');
  const qtyPlus = document.getElementById('qtyPlus');
  const toast = document.getElementById('orderToast');
  const toastMessage = document.getElementById('toastMessage');
  const platformShortcuts = document.getElementById('platformShortcuts');
  const paymentInputs = document.querySelectorAll('input[name="paymentMethod"]');
  const paymentOptions = document.querySelectorAll('.payment-option');
  const qrisBox = document.getElementById('qrisBox');
  const qrisCode = document.getElementById('qrisCode');
  const qrisCanvas = document.getElementById('qrisCanvas');
  const qrisOrderCode = document.getElementById('qrisOrderCode');
  const qrisValidUntil = document.getElementById('qrisValidUntil');
  const refreshQris = document.getElementById('refreshQris');
  const copyOrderCode = document.getElementById('copyOrderCode');
  const bankDetailPanel = document.getElementById('bankDetailPanel');
  const ewalletDetailPanel = document.getElementById('ewalletDetailPanel');

  const customerName = document.getElementById('customerName');
  const customerEmail = document.getElementById('customerEmail');
  const customerPhone = document.getElementById('customerPhone');
  const customerCity = document.getElementById('customerCity');
  const shippingAddress = document.getElementById('shippingAddress');
  const notesInput = document.getElementById('notesInput');
  const bankName = document.getElementById('bankName');
  const bankAccountNumber = document.getElementById('bankAccountNumber');
  const bankAccountHolder = document.getElementById('bankAccountHolder');
  const ewalletProvider = document.getElementById('ewalletProvider');
  const ewalletNumber = document.getElementById('ewalletNumber');
  const ewalletOwner = document.getElementById('ewalletOwner');
  const studentBenefitBox = document.getElementById('studentBenefitBox');
  const pmkStudentToggle = document.getElementById('pmkStudentToggle');
  const pmkStudentId = document.getElementById('pmkStudentId');

  if (!form || !gameSelect) return;

  const STORE_WA_NUMBER = '6281234567890';
  const OFFICIAL_QRIS_PAYLOAD = '';
  const STUDENT_DISCOUNT_RATE = Number(window.RS_STUDENT_DISCOUNT_RATE || 0.15);
  let currentOrderCode = '';

  const elements = {
    image: document.getElementById('summaryImage'),
    badge: document.getElementById('summaryBadge'),
    title: document.getElementById('summaryTitle'),
    meta: document.getElementById('summaryMeta'),
    rating: document.getElementById('summaryRating'),
    customer: document.getElementById('lineCustomer'),
    contact: document.getElementById('lineContact'),
    address: document.getElementById('lineAddress'),
    game: document.getElementById('lineGame'),
    edition: document.getElementById('lineEdition'),
    platform: document.getElementById('linePlatform'),
    quantity: document.getElementById('lineQuantity'),
    studentBenefit: document.getElementById('lineStudentBenefit'),
    basePrice: document.getElementById('lineBasePrice'),
    editionPrice: document.getElementById('lineEditionPrice'),
    studentDiscount: document.getElementById('lineStudentDiscount'),
    payment: document.getElementById('linePayment'),
    paymentDetail: document.getElementById('linePaymentDetail'),
    total: document.getElementById('lineTotal')
  };

  const params = new URLSearchParams(window.location.search);
  const preselectedGame = params.get('game');

  gameSelect.innerHTML = '<option value="" selected>Pilih game</option>' + games.map((game) => (
    `<option value="${game.id}">${game.title}</option>`
  )).join('');

  if (preselectedGame && games.some((game) => game.id === preselectedGame)) {
    gameSelect.value = preselectedGame;
  }

  function getSelectedGame() {
    return games.find((game) => game.id === gameSelect.value);
  }

  function getSelectedPayment() {
    return document.querySelector('input[name="paymentMethod"]:checked')?.value || 'QRIS';
  }

  function generateOrderCode() {
    const random = Math.floor(1000 + Math.random() * 9000);
    const time = Date.now().toString().slice(-5);
    return `RS-${time}-${random}`;
  }

  function ensureOrderCode(force = false) {
    if (!currentOrderCode || force) currentOrderCode = generateOrderCode();
    if (qrisOrderCode) qrisOrderCode.textContent = currentOrderCode;
    return currentOrderCode;
  }

  function isStudentBenefitActive() {
    return Boolean(pmkStudentToggle?.checked);
  }

  function syncStudentBenefitUI() {
    const active = isStudentBenefitActive();
    studentBenefitBox?.classList.toggle('is-active', active);
    if (pmkStudentId) {
      pmkStudentId.required = active;
      if (!active) pmkStudentId.classList.remove('is-invalid');
    }
  }

  function getOrderSubtotal() {
    const game = getSelectedGame();
    const upgrade = upgrades[editionSelect.value] || 0;
    const qty = Number(quantityInput.value) || 1;
    return ((game?.price || 0) + upgrade) * qty;
  }

  function getStudentDiscount() {
    return isStudentBenefitActive() ? Math.round(getOrderSubtotal() * STUDENT_DISCOUNT_RATE) : 0;
  }

  function getOrderTotal() {
    return Math.max(0, getOrderSubtotal() - getStudentDiscount());
  }

  function getPaymentDetail() {
    const payment = getSelectedPayment();

    if (payment === 'Transfer Bank') {
      const bank = bankName?.value || 'Bank belum dipilih';
      const account = bankAccountNumber?.value || 'No rekening belum diisi';
      const holder = bankAccountHolder?.value || 'Nama pemilik belum diisi';
      return `${bank} | ${account} | ${holder}`;
    }

    if (payment === 'E-Wallet') {
      const provider = ewalletProvider?.value || 'E-wallet belum dipilih';
      const number = ewalletNumber?.value || 'Nomor belum diisi';
      const owner = ewalletOwner?.value || 'Nama akun belum diisi';
      return `${provider} | ${number} | ${owner}`;
    }

    return 'QR code siap discan';
  }

  function getOrderPayload() {
    const game = getSelectedGame();
    const payload = {
      merchant: 'Rockstar Games × PMK Student Benefit',
      order_code: ensureOrderCode(),
      name: customerName?.value || '-',
      email: customerEmail?.value || '-',
      whatsapp: customerPhone?.value || '-',
      city: customerCity?.value || '-',
      address: shippingAddress?.value || '-',
      game: game?.title || '-',
      edition: editionSelect.value,
      platform: platformSelect.value,
      quantity: Number(quantityInput.value) || 1,
      student_program: isStudentBenefitActive() ? 'PMK Student Benefit' : 'Regular',
      student_id: isStudentBenefitActive() ? (pmkStudentId?.value || '-') : '-',
      subtotal: getOrderSubtotal(),
      student_discount: getStudentDiscount(),
      payment: getSelectedPayment(),
      payment_detail: getPaymentDetail(),
      total: getOrderTotal(),
      note: notesInput?.value || '-'
    };

    if (OFFICIAL_QRIS_PAYLOAD) return OFFICIAL_QRIS_PAYLOAD;

    const shortGame = game?.shortTitle || game?.title || '-';
    return [
      `MERCHANT: Rockstar x PMK`,
      `ORDER: ${ensureOrderCode()}`,
      `GAME: ${shortGame}`,
      `TOTAL: ${getOrderTotal()}`,
      `BENEFIT: ${isStudentBenefitActive() ? 'PMK 15%' : 'REGULAR'}`,
      `PAYMENT: QRIS`
    ].join('\n');
  }

  function renderRealQrCode(forceNewCode = false) {
    ensureOrderCode(forceNewCode);
    if (qrisValidUntil) qrisValidUntil.textContent = 'Aktif 15 menit';
    if (!qrisCode) return;

    const payload = getOrderPayload();

    if (window.QRCode?.toCanvas && qrisCanvas) {
      window.QRCode.toCanvas(qrisCanvas, payload, {
        width: 184,
        margin: 1,
        errorCorrectionLevel: 'M',
        color: {
          dark: '#08090c',
          light: '#f4f5f7'
        }
      }, (error) => {
        if (error) {
          qrisCode.innerHTML = '<div class="qr-fallback-text">QR gagal dibuat. Cek koneksi script QR.</div>';
        }
      });
      return;
    }

    qrisCode.innerHTML = '<div class="qr-fallback-text">QR generator belum dimuat. Pastikan file assets/js/qrcode-local.js ada.</div>';
  }

  function setRequiredForPanel(controls, isRequired) {
    controls.forEach((control) => {
      if (!control) return;
      control.required = isRequired;
      if (!isRequired) control.classList.remove('is-invalid');
    });
  }

  function syncPaymentUI() {
    const selectedPayment = getSelectedPayment();

    paymentOptions.forEach((option) => {
      const input = option.querySelector('input[name="paymentMethod"]');
      option.classList.toggle('is-active', input?.checked);
    });

    qrisBox?.classList.toggle('is-active', selectedPayment === 'QRIS');
    bankDetailPanel?.classList.toggle('is-active', selectedPayment === 'Transfer Bank');
    ewalletDetailPanel?.classList.toggle('is-active', selectedPayment === 'E-Wallet');

    setRequiredForPanel([bankName, bankAccountNumber, bankAccountHolder], selectedPayment === 'Transfer Bank');
    setRequiredForPanel([ewalletProvider, ewalletNumber, ewalletOwner], selectedPayment === 'E-Wallet');

    if (elements.payment) elements.payment.textContent = selectedPayment;
    if (elements.paymentDetail) elements.paymentDetail.textContent = getPaymentDetail();

    if (selectedPayment === 'QRIS') renderRealQrCode();
  }

  function syncPlatformButtons() {
    platformShortcuts?.querySelectorAll('button').forEach((button) => {
      button.classList.toggle('active', button.dataset.platform === platformSelect.value);
    });
  }

  function updateSummary() {
    const game = getSelectedGame();
    const edition = editionSelect.value;
    const qty = Number(quantityInput.value) || 1;
    const upgrade = upgrades[edition] || 0;
    const base = game?.price || 0;
    const subtotal = (base + upgrade) * qty;
    const discount = getStudentDiscount();
    const total = Math.max(0, subtotal - discount);

    if (game) {
      elements.image.src = game.image;
      elements.image.alt = game.title;
      elements.badge.textContent = game.badge;
      elements.title.textContent = game.title;
      elements.meta.textContent = `${game.genre} | ${game.year}`;
      elements.rating.textContent = game.rating.toFixed(1);
      elements.game.textContent = game.title;
      elements.basePrice.textContent = rupiah(base);
    } else {
      elements.badge.textContent = 'Waiting Selection';
      elements.title.textContent = 'Belum dipilih';
      elements.meta.textContent = 'Pilih game terlebih dahulu';
      elements.rating.textContent = '—';
      elements.game.textContent = '—';
      elements.basePrice.textContent = rupiah(0);
    }

    elements.customer.textContent = customerName?.value || '—';
    elements.contact.textContent = customerPhone?.value || customerEmail?.value || '—';
    elements.address.textContent = shippingAddress?.value ? `${shippingAddress.value}${customerCity?.value ? ', ' + customerCity.value : ''}` : '—';
    elements.edition.textContent = edition;
    elements.platform.textContent = platformSelect.value;
    elements.quantity.textContent = qty;
    elements.editionPrice.textContent = rupiah(upgrade);
    if (elements.studentBenefit) elements.studentBenefit.textContent = isStudentBenefitActive() ? `Aktif | ${pmkStudentId?.value || 'Menunggu NIS'}` : 'Tidak aktif';
    if (elements.studentDiscount) elements.studentDiscount.textContent = `-${rupiah(discount)}`;
    elements.total.textContent = rupiah(total);

    syncStudentBenefitUI();
    syncPlatformButtons();
    syncPaymentUI();
  }

  qtyMinus?.addEventListener('click', () => {
    quantityInput.value = Math.max(1, Number(quantityInput.value) - 1);
    updateSummary();
  });

  qtyPlus?.addEventListener('click', () => {
    quantityInput.value = Math.min(10, Number(quantityInput.value) + 1);
    updateSummary();
  });

  [gameSelect, editionSelect, platformSelect].forEach((control) => {
    control?.addEventListener('change', updateSummary);
  });

  [customerName, customerEmail, customerPhone, customerCity, shippingAddress, notesInput, bankName, bankAccountNumber, bankAccountHolder, ewalletProvider, ewalletNumber, ewalletOwner, pmkStudentId].forEach((control) => {
    control?.addEventListener('input', updateSummary);
    control?.addEventListener('change', updateSummary);
  });

  paymentInputs.forEach((input) => {
    input.addEventListener('change', updateSummary);
  });

  pmkStudentToggle?.addEventListener('change', updateSummary);

  refreshQris?.addEventListener('click', () => {
    renderRealQrCode(true);
  });

  copyOrderCode?.addEventListener('click', async () => {
    const code = qrisOrderCode?.textContent || '';
    if (!code) return;

    try {
      await navigator.clipboard.writeText(code);
      copyOrderCode.innerHTML = '<i class="bi bi-check2"></i> Tersalin';
      window.setTimeout(() => {
        copyOrderCode.innerHTML = '<i class="bi bi-copy"></i> Salin Kode';
      }, 1400);
    } catch (error) {
      console.warn('Gagal menyalin kode order.');
    }
  });

  platformShortcuts?.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-platform]');
    if (!button) return;
    platformSelect.value = button.dataset.platform;
    updateSummary();
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    event.stopPropagation();
    syncStudentBenefitUI();
    syncPaymentUI();

    if (!form.checkValidity()) {
      form.classList.add('was-validated');
      return;
    }

    const game = getSelectedGame();
    const payment = getSelectedPayment();
    const waText = encodeURIComponent(
      `Halo Rockstar × PMK Showcase, saya sudah membuat pesanan.\n\nKode: ${ensureOrderCode()}\nNama: ${customerName.value}\nGame: ${game?.title || '-'}\nBenefit: ${isStudentBenefitActive() ? 'PMK Student Benefit 15%' : 'Regular'}\nDiskon: ${rupiah(getStudentDiscount())}\nTotal: ${rupiah(getOrderTotal())}\nPembayaran: ${payment}\nDetail: ${getPaymentDetail()}`
    );

    if (toast && toastMessage) {
      toastMessage.innerHTML = `${game?.title || 'Game'} berhasil dipesan via ${payment}. ${isStudentBenefitActive() ? 'PMK Student Benefit aktif. ' : ''}<a href="https://wa.me/${STORE_WA_NUMBER}?text=${waText}" target="_blank" rel="noopener noreferrer">Kirim ke WhatsApp admin</a>`;
      toast.classList.add('show');
      window.setTimeout(() => toast.classList.remove('show'), 5800);
    }

    form.reset();
    gameSelect.value = '';
    editionSelect.value = 'Standard Edition';
    platformSelect.value = 'PC';
    quantityInput.value = '1';
    document.querySelector('input[name="paymentMethod"][value="QRIS"]').checked = true;
    if (pmkStudentToggle) pmkStudentToggle.checked = false;
    if (pmkStudentId) pmkStudentId.value = '';
    currentOrderCode = '';
    form.classList.remove('was-validated');
    renderRealQrCode(true);
    updateSummary();
  });

  renderRealQrCode(true);
  updateSummary();
}
