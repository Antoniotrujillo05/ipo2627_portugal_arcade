/* ==========================================================================
   config.js — Constantes del juego
   Centralizadas para que Modelo, Vista y Controlador compartan los mismos
   valores sin duplicarlos (una sola fuente de verdad).
   ========================================================================== */

/** Lienzo lógico: dimensiones en unidades de diseño (px) */
(function (Arcade) {
'use strict';

const LIENZO = {
  ancho: 480,
  alto: 640,
  margen: 18,
};

/** Ajustes prepartida (parámetros configurables por el usuario) */
const DIFICULTADES = {
  facil: {
    id: 'facil',
    etiqueta: 'Fácil',
    vidas: 4,
    factorVelocidad: 0.75,
    cadenciaEnemiga: 0.6,
    probabilidadPotenciador: 0.12,
  },
  normal: {
    id: 'normal',
    etiqueta: 'Normal',
    vidas: 3,
    factorVelocidad: 1,
    cadenciaEnemiga: 1,
    probabilidadPotenciador: 0.08,
  },
  dificil: {
    id: 'dificil',
    etiqueta: 'Difícil',
    vidas: 3,
    factorVelocidad: 1.3,
    cadenciaEnemiga: 1.6,
    probabilidadPotenciador: 0.05,
  },
};

const DIFICULTAD_POR_DEFECTO = 'normal';

/** Nave del jugador: física de movimiento (aceleración y rozamiento) */
const JUGADOR = {
  ancho: 34,
  alto: 20,
  y: LIENZO.alto - 56,
  aceleracion: 1600,
  velocidadMax: 270,
  rozamiento: 2000,
  cadencia: 0.38,
  invulnerable: 1.6,
  escudoMax: 3,
  vidasMax: 5,
};

/** Proyectiles */
const PROYECTIL = {
  anchoJugador: 3,
  altoJugador: 12,
  velocidadJugador: 460,
  anchoEnemigo: 3,
  altoEnemigo: 10,
  velocidadEnemigo: 235,
};

/** Flota enemiga: 8 columnas × 4 filas */
const ENEMIGOS = {
  columnas: 8,
  filas: 4,
  ancho: 33,
  alto: 24,
  celda: 3,
  separacionX: 46,
  separacionY: 34,
  y0: 100,
  tipos: ['calamar', 'cangrejo', 'cangrejo', 'pulpo'],
  puntos: [30, 20, 20, 10],
  velocidadBase: 24,
  velocidadExtra: 90,
  descenso: 14,
  intervaloDisparo: 1.15,
};

/** Barreras destructibles (patrón con arco inferior) */
const BARRERAS = {
  cantidad: 3,
  celdasX: 11,
  celdasY: 5,
  celda: 5,
  y: LIENZO.alto - 170,
};

/** Ovni bonus */
const OVNI = {
  ancho: 34,
  alto: 16,
  y: 52,
  velocidad: 95,
  puntos: [50, 100, 150],
  intervaloMin: 9,
  intervaloMax: 17,
};

/** Potenciadores que caen de los enemigos */
const POTENCIADOR = {
  ancho: 22,
  alto: 18,
  velocidadInicial: 45,
  gravedad: 60,
  tipos: ['escudo', 'rafaga', 'vida'],
  duracionRafaga: 8,
  puntos: 25,
};

/** Reglas generales de la partida */
const JUEGO = {
  pausaOleada: 1.8,
  bonusOleada: 100,
  claveRecord: 'portugal-arcade.record',
};

Object.assign(Arcade, {
  LIENZO,
  DIFICULTADES,
  DIFICULTAD_POR_DEFECTO,
  JUGADOR,
  PROYECTIL,
  ENEMIGOS,
  BARRERAS,
  OVNI,
  POTENCIADOR,
  JUEGO,
});
})(window.Arcade = window.Arcade || {});
