// ============================================================================
// Genera un PNG fuente (1024x1024) SIN dependencias externas.
// Luego, en CI, `npx tauri icon` crea a partir de el todos los iconos
// (.ico, .icns, png) que Tauri necesita para empaquetar el .exe.
// Asi no guardamos binarios en el repo y no se descarga nada raro.
// ============================================================================

import zlib from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

const W = 1024;
const H = 1024;
const OUT = "assets/icon-source.png";

const NAVY = [15, 27, 61];
const BLUE = [37, 99, 235];
const WHITE = [255, 255, 255];

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return (~c) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const t = Buffer.from(type, "ascii");
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([t, data])), 0);
  return Buffer.concat([len, t, data, crc]);
}

// Lienzo RGBA con un cuadro navy, un circulo azul y una "barra" blanca simple.
const raw = Buffer.alloc((W * 4 + 1) * H);
const cx = W / 2;
const cy = H / 2;
const r = 360;
let off = 0;
for (let y = 0; y < H; y++) {
  raw[off++] = 0; // byte de filtro por scanline
  for (let x = 0; x < W; x++) {
    let c = NAVY;
    const dx = x - cx;
    const dy = y - cy;
    if (dx * dx + dy * dy <= r * r) c = BLUE;
    // tres barras blancas tipo grafica dentro del circulo
    const inCircle = dx * dx + dy * dy <= (r - 30) * (r - 30);
    if (inCircle) {
      const bx = x - (cx - 150);
      if (bx >= 0 && bx <= 300) {
        const col = Math.floor(bx / 110); // 0,1,2
        const altura = [150, 240, 320][col] ?? 0;
        const baseY = cy + 160;
        if (y <= baseY && y >= baseY - altura) {
          const dentroBarra = bx % 110 < 80;
          if (dentroBarra) c = WHITE;
        }
      }
    }
    raw[off++] = c[0];
    raw[off++] = c[1];
    raw[off++] = c[2];
    raw[off++] = 255;
  }
}

const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(W, 0);
ihdr.writeUInt32BE(H, 4);
ihdr[8] = 8; // bit depth
ihdr[9] = 6; // color type RGBA
ihdr[10] = 0;
ihdr[11] = 0;
ihdr[12] = 0;

const idat = zlib.deflateSync(raw, { level: 9 });
const png = Buffer.concat([
  sig,
  chunk("IHDR", ihdr),
  chunk("IDAT", idat),
  chunk("IEND", Buffer.alloc(0)),
]);

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, png);
console.log(`Icono fuente generado: ${OUT} (${png.length} bytes)`);
