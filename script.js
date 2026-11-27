const W = 120, H = 50;
const tela = document.getElementById('tela');
let grade = [];

function limpar() {
    grade = Array.from({ length: H }, () =>
    Array.from({ length: W}, () => ({ ch: ' ', cor: ''}))
    );
}

function desenhar() {
    let html = '';
    for(const linha of grade) {
        for (const c of linha) {
            html += c.cor ? `<span style="color:${c.cor}">${c.ch}</span>` : c.ch;
        }
        html += '\n';
    }
    tela.innerHTML = html;
}
const celulas = [];

// camada: 0 = caule, 1 = flor (flor sempre em cima do caule)
function plot(x, y, ch, cor, ordem, camada = 1) {
    x = Math.round(x); y = Math.round(y);
    if (x < 0 || x >= W || y < 0 || y >= H) return;
    celulas.push({x, y, ch, cor, ordem, camada});
}

function animar() {
    celulas.sort((a, b) => a.ordem - b.ordem);
    let tempo = 0, i = 0;

    function frame() {
        tempo += 0.9;
        while (i < celulas.length && celulas[i].ordem <= tempo) {
            const c = celulas[i++];
            const atual = grade[c.y][c.x];
            if ((atual.camada ?? -1) <= c.camada) grade[c.y][c.x] = c;
        }
        piscarEstrelas();
        brilhar();
        desenhar();
        if (i < celulas.length) requestAnimationFrame(frame);
        else terminou()
    }
    frame();
}

// caule e folha
function caule(x0, y0, x1, y1, atraso = 0) {
    const passos = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
    const dx = x1 - x0;
    const ch = Math.abs(dx) < passos / 3 ? '|' : (dx > 0 ? '/' : '\\');
    
    for (let i = 0; i <= passos; i++) {
        const t = i / passos;
        const x = x0 + dx * t, y = y0 + (y1 - y0) * t;
        plot(x, y, ch, '#3a7d44', atraso + i, 0);
        if (i === Math.floor(passos / 2)) folha(x, y, dx >= 0 ? -1 : 1, atraso + i);
    }
    return atraso + passos;  // momento em q o caule acaba 
}

function folha(x, y, lado, ordem) {
    plot(x + lado, y, '~', '#5fae5f', ordem + 1, 0);
    plot(x + 2 * lado, y, '~', '#5fae5f', ordem + 2, 0);
}
// a flor vai usar o momento em que o caule chegar la em cima p comecar a abrir

// ===== utilitários =====
function limitar(v, a, b) { return Math.max(a, Math.min(b, v)); }
function dente(z) { return Math.abs((z - Math.floor(z)) - 0.5) * 2; }   // zigue-zague de 0 a 1

// caractere de traço que aponta na direção (dx, dy) da tela
function traco(dx, dy) {
  let a = Math.atan2(dy, dx);
  if (a < 0) a += Math.PI;
  if (a < Math.PI / 8 || a > 7 * Math.PI / 8) return '-';
  if (a < 3 * Math.PI / 8) return '\\';
  if (a < 5 * Math.PI / 8) return '|';
  return '/';
}

// ===== CRAVO ROSA (visto de lado) =====
// cabeça fofa com franjas serrilhadas em cima + cálice verde comprido embaixo
function cravo(cx, cy, R, atraso) {
  const rosa  = ['#ffe0ea', '#ffbcd2', '#ff95b6', '#f2709c', '#d64f82', '#b23a6a'];  // claro -> escuro
  const verde = ['#9ad69a', '#6fbf6f', '#4d9a58', '#357a42'];

  // cabeça: oval achatada, centro um pouco acima de cy
  for (let y = -R - 1; y <= Math.ceil(R * 0.35); y++) {
    for (let x = -2 * R - 2; x <= 2 * R + 2; x++) {
      const u = x / (2 * R), v = (y + 0.3 * R) / (0.65 * R);
      const t = Math.atan2(v, u);
      const d = Math.hypot(u, v);
      const franja = v < 0 ? 0.16 * dente(t * 14 / Math.PI) : 0;    // dentinhos só em cima
      const borda = 1 + franja;
      if (d > borda || y > R * 0.35) continue;

      let ch, nivel;
      if (d > borda - 0.13 && v < 0) {                // pontinhas das pétalas
        ch = '^'; nivel = 0.5;
      } else {
        const onda = (v + 1) * 3.2 + 0.35 * Math.sin(u * 11 + v * 4);  // babados em camadas
        const dobra = onda - Math.floor(onda) < 0.28;
        const luz = -0.6 * u - 0.5 * v;              // claro em cima/esquerda
        nivel = 2.4 - luz * 2 + (dobra ? 1.6 : 0) + (d > 0.85 ? 0.8 : 0);
        ch = dobra ? '~' : (luz > 0.2 ? '%' : '&');
      }
      plot(cx + x, cy + y, ch, rosa[limitar(Math.round(nivel), 0, 5)], atraso + 4 + (1 - v) * R * 0.8, 3);
    }
  }

  // cálice: tubo verde que afina para baixo, com sépalas pontudas em cima
  const yIni = Math.round(R * 0.3), yFim = Math.round(R * 1.2);
  for (let y = yIni; y <= yFim; y++) {
    const h = (y - yIni) / (yFim - yIni);
    const meia = Math.max(1, Math.round(R * (0.5 - 0.25 * h)));
    for (let x = -meia; x <= meia; x++) {
      let ch;
      if (y === yIni) ch = (x + meia) % 2 ? '/' : '\\';        // sépalas: \/\/\/
      else if (x === -meia) ch = '(';
      else if (x === meia)  ch = ')';
      else ch = '|';
      const nivel = (x < 0 ? 0 : 1) + (x === meia ? 2 : 0) + h;
      plot(cx + x, cy + y, ch, verde[limitar(Math.round(nivel), 0, 3)], atraso + 4 * (1 - h), 3.1);
    }
  }
}

