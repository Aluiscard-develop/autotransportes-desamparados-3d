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
| `MULTAS Y POLICÍA` | Límite de velocidad, monto de las multas, velocidad de la patrulla |
| `AMBULANCIA` | El modelo de la ambulancia y sus luces |
| `// cielo` | El cielo, el sol y las estrellas |
| `function tree` / `function house` / `function mount` | Árboles, casas y montañas |
| `function mkCar` | Los carros del tráfico |
| `// autobus` y `Carrocería` | El bus, su parabrisas y su interior |
| `const PVS` | Velocidad, aceleración y manejo de cada vehículo |
| `const PARTS` | Las piezas de tuning del garaje |
| `const ZN` | Los nombres de las 19 zonas |
| `OPTIMIZACIÓN` | Liberar memoria y congelar el escenario estático |

## Reglas sencillas

- Prueba tu cambio abriendo `index.html` antes de enviarlo.
- No cambies `original.html`: es la versión original del juego.
- Mantén el formato del código. Si usas [Prettier](https://prettier.io/), ya viene configurado (`.prettierrc`).
- Escribe con respeto: este juego lo empezó un niño 🧒.
