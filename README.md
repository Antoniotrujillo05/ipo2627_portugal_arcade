# PROYECTO Arcade

El proyecto consiste en una aplicación web que implementa un juego arcade.  

Se proponen las siguientes sugerencias (no vinculantes):

- Juego de plataformas tipo Mario: scroll lateral, saltos, enemigos y obstáculos.
- Circuito de coches: vehículo que recorre un trazado esquivando obstáculos o rivales.
- Matamarcianos: nave que dispara a enemigos en movimiento vertical u horizontal.

# Objetivos

El desarrollo se realizará en HTML, CSS y JS nativos, sin bibliotecas ni frameworks auxiliares.

El objetivo de esta actividad es el empleo de la interfaz Canvas API para el desarrollo de aplicaciones interactivas con un fuerte componente dinámico y visual.

# Descripción

El sistema interactúa con un único actor (jugador humano) que es el usuario encargado de jugar al juego. 

El sistema debe cumplir los siguientes requisitos: 
- el usuario tendrá la capacidad de comenzar, pausar o finalizar el juego
- el sistema ofrecerá un componente de ayuda para informar al usuario las reglas del juego


Si procede, en función del tipo de juego, el sistema 
- ofrecerá capacidad para ajustar parámetros antes de comenzar (o durante) la partida
- mostrará durante el juego un indicador de progreso (marcador, vidas, etc.) 

Los juegos deben implementar un bucle principal que centraliza el juego, y según las características del juego deberá contemplar aquellos componentes relevantes:
- acciones de las entidades según la variante: saltos y desplazamiento en plataformas, disparos en matamarcianos, aceleración y giro en circuitos, etc.
- actualización - estado y movimiento - y renderizado 
- detección de colisiones
- física de las entidades (velocidad, aceleración, gravedad, etc.)



# Diseño

- La aplicación deberá estar implementada siguiendo un patrón MVC (_Model-View-Controller_) con objeto de clarificar y diferenciar las distintas responsabilidades. 
- Tanto la distribución del código de los ficheros como la propia organización de los ficheros incluidos en la carpeta del proyecto deberán facilitar la comprensión y el mantenimiento de la solución aportada. 


## Interacción 

La implementación de la interacción estará guiada para favorecer la usabilidad de la aplicación.

# Buenas prácticas HTML/CSS/JS

- Vinculación moderna de los componentes HTML, CSS y JS
- Etiquetado HTML semántico y moderno
- Estrategia de selectores CSS mantenible
- Selección de composiciones apropiadas (unidimensional, bidimensional)
- Aplicación justificada del posicionamiento 
- Separación clara y organizada de los distintos aspectos estilísticos considerados: diseño cromático, tipográfico y espacial. Y cada uno estará cimentado en una sólida estrategia:
  - diseño cromático: monocromático, triádico, complementario, etc.
  - diseño tipográfico: dos fuentes contrastadas, una única fuente con niveles distintos de realce, etc.
  - diseño espacial: selección de unidades de medida y contenedores, principios de diseño `Gestalt`, etc. 

# Estructura de la solución

```
web/
├── index.html                  Página semántica (HTML moderno y accesible)
├── css/
│   ├── tokens.css              Diseño cromático, tipográfico y espacial (:root)
│   ├── base.css                Reset y estilos por etiqueta (estrategia "etiquetas primero")
│   ├── layout.css              Composición de la página (grid 2D / flex 1D)
│   └── components.css          Componentes y variantes (clases)
└── js/
    ├── constantes.js           Constantes compartidas (única fuente de verdad)
    ├── modelo/                 Modelo: datos y reglas (sin DOM)
    │   ├── Juego.js            Estado de la partida, actualización, colisiones y puntuación
    │   ├── Entidades.js        Nave, proyectiles, enemigos, barreras, ovni y efectos
    │   ├── Fisica.js           Colisiones AABB y cálculo de movimiento
    │   └── Ajustes.js          Parámetros ajustables (dificultad)
    ├── vista/                  Vista: presentación e interacción (sólo lectura)
    │   ├── RenderizadorLienzo.js  Dibujo de la escena con Canvas API 2D
    │   └── VistaUi.js          HUD, capas, mensajes y ajustes en el DOM
    ├── controlador/            Controlador: intermediario
    │   ├── ControladorPartida.js  Traduce peticiones en acciones y entrega el resultado a las vistas
    │   ├── ControladorEntrada.js  Teclado → comandos e intención de movimiento
    │   └── BucleJuego.js       Bucle principal (requestAnimationFrame)
    └── main.js                 Punto de entrada: compone el MVC y arranca
```

Las vistas nunca consultan ni mutan el modelo, ni siquiera lo importan: sólo
dependen de `constantes.js` (vocabulario compartido). El modelo expone las
proyecciones de solo lectura `obtenerEstado()` (interfaz) y `obtenerEscena()`
(lienzo), y es el controlador quien se las entrega en cada fotograma.

# Cómo se lee el código

1. `main.js` crea las piezas y las conecta (no hay lógica ahí).
2. El usuario pulsa un botón o una tecla → la vista o el teclado avisan al
   `ControladorPartida` con un comando.
3. El controlador traduce ese comando en una acción sobre el modelo (`Juego`).
4. Cada fotograma, `BucleJuego` pide al modelo actualizar su estado y luego el
   controlador reparte el resultado: `obtenerEscena()` al canvas y
   `obtenerEstado()` al HUD.

Todos los ficheros empiezan con una cabecera que dice qué es, qué contiene y
dónde tocar para los cambios habituales de ese fichero.

# Recetas de extensión (dónde tocar)

| Quiero… | Dónde toco |
|---|---|
| Cambiar puntos, vidas, velocidades o tamaños | `js/constantes.js` |
| Añadir una dificultad | `DIFICULTADES` en `js/constantes.js` (los selectores se actualizan solos) |
| Mapear una tecla nueva | `COMANDOS_TECLA` en `js/controlador/ControladorEntrada.js` |
| Añadir un comando o un botón nuevo | `data-comando` en `web/index.html` + `case` en `ControladorPartida.manejarComando` |
| Añadir un tipo de potenciador | `POTENCIADOR.tipos` en `constantes.js` + `Juego._recogerPotenciador` + colores/letras en `RenderizadorLienzo._dibujarPotenciadores` + la ayuda |
| Añadir una entidad nueva | clase en `Entidades.js` → crear/actualizar/colisionar en `Juego.js` → `obtenerEscena()` → `_dibujarX()` en `RenderizadorLienzo.js` |
| Añadir un dato al HUD | `id` en `index.html` + `VistaUi.els` + escribirlo en `VistaUi.sincronizar` |
| Cambiar colores, fuentes o espaciado | `css/tokens.css` |
| Cambiar la disposición de la página | `css/layout.css` |
| Cambiar el aspecto de un componente | `css/components.css` |
