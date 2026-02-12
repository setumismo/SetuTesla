# Tesla Model Y Browser SPA

SPA orientada a la pantalla horizontal del Tesla Model Y con:

- Modo oscuro puro (#000).
- Menú lateral con botones circulares grandes.
- Navegación con Mapbox + geolocalización en tiempo real.
- Multimedia con accesos a Spotify, YouTube Music y Tidal dentro de un iframe.
- Dashboard de reloj, fecha y clima (OpenWeather).
- Ajustes persistentes en `localStorage`.

## Uso

1. Abre `index.html` en el navegador del vehículo o en un navegador de escritorio.
2. Ve a **Ajustes** y añade:
   - `Mapbox Public Token`.
   - `OpenWeather API Key`.
   - Ciudad para el widget de clima.
3. Regresa a **Mapa** y **Apps** para ver navegación y clima activos.

## Nota Tesla

- No se usan pop-ups.
- Todo se carga en la misma SPA mediante iframe o navegación directa.
