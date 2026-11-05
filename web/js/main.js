/* ==========================================================================
   main.js — Punto de entrada
   Compone las tres piezas del patrón MVC y las conecta:
   - Modelo (Juego): estado y reglas de la partida.
   - Vista (RenderizadorLienzo + VistaUi): dibujo en canvas y DOM.
   - Controlador (ControladorEntrada + BucleJuego): entrada y bucle.
   ========================================================================== */

(function (Arcade) {
'use strict';

const { Ajustes } = Arcade;
const { Juego, FASE } = Arcade;
const { RenderizadorLienzo } = Arcade;
const { VistaUi } = Arcade;
const { ControladorEntrada } = Arcade;
const { BucleJuego } = Arcade;

const lienzo = document.getElementById('lienzo');

const ajustes = new Ajustes();
const juego = new Juego(ajustes);

/** Traduce los comandos de la interfaz y del teclado en acciones del modelo */
function manejarComando(comando, valor) {
  switch (comando) {
    case 'iniciar':
    case 'reiniciar':
      juego.iniciar();
      break;

    case 'reanudar':
      juego.reanudar();
      break;

    case 'pausar':
      juego.pausar();
      break;

    case 'alternar-pausa':
      if (juego.fase === FASE.JUGANDO) juego.pausar();
      else if (juego.fase === FASE.PAUSA) juego.reanudar();
      break;

    case 'terminar':
      juego.terminar();
      break;

    case 'menu':
      juego.volverAlMenu();
      break;

    case 'ayuda':
      // Abrir la ayuda desde la partida la deja en pausa
      if (juego.fase === FASE.JUGANDO) juego.pausar();
      if (vista.ayudaAbierta) vista.cerrarAyuda();
      else vista.mostrarAyuda();
      break;

    case 'escape':
      if (vista.ayudaAbierta) break;
      if (juego.fase === FASE.JUGANDO) juego.pausar();
      else if (juego.fase === FASE.PAUSA) juego.reanudar();
      break;

    case 'enter':
      // Enter sólo empieza (menú) o reanuda (pausa); el reinicio es la tecla R
      if (vista.ayudaAbierta) break;
      if (juego.fase === FASE.MENU) juego.iniciar();
      else if (juego.fase === FASE.PAUSA) juego.reanudar();
      break;

    case 'ajuste':
      if (valor && valor.nombre === 'dificultad') {
        ajustes.cambiar(valor.valor);
        vista.sincronizar(juego);
      }
      break;

    default:
      break;
  }
}

const vista = new VistaUi({ onComando: manejarComando });
const entrada = new ControladorEntrada({
  onComando: (comando) => manejarComando(comando),
});
const renderizador = new RenderizadorLienzo(lienzo, juego);

const bucle = new BucleJuego({
  actualizar: (dt) => juego.actualizar(dt, entrada.estado),
  renderizar: (tiempo) => {
    renderizador.renderizar(tiempo);
    vista.sincronizar(juego);
  },
});

// Sincronización inicial de la interfaz y arranque del bucle
vista.sincronizar(juego);
bucle.arrancar();
})(window.Arcade = window.Arcade || {});
