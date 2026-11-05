/* ==========================================================================
   UiView.js — Vista de la interfaz DOM
   Sincroniza el HUD, las capas de menú/pausa/fin, el mensaje emergente y
   los ajustes con el estado del modelo. Sólo lee el estado: nunca lo muta.
   ========================================================================== */

(function (Arcade) {
'use strict';

class VistaUi {
  constructor({ onComando }) {
    this.onComando = onComando;

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
    this._fase = null;
    this._cache = {
      puntuacion: -1,
      record: -1,
      vidas: -1,
      escudo: -1,
      oleada: -1,
      pct: -1,
      restantes: -1,
      mensaje: null,
      dificultad: null,
    };

    this._registraEventos();
  }

  _registraEventos() {
    // Delegación de eventos: un único gestor para todos los botones
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

    // Ajustes (selectores sincronizados entre menú, pausa y lateral)
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

  mostrarAyuda() {
    if (this.ayudaAbierta) return;
    this.els.ayuda.showModal();
    this.ayudaAbierta = true;
  }

  cerrarAyuda() {
    if (!this.ayudaAbierta) return;
    this.els.ayuda.close();
  }

  /** Llamado en cada fotograma con el estado actual del modelo */
  sincronizar(juego) {
    const fase = juego.fase;
    if (fase !== this._fase) {
      this._aplicarFase(fase, juego);
      this._fase = fase;
    }

    this._valor('puntuacion', juego.puntuacion, (v) => {
      this.els.puntuacion.textContent = String(v);
    });
    this._valor('record', juego.record, (v) => {
      this.els.record.textContent = String(v);
    });
    this._valor('oleada', juego.oleada, (v) => {
      this.els.oleada.textContent = String(v);
    });

    const vidas = Math.max(0, juego.vidas);
    this._valor('vidas', vidas, (v) => {
      this.els.vidas.textContent = v > 0 ? '♥'.repeat(v) : '—';
      this.els.vidas.setAttribute(
        'aria-label',
        `${v} ${v === 1 ? 'vida' : 'vidas'}`
      );
    });

    const escudo = juego.nave ? juego.nave.escudo : 0;
    this._valor('escudo', escudo, (v) => {
      this.els.escudo.hidden = v === 0;
      this.els.escudoValor.textContent = String(v);
    });

    // Indicador de progreso: enemigos eliminados
    const vivos = juego.enemigosVivos;
    const totales = juego.enemigosTotales;
    const pct = totales > 0 ? Math.round(((totales - vivos) / totales) * 100) : 0;
    this._valor('pct', pct, (v) => {
      this.els.relleno.style.width = `${v}%`;
      this.els.barra.setAttribute('aria-valuenow', String(v));
    });
    // En el menú no hay flota en pantalla: se muestra un guion
    const restantes = juego.fase === 'menu' ? '—' : String(vivos);
    if (this._cache.restantes !== restantes) {
      this._cache.restantes = restantes;
      this.els.restantes.textContent = restantes;
    }
    // Mensaje emergente
    const texto = juego.mensaje ? juego.mensaje.texto : null;
    if (texto !== this._cache.mensaje) {
      this._cache.mensaje = texto;
      this.els.mensaje.textContent = texto || '';
      this.els.mensaje.classList.toggle('is-visible', Boolean(texto));
    }

    // Selectores de dificultad sincronizados
    const dificultad = juego.ajustes.dificultad;
    if (dificultad !== this._cache.dificultad) {
      this._cache.dificultad = dificultad;
      document.querySelectorAll('[data-ajuste="dificultad"]').forEach((select) => {
        if (select.value !== dificultad) select.value = dificultad;
      });
    }
  }

  _aplicarFase(fase, juego) {
    const { capaMenu, capaPausa, capaFin, btnPausa, btnPausaTexto } = this.els;

    capaMenu.hidden = fase !== 'menu';
    capaPausa.hidden = fase !== 'pausado';
    capaFin.hidden = fase !== 'fin';

    const enPartida = fase === 'jugando' || fase === 'pausado';
    btnPausa.hidden = !enPartida;
    btnPausaTexto.textContent = fase === 'jugando' ? 'Pausa' : 'Reanudar';

    if (fase === 'fin') {
      this.els.finMotivo.textContent = juego.motivoFin;
      this.els.finPuntuacion.textContent = String(juego.puntuacion);
      this.els.finOleada.textContent = String(juego.oleada);
      this.els.finRecord.textContent = String(juego.record);
      this.els.finNuevoRecord.hidden = !juego.nuevoRecord;
      this.els.finTitulo.textContent = juego.nuevoRecord ? '¡Récord!' : 'Game Over';
    }
  }

  /** Evita escribir en el DOM si el valor no ha cambiado */
  _valor(clave, valor, aplicar) {
    if (this._cache[clave] === valor) return;
    this._cache[clave] = valor;
    aplicar(valor);
  }
}

Object.assign(Arcade, { VistaUi });
})(window.Arcade = window.Arcade || {});
