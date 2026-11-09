// =====================================================================
// AJUSTES · los números que más se cambian, todos juntos en un solo lugar.
// Cambiá un número, guardá y recargá la página para ver el cambio.
// (Se carga primero, antes que todo el juego.)
// =====================================================================
const AJUSTES = {
  // ----- GRÁFICOS Y RENDIMIENTO -----
  // Cada nivel del menú "🎨 Gráficos". "Automático" empieza en el nivel que le sirve a la PC
  // y, si el juego se pone lento, baja la resolución y después el nivel para que vaya fluido.
  graficos: {
    ultra: {
      resolucion: 2, // nitidez máxima (1 = normal; más alto = más nítido y más pesado)
      sombras: 4096, // tamaño del mapa de sombras (0 = sin sombras)
      sombrasSuaves: true,
      antialias: true, // bordes suaves (se aplica al recargar la página)
      vista: 1, // qué tan lejos se ve (1 = normal; 0.6 = más niebla y menos cosas que dibujar)
      efectos: 1, // cuánta gente, tornados y fuego en el apocalipsis (1 = todo)
    },
    normal: { resolucion: 1.25, sombras: 2048, sombrasSuaves: true, antialias: true, vista: 1, efectos: 1 },
    bajo: { resolucion: 0.85, sombras: 0, sombrasSuaves: false, antialias: false, vista: 0.6, efectos: 0.35 },
    // Modo automático: cuadros por segundo que intenta mantener y qué tan baja puede ir la resolución.
    auto: { fpsMeta: 50, fpsSubir: 57, resolucionMinima: 0.55 },
  },

  // ----- TRIKE (ultraligero) -----
  // Si vas volando y le pegás a un carro, el ala se daña: ya no sube y baja despacio hasta el piso.
  // Al aterrizar queda arreglada. (js/juego/13-actualizar.js, busca ALA DAÑADA)
  trike: {
    bajadaAlaRota: 3, // metros por segundo que baja con el ala dañada
    danioAla: 8, // daño extra al pegarle a un carro con el ala (de 100)
  },

  // ----- APOCALIPSIS (js/apocalipsis.js) -----
  // Orden: calma → caos → Tormenta Morada → tormenta de comida → calma → …
  apocalipsis: {
    primeraCalma: 25, // segundos de calma al empezar
    calma: 120, // segundos de calma entre apocalipsis
    caos: 40, // segundos de caos (tornados y carros rapidísimos)
    morada: 60, // cada cuántos segundos sube de nivel la Tormenta Morada (+₡5000)
    nivelesMorada: 3, // cuántos niveles dura la Tormenta Morada antes de terminar (3 × 60 s = 3 minutos)
    comida: 90, // segundos que dura la tormenta de comida
    velCarros: { caos: 3, morada: 4 }, // veces más rápido que lo normal
  },

  // ----- TORMENTA DE COMIDA (js/tormenta-comida.js) -----
  tormentaComida: {
    cadaCuanto: [0.5, 1.3], // segundos entre una comida y la siguiente (mínimo, máximo)
    maxComidas: 14, // cuántas comidas puede haber a la vez (en gráficos bajos, menos)
    tamano: [7, 15], // tamaño de la comida gigante en metros (mínimo, máximo)
    velocidadCaida: 55, // metros por segundo
    danio: 16, // daño si te cae encima (de 100)
    radioGolpe: 11, // metros alrededor del impacto que te alcanzan
    segundosEnElSuelo: 14, // cuánto tiempo se queda la comida tirada en la carretera
    premio: 15000, // colones por sobrevivir
  },
};
