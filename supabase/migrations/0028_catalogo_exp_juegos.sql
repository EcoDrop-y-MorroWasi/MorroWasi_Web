-- Los minijuegos ahora acreditan EXP además de HydroPuntos:
-- calcGameExp(30) = 6 y calcGameExp(100) = 20. Esta migración es
-- intencionalmente nueva: 0010 y 0017 ya pueden haber sido aplicadas.
-- El catálogo completo se genera en supabase/catalogo_recompensas.generated.sql.

update catalogo_recompensas
set exp_min = 6,
    exp_max = 20
where tipo = 'juego';
