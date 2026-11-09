# 🛠 Cómo colaborar

¡Cualquier persona puede proponer mejoras! No hace falta instalar nada ni saber mucho de programación.

## Opción 1: proponer una idea o reportar un error

1. Entra a la pestaña [**Issues**](../../issues) y toca **New issue**.
2. Elige **💡 Idea** o **🐞 Error** y llena el formulario.

## Opción 2: cambiar el código desde el navegador

1. Abre el archivo que quieres cambiar, por ejemplo [js/juego/15-policia.js](js/juego/15-policia.js).
2. Toca el **lápiz ✏️** (arriba a la derecha). GitHub crea automáticamente tu propia copia (un *fork*).
3. Haz el cambio y toca **Commit changes…** → **Propose changes**.
4. Toca **Create pull request**. Revisamos el cambio, y cuando lo aprobamos aparece en el juego en un par de minutos.

> Para editar con un editor completo, presiona la tecla **`.`** (punto) en la página del repositorio. Se abre VS Code en el navegador.

## Opción 3: con Git en tu computadora

```bash
git clone https://github.com/<tu-usuario>/autotransportes-desamparados-3d.git
cd autotransportes-desamparados-3d
# abre index.html en el navegador, cambia el código y recarga la página
git checkout -b mi-mejora
git commit -am "Describe tu mejora"
git push origin mi-mejora   # y luego abre el pull request en GitHub
```

## Cómo está partido el juego (`js/juego/`)

El juego base está partido en 18 archivos chicos, uno por tema. `index.html` los carga en orden
(01, 02, 03…) y todos comparten las mismas variables: un archivo puede usar lo que creó uno anterior.
Si agregás un archivo nuevo, ponelo en `index.html` en el lugar que le toca.

| Archivo | Qué tiene |
|---|---|
| [`01-base.js`](js/juego/01-base.js) | utilidades ($, setH, R), cantidad de zonas (NZ) y PENDIENTES Y BAJADAS (RELIEVE) |
| [`02-escena.js`](js/juego/02-escena.js) | renderizador, cámara, cielo, sol, nubes, lluvia y suelo |
| [`03-paisaje.js`](js/juego/03-paisaje.js) | texturas, calles, árboles, casas, montañas, postes y los tramos que se reciclan (scatter) |
| [`04-bus.js`](js/juego/04-bus.js) | el bus: carrocería, parabrisas, luces y pinturas (SK, applySkin) |
| [`05-vehiculos.js`](js/juego/05-vehiculos.js) | los demás vehículos que se pueden manejar (mkV 4 a 21, Oruga turbo) |
| [`06-manejo-y-tuning.js`](js/juego/06-manejo-y-tuning.js) | velocidad y manejo de cada vehículo (PVS), piezas del garaje (PARTS) y setVeh |
| [`07-bus-interior.js`](js/juego/07-bus-interior.js) | interior del bus: tablero, piso, asientos, pasajeros y ruedas |
| [`08-trafico.js`](js/juego/08-trafico.js) | carros del tráfico (mkCar), ambulancia, accidentes, botes y paradas (mkStop) |
| [`09-rotonda.js`](js/juego/09-rotonda.js) | Rotonda de La Y Griega y el McDonald's |
| [`10-zonas.js`](js/juego/10-zonas.js) | nombres de las zonas (ZN), torres, peaje, túneles, trenes, ciudades, puentes y rampas |
| [`11-controles-y-sonido.js`](js/juego/11-controles-y-sonido.js) | estado del juego, teclado y botones táctiles, sonidos (motor, bocina, timbre) |
| [`12-menu.js`](js/juego/12-menu.js) | empezar (start), garaje y tuning, menú, guardar partida y gráficos (applyGfx) |
| [`13-actualizar.js`](js/juego/13-actualizar.js) | lo que pasa en cada cuadro: manejo, choques, paradas, cámara y HUD (función upd) |
| [`14-optimizacion.js`](js/juego/14-optimizacion.js) | liberar memoria, congelar el escenario estático y efectos por cuadro (gfxTick) |
| [`15-policia.js`](js/juego/15-policia.js) | MULTAS Y POLICÍA |
| [`16-vara-blanca.js`](js/juego/16-vara-blanca.js) | CARRETERA A VARA BLANCA (zona 8): salida de montaña, derrumbe y presa |
| [`17-ruta-montana.js`](js/juego/17-ruta-montana.js) | RUTA DE MONTAÑA A VARA BLANCA (150 km): curvas, precipicios, bombas, volcanes y puente |
| [`18-bucle.js`](js/juego/18-bucle.js) | el bucle principal: actualiza y dibuja cada cuadro |

## Dónde está cada cosa en `js/juego/`

