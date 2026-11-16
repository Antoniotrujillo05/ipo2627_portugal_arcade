/* ==========================================================================
   main.js — Punto de entrada
   QUÉ ES: donde se compone el patrón MVC: se crean las piezas, se conectan
   entre sí y se arranca. No contiene lógica de juego.
   CONTIENE: · creación del modelo, las vistas y el controlador · cableado
   DÓNDE TOCAR:
     · Casi ningún cambio vive aquí: la lógica está en constantes.js, modelo/,
       vista/ o controlador/.
     · Si quisieras crear piezas nuevas (p. ej. otra vista), se crearían aquí.
   Las piezas son:
   - Modelo (Juego + Ajustes): estado y reglas de la partida.
   - Vista (RenderizadorLienzo + VistaUi): dibujo en canvas y DOM.
   - Controlador (ControladorPartida + ControladorEntrada + BucleJuego):
     peticiones del usuario, traducción a acciones y bucle principal.
   ========================================================================== */

(function (Arcade) {
'use strict';

const {
  Ajustes,
  Juego,
  RenderizadorLienzo,
  VistaUi,
  ControladorEntrada,
  ControladorPartida,
} = Arcade;

// Modelo
const ajustes = new Ajustes();
const juego = new Juego(ajustes);

// Vistas
const renderizador = new RenderizadorLienzo(document.getElementById('lienzo'));
const vista = new VistaUi({
  onComando: (comando, valor) => controlador.manejarComando(comando, valor),
});

// Controlador de entrada: el estado de la vista de ayuda se le inyecta
const entrada = new ControladorEntrada({
  onComando: (comando) => controlador.manejarComando(comando),
  dialogoAbierto: () => vista.ayudaAbierta,
});

// Controlador principal (los callbacks anteriores sólo se ejecutan cuando
// el usuario actúa, con el controlador ya creado)
const controlador = new ControladorPartida({
  juego,
  ajustes,
  vista,
  entrada,
  renderizador,
});

controlador.arrancar();
})(window.Arcade = window.Arcade || {});