// ===== HORTÊNSIA AZUL =====
// bola feita de dezenas de florzinhas de 4 pétalas:   (@)
//                                                   (@o@)
//                                                    (@)
function hortensia(cx, cy, R, atraso) {
  const azul = ['#e6f2ff', '#c8e2ff', '#a6cdf8', '#88b8f0', '#6ea0e2', '#5a8bcf'];  // claro -> escuro
  const desenho = [' (@) ', '(@o@)', ' (@) '];
  let i = 0;
  for (let gy = -R; gy <= R; gy += 2) {
    const linha = Math.round((gy + R) / 2);
    for (let gx = -2 * R + (linha % 2) * 3; gx <= 2 * R; gx += 6) {
      if ((gx / 2) ** 2 + gy ** 2 > (R - 0.5) ** 2) continue;
      const luz = (-gx / 2 - gy) / (2 * R);                    // -1 .. 1
      const base = limitar(Math.round(2.2 - luz * 2.5 + (Math.random() - 0.5) * 1.2), 0, 4);
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 5; c++) {
          const ch = desenho[r][c];
          if (ch === ' ') continue;
          let cor = azul[base];
          if (ch === '(' || ch === ')') cor = azul[limitar(base + 2, 0, 5)];   // contorno da pétala
          if (ch === 'o') cor = '#ffffff';                                   // miolinho
          // florzinhas de baixo ficam na frente das de cima
          plot(cx + gx + c - 2, cy + gy + r - 1, ch, cor, atraso + i * 0.3, 1 + (gy + R) * 0.002);
        }
      }
      i++;
    }
  }
}

// ===== CRISÂNTEMO BRANCO (de frente) =====
// três camadas de pétalas compridas saindo do centro + miolo amarelo
function crisantemo(cx, cy, R, atraso) {
  const branco = ['#ffffff', '#f0f0f8', '#dcdce8', '#bdbdd0'];
  const miolo  = ['#fbf0a0', '#ecd85e', '#c9b43a'];
  const achatar = 0.85;
  const camadas = [
    { n: Math.round(2.6 * R), de: 0.3,  ate: 1.0,  giro: 0,    camada: 2.0, tom: 1 },   // de fora (mais atrás)
    { n: Math.round(2.1 * R), de: 0.25, ate: 0.75, giro: 0.5,  camada: 2.1, tom: 0 },
    { n: Math.round(1.6 * R), de: 0.2,  ate: 0.5,  giro: 0.25, camada: 2.2, tom: 0 },   // de dentro
  ];
  for (const k of camadas) {
    for (let p = 0; p < k.n; p++) {
      const a0 = (p + k.giro) / k.n * 2 * Math.PI;
      for (let r = k.de * R; r <= k.ate * R; r += 0.2) {
        const a = a0 + 0.1 * (r / R) ** 2;                       // pontinha curvada
        const dx = 2 * Math.cos(a), dy = Math.sin(a) * achatar;
        const ch = traco(dx, dy);
        const meio = (r - k.de * R) / ((k.ate - k.de) * R);      // 0 na base, 1 na ponta
        const largura = Math.sin(meio * Math.PI) * 0.07;         // pétala mais larga no meio
        const nivel = k.tom + (Math.sin(a) < -0.3 ? 1 : 0) + (meio < 0.15 ? 1 : 0);
        for (const lado of [-largura, 0, largura]) {
          const b = a + lado;
          plot(cx + r * 2 * Math.cos(b), cy + r * Math.sin(b) * achatar, ch,
               branco[limitar(nivel, 0, 3)], atraso + r * 2, k.camada);
        }
      }
    }
  }
  // miolo: bolinha pontilhada
  const m = R * 0.22;
  for (let y = -Math.ceil(m); y <= Math.ceil(m); y++) {
    for (let x = -Math.ceil(2 * m); x <= Math.ceil(2 * m); x++) {
      const d = Math.hypot(x / 2, y / achatar) / m;
      if (d > 1) continue;
      plot(cx + x, cy + y, (x + y) % 2 ? 'o' : '@', miolo[limitar(Math.round(d * 2), 0, 2)], atraso, 2.3);
    }
  }
}

