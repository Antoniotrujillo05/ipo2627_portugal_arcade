/* ==========================================================================
   entities.js — Entidades del modelo
   Objetos de datos con su comportamiento mínimo. No conocen el DOM ni el
   contexto 2D: sólo guardan estado y lo actualizan.
   ========================================================================== */

(function (Arcade) {
'use strict';

/** Nave del jugador */
class Nave {
  constructor({ x, y, w, h }) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.vx = 0;
    this.tiempoDisparo = 0;
    this.invulnerable = 0;
    this.escudo = 0;
    this.rapido = 0;
  }
}

/** Proyectil (propio o enemigo) */
class Proyectil {
  constructor({ x, y, w, h, vx, vy, dueno }) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.vx = vx;
    this.vy = vy;
    this.dueno = dueno;
    this.vivo = true;
  }
}

/** Enemigo de la flota */
class Enemigo {
  constructor({ x, y, w, h, fila, tipo, puntos }) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.fila = fila;
    this.tipo = tipo;
    this.puntos = puntos;
    this.vivo = true;
  }
}

/** Ovni bonus que cruza la parte superior */
class Ovni {
  constructor({ x, y, w, h, vx, puntos }) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.vx = vx;
    this.puntos = puntos;
    this.vivo = true;
  }
}

/** Barrera compuesta por celdas destructibles */
class Barrera {
  constructor({ x, y, celdasX, celdasY, celda }) {
    this.x = x;
    this.y = y;
    this.w = celdasX * celda;
    this.h = celdasY * celda;
    this.celdas = [];

    for (let fila = 0; fila < celdasY; fila++) {
      for (let col = 0; col < celdasX; col++) {
        // Arco inferior central: hueco típico de las barreras
        const esArco = fila >= celdasY - 2 && col >= 4 && col <= 6;
        if (esArco) continue;
        this.celdas.push({
          x: x + col * celda,
          y: y + fila * celda,
          activa: true,
        });
      }
    }
  }

  /**
   * Erosiona las celdas que se solapan con la caja recibida.
   * Devuelve el número de celdas destruidas (0 si no hay efecto).
   */
  danar(caja) {
    let destruidas = 0;
    for (const celda of this.celdas) {
      if (!celda.activa) continue;
      const solapa =
        caja.x < celda.x + 5 &&
        caja.x + caja.w > celda.x &&
        caja.y < celda.y + 5 &&
        caja.y + caja.h > celda.y;
      if (solapa) {
        celda.activa = false;
        destruidas += 1;
      }
    }
    return destruidas;
  }
}

/** Potenciador que cae */
class Potenciador {
  constructor({ x, y, w, h, tipo }) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.tipo = tipo;
    this.vy = 0;
    this.vivo = true;
  }
}

/** Efecto visual temporal (explosión con partículas) */
class Efecto {
  constructor({ x, y, tono, cantidad = 12, radio = 14, duracion = 0.45 }) {
    this.x = x;
    this.y = y;
    this.tono = tono;
    this.t = 0;
    this.duracion = duracion;
    this.particulas = [];

    for (let i = 0; i < cantidad; i++) {
      const angulo = (Math.PI * 2 * i) / cantidad + Math.random() * 0.5;
      const velocidad = radio * (1.6 + Math.random() * 1.5);
      this.particulas.push({
        x,
        y,
        vx: Math.cos(angulo) * velocidad,
        vy: Math.sin(angulo) * velocidad,
        tam: 2 + Math.random() * 2.5,
      });
    }
  }

  get progreso() {
    return Math.min(1, this.t / this.duracion);
  }

  actualizar(dt) {
    this.t += dt;
    for (const p of this.particulas) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.92;
      p.vy *= 0.92;
    }
  }

  get agotado() {
    return this.t >= this.duracion;
  }
}

Object.assign(Arcade, {
  Nave,
  Proyectil,
  Enemigo,
  Ovni,
  Barrera,
  Potenciador,
  Efecto,
});
})(window.Arcade = window.Arcade || {});
