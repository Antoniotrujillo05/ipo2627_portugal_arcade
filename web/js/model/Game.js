/* ==========================================================================
   Game.js — Modelo central del juego
   Contiene el estado de la partida y toda la lógica de actualización:
   acciones de las entidades, física, colisiones y reglas de puntuación.
   No accede al DOM ni al canvas: sólo recibe el estado de entrada
   (teclas) y lo transforma en estado nuevo. La vista lo dibuja después.
   ========================================================================== */

(function (Arcade) {
'use strict';

const {
  LIENZO,
  JUGADOR,
  PROYECTIL,
  ENEMIGOS,
  BARRERAS,
  OVNI,
  POTENCIADOR,
  JUEGO,
} = Arcade;

const {
  Nave,
  Proyectil,
  Enemigo,
  Ovni,
  Barrera,
  Potenciador,
  Efecto,
} = Arcade;

const { colisiona, limitar, aleatorio, elegir, acelerar } = Arcade;

/** Fases de la máquina de estados del juego */
const FASE = {
  MENU: 'menu',
  JUGANDO: 'jugando',
  PAUSA: 'pausado',
  FIN: 'fin',
};

class Juego {
  constructor(ajustes) {
    this.ajustes = ajustes;

    this.fase = FASE.MENU;
    this.puntuacion = 0;
    this.record = Juego._leerRecord();
    this.nuevoRecord = false;
    this.vidas = 0;
    this.oleada = 1;
    this.motivoFin = '';
    this.mensaje = null;

    // Entidades
    this.nave = null;
    this.enemigos = [];
    this.proyectiles = [];
    this.barreras = [];
    this.potenciadores = [];
    this.efectos = [];
    this.ovni = null;

    // Temporizadores y banderas internas
    this.enemigosTotales = 0;
    this.direccion = 1;
    this.intermedio = 0;
    this._tDisparoEnemigo = 0;
    this._tOvni = 0;
  }

  /* ------------------------------------------------------------------
     Transiciones de fase (inicio, pausa, finalización)
     ------------------------------------------------------------------ */

  /** Comienza una partida nueva desde cero */
  iniciar() {
    this.fase = FASE.JUGANDO;
    this.puntuacion = 0;
    this.vidas = this.ajustes.valores.vidas;
    this.oleada = 1;
    this.motivoFin = '';
    this.nuevoRecord = false;
    this.mensaje = null;

    this.nave = this._crearNave();
    this.proyectiles = [];
    this.potenciadores = [];
    this.efectos = [];
    this.ovni = null;
    this.barreras = Juego._crearBarreras();
    this.intermedio = 0;
    this._tOvni = aleatorio(OVNI.intervaloMin, OVNI.intervaloMax);
    this._tDisparoEnemigo = 1.4;

    this._crearOleada();
    this._anunciar(`¡OLEADA ${this.oleada}!`, 1.6);
  }

  pausar() {
    if (this.fase === FASE.JUGANDO) {
      this.fase = FASE.PAUSA;
    }
  }

  reanudar() {
    if (this.fase === FASE.PAUSA) {
      this.fase = FASE.JUGANDO;
    }
  }

  /** Finaliza la partida desde el juego en marcha o en pausa */
  terminar() {
    if (this.fase === FASE.JUGANDO || this.fase === FASE.PAUSA) {
      this._finalizar('Partida finalizada por el jugador');
    }
  }

  volverAlMenu() {
    this.fase = FASE.MENU;
    this.mensaje = null;
  }

  /* ------------------------------------------------------------------
     Bucle de actualización
     ------------------------------------------------------------------ */

  /**
   * @param {number} dt  segundos transcurridos desde el fotograma anterior
   * @param {{izquierda:boolean, derecha:boolean, disparo:boolean}} entrada
   */
  actualizar(dt, entrada) {
    this._avanzarMensaje(dt);

    if (this.fase !== FASE.JUGANDO || !this.nave) return;

    this._actualizarJugador(dt, entrada);

    if (this.intermedio > 0) {
      this.intermedio -= dt;
      if (this.intermedio <= 0) this._siguienteOleada();
    } else {
      this._actualizarFormacion(dt);
      this._actualizarDisparoEnemigo(dt);
    }

    this._actualizarOvni(dt);
    this._actualizarProyectiles(dt);
    this._actualizarPotenciadores(dt);
    this._actualizarEfectos(dt);
    this._comprobarColisiones();
    this._comprobarInvasion();
  }

  /* ------------------------------------------------------------------
     Acciones de las entidades
     ------------------------------------------------------------------ */

  _actualizarJugador(dt, entrada) {
    const nave = this.nave;
    const direccion = (entrada.derecha ? 1 : 0) - (entrada.izquierda ? 1 : 0);

    // Física: aceleración al pulsar, rozamiento al soltar
    nave.vx = acelerar(nave.vx, direccion, dt, JUGADOR);
    nave.x = limitar(nave.x + nave.vx * dt, 6, LIENZO.ancho - nave.w - 6);

    // Temporizadores
    nave.tiempoDisparo = Math.max(0, nave.tiempoDisparo - dt);
    nave.invulnerable = Math.max(0, nave.invulnerable - dt);
    nave.rapido = Math.max(0, nave.rapido - dt);

    if (entrada.disparo && nave.tiempoDisparo === 0) {
      this._dispararJugador();
    }
  }

  _dispararJugador() {
    const nave = this.nave;
    this.proyectiles.push(
      new Proyectil({
        x: nave.x + nave.w / 2 - PROYECTIL.anchoJugador / 2,
        y: nave.y - PROYECTIL.altoJugador,
        w: PROYECTIL.anchoJugador,
        h: PROYECTIL.altoJugador,
        vx: 0,
        vy: -PROYECTIL.velocidadJugador,
        dueno: 'jugador',
      })
    );
    nave.tiempoDisparo = nave.rapido > 0 ? JUGADOR.cadencia * 0.45 : JUGADOR.cadencia;
  }

  /** Movimiento de la flota: rebaño con cambios de sentido y descenso */
  _actualizarFormacion(dt) {
    const vivos = this.enemigos.filter((e) => e.vivo);
    if (vivos.length === 0) {
      this._completarOleada();
      return;
    }

    const fraccion = vivos.length / this.enemigosTotales;
    const factor =
      this.ajustes.valores.factorVelocidad * (1 + (this.oleada - 1) * 0.08);
    const velocidad =
      (ENEMIGOS.velocidadBase + (1 - fraccion) * ENEMIGOS.velocidadExtra) * factor;

    const dx = this.direccion * velocidad * dt;

    let izq = Infinity;
    let der = -Infinity;
    for (const e of vivos) {
      izq = Math.min(izq, e.x);
      der = Math.max(der, e.x + e.w);
    }

    if (izq + dx < LIENZO.margen || der + dx > LIENZO.ancho - LIENZO.margen) {
      this.direccion *= -1;
      for (const e of vivos) e.y += ENEMIGOS.descenso;
    } else {
      for (const e of vivos) e.x += dx;
    }
  }

  /** Disparo enemigo: elige siempre el enemigo más bajo de cada columna */
  _actualizarDisparoEnemigo(dt) {
    this._tDisparoEnemigo -= dt;
    if (this._tDisparoEnemigo > 0) return;

    const porColumna = new Map();
    for (const e of this.enemigos) {
      if (!e.vivo) continue;
      const clave = Math.round(e.x);
      const actual = porColumna.get(clave);
      if (!actual || e.y > actual.y) porColumna.set(clave, e);
    }

    const tiradores = [...porColumna.values()];
    if (tiradores.length > 0) {
      const origen = elegir(tiradores);
      this.proyectiles.push(
        new Proyectil({
          x: origen.x + origen.w / 2 - PROYECTIL.anchoEnemigo / 2,
          y: origen.y + origen.h,
          w: PROYECTIL.anchoEnemigo,
          h: PROYECTIL.altoEnemigo,
          vx: 0,
          vy:
            PROYECTIL.velocidadEnemigo *
            (1 + (this.oleada - 1) * 0.04),
          dueno: 'enemigo',
        })
      );
    }

    // Cuantos menos enemigos quedan, más frecuente es el fuego
    const vivos = this.enemigos.filter((e) => e.vivo).length;
    const fraccion = vivos / this.enemigosTotales;
    const base = Math.max(
      0.32,
      ENEMIGOS.intervaloDisparo * (1 - (1 - fraccion) * 0.45)
    );
    this._tDisparoEnemigo =
      (base / this.ajustes.valores.cadenciaEnemiga) * aleatorio(0.7, 1.4);
  }

  _actualizarOvni(dt) {
    if (this.ovni) {
      this.ovni.x += this.ovni.vx * dt;
      if (
        this.ovni.x < -this.ovni.w - 10 ||
        this.ovni.x > LIENZO.ancho + 10
      ) {
        this.ovni = null;
      }
      return;
    }

    this._tOvni -= dt;
    if (this._tOvni <= 0) {
      const direccion = Math.random() < 0.5 ? 1 : -1;
      this.ovni = new Ovni({
        x: direccion > 0 ? -OVNI.ancho : LIENZO.ancho,
        y: OVNI.y,
        w: OVNI.ancho,
        h: OVNI.alto,
        vx: direccion * OVNI.velocidad,
        puntos: elegir(OVNI.puntos),
      });
      this._tOvni = aleatorio(OVNI.intervaloMin, OVNI.intervaloMax);
    }
  }

  _actualizarProyectiles(dt) {
    for (const b of this.proyectiles) {
      b.x += b.vx * dt;
      b.y += b.vy * dt;
    }
    this.proyectiles = this.proyectiles.filter(
      (b) =>
        b.vivo &&
        b.y > -20 &&
        b.y < LIENZO.alto + 20 &&
        b.x > -20 &&
        b.x < LIENZO.ancho + 20
    );
  }

  _actualizarPotenciadores(dt) {
    for (const p of this.potenciadores) {
      p.vy += POTENCIADOR.gravedad * dt;
      p.y += p.vy * dt;
    }
    this.potenciadores = this.potenciadores.filter(
      (p) => p.vivo && p.y < LIENZO.alto + 20
    );
  }

  _actualizarEfectos(dt) {
    for (const efecto of this.efectos) efecto.actualizar(dt);
    this.efectos = this.efectos.filter((e) => !e.agotado);
  }

  /* ------------------------------------------------------------------
     Detección de colisiones
     ------------------------------------------------------------------ */

  _comprobarColisiones() {
    for (const b of this.proyectiles) {
      if (!b.vivo) continue;

      if (b.dueno === 'jugador') {
        // Proyectil propio vs ovni
        if (this.ovni && colisiona(b, this.ovni)) {
          const puntos = this.ovni.puntos;
          this._efecto(
            this.ovni.x + this.ovni.w / 2,
            this.ovni.y + this.ovni.h / 2,
            'peligro',
            16
          );
          this.ovni = null;
          b.vivo = false;
          this.puntuacion += puntos;
          this._anunciar(`¡OVNI DERIBADO! +${puntos}`, 1.2);
          continue;
        }

        // Proyectil propio vs flota
        for (const e of this.enemigos) {
          if (e.vivo && colisiona(b, e)) {
            e.vivo = false;
            b.vivo = false;
            this.puntuacion += e.puntos;
            this._efecto(e.x + e.w / 2, e.y + e.h / 2, 'acento');
            if (
              Math.random() < this.ajustes.valores.probabilidadPotenciador
            ) {
              this._soltarPotenciador(e);
            }
            break;
          }
        }
      } else {
        // Proyectil enemigo vs nave
        if (colisiona(b, this.nave)) {
          b.vivo = false;
          this._impactoNave();
        }
      }

      // Todo proyectil vivo erosiona las barreras
      if (b.vivo) this._danarBarreras(b);
    }

    // La flota aplasta las barreras por la que atraviesa
    for (const e of this.enemigos) {
      if (!e.vivo) continue;
      for (const barrera of this.barreras) {
        if (colisiona(e, barrera)) barrera.danar(e);
      }
    }

    // Potenciadores vs nave
    for (const p of this.potenciadores) {
      if (p.vivo && colisiona(p, this.nave)) {
        p.vivo = false;
        this._recogerPotenciador(p);
      }
    }
  }

  _danarBarreras(proyectil) {
    for (const barrera of this.barreras) {
      if (!colisiona(proyectil, barrera)) continue;
      const destruidas = barrera.danar(proyectil);
      if (destruidas > 0) {
        proyectil.vivo = false;
        this._efecto(
          proyectil.x,
          proyectil.y + proyectil.h / 2,
          'neutro',
          6,
          8
        );
        return;
      }
    }
  }

  _impactoNave() {
    const nave = this.nave;
    if (nave.invulnerable > 0) return;

    if (nave.escudo > 0) {
      nave.escudo -= 1;
      nave.invulnerable = 0.7;
      this._efecto(nave.x + nave.w / 2, nave.y, 'info', 10, 12);
      this._anunciar('¡EL ESCUDO ABSORBE EL IMPACTO!', 1.2);
      return;
    }

    this.vidas -= 1;
    nave.invulnerable = JUGADOR.invulnerable;
    nave.vx = 0;
    this._efecto(nave.x + nave.w / 2, nave.y + nave.h / 2, 'peligro', 18, 18);
    this.proyectiles = [];

    if (this.vidas <= 0) {
      this._finalizar('Te has quedado sin vidas');
    } else {
      this._anunciar(
        `¡IMPACTO! Quedan ${this.vidas} ${this.vidas === 1 ? 'vida' : 'vidas'}`,
        1.6
      );
    }
  }

  _comprobarInvasion() {
    if (this.fase !== FASE.JUGANDO) return;
    const invade = this.enemigos.some(
      (e) => e.vivo && e.y + e.h >= this.nave.y
    );
    if (invade) {
      this._efecto(this.nave.x + this.nave.w / 2, this.nave.y, 'peligro', 18, 18);
      this._finalizar('Los enemigos han alcanzado la línea defensiva');
    }
  }

  /* ------------------------------------------------------------------
     Reglas de puntuación y oleadas
     ------------------------------------------------------------------ */

  _completarOleada() {
    const bonus = JUEGO.bonusOleada * this.oleada;
    this.puntuacion += bonus;
    this.intermedio = JUEGO.pausaOleada;
    this.proyectiles = this.proyectiles.filter((b) => b.dueno === 'jugador');
    this._anunciar(
      `¡OLEADA ${this.oleada} SUPERADA! +${bonus}`,
      JUEGO.pausaOleada
    );
  }

  _siguienteOleada() {
    this.oleada += 1;
    this._crearOleada();
    this._anunciar(`¡OLEADA ${this.oleada}!`, 1.6);
  }

  _crearOleada() {
    const { columnas, filas, ancho, alto, separacionX, y0, tipos, puntos } =
      ENEMIGOS;
    const anchoTotal = (columnas - 1) * separacionX + ancho;
    const x0 = (LIENZO.ancho - anchoTotal) / 2;

    this.enemigos = [];
    for (let fila = 0; fila < filas; fila++) {
      for (let col = 0; col < columnas; col++) {
        this.enemigos.push(
          new Enemigo({
            x: x0 + col * separacionX,
            y: y0 + fila * ENEMIGOS.separacionY,
            w: ancho,
            h: alto,
            fila,
            tipo: tipos[fila],
            puntos: puntos[fila],
          })
        );
      }
    }
    this.enemigosTotales = this.enemigos.length;
    this.direccion = 1;
  }

  _crearNave() {
    return new Nave({
      x: LIENZO.ancho / 2 - JUGADOR.ancho / 2,
      y: JUGADOR.y,
      w: JUGADOR.ancho,
      h: JUGADOR.alto,
    });
  }

  static _crearBarreras() {
    const { cantidad, celdasX, celdasY, celda, y } = BARRERAS;
    const ancho = celdasX * celda;
    const zona = LIENZO.ancho / cantidad;
    const barreras = [];
    for (let i = 0; i < cantidad; i++) {
      barreras.push(
        new Barrera({
          x: i * zona + (zona - ancho) / 2,
          y,
          celdasX,
          celdasY,
          celda,
        })
      );
    }
    return barreras;
  }

  _soltarPotenciador(enemigo) {
    this.potenciadores.push(
      new Potenciador({
        x: enemigo.x + enemigo.w / 2 - POTENCIADOR.ancho / 2,
        y: enemigo.y,
        w: POTENCIADOR.ancho,
        h: POTENCIADOR.alto,
        tipo: elegir(POTENCIADOR.tipos),
      })
    );
  }

  _recogerPotenciador(potenciador) {
    this.puntuacion += POTENCIADOR.puntos;

    switch (potenciador.tipo) {
      case 'escudo':
        this.nave.escudo = Math.min(
          JUGADOR.escudoMax,
          this.nave.escudo + 1
        );
        this._anunciar('¡ESCUDO +1!', 1.4);
        break;
      case 'rafaga':
        this.nave.rapido = POTENCIADOR.duracionRafaga;
        this._anunciar('¡DISPARO RÁPIDO!', 1.4);
        break;
      case 'vida':
        if (this.vidas < JUGADOR.vidasMax) {
          this.vidas += 1;
          this._anunciar('¡VIDA EXTRA!', 1.4);
        } else {
          this.puntuacion += 200;
          this._anunciar('¡VIDA COMPLETA! +200', 1.4);
        }
        break;
      default:
        break;
    }

    this._efecto(
      potenciador.x + potenciador.w / 2,
      potenciador.y + potenciador.h / 2,
      'info',
      10,
      12
    );
  }

  _finalizar(motivo) {
    this.fase = FASE.FIN;
    this.motivoFin = motivo;
    this.mensaje = null;
    this.nuevoRecord = this.puntuacion > this.record;
    if (this.nuevoRecord) {
      this.record = this.puntuacion;
      Juego._guardarRecord(this.record);
    }
  }

  /* ------------------------------------------------------------------
     Utilidades internas
     ------------------------------------------------------------------ */

  _anunciar(texto, ttl) {
    this.mensaje = { texto, ttl };
  }

  _avanzarMensaje(dt) {
    if (!this.mensaje) return;
    this.mensaje.ttl -= dt;
    if (this.mensaje.ttl <= 0) this.mensaje = null;
  }

  _efecto(x, y, tono, cantidad = 12, radio = 14) {
    this.efectos.push(new Efecto({ x, y, tono, cantidad, radio }));
  }

  /** Enemigos vivos (lo usa la vista para el indicador de progreso) */
  get enemigosVivos() {
    let n = 0;
    for (const e of this.enemigos) if (e.vivo) n += 1;
    return n;
  }

  static _leerRecord() {
    try {
      const valor = window.localStorage.getItem(JUEGO.claveRecord);
      return valor ? Number.parseInt(valor, 10) || 0 : 0;
    } catch {
      return 0;
    }
  }

  static _guardarRecord(valor) {
    try {
      window.localStorage.setItem(JUEGO.claveRecord, String(valor));
    } catch {
      /* almacenamiento no disponible: el récord sólo vive en memoria */
    }
  }
}

Object.assign(Arcade, { FASE, Juego });
})(window.Arcade = window.Arcade || {});