// ================= MONTAGEM DO BUQUÊ =================
// As posições abaixo estão na "escala antiga" (120 x 50) e são multiplicadas por S.
const E = v => Math.round(v * S);
const BASE_X = E(60), BASE_Y = E(41);

const buque = [
  // atrás, nas laterais
  { flor: hortensia,  x: 37, y: 18, R: 7 },
  { flor: hortensia,  x: 83, y: 18, R: 7 },
  // vãos
  { flor: crisantemo, x: 60, y: 8,  R: 5 },
  { flor: crisantemo, x: 24, y: 30, R: 5 },
  { flor: crisantemo, x: 96, y: 30, R: 5 },
  { flor: crisantemo, x: 60, y: 34, R: 4 },
  // frente (principal)
  { flor: cravo,      x: 60, y: 20, R: 7 },
  { flor: cravo,      x: 43, y: 30, R: 6 },
  { flor: cravo,      x: 77, y: 30, R: 6 },
];

// número "aleatório" fixo por posição (a textura não muda a cada recarga)
function ruido(x, y) {
  const s = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  return s - Math.floor(s);
}

// folhagem: preenche os vãos entre as flores com folhinhas verdes e mosquitinhos
function folhagem(margem, atraso) {
  const verdes = ['#6fbf6f', '#4f9f55', '#3d8547', '#2e6b39', '#23552d'];
  const chars = ['\'', '`', ',', ';', '~', '"'];
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      // distância até a borda da flor mais próxima
      let perto = Infinity;
      for (const f of buque) {
        const d = Math.hypot((x - E(f.x)) / 2, y - E(f.y)) - E(f.R);
        perto = Math.min(perto, d);
      }
      if (perto > margem * (0.6 + 0.6 * ruido(Math.round(x / 4), Math.round(y / 3)))) continue;
      const r = ruido(x, y);
      if (r < 0.3) continue;                              // buraquinhos: textura mais leve
      if (r > 0.975) {                                    // mosquitinho
        plot(x, y, '*', '#ffffff', atraso + 15 + perto, 0.6);
        continue;
      }
      const nivel = Math.round(1 + (r - 0.3) * 3 + (y > E(30) ? 1 : 0));
      plot(x, y, chars[Math.floor(r * 97) % chars.length], verdes[limitar(nivel, 0, 4)], atraso + 8 + perto, 0.3);
    }
  }
}

// papel de embrulho em cone, na frente dos caules e atrás das flores
function embrulho(cx, yTopo, yFim, larguraTopo, atraso) {
  const papel = ['#fde8ee', '#f7d3de', '#eebccb', '#e0a3b6', '#cc89a0'];
  for (let y = yTopo; y <= yFim; y++) {
    const h = (y - yTopo) / (yFim - yTopo);
    const meia = larguraTopo * (1 - h) + 3 * h;
    for (let x = Math.ceil(cx - meia); x <= cx + meia; x++) {
      const lado = (x - cx) / meia;                         // -1 .. 1
      if (y === yTopo && ruido(x, y) < 0.4) continue;      // beirada recortada
      const dobra = (lado * 2.5 + 10) % 1;                 // vincos do papel
      let ch, nivel = 1.5 + lado * 1.2 + h;                // mais escuro à direita e embaixo
      if (dobra < 0.12)      { ch = lado < 0 ? '/' : '\\'; nivel += 1.5; }
      else if (Math.abs(lado) > 0.93) { ch = lado < 0 ? '/' : '\\'; nivel += 1; }
      else ch = h < 0.08 ? '~' : '=';
      plot(x, y, ch, papel[limitar(Math.round(nivel), 0, 4)], atraso + h * 5, 0.8);
    }
  }
}

