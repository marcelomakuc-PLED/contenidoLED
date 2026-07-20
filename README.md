# Contenido HTML para Pendón LED (P1.8 / P2.5)

Contenido informativo en tiempo real para pantalla LED vertical con aspecto
**0,33:1** (ancho:alto = 1:3), pensado para pendones publicitarios tipo tótem.

Todo está en un solo archivo: **`index.html`** — sin dependencias, sin
librerías externas, sin API keys. Basta abrirlo en el navegador del player.

## Qué muestra

| Sección | Contenido | Fuente | Actualización |
|---|---|---|---|
| Cabecera | Hora (con segundos) y fecha en español | Reloj local (zona `America/Santiago`) | Cada segundo |
| El Tiempo | Temperatura, ícono animado, máx/mín, humedad, viento | [Open-Meteo](https://open-meteo.com) (gratis, sin key) | Cada 15 min |
| Indicadores | Dólar observado, UF y UTM con variación diaria ▲▼ | [mindicador.cl](https://mindicador.cl) | Cada 30 min |
| Noticias | Titulares RSS rotativos con barra de progreso | Cooperativa, Emol, La Tercera | Cada 10 min |
| Cinta inferior | Marquesina continua con indicadores + titulares | (mezcla de lo anterior) | Automática |

## Diseño pensado para LED

- **Fondo negro** y colores 100% saturados: máximo contraste y menor consumo.
- **Tipografía extra gruesa** (Arial Black, weight 900) y sin suavizado:
  legible en pitch P2.5 incluso a baja resolución.
- **Sin líneas finas** ni degradados sutiles que se pierden entre píxeles.
- Íconos de clima en **SVG animado** (sol girando, lluvia cayendo, rayo
  destellando) — nada de imágenes externas que puedan fallar sin internet.
- Cada sección tiene su color propio: azul/cian (clima), verde (dólar),
  naranjo (UF), violeta (UTM), rojo (noticias), amarillo (cinta).

## Resolución y escalado

El diseño base es **384 × 1152 px (1:3)** y se **escala automáticamente**
al tamaño real de la pantalla manteniendo la proporción. Sirve tal cual para
resoluciones típicas de pendón:

- P2.5 → ej. 320×960, 336×1008
- P1.8 → ej. 480×1440, 512×1536

## Instalación en el player

1. Copie `index.html` al player (o publíquelo en una URL) y ábralo en el
   navegador / módulo HTML del software del LED (NovaStar, HD Player,
   Xibo, etc.) en modo kiosco / pantalla completa.
2. Requiere **conexión a internet** para clima, indicadores y noticias.
   Si se corta la conexión, mantiene los últimos valores mostrados y
   reintenta solo.
3. La página se **recarga sola cada 6 horas** para evitar fugas de memoria
   en players que quedan encendidos 24/7.

## Personalización (bloque `CONFIG` al inicio del `<script>`)

```js
ciudad: 'Santiago',        // nombre mostrado
latitud: -33.45,           // coordenadas para el clima
longitud: -70.66,
feeds: [ ... ],            // agregue o cambie fuentes RSS
segundosPorNoticia: 9,     // velocidad de rotación de titulares
refrescoClimaMin: 15,      // frecuencias de actualización
```

Las noticias RSS se leen a través del proxy público `allorigins.win`
(necesario porque los diarios no permiten lectura directa desde el
navegador). Si prefiere no depender de un proxy, puede reemplazar
`proxyRSS` por un proxy propio o un servicio como rss2json.

## Ideas de ampliación

- Segunda "página" rotativa con publicidad propia intercalada.
- Pronóstico de 3 días bajo el clima actual.
- Farmacias de turno, sismos recientes (API de sismología) o estado del
  tránsito.
- Logo de la empresa en la cabecera junto al reloj.
