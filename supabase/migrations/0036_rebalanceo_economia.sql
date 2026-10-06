-- Rebalanceo economía: juegos pagan EXP hydro/10 (antes /5) y las
-- personalizadas pagan 5 fijos (antes hasta 40, auto-premio).
-- Espeja calcGameExp() y calcCustomXp() de src/utils/gamification.ts.
-- Ojo: ledgers locales aún sin sincronizar con valores viejos (juegos 11-20
-- EXP, personalizadas 6-40) serán rechazados al sincronizar. Pérdida acotada
-- a lo no sincronizado; los dos perfiles en revisión ya sincronizaron todo.

update catalogo_recompensas
set exp_min = 3, exp_max = 10
where tipo = 'juego';

update catalogo_recompensas
set exp_min = 5, exp_max = 5
where ref = 'personalizada' and tipo = 'mision';
