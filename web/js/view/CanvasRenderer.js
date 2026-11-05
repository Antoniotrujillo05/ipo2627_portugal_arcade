/* ==========================================================================
   CanvasRenderer.js — Vista del lienzo (Canvas API 2D)
   Dibuja el estado del modelo con el ciclo limpiar → pintar.
   Las figuras del canvas no tienen reflejo en el DOM, así que todo lo que
   se ve durante la partida se dibuja aquí con primitivas del contexto 2d.
   ========================================================================== */

(function (Arcade) {
'use strict';

const { LIENZO, ENEMIGOS } = Arcade;

/* Sprites de11 × 8 celdas dibujados con rectángulos --------------- */
const SPRITES = {
  calamar: {
    cuerpo: [
      '..X.....X..',
      '...X...X...',
      '..XXXXXXX..',
      '.XX.XXX.XX.',
      'XXXXXXXXXXX',
      'X.XXXXXXX.X',
    ],
    patasA: ['X.X.....X.X', '...XX.XX...'],
    patasB: ['X.........X', '..XX...XX..'],
  },
  cangrejo: {
    cuerpo: [
      '...XX.XX...',
      '..XXXXXXX..',
      '.XX.XXX.XX.',
      'XXXXXXXXXXX',
      'X.XXXXXXX.X',
      'X.X.....X.X',
    ],
    patasA: ['.X.......X.', 'X.........X'],
    patasB: ['..X.....X..', 'X.........X'],
  },
  pulpo: {
    cuerpo: [
      '...XXXXX...',
      '.XXXXXXXXX.',
      'XXX.XXX.XXX',
      'XXXXXXXXXXX',
      '..XX...XX..',
      '.XX.....XX.',
    ],
    patasA: ['X.X.....X.X', 'X.........X'],
    patasB: ['X.........X', '..X.....X..'],
  },
};

const COLOR_FILA = ['--color-peligro', '--color-acento', '--color-acento', '--color-info'];

class RenderizadorLienzo {
  constructor(canvas, juego) {
    this.canvas = canvas;
    this.juego = juego;
    this.ctx = canvas.getContext('2d');
    this.tiempo = 0;
    this._colores = RenderizadorLienzo._leerTokens();
    this._estrellas = RenderizadorLienzo._crearEstrellas(90);
    this._degradado = null;

    this.redimensionar();
    window.addEventListener('resize', () => this.redimensionar());
  }

  /** Lee las variables CSS del :root (los tokens son la fuente de verdad) */
  static _leerTokens() {
    const estilos = getComputedStyle(document.documentElement);
    const leer = (nombre, porDefecto) =>
      estilos.getPropertyValue(nombre).trim() || porDefecto;
    return {
      fondo: leer('--color-fondo', '#0d0a1a'),
      texto: leer('--color-texto', '#f5f4fa'),
      textoTenue: leer('--color-texto-tenue', '#b9b5c9'),
      acento: leer('--color-acento', '#c8f542'),
      info: leer('--color-info', '#4de6f2'),
      peligro: leer('--color-peligro', '#ff5c47'),
    };
  }

  static _crearEstrellas(cantidad) {
    const estrellas = [];
    for (let i = 0; i < cantidad; i++) {
      estrellas.push({
        x: Math.random() * LIENZO.ancho,
        y: Math.random() * LIENZO.alto,
        tam: Math.random() < 0.2 ? 2 : 1,
        vel: 4 + Math.random() * 14,
        tenue: Math.random() < 0.5,
      });
    }
    return estrellas;
  }

  /** Ajusta el bitmap al dispositivo (pantallas de alta densidad) */
  redimensionar() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.round(LIENZO.ancho * dpr);
    this.canvas.height = Math.round(LIENZO.alto * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this._degradado = null;
  }

  /**
   * @param {number} tiempo segundos acumulados para animaciones (estrellas,
   * parpadeos, sprites)
   */
  renderizar(tiempo) {
    this.tiempo = tiempo;
    const ctx = this.ctx;
    const juego = this.juego;

    // 1) Limpiar el lienzo
    ctx.clearRect(0, 0, LIENZO.ancho, LIENZO.alto);

    // 2) Pintar por capas: fondo → defensa → enemigos → proyectiles → nave
    this._dibujarFondo();
    this._dibujarLineaDefensa();
    this._dibujarBarreras(juego.barreras);

    if (juego.ovni) this._dibujarOvni(juego.ovni);
    this._dibujarEnemigos(juego.enemigos);
    this._dibujarPotenciadores(juego.potenciadores);
    this._dibujarProyectiles(juego.proyectiles);

    if (juego.nave && juego.fase !== 'menu') this._dibujarNave(juego.nave);

    this._dibujarEfectos(juego.efectos);
  }

  _dibujarFondo() {
    const ctx = this.ctx;
    if (!this._degradado) {
      const g = ctx.createLinearGradient(0, 0, 0, LIENZO.alto);
      g.addColorStop(0, 'hsl(265 55% 14%)');
      g.addColorStop(1, 'hsl(265 50% 5%)');
      this._degradado = g;
    }
    ctx.fillStyle = this._degradado;
    ctx.fillRect(0, 0, LIENZO.ancho, LIENZO.alto);

    // Estrellas en movimiento (animación continua con el tiempo)
    const { texto, textoTenue } = this._colores;
    for (const estrella of this._estrellas) {
      const y =
        (estrella.y + this.tiempo * estrella.vel) % (LIENZO.alto + 4) - 2;
      ctx.fillStyle = estrella.tenue ? textoTenue : texto;
      ctx.globalAlpha = estrella.tenue ? 0.35 : 0.7;
      ctx.fillRect(estrella.x, y, estrella.tam, estrella.tam);
    }
    ctx.globalAlpha = 1;
  }

  _dibujarLineaDefensa() {
    const ctx = this.ctx;
    const y = LIENZO.alto - 56;
    ctx.save();
    ctx.strokeStyle = this._colores.peligro;
    ctx.globalAlpha = 0.35;
    ctx.setLineDash([6, 8]);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(LIENZO.ancho, y);
    ctx.stroke();
    ctx.restore();
  }

  _dibujarBarreras(barreras) {
    const ctx = this.ctx;
    ctx.fillStyle = this._colores.textoTenue;
    for (const barrera of barreras) {
      for (const celda of barrera.celdas) {
        if (!celda.activa) continue;
        ctx.fillRect(celda.x, celda.y, 5, 5);
      }
    }
  }

  _dibujarEnemigos(enemigos) {
    const ctx = this.ctx;
    const { celda } = ENEMIGOS;
    const frame = Math.floor(this.tiempo * 2.5) % 2;

    for (const e of enemigos) {
      if (!e.vivo) continue;
      const sprite = SPRITES[e.tipo];
      const filas = sprite.cuerpo.concat(frame === 0 ? sprite.patasA : sprite.patasB);
      ctx.fillStyle = this._colores[
        ['peligro', 'acento', 'acento', 'info'][e.fila]
      ];

      for (let r = 0; r < filas.length; r++) {
        const fila = filas[r];
        for (let c = 0; c < fila.length; c++) {
          if (fila[c] === 'X') {
            ctx.fillRect(e.x + c * celda, e.y + r * celda, celda, celda);
          }
        }
      }
    }
  }

  _dibujarOvni(ovni) {
    const ctx = this.ctx;
    const { x, y, w, h } = ovni;
    ctx.save();
    ctx.fillStyle = this._colores.peligro;
    ctx.beginPath();
    ctx.ellipse(x + w / 2, y + h * 0.6, w / 2, h * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + w / 2, y + h * 0.45, h * 0.4, Math.PI, 0);
    ctx.fill();
    // Patas
    ctx.fillRect(x + 4, y + h * 0.8, 4, 3);
    ctx.fillRect(x + w / 2 - 2, y + h * 0.8, 4, 3);
    ctx.fillRect(x + w - 8, y + h * 0.8, 4, 3);
    ctx.restore();
  }

  _dibujarProyectiles(proyectiles) {
    const ctx = this.ctx;
    for (const b of proyectiles) {
      if (!b.vivo) continue;
      ctx.fillStyle =
        b.dueno === 'jugador' ? this._colores.acento : this._colores.peligro;
      ctx.fillRect(b.x, b.y, b.w, b.h);
    }
  }

  _dibujarPotenciadores(potenciadores) {
    const ctx = this.ctx;
    const letras = { escudo: 'E', rafaga: 'R', vida: 'V' };
    const colores = { escudo: 'info', rafaga: 'acento', vida: 'peligro' };

    for (const p of potenciadores) {
      if (!p.vivo) continue;
      ctx.save();
      ctx.fillStyle = this._colores[colores[p.tipo]];
      ctx.globalAlpha = 0.9;
      ctx.fillRect(p.x, p.y, p.w, p.h);
      ctx.globalAlpha = 1;
      ctx.fillStyle = 'hsl(265 45% 6%)';
      ctx.font = 'bold 12px ui-monospace, monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(letras[p.tipo], p.x + p.w / 2, p.y + p.h / 2 + 1);
      ctx.restore();
    }
  }

  _dibujarNave(nave) {
    const ctx = this.ctx;
    const { x, y, w, h } = nave;

    // Parpadeo durante la invulnerabilidad
    const parpadeo =
      nave.invulnerable > 0 && Math.floor(this.tiempo * 12) % 2 === 0;
    if (parpadeo) return;

    // Anillo del escudo
    if (nave.escudo > 0) {
      ctx.save();
      ctx.strokeStyle = this._colores.info;
      ctx.globalAlpha = 0.5 + 0.3 * Math.sin(this.tiempo * 6);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x + w / 2, y + h / 2, w * 0.75, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    ctx.save();
    ctx.fillStyle = this._colores.acento;

    // Casco
    ctx.beginPath();
    ctx.moveTo(x, y + h);
    ctx.lineTo(x + 6, y + h);
    ctx.lineTo(x + 9, y + 10);
    ctx.lineTo(x + 13, y + 10);
    ctx.lineTo(x + 13, y + 4);
    ctx.lineTo(x + 21, y + 4);
    ctx.lineTo(x + 21, y + 10);
    ctx.lineTo(x + 25, y + 10);
    ctx.lineTo(x + 28, y + h);
    ctx.lineTo(x + w, y + h);
    ctx.closePath();
    ctx.fill();

    // Cañón
    ctx.fillRect(x + w / 2 - 2, y - 8, 4, 14);

    // Cabina
    ctx.fillStyle = this._colores.info;
    ctx.fillRect(x + w / 2 - 3, y + 5, 6, 5);
    ctx.restore();
  }

  _dibujarEfectos(efectos) {
    const ctx = this.ctx;
    const colores = {
      acento: this._colores.acento,
      info: this._colores.info,
      peligro: this._colores.peligro,
      neutro: this._colores.texto,
    };

    for (const efecto of efectos) {
      ctx.save();
      ctx.globalAlpha = 1 - efecto.progreso;
      ctx.fillStyle = colores[efecto.tono] || colores.neutro;
      for (const p of efecto.particulas) {
        ctx.fillRect(p.x, p.y, p.tam, p.tam);
      }
      ctx.restore();
    }
  }
}

Object.assign(Arcade, { RenderizadorLienzo });
})(window.Arcade = window.Arcade || {});
