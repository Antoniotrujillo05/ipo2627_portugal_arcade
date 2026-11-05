/* ==========================================================================
   physics.js — Física y utilidades matemáticas del modelo
   Sin dependencias del DOM: sólo cálculo puro.
   ========================================================================== */

(function (Arcade) {
'use strict';

/**
 * Colisión AABB entre dos entidades con propiedades x, y, w, h.
 */
function colisiona(a, b) {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}

/** Restringe un valor al intervalo [min, max] */
function limitar(valor, min, max) {
  return Math.min(max, Math.max(min, valor));
}

/** Número aleatorio en [min, max) */
function aleatorio(min, max) {
  return min + Math.random() * (max - min);
}

/** Elemento aleatorio de una lista */
function elegir(lista) {
  return lista[Math.floor(Math.random() * lista.length)];
}

/**
 * Aplica una aceleración con rozamiento a la velocidad de una entidad
 * (física de velocidad + frenado), limitada a una velocidad máxima.
 */
function acelerar(velocidad, direccion, dt, { aceleracion, rozamiento, velocidadMax }) {
  let v = velocidad;
  if (direccion !== 0) {
    v += direccion * aceleracion * dt;
  } else if (v !== 0) {
    const signo = Math.sign(v);
    v -= signo * rozamiento * dt;
    if (Math.sign(v) !== signo) v = 0;
  }
  return limitar(v, -velocidadMax, velocidadMax);
}

Object.assign(Arcade, { colisiona, limitar, aleatorio, elegir, acelerar });
})(window.Arcade = window.Arcade || {});