// laço de fita
function laco(cx, cy, atraso) {
  const desenho = [
    "  .-~-.     .-~-.  ",
    " (     '. .'     ) ",
    "  '-.._  (@)  _..-' ",
    "        /   \\       ",
    "       /     \\      ",
    "      ~       ~     ",
  ];
  const cores = { '@': '#ff6f9c' };
  desenho.forEach((linha, j) => {
    [...linha].forEach((ch, i) => {
      if (ch === ' ') return;
      plot(cx - 9 + i, cy - 2 + j, ch, cores[ch] || (j < 3 ? '#ff9fbe' : '#f47ba4'), atraso + j, 5);
    });
  });
}

// cabo: feixe de caules saindo por baixo do papel
function cabo(cx, yTopo, yFim) {
  const tons = ['#2f6b3a', '#3a7d44', '#4d9456'];
  let ordem = 0;
  for (let y = yFim; y >= yTopo; y--, ordem++) {
    for (let x = cx - 3; x <= cx + 3; x++) {
      plot(x, y, x % 2 ? '|' : '!', tons[(x + y) % 3], ordem, 0);
    }
  }
  return ordem;
}

// ramo fino de pontinhos (camada 0.5)
function ramo(x0, y0, x1, y1, cor, atraso) {
  const passos = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
  for (let i = 0; i <= passos; i++) {
    const t = i / passos;
    const x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t;
    plot(x, y, ':', cor, atraso + i, 0.5);
    if (i > passos / 2 && ruido(i, x0) < 0.5) {
      plot(x + (ruido(i, y0) < 0.5 ? -1 : 1), y, '.', cor, atraso + i + 1, 0.5);
    }
  }
}

function montarBuque() {
  const fimCabo = cabo(BASE_X, BASE_Y, H - 4);
  embrulho(BASE_X, E(27), BASE_Y + 1, E(30), fimCabo);
  laco(BASE_X, BASE_Y + 2, fimCabo + 6);
  folhagem(E(4), fimCabo);

  for (const f of buque) {
    const x = E(f.x), y = E(f.y), R = E(f.R);
    const fim = caule(BASE_X, BASE_Y, x, y + R, fimCabo);
    f.flor(x, y, R, fim);
  }

  // ramos subindo (branco no meio, lilás nas laterais)
  ramo(E(52), E(8), E(46), E(0.5), '#ffffff', 40);
  ramo(E(60), E(4), E(60), 0,       '#ffffff', 40);
  ramo(E(68), E(8), E(74), E(0.5), '#ffffff', 40);
  ramo(E(30), E(12), E(18), E(2),  '#c9a7ff', 45);
  ramo(E(90), E(12), E(102), E(2), '#c9a7ff', 45);
}

// brilho sutil: só alguns caracteres trocam, e por outros parecidos
const TROCAS = {
  '%': '%%&', '&': '&&%',      // miolo do cravo
  '@': '@@@O',                 // pétalas da hortênsia
  ':': '::.',                  // ramos
};

function brilhar(qtd = 40) {
  for (let n = 0; n < qtd; n++) {
    const c = grade[Math.floor(Math.random() * H)][Math.floor(Math.random() * W)];
    if (!c.camada) continue;           // pula vazio, estrela e caule
    c.original ??= c.ch;               // lembra o caractere de verdade
    const opcoes = TROCAS[c.original];
    if (opcoes) c.ch = opcoes[Math.floor(Math.random() * opcoes.length)];
  }
}

// esttrelas e mensaem

const estrelas = Array.from({ length: 120 }, () => ({
  x: Math.floor(Math.random() * W),
  y: Math.floor(Math.random() * H * 0.6),
  acesa: Math.random() < 0.5,
}));

function piscarEstrelas() {
  for (const e of estrelas) {
    if (Math.random() < 0.02) e.acesa = !e.acesa;
    const c = grade[e.y][e.x];
    if (c.camada === undefined) {
      grade[e.y][e.x] = { ch: e.acesa ? '+' : '.', cor: e.acesa ? '#aab' : '#445' };
    }
  }
}

function terminou() {
  setInterval(() => { piscarEstrelas(); brilhar(150); desenhar(); }, 100);
  escrever('Para Ana, que o nosso amor dure tanto quanto essas flores. <3');
}

function escrever(texto) {
  const el = document.getElementById('mensagem');
  let i = 0;
  const id = setInterval(() => {
    el.textContent = texto.slice(0, ++i);
    if (i >= texto.length) clearInterval(id);
  }, 80);
}

// inicialização
limpar();
montarBuque();
animar();