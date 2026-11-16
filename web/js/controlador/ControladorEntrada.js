/* ==========================================================================
   ControladorEntrada.js — Controlador de entrada
   QUÉ ES: traduce el teclado en dos cosas: comandos discretos (pausa, ayuda…)
   y la intención de movimiento que consume el modelo cada fotograma.
   Se usa addEventListener; nunca atributos onXXX en el HTML.
   CONTIENE: · mapa de teclas a comandos · estado de movimiento · filtros
   DÓNDE TOCAR:
     · Mapear una tecla nueva a un comando → COMANDOS_TECLA.
     · Cambiar las teclas de movimiento o disparo → _alPulsar/_alSoltar.
     · Añadir un comando nuevo → añádelo aquí y su case en ControladorPartida.
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
   * @param {{ onComando: (comando: string) => void,
   *          dialogoAbierto: () => boolean }} opciones
   *        dialogoAbierto informa del estado de la vista de ayuda
   */
  constructor({ onComando, dialogoAbierto }) {
    this.onComando = onComando;
    this.dialogoAbierto = dialogoAbierto;
    this._estado = { izquierda: false, derecha: false, disparo: false };

    this._alPulsar = this._alPulsar.bind(this);
    this._alSoltar = this._alSoltar.bind(this);
    this._alPerderFoco = this._alPerderFoco.bind(this);

    window.addEventListener('keydown', this._alPulsar);
    window.addEventListener('keyup', this._alSoltar);
    window.addEventListener('blur', this._alPerderFoco);
  }

  /** Intención de movimiento para el modelo (traducción del estado de teclado) */
  get intencion() {
    return {
      direccion:
        (this._estado.derecha ? 1 : 0) - (this._estado.izquierda ? 1 : 0),
      disparo: this._estado.disparo,
    };
  }

  /** ¿El evento debe ignorarse por estar en un control nativo? */
  _debeIgnorar(evento) {
    const objetivo = evento.target;
    const esElemento = objetivo instanceof Element;

    // Con el diálogo de ayuda abierto sólo se atiende el comando de ayuda
    // (cerrar); Escape lo cierra el propio diálogo de forma nativa.
    if (this.dialogoAbierto()) {
      return COMANDOS_TECLA.get(evento.key) !== 'ayuda';
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

  /** Gestor de tecla pulsada: activa movimiento o lanza un comando */
  _alPulsar(evento) {
    if (this._debeIgnorar(evento)) return;

    switch (evento.key) {
      case 'ArrowLeft':
      case 'a':
      case 'A':
        this._estado.izquierda = true;
        evento.preventDefault();
        return;
      case 'ArrowRight':
      case 'd':
      case 'D':
        this._estado.derecha = true;
        evento.preventDefault();
        return;
      case ' ':
        this._estado.disparo = true;
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

  /** Gestor de tecla soltada: desactiva el movimiento correspondiente */
  _alSoltar(evento) {
    switch (evento.key) {
      case 'ArrowLeft':
      case 'a':
      case 'A':
        this._estado.izquierda = false;
        break;
      case 'ArrowRight':
      case 'd':
      case 'D':
        this._estado.derecha = false;
        break;
      case ' ':
        this._estado.disparo = false;
        break;
      default:
        break;
    }
  }

  /** Al perder el foco se sueltan todas las teclas (evita movimientos pegados) */
  _alPerderFoco() {
    this.limpiar();
  }

  /** Suelta todas las teclas (evita movimientos pegados) */
  limpiar() {
    this._estado.izquierda = false;
    this._estado.derecha = false;
    this._estado.disparo = false;
  }
}

Object.assign(Arcade, { ControladorEntrada });
})(window.Arcade = window.Arcade || {});
