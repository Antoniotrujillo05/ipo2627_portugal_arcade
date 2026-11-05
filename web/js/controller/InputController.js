/* ==========================================================================
   InputController.js — Controlador de entrada
   Traduce los eventos del teclado en estado de movimiento (que el modelo
   consulta cada fotograma) y en comandos discretos (pausa, ayuda…).
   Se usa addEventListener; nunca atributos onXXX en el HTML.
   ========================================================================== */

(function (Arcade) {
'use strict';

const COMANDOS_TECLA = new Map([
  ['p', 'alternar-pausa'],
  ['P', 'alternar-pausa'],
  ['Escape', 'escape'],
  ['Enter', 'enter'],
  ['h', 'ayuda'],
  ['H', 'ayuda'],
  ['r', 'reiniciar'],
  ['R', 'reiniciar'],
]);

class ControladorEntrada {
  /**
   * @param {{ onComando: (comando: string) => void }} opciones
   */
  constructor({ onComando }) {
    this.onComando = onComando;
    this.estado = { izquierda: false, derecha: false, disparo: false };

    this._alPulsar = this._alPulsar.bind(this);
    this._alSoltar = this._alSoltar.bind(this);
    this._alPerderFoco = this._alPerderFoco.bind(this);

    window.addEventListener('keydown', this._alPulsar);
    window.addEventListener('keyup', this._alSoltar);
    window.addEventListener('blur', this._alPerderFoco);
  }

  /** ¿El evento debe ignorarse por estar en un control nativo? */
  _ignorar(evento) {
    const objetivo = evento.target;
    const esElemento = objetivo instanceof Element;

    // Con el diálogo de ayuda abierto sólo se atiende H (cerrar);
    // Escape lo cierra el propio diálogo de forma nativa.
    if (document.querySelector('dialog[open]')) {
      return evento.key !== 'h' && evento.key !== 'H';
    }

    // Los campos nativos (select…) manejan sus propias teclas
    if (esElemento && objetivo.closest('select, input, textarea')) return true;

    // Espacio/Enter sobre un botón: se deja activar el botón de forma nativa
    if (
      (evento.key === ' ' || evento.key === 'Enter') &&
      esElemento &&
      objetivo.closest('button, a')
    ) {
      return true;
    }

    return false;
  }

  _alPulsar(evento) {
    if (this._ignorar(evento)) return;

    switch (evento.key) {
      case 'ArrowLeft':
      case 'a':
      case 'A':
        this.estado.izquierda = true;
        evento.preventDefault();
        return;
      case 'ArrowRight':
      case 'd':
      case 'D':
        this.estado.derecha = true;
        evento.preventDefault();
        return;
      case ' ':
        this.estado.disparo = true;
        evento.preventDefault();
        return;
      default:
        break;
    }

    // Comandos discretos: sin repetición automática
    const comando = COMANDOS_TECLA.get(evento.key);
    if (comando && !evento.repeat) {
      evento.preventDefault();
      this.onComando(comando);
    }
  }

  _alSoltar(evento) {
    switch (evento.key) {
      case 'ArrowLeft':
      case 'a':
      case 'A':
        this.estado.izquierda = false;
        break;
      case 'ArrowRight':
      case 'd':
      case 'D':
        this.estado.derecha = false;
        break;
      case ' ':
        this.estado.disparo = false;
        break;
      default:
        break;
    }
  }

  /** Al perder el foco se sueltan todas las teclas (evita movimientos pegados) */
  _alPerderFoco() {
    this.limpiar();
  }

  limpiar() {
    this.estado.izquierda = false;
    this.estado.derecha = false;
    this.estado.disparo = false;
  }
}

Object.assign(Arcade, { ControladorEntrada });
})(window.Arcade = window.Arcade || {});
