/* ==========================================================================
   VistaUi.js — Vista de la interfaz DOM
   QUÉ ES: la vista de la interfaz: pinta el estado del juego (HUD, capas,
   mensajes) y recoge los clics y cambios de los controles. Nunca consulta
   ni muta el modelo: sólo recibe datos y los muestra.
   CONTIENE: · generación de contenido (dificultades, tabla de puntos) ·
             eventos de la interfaz · sincronización con el estado · ayuda
   DÓNDE TOCAR:
     · Añadir un dato al HUD → <span id="…"> en index.html + this.els +
       escribirlo en sincronizar().
     · Añadir un botón → data-comando en index.html + case en
       ControladorPartida.manejarComando().
     · Cambiar los textos de la ayuda → el diálogo #ayuda de index.html.
     · Cambiar la tabla de puntuaciones → _poblarTablaPuntos().
   ========================================================================== */

(function (Arcade) {
'use strict';

const { FASE, DIFICULTADES, ENEMIGOS, OVNI, POTENCIADOR, JUEGO } = Arcade;

class VistaUi {
  /** @param {{ onComando: (comando: string, valor?: *) => void }} opciones */
  constructor({ onComando }) {
    this.onComando = onComando;

    // Todos los elementos del DOM que la vista actualiza (accedidos por id)
    this.els = {
      puntuacion: document.getElementById('hud-puntuacion'),
      record: document.getElementById('hud-record'),
      vidas: document.getElementById('hud-vidas'),
      escudo: document.getElementById('hud-escudo'),
      escudoValor: document.getElementById('hud-escudo-valor'),
      oleada: document.getElementById('hud-oleada'),
      barra: document.getElementById('hud-barra'),
      relleno: document.getElementById('hud-relleno'),
      restantes: document.getElementById('hud-restantes'),
      mensaje: document.getElementById('mensaje'),
      capaMenu: document.getElementById('capa-menu'),
      capaPausa: document.getElementById('capa-pausa'),
      capaFin: document.getElementById('capa-fin'),
      btnPausa: document.getElementById('btn-pausa'),
      btnPausaTexto: document.getElementById('pausa-texto'),
      finTitulo: document.getElementById('fin-titulo'),
      finMotivo: document.getElementById('fin-motivo'),
      finPuntuacion: document.getElementById('fin-puntuacion'),
      finOleada: document.getElementById('fin-oleada'),
      finRecord: document.getElementById('fin-record'),
      finNuevoRecord: document.getElementById('fin-nuevo-record'),
      ayuda: document.getElementById('ayuda'),
    };

    this.ayudaAbierta = false;

    this._poblarDificultades();
    this._poblarTablaPuntos();
    this._registraEventos();
  }

  /* ------------------------------------------------------------------
     Contenido generado desde la configuración (única fuente de verdad)
     ------------------------------------------------------------------ */

  /**
   * Puebla los selectores de dificultad desde la configuración. Las opciones
   * estáticas del HTML sólo son el respaldo cuando no hay JavaScript.
   */
  _poblarDificultades() {
    const opciones = Object.values(DIFICULTADES)
      .map(
        (op) =>
          `<option value="${op.id}">${op.etiqueta} · ${op.descripcion}</option>`
      )
      .join('');
    document
      .querySelectorAll('[data-ajuste="dificultad"]')
      .forEach((select) => {
        select.innerHTML = opciones;
      });
  }

  /**
   * Genera la tabla de puntuaciones de la ayuda desde la configuración
   * (los índices de ENEMIGOS.puntos siguen el orden de ENEMIGOS.tipos).
   */
  _poblarTablaPuntos() {
    const filas = [
      ['Calamar (fila superior)', ENEMIGOS.puntos[0]],
      ['Cangrejo (filas centrales)', ENEMIGOS.puntos[1]],
      ['Pulpo (fila inferior)', ENEMIGOS.puntos[3]],
      ['Ovni (aparece por sorpresa)', OVNI.puntos.join(' · ')],
      ['Oleada superada', `${JUEGO.bonusOleada} × número de oleada`],
      ['Potenciador recogido', POTENCIADOR.puntos],
    ];
    const cuerpo = filas
      .map(([elemento, puntos]) => `<tr><td>${elemento}</td><td>${puntos}</td></tr>`)
      .join('');
    document.querySelector('#tabla-puntos tbody').innerHTML = cuerpo;
  }

  /* ------------------------------------------------------------------
     Eventos de la interfaz
     ------------------------------------------------------------------ */

  /** Registra los gestores de eventos de la interfaz (con delegación) */
  _registraEventos() {
    // Un único gestor para todos los botones (leen su comando de data-comando)
    document.addEventListener('click', (evento) => {
      const boton = evento.target.closest('[data-comando]');
      if (!boton) return;
      const comando = boton.dataset.comando;
      if (comando === 'cerrar-ayuda') {
        this.cerrarAyuda();
        return;
      }
      this.onComando(comando, boton.dataset.valor);
    });

    // Un único gestor para los selectores de ajustes (data-ajuste)
    document.addEventListener('change', (evento) => {
      const control = evento.target.closest('[data-ajuste]');
      if (!control) return;
      this.onComando('ajuste', {
        nombre: control.dataset.ajuste,
        valor: control.value,
      });
    });

    const ayuda = this.els.ayuda;
    ayuda.addEventListener('close', () => {
      this.ayudaAbierta = false;
      document.getElementById('btn-ayuda').focus();
    });

    // Clic en el fondo del diálogo (backdrop) para cerrar
    ayuda.addEventListener('click', (evento) => {
      if (evento.target === ayuda) this.cerrarAyuda();
    });
  }

  /** Abre la ayuda como diálogo modal */
  mostrarAyuda() {
    if (this.ayudaAbierta) return;
    this.els.ayuda.showModal();
    this.ayudaAbierta = true;
  }

  /** Cierra la ayuda */
  cerrarAyuda() {
    if (!this.ayudaAbierta) return;
    this.els.ayuda.close();
  }

  /* ------------------------------------------------------------------
     Sincronización con el estado del juego
     ------------------------------------------------------------------ */

  /**
   * Llamado en cada fotograma: pinta el estado completo en el DOM.
   * @param {object} estado  proyección de solo lectura del modelo
   */
  sincronizar(estado) {
    this._aplicarFase(estado);

    this.els.puntuacion.textContent = String(estado.puntuacion);
    this.els.record.textContent = String(estado.record);
    this.els.oleada.textContent = String(estado.oleada);

    const vidas = Math.max(0, estado.vidas);
    this.els.vidas.textContent = vidas > 0 ? '♥'.repeat(vidas) : '—';
    this.els.vidas.setAttribute(
      'aria-label',
      `${vidas} ${vidas === 1 ? 'vida' : 'vidas'}`
    );

    this.els.escudo.hidden = estado.escudo === 0;
    this.els.escudoValor.textContent = String(estado.escudo);

    // Indicador de progreso: porcentaje de enemigos eliminados
    const vivos = estado.enemigosVivos;
    const totales = estado.enemigosTotales;
    const pct = totales > 0 ? Math.round(((totales - vivos) / totales) * 100) : 0;
    this.els.relleno.style.width = `${pct}%`;
    this.els.barra.setAttribute('aria-valuenow', String(pct));

    // En el menú no hay flota en pantalla: se muestra un guion
    this.els.restantes.textContent =
      estado.fase === FASE.MENU ? '—' : String(vivos);

    // Mensaje emergente
    this.els.mensaje.textContent = estado.mensaje || '';
    this.els.mensaje.classList.toggle('is-visible', Boolean(estado.mensaje));

    // Selectores de dificultad sincronizados. Sólo se escribe si cambia,
    // para no interferir con un desplegable que tenga abierto el usuario.
    document.querySelectorAll('[data-ajuste="dificultad"]').forEach((select) => {
      if (select.value !== estado.dificultad) select.value = estado.dificultad;
    });
  }

  /** Muestra u oculta las capas de menú/pausa/fin según la fase */
  _aplicarFase(estado) {
    const fase = estado.fase;
    const { capaMenu, capaPausa, capaFin, btnPausa, btnPausaTexto } = this.els;

    capaMenu.hidden = fase !== FASE.MENU;
    capaPausa.hidden = fase !== FASE.PAUSA;
    capaFin.hidden = fase !== FASE.FIN;

    const enPartida = fase === FASE.JUGANDO || fase === FASE.PAUSA;
    btnPausa.hidden = !enPartida;
    btnPausaTexto.textContent = fase === FASE.JUGANDO ? 'Pausa' : 'Reanudar';

    if (fase === FASE.FIN) {
      this.els.finMotivo.textContent = estado.motivoFin;
      this.els.finPuntuacion.textContent = String(estado.puntuacion);
      this.els.finOleada.textContent = String(estado.oleada);
      this.els.finRecord.textContent = String(estado.record);
      this.els.finNuevoRecord.hidden = !estado.nuevoRecord;
      this.els.finTitulo.textContent = estado.nuevoRecord ? '¡Récord!' : 'Game Over';
    }
  }
}

Object.assign(Arcade, { VistaUi });
})(window.Arcade = window.Arcade || {});
