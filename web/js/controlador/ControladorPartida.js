/* ==========================================================================
   ControladorPartida.js — Controlador principal del patrón MVC
   QUÉ ES: el intermediario del patrón. Recibe las peticiones del usuario
   (desde la vista y desde el teclado), las traduce en acciones sobre el
   modelo y reparte el resultado a las vistas.
   CONTIENE: · manejarComando (traducción) · acciones compuestas · bucle
   DÓNDE TOCAR:
     · Añadir un comando nuevo → un case en manejarComando() (+ data-comando
       en index.html y/o una tecla en ControladorEntrada).
     · Cambiar lo que ocurre al pausar o abrir la ayuda → _alternarPausa /
       _alternarAyuda.
     · Cambiar qué se reparte cada fotograma → _actualizar / _renderizar.
   ========================================================================== */

(function (Arcade) {
'use strict';

const { FASE, BucleJuego } = Arcade;

class ControladorPartida {
  /**
   * @param {{ juego: object, ajustes: object, vista: object,
   *          entrada: object, renderizador: object }} opciones
   */
  constructor({ juego, ajustes, vista, entrada, renderizador }) {
    this.juego = juego;
    this.ajustes = ajustes;
    this.vista = vista;
    this.entrada = entrada;
    this.renderizador = renderizador;

    this.bucle = new BucleJuego({
      actualizar: (dt) => this._actualizar(dt),
      renderizar: (tiempo) => this._renderizar(tiempo),
    });
  }

  /** Sincroniza la interfaz y arranca el bucle principal */
  arrancar() {
    this._sincronizar();
    this.bucle.arrancar();
  }

  /**
   * Traduce una petición del usuario en acciones sobre el modelo.
   * @param {string} comando  petición (botón de la interfaz o tecla)
   * @param {*} [valor]       datos asociados (p. ej. un ajuste)
   */
  manejarComando(comando, valor) {
    switch (comando) {
      case 'iniciar':
      case 'reiniciar':
        this.juego.iniciar();
        break;

      case 'reanudar':
        this.juego.reanudar();
        break;

      case 'terminar':
        this.juego.terminar();
        break;

      case 'menu':
        this.juego.volverAlMenu();
        break;

      case 'alternar-pausa':
      case 'escape':
        if (this.vista.ayudaAbierta) break;
        this._alternarPausa();
        break;

      case 'ayuda':
        this._alternarAyuda();
        break;

      case 'enter':
        // Enter sólo empieza (menú) o reanuda (pausa); el reinicio es la tecla R
        if (this.vista.ayudaAbierta) break;
        if (this.juego.fase === FASE.MENU) this.juego.iniciar();
        else if (this.juego.fase === FASE.PAUSA) this.juego.reanudar();
        break;

      case 'ajuste':
        if (valor && valor.nombre === 'dificultad') {
          this.ajustes.cambiar(valor.valor);
          this._sincronizar();
        }
        break;

      default:
        break;
    }
  }

  /* ------------------------------------------------------------------
     Acciones compuestas
     ------------------------------------------------------------------ */

  /** Alterna entre jugando y pausado */
  _alternarPausa() {
    if (this.juego.fase === FASE.JUGANDO) this.juego.pausar();
    else if (this.juego.fase === FASE.PAUSA) this.juego.reanudar();
  }

  _alternarAyuda() {
    // Abrir la ayuda desde la partida la deja en pausa
    if (this.juego.fase === FASE.JUGANDO) this.juego.pausar();
    if (this.vista.ayudaAbierta) this.vista.cerrarAyuda();
    else this.vista.mostrarAyuda();
  }

  /* ------------------------------------------------------------------
     Bucle: actualiza el modelo y vuelca el resultado en las vistas
     ------------------------------------------------------------------ */

  /** Cada fotograma: pasa la intención del jugador al modelo */
  _actualizar(dt) {
    this.juego.actualizar(dt, this.entrada.intencion);
  }

  /** Cada fotograma: dibuja la escena y sincroniza la interfaz */
  _renderizar(tiempo) {
    this.renderizador.renderizar(this.juego.obtenerEscena(), tiempo);
    this._sincronizar();
  }

  /** Entrega el estado actual del modelo a la vista de la interfaz */
  _sincronizar() {
    this.vista.sincronizar(this.juego.obtenerEstado());
  }
}

Object.assign(Arcade, { ControladorPartida });
})(window.Arcade = window.Arcade || {});
