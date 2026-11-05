/* ==========================================================================
   GameLoop.js — Bucle principal del juego
   Centraliza el juego en un único ciclo requestAnimationFrame:
   actualizar (estado y movimiento) → renderizar (vista) → sincronizar UI.
   Se usa requestAnimationFrame en lugar de setInterval/setTimeout porque
   sincroniza el ciclo con el refresco del monitor (~60 fps).
   ========================================================================== */

(function (Arcade) {
'use strict';

class BucleJuego {
  /**
   * @param {{ actualizar: (dt: number) => void,
   *          renderizar: (tiempo: number) => void }} opciones
   */
  constructor({ actualizar, renderizar }) {
    this.actualizar = actualizar;
    this.renderizar = renderizar;
    this._anterior = 0;
    this._tiempo = 0;
    this._corriendo = false;
    this._paso = this._paso.bind(this);
  }

  arrancar() {
    if (this._corriendo) return;
    this._corriendo = true;
    this._anterior = performance.now();
    requestAnimationFrame(this._paso);
  }

  _paso(ahora) {
    if (!this._corriendo) return;

    // dt en segundos, limitado para evitar saltos grandes tras una
    // pestaña en segundo plano
    const dt = Math.min((ahora - this._anterior) / 1000, 0.05);
    this._anterior = ahora;
    this._tiempo += dt;

    this.actualizar(dt);
    this.renderizar(this._tiempo);

    requestAnimationFrame(this._paso);
  }
}

Object.assign(Arcade, { BucleJuego });
})(window.Arcade = window.Arcade || {});
