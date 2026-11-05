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
