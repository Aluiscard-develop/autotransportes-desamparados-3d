# 🛠 Cómo colaborar

¡Cualquier persona puede proponer mejoras! No hace falta instalar nada ni saber mucho de programación.

## Opción 1: proponer una idea o reportar un error

1. Entra a la pestaña [**Issues**](../../issues) y toca **New issue**.
2. Elige **💡 Idea** o **🐞 Error** y llena el formulario.

## Opción 2: cambiar el código desde el navegador

1. Abre el archivo que quieres cambiar, por ejemplo [js/juego.js](js/juego.js).
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

## Dónde está cada cosa en `js/juego.js`

Busca estos comentarios (Ctrl+F) para llegar rápido:

| Busca | Para cambiar |
|---|---|
| `PENDIENTES Y BAJADAS` | En qué zonas hay lomas, qué tan altas son y cuántas por km (`RELIEVE`) |
| `CARRETERA A VARA BLANCA` | La salida de montaña: forma del camino (`VB`), altura del paso (`VB_ALTURA`), derrumbe y presa |
| `RUTA DE MONTAÑA A VARA BLANCA` | Los 150 km: curvas y alturas del camino, precipicios (`mK`), barandas, bombas (`M_BOMBAS`), parques (`M_PARQUES`), volcanes (`M_VOLCANES`) y el puente del km 44 (`PUENTE`) |
| `Oruga turbo` | El vehículo de orugas con alerón (modelo; su manejo está al final de `const PVS`) |
| `MULTAS Y POLICÍA` | Límite de velocidad, monto de las multas, velocidad de la patrulla |
| `AMBULANCIA` | El modelo de la ambulancia y sus luces |
| `// cielo` | El cielo, el sol y las estrellas |
| `function tree` / `function house` / `function mount` | Árboles, casas y montañas |
| `function mkCar` | Los carros del tráfico |
| `// autobus` y `Carrocería` | El bus, su parabrisas y su interior |
| `const PVS` | Velocidad, aceleración y manejo de cada vehículo |
| `const PARTS` | Las piezas de tuning del garaje |
| `const ZN` | Los nombres de las zonas (las 5 nuevas se agregan en `js/mundo.js`) |
| `const NZ` | Cuántas zonas tiene el recorrido antes de repetirse (35) |
| `function multa` | Lo que hace la policía (ahora regala plata) |
| `function end` | Qué pasa cuando el vehículo se destroza (ahora queda como nuevo) |
| `const JAM` | Dónde hay presas |
| `OPTIMIZACIÓN` | Liberar memoria y congelar el escenario estático |

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
| `ZONA 24 · RUTA DE LA MUERTE` | Avisos, cruces, barandas y antenas (la neblina está en `js/juego.js`, busca `zl == 24`) |
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
| `ESTACIONES REMODELADAS` | Las estaciones de la rotonda (la parada normal es `mkStop` en `js/juego.js`) |
| `ZONA 32 · TERMINAL LUMACA` | La terminal, sus andenes y el premio del ANDÉN 1 (`TERM`) |
| `PAÍSES UNIDOS` | Los países (`PAISES_UNIDOS`) y sus monumentos |
| `MOTOS Y BUSES PARA MANEJAR` | Las motos (vehículos 25 y 26) y los buses 27 a 30 (pintura en `SK`) |

## Reglas sencillas

- Prueba tu cambio abriendo `index.html` antes de enviarlo.
- No cambies `original.html`: es la versión original del juego.
- Mantén el formato del código. Si usas [Prettier](https://prettier.io/), ya viene configurado (`.prettierrc`).
- Escribe con respeto: este juego lo empezó un niño 🧒.
