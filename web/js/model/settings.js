/* ==========================================================================
   settings.js — Parámetros ajustables por el usuario
   La dificultad se puede cambiar antes de comenzar y durante la pausa.
   ========================================================================== */

(function (Arcade) {
'use strict';

const { DIFICULTADES, DIFICULTAD_POR_DEFECTO } = Arcade;

class Ajustes {
  constructor() {
    this._dificultad = DIFICULTAD_POR_DEFECTO;
  }

  get dificultad() {
    return this._dificultad;
  }

  /** Valores efectivos de la dificultad activa */
  get valores() {
    return DIFICULTADES[this._dificultad];
  }

  /** Cambia la dificultad. Devuelve false si el identificador no existe. */
  cambiar(id) {
    if (!Object.prototype.hasOwnProperty.call(DIFICULTADES, id)) {
      return false;
    }
    this._dificultad = id;
    return true;
  }

  /** Lista para poblar los selectores de la vista */
  static get opciones() {
    return Object.values(DIFICULTADES);
  }
}

Object.assign(Arcade, { Ajustes });
})(window.Arcade = window.Arcade || {});