Busca estos comentarios (Ctrl+F) en el archivo indicado para llegar rápido:

| Busca | En | Para cambiar |
|---|---|---|
| `PENDIENTES Y BAJADAS` | `01-base` | En qué zonas hay lomas, qué tan altas son y cuántas por km (`RELIEVE`) |
| `CARRETERA A VARA BLANCA` | `16-vara-blanca` | La salida de montaña: forma del camino (`VB`), altura del paso (`VB_ALTURA`), derrumbe y presa |
| `RUTA DE MONTAÑA A VARA BLANCA` | `17-ruta-montana` | Los 150 km: curvas y alturas del camino, precipicios (`mK`), barandas, bombas (`M_BOMBAS`), parques (`M_PARQUES`), volcanes (`M_VOLCANES`) y el puente del km 44 (`PUENTE`) |
| `Oruga turbo` | `05-vehiculos` | El vehículo de orugas con alerón (modelo; su manejo está al final de `const PVS`) |
| `MULTAS Y POLICÍA` | `15-policia` | Límite de velocidad, monto de las multas, velocidad de la patrulla |
| `AMBULANCIA` | `08-trafico` | El modelo de la ambulancia y sus luces |
| `// cielo` | `02-escena` | El cielo, el sol y las estrellas |
| `function tree` / `function house` / `function mount` | `03-paisaje` | Árboles, casas y montañas |
| `function mkCar` | `08-trafico` | Los carros del tráfico |
| `// autobus` y `Carrocería` | `04-bus` · `07-bus-interior` | El bus, su parabrisas y su interior |
| `const PVS` | `06-manejo-y-tuning` | Velocidad, aceleración y manejo de cada vehículo |
| `const PARTS` | `06-manejo-y-tuning` | Las piezas de tuning del garaje |
| `const ZN` | `10-zonas` | Los nombres de las zonas (las 5 nuevas se agregan en `js/mundo.js`) |
| `const NZ` | `01-base` | Cuántas zonas tiene el recorrido antes de repetirse (49) |
| `function multa` | `15-policia` | Lo que hace la policía (ahora regala plata) |
| `function end` | `12-menu` | Qué pasa cuando el vehículo se destroza (ahora queda como nuevo) |
| `const JAM` | `03-paisaje` | Dónde hay presas |
| `OPTIMIZACIÓN` | `14-optimizacion` | Liberar memoria y congelar el escenario estático |

## Dónde está cada cosa en `js/mundo.js`

| Busca | Para cambiar |
|---|---|
| `NEGOCIOS` | Cómo se ven KFC, McDonald's, Dunkin', Burger King, bomberos, hospital, oficinas y fábricas |
| `LOTES POR TODO EL JUEGO` | En qué zonas aparecen los negocios (`ZONAS_LOTE`) y cuáles salen (`elegirNegocio`) |
| `VEHÍCULOS NUEVOS` | Camión de bomberos, tráiler, buses (`BUSES`) y taxis; qué sale en cada zona (`vehNuevo`) |
| `ZONA 19 · NUEVA YORK` | Rascacielos, calles, metro, terminal, Estatua de la Libertad |
| `ZONA 20 · PARQUE INDUSTRIAL` | Campus de Intel, AMD, Microsoft y Windows, contenedores, tren de carga |
| `ZONA 21 · FRONTERA` | Migración, aduana, banderas (`BANDERAS`) |
| `ZONA 22 · AUTOPISTA NUEVA` | La autopista alterna sin presa |
| `ZONA 23 · NACIONES` | La Rotonda de las Naciones |
| `SAN JOSÉ · BOMBEROS Y HOSPITAL` | Dónde están la estación y el hospital (`Z_ESTACION`, `Z_HOSPITAL`) |
| `EMERGENCIAS` | Ambulancia y camión de bomberos para manejar, el incendio (`INC`: dónde está y cuánto mide), la presa de 5 km (`INC.presa`), el carril de emergencia (`cocheTick`), el agua y los heridos |
| `CUADRO A CUADRO` | Los trenes que se mueven y el sello de Migración |

## Dónde está cada cosa en `js/mundo2.js`

| Busca | Para cambiar |
|---|---|
| `ZONA 24 · RUTA DE LA MUERTE` | Avisos, cruces, barandas y antenas (la neblina está en `js/juego/13-actualizar.js`, busca `zl == 24`) |
| `ZONA 25 · FLORENCIO DEL CASTILLO` | El plantel de RECOPE y su incendio (`RECOPE`: dónde está, la presa) |
| `ZONA 26 · PUNTARENAS` | Playa, mar, muelle, crucero, ferrys, botes y hoteles (`HOTELES`) |
| `ZONA 27 · VOLCANES` | Dónde está cada volcán (`volcan(...)`) y los letreros de parques nacionales |
| `ZONA 28 · CHICAGO` · `ZONA 29 · MINNESOTA` · `ZONA 30 · NUEVA JERSEY` · `ZONA 31 · PANAMÁ` | Cada ciudad |
| `SUPER DIESEL` | El modelo y el manejo del Super Diesel |
| `TRÁFICO NUEVO` | Motos, pickups, cisternas, mezcladoras y grúas, y qué tan seguido salen |

