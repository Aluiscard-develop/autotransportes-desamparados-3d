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

  // ----- CAMPO DE GUERRA (zona 49, js/mundo6.js) -----
  campoDeGuerra: {
    tanques: 10, // cuántos tanques hay (mitad de cada lado)
    cadaCuantoDisparan: [2.5, 5], // segundos entre disparos de cada tanque (mínimo, máximo)
    alJugador: 0.25, // de cada disparo, qué parte cae en la carretera cerca de vos (0 a 1)
    danio: 14, // daño de un cañonazo si te agarra (las bombas hacen más)
    radio: 9, // metros alrededor de la explosión que te alcanzan
    avionCada: [12, 20], // segundos entre un avión y el siguiente (mínimo, máximo)
    bombasPorAvion: 7,
    premio: 30000, // colones por cruzar la zona
  },

  // ----- TIENDAS DE CELULARES (js/tiendas.js) -----
  tiendas: {
    premio: 1000, // colones cada vez que pasás frente a una tienda (una vez por tienda en cada vuelta)
  },

  // ----- APOCALIPSIS (js/apocalipsis.js) -----
  // Orden: calma → caos → Tormenta Morada + Tormenta de Fettuccine juntas (con comida gigante, fideos,
  //        salsa Alfredo y la carretera partiéndose) → calma → caos → …
  apocalipsis: {
    juntas: true, // true = la Morada y la de Fettuccine vienen juntas; false = se turnan (una y una)
    primeraCalma: 25, // segundos de calma al empezar
    calma: 120, // segundos de calma entre apocalipsis
    caos: 40, // segundos de caos (tornados y carros rapidísimos)
    morada: 60, // cada cuántos segundos sube de nivel la Tormenta Morada (+₡5000)
    nivelesMorada: 3, // cuántos niveles dura la Tormenta Morada antes de terminar (3 × 60 s = 3 minutos)
    premio: 20000, // colones por sobrevivir la Tormenta Morada entera
    fettuccine: 120, // segundos que dura la Tormenta de Fettuccine (cuando se turnan; juntas dura lo de la Morada)
    premioFettuccine: 15000, // colones por sobrevivir la Tormenta de Fettuccine (juntas: se suma al de la Morada)
    velCarros: { caos: 3, morada: 4, fettuccine: 2 }, // veces más rápido que lo normal
  },

  // ----- LLUVIA DE COMIDA GIGANTE (js/tormenta-comida.js) · cae en las tormentas -----
  tormentaComida: {
    cadaCuanto: [0.5, 1.3], // segundos entre una comida y la siguiente (mínimo, máximo)
    maxComidas: 14, // cuántas comidas puede haber a la vez (en gráficos bajos, menos)
    tamano: [7, 15], // tamaño de la comida gigante en metros (mínimo, máximo)
    velocidadCaida: 55, // metros por segundo
    danio: 16, // daño si te cae encima (de 100)
    radioGolpe: 11, // metros alrededor del impacto que te alcanzan
    segundosEnElSuelo: 14, // cuánto tiempo se queda la comida tirada en la carretera
    albondigasAlCaer: 5, // cuántas albóndigas dispara el plato de espagueti cuando cae
    albondigasCada: [2, 3.5], // después, cada cuántos segundos dispara otra (mínimo, máximo)
    danioAlbondiga: 9, // daño si te pega una albóndiga (de 100)
  },

  // ----- TORMENTA DE FETTUCCINE (js/tormenta-fettuccine.js) · viene junto con la Tormenta Morada -----
  // Las comidas que caen (platos Alfredo, nidos y tiras) usan cadaCuanto, tamano y danio de tormentaComida.
  tormentaFettuccine: {
    fideos: 180, // cuántos fideos caen a la vez en la lluvia (en gráficos Bajo, menos)
    charcoSegundos: 18, // cuánto dura un charco de salsa Alfredo
    deslizar: 5, // qué tan rápido te vas de lado en la salsa (metros por segundo)
    frenoTira: 0.3, // cuánta velocidad te queda después de 1 segundo pegado en una tira (0 a 1)
    danioTira: 3, // daño al enredarte en una tira (de 100)
  },

  // ----- CARRETERA PARTIDA (js/carretera-partida.js) · pasa durante la Tormenta Morada -----
  // Adelante de vos la carretera se raja por la línea del centro y una mitad se hunde.
  carreteraPartida: {
    cadaCuanto: [7, 13], // segundos entre una rajadura y la siguiente (mínimo, máximo)
    distancia: [140, 260], // a cuántos metros adelante de vos se raja (mínimo, máximo)
    largo: [40, 100], // largo del pedazo que se hunde, en metros (mínimo, máximo)
    aviso: 2, // segundos que se ve la raja antes de hundirse
    danio: 20, // daño si te caés en el hueco (de 100)
    maximo: 3, // cuántas puede haber a la vez
  },
};
