/* ==========================================================================
   Juego.js — Modelo central del juego
   QUÉ ES: el cerebro de la partida. Guarda el estado (puntuación, vidas,
   entidades…) y todas las reglas: cómo se mueven, qué chocan y qué puntúa.
   No toca el DOM ni el canvas: recibe intenciones de movimiento y devuelve
   datos; las vistas sólo reciben sus proyecciones obtenerEstado/obtenerEscena.
   CONTIENE: · máquina de fases · bucle de actualización · acciones de las
             entidades · colisiones · puntuación y oleadas · récord
   DÓNDE TOCAR:
     · Cambiar reglas de puntuación → _completarOleada, _recogerPotenciador.
     · Cambiar cómo se mueve la flota → _actualizarFormacion.
     · Cambiar la dificultad del fuego enemigo → _actualizarDisparoEnemigo.
     · Añadir una entidad nueva → créala en Entidades.js y aquí su creación,
       actualización y colisiones (y su dibujo en RenderizadorLienzo.js).
     · Añadir un tipo de potenciador → _recogerPotenciador.
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
  FASE,
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

  /** Pone la partida en pausa (sólo desde jugando) */
  pausar() {
    if (this.fase === FASE.JUGANDO) {
      this.fase = FASE.PAUSA;
    }
  }

  /** Reanuda la partida desde la pausa */
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

  /** Vuelve al menú inicial */
  volverAlMenu() {
    this.fase = FASE.MENU;
    this.mensaje = null;
  }

  /* ------------------------------------------------------------------
     Bucle de actualización
     ------------------------------------------------------------------ */

  /**
   * @param {number} dt  segundos transcurridos desde el fotograma anterior
   * @param {{direccion: number, disparo: boolean}} intencion
   *        intención de movimiento traducida por el controlador
   */
  actualizar(dt, intencion) {
    if (this.fase !== FASE.JUGANDO || !this.nave) return;

    this._avanzarMensaje(dt);
    this._actualizarJugador(dt, intencion);

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

  /** Mueve la nave según la intención del jugador y gestiona su cadencia de disparo */
  _actualizarJugador(dt, intencion) {
    const nave = this.nave;

    // Física: aceleración al pulsar, rozamiento al soltar
    nave.vx = acelerar(nave.vx, intencion.direccion, dt, JUGADOR);
    nave.x = limitar(nave.x + nave.vx * dt, 6, LIENZO.ancho - nave.w - 6);

    // Temporizadores
    nave.tiempoDisparo = Math.max(0, nave.tiempoDisparo - dt);
    nave.invulnerable = Math.max(0, nave.invulnerable - dt);
    nave.rafaga = Math.max(0, nave.rafaga - dt);

    if (intencion.disparo && nave.tiempoDisparo === 0) {
      this._dispararJugador();
    }
  }

  /** Crea un proyectil del jugador desde el cañón de la nave */
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
    nave.tiempoDisparo = nave.rafaga > 0 ? JUGADOR.cadencia * 0.45 : JUGADOR.cadencia;
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

  /** Desplaza al ovni o, si no hay ninguno, programa su próxima aparición */
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

  /** Mueve los proyectiles y descarta los que salen del lienzo */
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

  /** Hace caer los potenciadores bajo la gravedad */
  _actualizarPotenciadores(dt) {
    for (const p of this.potenciadores) {
      p.vy += POTENCIADOR.gravedad * dt;
      p.y += p.vy * dt;
    }
    this.potenciadores = this.potenciadores.filter(
      (p) => p.vivo && p.y < LIENZO.alto + 20
    );
  }

  /** Avanza las explosiones y elimina las que ya terminaron */
  _actualizarEfectos(dt) {
    for (const efecto of this.efectos) efecto.actualizar(dt);
    this.efectos = this.efectos.filter((e) => !e.agotado);
  }

  /* ------------------------------------------------------------------
     Detección de colisiones
     ------------------------------------------------------------------ */

  /** Resuelve todos los choques entre entidades (proyectiles, flota, ovni…) */
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
          this._anunciar(`¡OVNI DERRIBADO! +${puntos}`, 1.2);
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

  /** Un proyectil vivo erosiona la primera barrera que toca */
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

  /** Gestiona un impacto en la nave: lo absorbe el escudo o cuesta una vida */
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

  /** Acaba la partida si algún enemigo vivo alcanza la línea de la nave */
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

  /** Al vaciar la flota: bonus de puntos y pausa breve antes de la siguiente */
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

  /** Pasa a la siguiente oleada */
  _siguienteOleada() {
    this.oleada += 1;
    this._crearOleada();
    this._anunciar(`¡OLEADA ${this.oleada}!`, 1.6);
  }

  /** Genera la flota enemiga (8 columnas × 4 filas) centrada en el lienzo */
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

  /** Crea la nave del jugador centrada en la parte baja del lienzo */
  _crearNave() {
    return new Nave({
      x: LIENZO.ancho / 2 - JUGADOR.ancho / 2,
      y: JUGADOR.y,
      w: JUGADOR.ancho,
      h: JUGADOR.alto,
    });
  }

  /** Crea las barreras destructibles repartidas por el ancho del lienzo */
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

  /** Suelta un potenciador desde la posición de un enemigo destruido */
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

  /** Aplica el efecto del potenciador recogido (escudo, ráfaga o vida) */
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
        this.nave.rafaga = POTENCIADOR.duracionRafaga;
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

  /** Cierra la partida: guarda el motivo y actualiza el récord si procede */
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
     Proyecciones de solo lectura para las vistas
     ------------------------------------------------------------------ */

  /**
   * Estado de la interfaz: datos planos para el HUD y las capas.
   * La vista recibe esta proyección y nunca consulta el modelo.
   */
  obtenerEstado() {
    return {
      fase: this.fase,
      puntuacion: this.puntuacion,
      record: this.record,
      nuevoRecord: this.nuevoRecord,
      vidas: this.vidas,
      oleada: this.oleada,
      motivoFin: this.motivoFin,
      mensaje: this.mensaje ? this.mensaje.texto : null,
      escudo: this.nave ? this.nave.escudo : 0,
      enemigosVivos: this.enemigosVivos,
      enemigosTotales: this.enemigosTotales,
      dificultad: this.ajustes.dificultad,
    };
  }

  /**
   * Escena de dibujo: colecciones de entidades para el renderizador.
   * Sólo lectura: la vista dibuja estos datos y nunca los modifica.
   */
  obtenerEscena() {
    return {
      fase: this.fase,
      nave: this.nave,
      enemigos: this.enemigos,
      proyectiles: this.proyectiles,
      barreras: this.barreras,
      ovni: this.ovni,
      potenciadores: this.potenciadores,
      efectos: this.efectos,
    };
  }

  /* ------------------------------------------------------------------
     Utilidades internas
     ------------------------------------------------------------------ */

  /** Muestra un mensaje temporal en pantalla (ttl = segundos de vida) */
  _anunciar(texto, ttl) {
    this.mensaje = { texto, ttl };
  }

  /** Descuenta el tiempo de vida del mensaje y lo oculta al agotarse */
  _avanzarMensaje(dt) {
    if (!this.mensaje) return;
    this.mensaje.ttl -= dt;
    if (this.mensaje.ttl <= 0) this.mensaje = null;
  }

  /** Añade una explosión de partículas (efecto visual temporal) */
  _efecto(x, y, tono, cantidad = 12, radio = 14) {
    this.efectos.push(new Efecto({ x, y, tono, cantidad, radio }));
  }

  /** Enemigos vivos (lo usa la proyección obtenerEstado) */
  get enemigosVivos() {
    let n = 0;
    for (const e of this.enemigos) if (e.vivo) n += 1;
    return n;
  }

  /** Lee el récord guardado en el navegador (o 0 si no hay nada guardado) */
  static _leerRecord() {
    try {
      const valor = window.localStorage.getItem(JUEGO.claveRecord);
      return valor ? Number.parseInt(valor, 10) || 0 : 0;
    } catch {
      return 0;
    }
  }

  /** Guarda el récord en el navegador (si el almacenamiento está disponible) */
  static _guardarRecord(valor) {
    try {
      window.localStorage.setItem(JUEGO.claveRecord, String(valor));
    } catch {
      /* almacenamiento no disponible: el récord sólo vive en memoria */
    }
  }
}

Object.assign(Arcade, { Juego });
})(window.Arcade = window.Arcade || {});
