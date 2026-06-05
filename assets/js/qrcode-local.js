(function () {
  'use strict';

  const QR_INFOS = [
    null,
    { version: 1, dataCodewords: 19, eccPerBlock: 7, blocks: 1, align: [] },
    { version: 2, dataCodewords: 34, eccPerBlock: 10, blocks: 1, align: [6, 18] },
    { version: 3, dataCodewords: 55, eccPerBlock: 15, blocks: 1, align: [6, 22] },
    { version: 4, dataCodewords: 80, eccPerBlock: 20, blocks: 1, align: [6, 26] },
    { version: 5, dataCodewords: 108, eccPerBlock: 26, blocks: 1, align: [6, 30] },
    { version: 6, dataCodewords: 136, eccPerBlock: 18, blocks: 2, align: [6, 34] }
  ];

  const EXP = new Array(512);
  const LOG = new Array(256);
  (function initGaloisField() {
    let value = 1;
    for (let i = 0; i < 255; i += 1) {
      EXP[i] = value;
      LOG[value] = i;
      value <<= 1;
      if (value & 0x100) value ^= 0x11D;
    }
    for (let i = 255; i < 512; i += 1) EXP[i] = EXP[i - 255];
  })();

  function gfMultiply(left, right) {
    if (!left || !right) return 0;
    return EXP[LOG[left] + LOG[right]];
  }

  function makeReedSolomonDivisor(degree) {
    const result = Array(degree).fill(0);
    result[degree - 1] = 1;
    let root = 1;

    for (let i = 0; i < degree; i += 1) {
      for (let j = 0; j < result.length; j += 1) {
        result[j] = gfMultiply(result[j], root);
        if (j + 1 < result.length) result[j] ^= result[j + 1];
      }
      root = gfMultiply(root, 0x02);
    }

    return result;
  }

  function makeReedSolomonRemainder(data, divisor) {
    const result = Array(divisor.length).fill(0);

    data.forEach((byte) => {
      const factor = byte ^ result.shift();
      result.push(0);
      divisor.forEach((coefficient, index) => {
        result[index] ^= gfMultiply(coefficient, factor);
      });
    });

    return result;
  }

  function appendBits(buffer, value, length) {
    for (let i = length - 1; i >= 0; i -= 1) {
      buffer.push((value >>> i) & 1);
    }
  }

  function getUtf8Bytes(text) {
    if (window.TextEncoder) return Array.from(new TextEncoder().encode(text));
    return unescape(encodeURIComponent(text)).split('').map((char) => char.charCodeAt(0));
  }

  function chooseInfo(bytes) {
    for (let version = 1; version < QR_INFOS.length; version += 1) {
      const info = QR_INFOS[version];
      const capacityBits = info.dataCodewords * 8;
      const usedBits = 4 + 8 + bytes.length * 8;
      if (usedBits <= capacityBits) return info;
    }

    throw new Error('Data QR terlalu panjang. Singkatkan payload QR atau gunakan QRIS resmi dari payment gateway.');
  }

  function makeDataCodewords(text, info) {
    const bytes = getUtf8Bytes(text);
    const capacityBits = info.dataCodewords * 8;
    const bits = [];

    appendBits(bits, 0x4, 4); // byte mode
    appendBits(bits, bytes.length, 8);
    bytes.forEach((byte) => appendBits(bits, byte, 8));

    const terminator = Math.min(4, capacityBits - bits.length);
    appendBits(bits, 0, terminator);
    while (bits.length % 8 !== 0) bits.push(0);

    const data = [];
    for (let i = 0; i < bits.length; i += 8) {
      let byte = 0;
      for (let j = 0; j < 8; j += 1) byte = (byte << 1) | bits[i + j];
      data.push(byte);
    }

    for (let pad = 0xEC; data.length < info.dataCodewords; pad ^= 0xEC ^ 0x11) {
      data.push(pad);
    }

    return data;
  }

  function makeFinalCodewords(data, info) {
    const divisor = makeReedSolomonDivisor(info.eccPerBlock);
    const dataBlockLength = info.dataCodewords / info.blocks;
    const dataBlocks = [];
    const eccBlocks = [];

    for (let i = 0; i < info.blocks; i += 1) {
      const block = data.slice(i * dataBlockLength, (i + 1) * dataBlockLength);
      dataBlocks.push(block);
      eccBlocks.push(makeReedSolomonRemainder(block, divisor));
    }

    const result = [];
    for (let i = 0; i < dataBlockLength; i += 1) {
      dataBlocks.forEach((block) => result.push(block[i]));
    }
    for (let i = 0; i < info.eccPerBlock; i += 1) {
      eccBlocks.forEach((block) => result.push(block[i]));
    }

    return result;
  }

  function getBit(value, index) {
    return ((value >>> index) & 1) !== 0;
  }

  function makeMatrix(text) {
    const bytes = getUtf8Bytes(text);
    const info = chooseInfo(bytes);
    const size = info.version * 4 + 17;
    const modules = Array.from({ length: size }, () => Array(size).fill(false));
    const isFunction = Array.from({ length: size }, () => Array(size).fill(false));

    function setFunction(row, col, dark) {
      if (row < 0 || row >= size || col < 0 || col >= size) return;
      modules[row][col] = Boolean(dark);
      isFunction[row][col] = true;
    }

    function drawFinder(row, col) {
      for (let dy = -1; dy <= 7; dy += 1) {
        for (let dx = -1; dx <= 7; dx += 1) {
          const r = row + dy;
          const c = col + dx;
          const isInside = dx >= 0 && dx <= 6 && dy >= 0 && dy <= 6;
          const dark = isInside && (dx === 0 || dx === 6 || dy === 0 || dy === 6 || (dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4));
          setFunction(r, c, dark);
        }
      }
    }

    function drawAlignment(centerRow, centerCol) {
      if (isFunction[centerRow][centerCol]) return;
      for (let dy = -2; dy <= 2; dy += 1) {
        for (let dx = -2; dx <= 2; dx += 1) {
          const distance = Math.max(Math.abs(dx), Math.abs(dy));
          setFunction(centerRow + dy, centerCol + dx, distance === 0 || distance === 2);
        }
      }
    }

    function drawFormatBits(mask) {
      const errorLevelBits = 1;
      const data = (errorLevelBits << 3) | mask;
      let remainder = data;

      for (let i = 0; i < 10; i += 1) {
        remainder = (remainder << 1) ^ (((remainder >>> 9) & 1) * 0x537);
      }

      const bits = ((data << 10) | remainder) ^ 0x5412;

      for (let i = 0; i < 15; i += 1) {
        const dark = getBit(bits, i);

        // Vertical format information.
        if (i < 6) setFunction(i, 8, dark);
        else if (i < 8) setFunction(i + 1, 8, dark);
        else setFunction(size - 15 + i, 8, dark);

        // Horizontal format information.
        if (i < 8) setFunction(8, size - i - 1, dark);
        else if (i < 9) setFunction(8, 15 - i, dark);
        else setFunction(8, 14 - i, dark);
      }

      setFunction(size - 8, 8, true);
    }

    drawFinder(0, 0);
    drawFinder(0, size - 7);
    drawFinder(size - 7, 0);

    for (let i = 8; i < size - 8; i += 1) {
      const dark = i % 2 === 0;
      setFunction(6, i, dark);
      setFunction(i, 6, dark);
    }

    info.align.forEach((row) => {
      info.align.forEach((col) => drawAlignment(row, col));
    });

    for (let i = 0; i < 15; i += 1) {
      if (i < 6) setFunction(i, 8, false);
      else if (i < 8) setFunction(i + 1, 8, false);
      else setFunction(size - 15 + i, 8, false);

      if (i < 8) setFunction(8, size - i - 1, false);
      else if (i < 9) setFunction(8, 15 - i, false);
      else setFunction(8, 14 - i, false);
    }
    setFunction(size - 8, 8, true);

    const dataCodewords = makeDataCodewords(text, info);
    const finalCodewords = makeFinalCodewords(dataCodewords, info);
    const dataBits = [];
    finalCodewords.forEach((byte) => appendBits(dataBits, byte, 8));

    let bitIndex = 0;
    let upward = true;
    const mask = 0;

    for (let right = size - 1; right >= 1; right -= 2) {
      if (right === 6) right -= 1;

      for (let vertical = 0; vertical < size; vertical += 1) {
        const row = upward ? size - 1 - vertical : vertical;
        for (let offset = 0; offset < 2; offset += 1) {
          const col = right - offset;
          if (isFunction[row][col]) continue;

          let dark = bitIndex < dataBits.length ? dataBits[bitIndex] === 1 : false;
          bitIndex += 1;

          if ((row + col) % 2 === 0) dark = !dark;
          modules[row][col] = dark;
        }
      }

      upward = !upward;
    }

    drawFormatBits(mask);
    return modules;
  }

  function drawQrToCanvas(canvas, text, options, callback) {
    try {
      const matrix = makeMatrix(String(text || ''));
      const size = options?.width || canvas.width || 184;
      const margin = Number.isFinite(options?.margin) ? options.margin : 4;
      const darkColor = options?.color?.dark || '#08090c';
      const lightColor = options?.color?.light || '#f4f5f7';
      const cells = matrix.length + margin * 2;
      const cellSize = size / cells;
      const ctx = canvas.getContext('2d');

      canvas.width = size;
      canvas.height = size;
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = lightColor;
      ctx.fillRect(0, 0, size, size);
      ctx.fillStyle = darkColor;

      matrix.forEach((row, rowIndex) => {
        row.forEach((dark, colIndex) => {
          if (!dark) return;
          const x = Math.round((colIndex + margin) * cellSize);
          const y = Math.round((rowIndex + margin) * cellSize);
          const nextX = Math.round((colIndex + margin + 1) * cellSize);
          const nextY = Math.round((rowIndex + margin + 1) * cellSize);
          ctx.fillRect(x, y, Math.max(1, nextX - x), Math.max(1, nextY - y));
        });
      });

      if (typeof callback === 'function') callback(null);
    } catch (error) {
      if (typeof callback === 'function') callback(error);
      else throw error;
    }
  }

  window.QRCode = window.QRCode || {};
  if (!window.QRCode.toCanvas) window.QRCode.toCanvas = drawQrToCanvas;
})();
