/* ==========================================================================
   constantes.js — Constantes del juego (única fuente de verdad)
   QUÉ ES: el panel de ajustes del juego. Todos los números y nombres que
   gobiernan la partida están aquí, para que Modelo, Vista y Controlador
   compartan los mismos valores sin duplicarlos.
   CONTIENE: · lienzo · dificultades · nave · proyectiles · enemigos ·
             barreras · ovni · potenciadores · reglas · fases
   DÓNDE TOCAR:
     · Cambiar puntos, vidas, velocidades o tamaños → edita la constante
       correspondiente; el juego y la ayuda se actualizan solos.
     · Añadir una dificultad → añade una entrada en DIFICULTADES (los tres
       selectores del HTML la mostrarán automáticamente).
     · Añadir un tipo de potenciador → añádelo a POTENCIADOR.tipos y aplica
       su efecto en Juego._recogerPotenciador.
     · Cambiar el nombre de una fase → modifica FASE (se usa en las 3 capas).
   ========================================================================== */

(function (Arcade) {
'use strict';

/** Lienzo lógico: dimensiones en unidades de diseño (px) */
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
    descripcion: '4 vidas',
    vidas: 4,
    factorVelocidad: 0.75,
    cadenciaEnemiga: 0.6,
    probabilidadPotenciador: 0.12,
  },
  normal: {
    id: 'normal',
    etiqueta: 'Normal',
    descripcion: '3 vidas',
    vidas: 3,
    factorVelocidad: 1,
    cadenciaEnemiga: 1,
    probabilidadPotenciador: 0.08,
  },
  dificil: {
    id: 'dificil',
    etiqueta: 'Difícil',
    descripcion: 'veloz y agresiva',
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

/** Fases de la máquina de estados del juego: vocabulario compartido por
    Modelo, Vista y Controlador (nunca como cadenas sueltas) */
const FASE = {
  MENU: 'menu',
  JUGANDO: 'jugando',
  PAUSA: 'pausado',
  FIN: 'fin',
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
  FASE,
});
})(window.Arcade = window.Arcade || {});