## Dónde está cada cosa en `js/mundo3.js`

| Busca | Para cambiar |
|---|---|
| `WALMART Y CARL'S JR` | Cómo se ven los dos negocios (qué tan seguido salen: `elegirNegocio` en `js/mundo.js`) |
| `ROTONDA LA Y GRIEGA · OBRAS` | Grúa, excavadora, conos, barreras y trabajadores de la rotonda |
| `CARRILES EXTERNOS` | Forma de los carriles que rodean la rotonda (`CTRL`) y su ancho (`CARRIL_ANCHO`) |
| `ESTACIONES REMODELADAS` | Las estaciones de la rotonda (la parada normal es `mkStop` en `js/juego/08-trafico.js`) |
| `ZONA 32 · TERMINAL LUMACA` | La terminal, sus andenes y el premio del ANDÉN 1 (`TERM`) |
| `PAÍSES UNIDOS` | Los países (`PAISES_UNIDOS`) y sus monumentos |
| `MOTOS Y BUSES PARA MANEJAR` | Las motos (vehículos 25 y 26) y los buses 27 a 30 (pintura en `SK`) |

## Dónde está cada cosa en `js/mundo4.js`

| Busca | Para cambiar |
|---|---|
| `OBRAS EN CARRETERA` | Cómo se ven las obras y qué tan seguido salen (`PROB_OBRA`, `SIN_OBRAS`) |
| `ICE Y KÖLBI` | Las oficinas del ICE y las tiendas kölbi |
| `CARROS NUEVOS` | SUV, deportivos, vans y camiones; qué tan seguido salen (`vehNuevo`) |
| `ZONA 35` | La construcción de la Carretera de las Minas y el túnel (`TUNEL`) |
| `ZONA 36` | Las Minas de Saratalán, las piedras que caen y las explosiones (`MINAS`) |
| `ZONA 37 · FERRY` | Los muelles (`MUELLE_A`, `MUELLE_B`) y el ferry (`FER`; su viaje está en CUADRO A CUADRO) |
| `ZONA 38` a `ZONA 42` | La isla, la ciudad, la cordillera, las autopistas (`AUTOP`) y las playas |

## Dónde está cada cosa en `js/mundo5.js`

| Busca | Para cambiar |
|---|---|
| `CLIMA` | Color del suelo, neblina, oscuridad y lluvia de cada zona |
| `ZONA 43` | Las montañas nevadas (la nieve que frena está en CUADRO A CUADRO) |
| `MOTONIEVE ULTRA 4X4` | El modelo y el manejo del vehículo 31 |
| `ZONA 44` · `ZONA 45` | Mundo de Bloques y Ciudad de Juguete |
| `ZONA 46` | La pista de karts, las flechas turbo (`KART.turbos`) y el premio de la meta |
| `ZONA 47` | El desierto y las plantas rodadoras |
| `ZONA 48` | La Supertormenta: viento, rayos, tornado, incendios y el premio (`TORM`) |

## La avalancha (`js/avalancha.js`) y la cámara de atrás

- `AV.dist` (a cuántos metros empieza), `AV.vel` (qué tan rápido avanza) y `AV.max` (nunca se queda más lejos) están al inicio de `js/avalancha.js`.
- La cámara que mira hacia atrás: busca `MIRA` en `js/juego/13-actualizar.js` y `js/juego/18-bucle.js`.

## El apocalipsis (`js/apocalipsis.js`)

- `FASES`: cuántos segundos dura la calma, el caos y la Tormenta Morada.
- `VEL_CARROS`: cuántas veces más rápido van los carros en cada fase.
- `N_TORNADOS`: cuántos tornados cercanos puede haber a la vez.
- En `js/apocalipsis2.js`: `N_HOR` (tornados del horizonte), `N_GENTE` (personas corriendo) y `N_AV` (avalanchas). Si el juego se pone lento en una computadora, bajá esos números.

## Reglas sencillas

- Prueba tu cambio abriendo `index.html` antes de enviarlo.
- No cambies `original.html`: es la versión original del juego.
- Mantén el formato del código. Si usas [Prettier](https://prettier.io/), ya viene configurado (`.prettierrc`).
- Escribe con respeto: este juego lo empezó un niño 🧒.
