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

};
