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
        tempo += 0.5;
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

// escolhe um tom da lista pelo "nível" de sombra (0 = mais claro)
function tom(tons, nivel) {
  return tons[Math.max(0, Math.min(tons.length - 1, Math.round(nivel)))];
}

// cravo rosa (camada 3, a da frente)
function cravo(cx, cy, R, atraso) {
  const tons = ['#ffe0ea', '#ffc2d4', '#ff9fbe', '#f47ba4', '#e05a8e', '#c4467a'];
  for (let y = -R; y <= R; y++) {
    for (let x = -2 * R; x <= 2 * R; x++) {
      const dx = x / 2;
      const r = Math.hypot(dx, y);
      const t = Math.atan2(y, dx);
      const borda = R * (0.88 + 0.1 * Math.sin(13 * t) + 0.05 * Math.sin(29 * t + 1));
      if (r > borda) continue;

      // anéis ondulados = camadas de pétalas
      const anel = r / R * 4 + 0.6 * Math.sin(11 * t + r);
      const dobra = anel - Math.floor(anel) > 0.72;     // vinco entre pétalas
      const luz = (-dx - y) / (2 * R);                  // luz vindo de cima/esquerda

      let nivel = 2 - luz * 3;
      if (dobra) nivel += 2;
      if (r > borda - 0.9) nivel += 1.5;                // contorno mais escuro
      if (r < R * 0.25) nivel += 1;                     // miolo fechado

      const ch = dobra ? '&' : (r < R * 0.25 ? '@' : '%');
      plot(cx + x, cy + y, ch, tom(tons, nivel), atraso + r * 2, 3);
    }
  }
}

// hortênsia azul (camada 1, atrás): bola de florzinhas (*)
function hortensia(cx, cy, R, atraso) {
  const tons = ['#d4e9ff', '#a8d1ff', '#84b9f2', '#5f97dc', '#3f74b8'];
  for (let y = -R; y <= R; y++) {
    for (let x = -2 * R; x <= 2 * R; x++) {
      const dx = x / 2;
      const r = Math.hypot(dx, y);
      const t = Math.atan2(y, dx);
      const borda = R * (0.9 + 0.1 * Math.sin(6 * t));
      if (r > borda) continue;

      // cada florzinha ocupa 4 colunas: ( * ) e um espaço; linhas alternadas deslocadas
      const u = ((x + (y & 1) * 2) % 4 + 4) % 4;
      const ch = ['(', '*', ')', ' '][u];
      const luz = (-dx - y) / (2 * R);

      let nivel = 1.8 - luz * 3;
      if (u === 1) nivel -= 1;                          // miolo da florzinha mais claro
      if (r > borda - 0.9) nivel += 1;
      plot(cx + x, cy + y, ch, tom(tons, nivel), atraso + r * 2, 1);
    }
  }
}

// crisântemo branco (camada 2): duas camadas de pétalas finas
function crisantemo(cx, cy, R, atraso) {
  const tons = ['#ffffff', '#f0f0f6', '#d8d8e4', '#b4b4c6'];
  const n = 8;                                          // 16 pétalas por camada
  for (let y = -R; y <= R; y++) {
    for (let x = -2 * R; x <= 2 * R; x++) {
      const dx = x / 2;
      const r = Math.hypot(dx, y);
      const t = Math.atan2(y, dx);

      if (r < R * 0.22) {                               // miolo amarelo
        plot(cx + x, cy + y, r < R * 0.12 ? '@' : 'o', '#f0d878', atraso + r * 2, 2);
        continue;
      }

      const ext = Math.abs(Math.cos(n * t));            // pétalas de fora
      const int = Math.abs(Math.sin(n * t));            // pétalas de dentro (entre as de fora)
      const naExterna = ext > 0.3 && r < R * (0.4 + 0.6 * Math.sqrt(ext));
      const naInterna = int > 0.3 && r < R * (0.3 + 0.35 * Math.sqrt(int));
      if (!naExterna && !naInterna) continue;

      const a = t < 0 ? t + Math.PI : t;
      let ch;
      if (a < Math.PI / 8 || a > 7 * Math.PI / 8) ch = '-';
      else if (a < 3 * Math.PI / 8)               ch = '\\';
      else if (a < 5 * Math.PI / 8)               ch = '|';
      else                                        ch = '/';

      const luz = (-dx - y) / (2 * R);
      let nivel = 1 - luz * 2;
      if (naInterna && !naExterna) nivel += 1;          // camada de dentro na sombra
      if ((naExterna ? ext : int) < 0.45) nivel += 1;   // beirada da pétala
      plot(cx + x, cy + y, ch, tom(tons, nivel), atraso + r * 2, 2);
    }
  }
}

