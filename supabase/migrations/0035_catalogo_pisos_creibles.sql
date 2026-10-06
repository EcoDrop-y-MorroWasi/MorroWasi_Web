-- Pisos creíbles de duración por partida (antitrampa juegos_solapados):
-- Riego y Corte avanzan por decisión, no por reloj, así que su partida mínima
-- real es mucho menor que durationSeconds (jg-4 ≈ 40 s, jg-10 ≈ 30 s).
-- Espeja segundosMin de src/utils/gamification.ts.

update catalogo_recompensas set segundos_min = 40 where ref = 'jg-4' and tipo = 'juego';
update catalogo_recompensas set segundos_min = 30 where ref = 'jg-10' and tipo = 'juego';
