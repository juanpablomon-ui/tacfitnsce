/* #NSCE — Código QR sin librerías (25-nov-2026, invitar amigos): versión 5, corrección L, modo byte (hasta 106 caracteres), máscara 0. `qrMatriz(texto)` → 37 × 37 de 0/1;
   `qrSvg(texto)` → SVG negro sobre blanco con su margen. */
'use strict';
function qrMatriz(txt){
  const N = 37, ND = 108, NE = 26, by = [...new TextEncoder().encode(txt)]; if(by.length > 106) throw new Error('Texto muy largo para el QR');
  let bits = ''; const pon = (v, n)=>{ bits += v.toString(2).padStart(n, '0'); };
  pon(4, 4); pon(by.length, 8); by.forEach(b=>pon(b, 8)); bits += '0000'.slice(0, Math.min(4, ND * 8 - bits.length)); while(bits.length % 8) bits += '0';
  const D = bits.match(/.{8}/g).map(x=>parseInt(x, 2)); for(let k = 0; D.length < ND; k++) D.push(k % 2 ? 0x11 : 0xEC);
  const EX = [], LG = []; for(let i = 0, x = 1; i < 255; i++){ EX[i] = x; LG[x] = i; x <<= 1; if(x & 256) x ^= 0x11d; }
  const mul = (a, b)=>a && b ? EX[(LG[a] + LG[b]) % 255] : 0;
  let G = [1]; for(let i = 0; i < NE; i++){ const H = Array(G.length + 1).fill(0); G.forEach((g, j)=>{ H[j] ^= g; H[j + 1] ^= mul(g, EX[i]); }); G = H; }
  const R = D.concat(Array(NE).fill(0)); for(let i = 0; i < ND; i++){ const c = R[i]; if(c) G.forEach((g, j)=>{ R[i + j] ^= mul(g, c); }); }
  const flujo = D.concat(R.slice(ND)).map(x=>x.toString(2).padStart(8, '0')).join('');
  const M = Array.from({length:N}, ()=>Array(N).fill(null)), set = (f, c, v)=>{ if(f >= 0 && c >= 0 && f < N && c < N) M[f][c] = v; };
  [[0, 0], [0, N - 7], [N - 7, 0]].forEach(([f, c])=>{ for(let i = -1; i < 8; i++) for(let j = -1; j < 8; j++){ const d = Math.max(Math.abs(i - 3), Math.abs(j - 3)); set(f + i, c + j, d===2 || d===4 ? 0 : 1); } });
  for(let i = -2; i < 3; i++) for(let j = -2; j < 3; j++) set(30 + i, 30 + j, Math.max(Math.abs(i), Math.abs(j))===1 ? 0 : 1);
  for(let i = 8; i < N - 8; i++) M[6][i] = M[i][6] = i % 2 ? 0 : 1;
  const fmt = 0b111011111000100;   // corrección L, máscara 0
  for(let i = 0; i < 15; i++){ const v = fmt >> i & 1;
    if(i < 6) M[i][8] = v; else if(i < 8) M[i + 1][8] = v; else M[N - 15 + i][8] = v;
    if(i < 8) M[8][N - 1 - i] = v; else if(i < 9) M[8][7] = v; else M[8][14 - i] = v; }
  M[N - 8][8] = 1;
  let k = 0, sube = true;
  for(let c = N - 1; c > 0; c -= 2){ if(c===6) c--; for(let n = 0; n < N; n++){ const f = sube ? N - 1 - n : n;
      for(const x of [c, c - 1]) if(M[f][x]===null) M[f][x] = (+(flujo[k++] || 0)) ^ ((f + x) % 2===0 ? 1 : 0); } sube = !sube; }
  return M;
}
function qrSvg(txt){
  const M = qrMatriz(txt); let p = ''; M.forEach((f, y)=>f.forEach((v, x)=>{ if(v) p += `M${x + 4} ${y + 4}h1v1h-1z`; }));
  return `<svg class="qr" viewBox="0 0 45 45" role="img" aria-label="Código QR de tu invitación" shape-rendering="crispEdges"><rect width="45" height="45" fill="#fff"/><path fill="#111" d="${p}"/></svg>`;
}
