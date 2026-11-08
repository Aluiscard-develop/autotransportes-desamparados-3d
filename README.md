# 🚌 Autotransportes Desamparados 3D

Juego 3D de buses ambientado en Costa Rica: maneja el bus, frena en cada parada verde para subir pasajeros, gana colones y evita el tráfico. En el camino pasas por la Rotonda de La Y Griega, el Túnel Zurquí, el peaje Quick Pass, el Estadio Nacional, la terminal de buses y mucho más.

**▶ Juega aquí:** https://aluiscard-develop.github.io/autotransportes-desamparados-3d/

El juego original lo creó mi sobrino 🧒. Esta versión conserva toda su jugabilidad, mejora los gráficos y suma funciones nuevas. También puedes jugar la [versión original](https://aluiscard-develop.github.io/autotransportes-desamparados-3d/original.html).

**¿Quieres ayudar a mejorarlo?** Cualquier persona puede proponer cambios. Lee la [guía para colaborar](CONTRIBUTING.md).

![Autopista con pendientes](docs/pendientes.png)

| Desde la cabina | Ambulancia en un accidente |
|---|---|
| ![Cabina](docs/cabina.png) | ![Ambulancia](docs/ambulancia.png) |

| Puente del Río Caliente (km 44) | Precipicios en la Ruta de montaña |
|---|---|
| ![Puente](docs/puente-rio-caliente.png) | ![Precipicio](docs/precipicio.png) |

| Carretera a Vara Blanca (presa y derrumbe) | 🐲 Oruga turbo todoterreno |
|---|---|
| ![Vara Blanca](docs/vara-blanca.png) | ![Oruga turbo](docs/oruga-turbo.png) |

| Ciudad | Pista de agua |
|---|---|
| ![Ciudad](docs/ciudad.png) | ![Agua](docs/agua.png) |

## Controles

| Tecla | Acción |
|---|---|
| Flechas / WASD | Manejar |
| Espacio | Freno de mano |
| C | Cámara (exterior, conductor, pasillo, asiento) |
| H | Bocina |
| Shift / N | Nitro |
| R | Reiniciar |
| M / Esc | Menú |
| 🔧 | Tuning y garaje |

En celulares y tablets aparecen botones en la pantalla.

## Qué tiene

- **22 vehículos:** 4 buses (ATD, Mercedes-Benz CAIO, Busscar Porvenir…), jeep, tanque, F1, un ultraligero que vuela, aerodeslizador, cohete y el nuevo **🐲 Oruga turbo**: todoterreno de orugas con alerón trasero y motor súper rápido (hasta ~245 km/h, casi no pierde velocidad fuera de la carretera)
- **19 zonas:** centro urbano, autopista, puente atirantado, Túnel Zurquí, puente de madera, Rotonda del Walmart con cruce de tren, rotondas del Bicentenario y de la Bandera (de noche), pista de agua, de carreras y de prueba
- **Pendientes y bajadas** en la Autopista, la Ruta del bosque, la Circunvalación y el Cruce Río Frío: el bus se inclina, pierde velocidad al subir y agarra impulso al bajar
- **Carretera a Vara Blanca:** en San José · Estadio Nacional hay una salida a la derecha ("SALIDA · CARRETERA VARA BLANCA — CUIDADO DERRUMBES Y PRESA") que lleva a una carretera de montaña de 2 carriles. Sube con curvas hasta un paso de 24 m, tiene barandas, un derrumbe que tapa un carril, una presa de carros con las intermitentes y una piedra que rueda cerro abajo; hay que adelantar por el otro carril. Vuelve a la autopista antes del túnel.
- **Ruta de montaña a Vara Blanca (150 km):** se entra pasando la presa de la carretera a Vara Blanca, o desde el menú ("Inicio: Ruta de montaña"). Tiene curvas y muchísimas subidas y bajadas, paredes de roca y **precipicios** (algunos sin baranda: si te salís, caés), bosques de parques nacionales (Braulio Carrillo, Volcán Poás, Tapantí, Volcán Irazú, Juan Castro Blanco y Volcán Arenal), miradores con **volcanes** (Poás con su laguna, Barva, Irazú, Turrialba y Arenal echando humo), bombas de gasolina cada 10 km y rótulos de kilómetro. Al llegar al km 150 ganás ₡50 000 y bajás de vuelta a la autopista.
- **Km 44 · Puente del Río Caliente:** puente colgante de madera, angosto, sin barandas sólidas, con tablas que faltan y que se mece. Hay que pasar despacio (máx. 20 km/h) y por el centro: si vas rápido cruje y te daña, a más de 75 km/h se quiebran las tablas y si te salís del borde caés al río (que echa vapor).
- **Multas y policía:** te multan por exceso de velocidad (70 km/h en ciudad, 100 en autopista), por chocar y por pasarte la parada. Con 3 multas te persigue una patrulla con sirena; si te alcanza, pagas ₡5000. Si le sacas más de 320 m, te escapas.
- **Ambulancias** en el tráfico (más rápidas, con luces) y atendiendo los accidentes
- **Parabrisas real:** desde la cámara del conductor se ve la carretera, con limpiaparabrisas, tablero y retrovisor
- Tuning con 35 piezas, motor diésel de 6 cambios con sonido sintetizado, gasolina, calentamiento e incendio del motor, y lluvia

## Mejoras gráficas

Cielo con halo del sol y estrellas de noche · nubes con volumen · asfalto con carriles, desgaste y grietas · zacate detallado · árboles de 3 tipos (pino, frondoso y palmera) · casas con puertas y ventanas · montañas con relieve y cumbres nevadas (sin meterse en la carretera) · ventanas de edificios que se encienden de noche · carros con vidrios polarizados y focos · agua con oleaje · humo y fuego suaves · interfaz nueva.

En celulares y tablets los reflejos se apagan solos. Así la carretera y el bus nunca se ven negros ni sin color.

## Cómo está hecho

| Archivo | Qué contiene |
|---|---|
| [index.html](index.html) | Pantallas y botones (menú, panel, controles táctiles) |
| [css/estilos.css](css/estilos.css) | Colores y estilos de la interfaz |
| [js/juego.js](js/juego.js) | Todo el juego (mundo 3D, vehículos, tráfico, física, sonido, multas) |
| [original.html](original.html) | La versión original, sin tocar |

El juego usa [Three.js r128](https://threejs.org/) y no necesita instalar ni compilar nada. Para jugar sin internet, abre `index.html` en el navegador (la primera vez sí necesita conexión para cargar Three.js y las fuentes).

## Rendimiento

- Las piezas que desaparecen (carros, paradas, patrullas) liberan la memoria de la tarjeta gráfica, así que el juego ya no se pone lento con el tiempo.
- La interfaz solo se redibuja cuando algo cambia.
- El escenario que no se mueve no se recalcula en cada cuadro.
- Los carros comparten la misma pintura por color.