// montagem do buquê
const BASE_X = 60, BASE_Y = 40;

// formato de coração: largo em cima, ponta embaixo
const buque = [
  // atrás
  { flor: hortensia,  x: 40, y: 14, R: 7 },
  { flor: hortensia,  x: 80, y: 14, R: 7 },
  // vãos e laterais
  { flor: crisantemo, x: 60, y: 9,  R: 5 },
  { flor: crisantemo, x: 27, y: 24, R: 4 },
  { flor: crisantemo, x: 93, y: 24, R: 4 },
  { flor: crisantemo, x: 47, y: 37, R: 3 },
  { flor: crisantemo, x: 73, y: 37, R: 3 },
  // frente (principal)
  { flor: cravo,      x: 60, y: 20, R: 6 },
  { flor: cravo,      x: 44, y: 29, R: 5 },
  { flor: cravo,      x: 76, y: 29, R: 5 },
  { flor: cravo,      x: 60, y: 34, R: 4 },
];

// feixe de caules amarrado com fita
function cabo(cx, yTopo, yFim) {
  const tons = ['#2f6b3a', '#3a7d44', '#4d9456'];
  let ordem = 0;
  for (let y = yFim; y >= yTopo; y--, ordem++) {
    for (let x = cx - 3; x <= cx + 3; x++) {
      plot(x, y, x % 2 ? '|' : '!', tons[(x + y) % 3], ordem, 0);
    }
  }
  const yFita = Math.round((yTopo + yFim) / 2);
  for (let x = cx - 5; x <= cx + 5; x++) plot(x, yFita, '=', '#ffd1dc', ordem, 4);
  plot(cx - 6, yFita, '{', '#ffb3c8', ordem + 1, 4);
  plot(cx + 6, yFita, '}', '#ffb3c8', ordem + 1, 4);
  return ordem;                 // momento em que o cabo termina
}

// ramo fino de pontinhos, atrás das flores (camada 0.5)
function ramo(x0, y0, x1, y1, cor, atraso) {
  const passos = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
  for (let i = 0; i <= passos; i++) {
    const t = i / passos;
    const x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t;
    plot(x, y, ':', cor, atraso + i, 0.5);
    if (i > passos / 2 && Math.random() < 0.5) {
      plot(x + (Math.random() < 0.5 ? -1 : 1), y, '.', cor, atraso + i + 1, 0.5);
    }
  }
}

// folha comprida de riscos, aparecendo pelas bordas
function folhaGrande(x, y, comprimento, lado, atraso) {
  for (let i = 0; i < comprimento; i++) {
    const ch = i % 2 ? '=' : '-';
    const cor = i < comprimento / 2 ? '#3a7d44' : '#5fae5f';
    plot(x + lado * i, y - Math.floor(i / 4), ch, cor, atraso + i, 0.5);
  }
}

function montarBuque() {
  const fimCabo = cabo(BASE_X, BASE_Y, 47);

  for (const f of buque) {
    const fim = caule(BASE_X, BASE_Y, f.x, f.y + f.R, fimCabo);
    f.flor(f.x, f.y, f.R, fim);
  }

  // ramos subindo (branco no meio, lilás nas laterais)
  ramo(52, 10, 46, 1, '#ffffff', 25);
  ramo(60, 8,  60, 0, '#ffffff', 25);
  ramo(68, 10, 74, 1, '#ffffff', 25);
  ramo(35, 10, 24, 2, '#c9a7ff', 30);
  ramo(85, 10, 98, 2, '#c9a7ff', 30);

  // folhas saindo pelas bordas
  folhaGrande(36, 32, 12, -1, 20);
  folhaGrande(84, 32, 12,  1, 20);
  folhaGrande(30, 28, 10, -1, 25);
  folhaGrande(90, 28, 10,  1, 25);
}

// caracteres das flores trocando sozinhos (o "brilho")
const TROCAS = {
  '%': '%%&', '&': '&&%', '@': '@@%',  // cravo (trocas sutis)
  '*': '**+',                          // miolo das florzinhas da hortênsia
  '-': '--~', '|': '||!', 'o': 'oo@',  // crisântemo
  ':': '::.',                          // ramos
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

const estrelas = Array.from({ length: 60 }, () => ({
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