/* ==========================================================================
   Ajustes.js — Parámetros ajustables por el usuario
   QUÉ ES: los ajustes de la partida (hoy sólo la dificultad), que se pueden
   cambiar antes de comenzar y durante la pausa.
   CONTIENE: · Ajustes (dificultad activa y su cambio)
   DÓNDE TOCAR:
     · Añadir un ajuste nuevo (p. ej. velocidad personalizada) → añade un
       campo aquí, explótalo en Juego.js y añade su control en index.html
       con el atributo data-ajuste.
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
}

Object.assign(Arcade, { Ajustes });
})(window.Arcade = window.Arcade || {});
