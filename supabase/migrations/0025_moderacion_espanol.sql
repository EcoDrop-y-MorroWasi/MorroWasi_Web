-- Filtro de lisuras: español primero.
--
-- 1) Falsos positivos: la lista (dataset LDNOOBW, 26 idiomas) se aplica entera a
--    cada mensaje, así que palabras de otros idiomas que en español son normales
--    censuraban y sumaban advertencias: "con" (fr), "del" (nl), "mama"/"comer" (pt),
--    "debil" (cs), "pico" (eo), "sm" (ja, tapaba "mismo"/"fantasma"), nombres como
--    Regina o Anita… Se quitan esas, y de la lista de español las que no son lisuras
--    (martillo, orina, trio, infierno…). Revisado contra las 50.000 palabras más
--    frecuentes del español.
-- 2) Lisuras peruanas/latinoamericanas que faltaban (huevón, cojudo, conchatumare,
--    carajo, chucha, pinga, ctm, ptm…).
-- 3) Cada palabra guarda un patrón precalculado (patron_moderacion) que tolera
--    letras repetidas ("mierdaaa"), números por letras ("put4", "m1erda"), espacios
--    o guiones dentro de frases ("concha-tu-madre", "conchatumadre") y, en español,
--    plurales ("putas", "cabrones").
-- 4) Censura con tildes: antes se detectaba "maricón" pero el reemplazo buscaba
--    "maricon" sin tilde en el texto original y no tapaba nada. Ahora se ubica la
--    coincidencia en el texto normalizado y se tapan esas mismas posiciones.
--    Requiere Postgres 15+ (regexp_instr).

create or replace function patron_moderacion(p_word text, p_lang text)
returns text
language plpgsql
stable
set search_path = public, extensions
as $$
declare
  v_w text := lower(unaccent(p_word));
  v_c text;
  v_cuerpo text := '';
begin
  -- Chino y japonés no separan palabras con espacios: se buscan como fragmento.
  if p_lang in ('zh', 'ja') then
    return regexp_replace(v_w, '([.^$*+?()\[\]{}|\\])', '\\\1', 'g');
  end if;

  foreach v_c in array regexp_split_to_array(v_w, '') loop
    v_cuerpo := v_cuerpo || case
      when v_c ~ '[[:space:]]' then '[[:space:][:punct:]]*'
      when v_c = 'a' then '[a4@]+'
      when v_c = 'e' then '[e3]+'
      when v_c = 'i' then '[i1!]+'
      when v_c = 'o' then '[o0]+'
      when v_c = 's' then '[s5$]+'
      when v_c = 't' then '[t7]+'
      else regexp_replace(v_c, '([.^$*+?()\[\]{}|\\-])', '\\\1', 'g') || '+'
    end;
  end loop;

  if p_lang = 'es' and v_w ~ '[[:alpha:]]$' then
    v_cuerpo := v_cuerpo || '(e?s)?';
  end if;

  return '(?<![[:alnum:]])' || v_cuerpo || '(?![[:alnum:]])';
end;
$$;

alter table banned_words add column if not exists patron text;

create or replace function banned_words_set_patron()
returns trigger
language plpgsql
set search_path = public, extensions
as $$
begin
  NEW.patron := patron_moderacion(NEW.word, NEW.lang);
  return NEW;
end;
$$;

drop trigger if exists banned_words_set_patron_trigger on banned_words;
create trigger banned_words_set_patron_trigger
  before insert or update of word, lang on banned_words
  for each row
  execute function banned_words_set_patron();

delete from banned_words where (lang, word) in (values
  ('fr', 'con'), ('fr', 'peter'), ('fr', 'gerber'), ('fr', 'pipi'), ('nl', 'del'), ('nl', 'anita'),
  ('nl', 'pot'), ('nl', 'johny'), ('pt', 'mama'), ('pt', 'comer'), ('pt', 'saco'), ('pt', 'burro'),
  ('pt', 'chupar'), ('pt', 'gozar'), ('pt', 'inferno'), ('pt', 'aborto'), ('pt', 'amador'), ('pt', 'cocaina'),
  ('pt', 'heterosexual'), ('pt', 'homosexual'), ('pt', 'bissexual'), ('pt', 'homem gay'), ('pt', 'lesbica'), ('pt', 'pinto'),
  ('pt', 'porra'), ('pt', 'pau'), ('pt', 'bosta'), ('pt', 'vibrador'), ('pt', 'consolo'), ('pt', 'ariano'),
  ('pt', 'aranha'), ('pt', 'cerveja'), ('pt', 'torneira'), ('pt', 'camisinha'), ('pt', 'frango assado'), ('en', 'sexo'),
  ('en', 'sexual'), ('en', 'sexually'), ('en', 'sexuality'), ('en', 'negro'), ('en', 'vagina'), ('en', 'clitoris'),
  ('en', 'vulva'), ('en', 'semen'), ('en', 'fecal'), ('en', 'lolita'), ('en', 'domination'), ('en', 'escort'),
  ('cs', 'debil'), ('cs', 'pica'), ('eo', 'pico'), ('tr', 'am'), ('tr', 'got'), ('no', 'fan'),
  ('no', 'satan'), ('it', 'mona'), ('it', 'regina'), ('it', 'monta'), ('it', 'montare'), ('it', 'tirare'),
  ('it', 'pompa'), ('it', 'brinca'), ('it', 'pippa'), ('ru', 'gol'), ('sv', 'olla'), ('sv', 'pitt'),
  ('sv', 'hard'), ('sv', 'sas'), ('da', 'pis'), ('fil', 'bobo'), ('fil', 'tanga'), ('pl', 'burdel'),
  ('hu', 'pina'), ('hu', 'pele'), ('fi', 'pano'), ('fi', 'reva'), ('fi', 'muna'), ('de', 'mose'),
  ('ja', 'sm'), ('ja', '3p'), ('zh', '13.'), ('es', 'asesinato'), ('es', 'asno'), ('es', 'caca'),
  ('es', 'chupada'), ('es', 'chupeton'), ('es', 'concha'), ('es', 'cono'), ('es', 'coprofagia'), ('es', 'drogas'),
  ('es', 'esperma'), ('es', 'fiesta de salchichas'), ('es', 'haciendo el amor'), ('es', 'heroina'), ('es', 'infierno'), ('es', 'maciza'),
  ('es', 'maldito'), ('es', 'martillo'), ('es', 'nazi'), ('es', 'orina'), ('es', 'pedo'), ('es', 'pezon'),
  ('es', 'racista'), ('es', 'sadico'), ('es', 'tia buena'), ('es', 'travesti'), ('es', 'trio')
);

-- on conflict: si la palabra ya estaba cargada en otro idioma (ej. "cagar" en pt),
-- pasa a español para que también detecte plurales.
insert into banned_words (word, lang) values
  ('huevon', 'es'), ('huevona', 'es'), ('huevonazo', 'es'), ('huevonada', 'es'), ('huevada', 'es'), ('webon', 'es'),
  ('webona', 'es'), ('wevon', 'es'), ('wevona', 'es'), ('weon', 'es'), ('weona', 'es'), ('guevon', 'es'),
  ('guevona', 'es'), ('guebon', 'es'), ('hueon', 'es'), ('cojudo', 'es'), ('cojuda', 'es'), ('cojudez', 'es'),
  ('cojudeces', 'es'), ('cojudear', 'es'), ('concha tu madre', 'es'), ('concha tu mare', 'es'), ('concha su madre', 'es'), ('concha su mare', 'es'),
  ('concha de su madre', 'es'), ('conchatumare', 'es'), ('conchetumare', 'es'), ('conchetumadre', 'es'), ('conchesumare', 'es'), ('conchasumare', 'es'),
  ('conchudo', 'es'), ('conchuda', 'es'), ('chucha', 'es'), ('chucha tu madre', 'es'), ('chuchatumare', 'es'), ('chuchasumare', 'es'),
  ('puto', 'es'), ('putazo', 'es'), ('puta madre', 'es'), ('putamadre', 'es'), ('putamare', 'es'), ('hijo de perra', 'es'),
  ('hija de perra', 'es'), ('hijueputa', 'es'), ('hijodeputa', 'es'), ('hijo e puta', 'es'), ('jijuna', 'es'), ('jijunagranputa', 'es'),
  ('malparido', 'es'), ('malparida', 'es'), ('malnacido', 'es'), ('ctm', 'es'), ('ctmr', 'es'), ('csm', 'es'),
  ('csmr', 'es'), ('ptm', 'es'), ('ptmr', 'es'), ('hdp', 'es'), ('mrd', 'es'), ('chtm', 'es'),
  ('carajo', 'es'), ('carajazo', 'es'), ('joder', 'es'), ('jodido', 'es'), ('jodida', 'es'), ('jodete', 'es'),
  ('cagar', 'es'), ('cagada', 'es'), ('cagado', 'es'), ('cagon', 'es'), ('cagona', 'es'), ('mierdoso', 'es'),
  ('pinga', 'es'), ('pichula', 'es'), ('pichulita', 'es'), ('chupapinga', 'es'), ('chupapichula', 'es'), ('chupapija', 'es'),
  ('cachero', 'es'), ('cachera', 'es'), ('pajero', 'es'), ('pajera', 'es'), ('pajearse', 'es'), ('teta', 'es'),
  ('tetona', 'es'), ('ojete', 'es'), ('culero', 'es'), ('culera', 'es'), ('culiao', 'es'), ('culiado', 'es'),
  ('pendeja', 'es'), ('pendejada', 'es'), ('cabrona', 'es'), ('maricona', 'es'), ('maraco', 'es'), ('rosquete', 'es'),
  ('zorra', 'es'), ('estupido', 'es'), ('estupida', 'es'), ('tarado', 'es'), ('tarada', 'es'), ('baboso', 'es'),
  ('babosa', 'es'), ('mongolo', 'es'), ('mongolito', 'es'), ('subnormal', 'es'), ('boludo', 'es'), ('boluda', 'es'),
  ('pelotudo', 'es'), ('pelotuda', 'es'), ('chingar', 'es'), ('chingada', 'es'), ('chingado', 'es'), ('chinga tu madre', 'es'),
  ('hijo de la chingada', 'es')
on conflict (word) do update set lang = 'es';

update banned_words set patron = patron_moderacion(word, lang);
alter table banned_words alter column patron set not null;

-- Rendimiento: evaluar ~2.500 regex sueltas por mensaje obligaba a Postgres a
-- recompilarlas todas cada vez (solo guarda 32 compiladas por conexión). Se
-- agrupan de a 100 en ~26 regex (una sola con todas es "too complex" para
-- Postgres), que sí quedan compiladas entre mensajes.
create table if not exists moderacion_grupos (
  grupo int primary key,
  patron text not null
);
alter table moderacion_grupos enable row level security;
-- Sin policies, igual que banned_words: solo la leen funciones SECURITY DEFINER.

create or replace function reconstruir_moderacion_grupos()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from moderacion_grupos;
  insert into moderacion_grupos (grupo, patron)
  select g, string_agg('(?:' || patron || ')', '|' order by lang, word)
  from (select lang, word, patron, (row_number() over (order by lang, word) - 1) / 100 as g from banned_words) s
  group by g;
end;
$$;

create or replace function banned_words_refrescar_grupos()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform reconstruir_moderacion_grupos();
  return null;
end;
$$;

drop trigger if exists banned_words_refrescar_grupos_trigger on banned_words;
create trigger banned_words_refrescar_grupos_trigger
  after insert or update or delete or truncate on banned_words
  for each statement
  execute function banned_words_refrescar_grupos();

-- Internas: sin esto quedarían expuestas como RPC en la API de Supabase.
revoke all on function reconstruir_moderacion_grupos() from public, anon, authenticated;
revoke all on function patron_moderacion(text, text) from public, anon, authenticated;

select reconstruir_moderacion_grupos();

create or replace function moderar_texto(
  p_texto text,
  out texto text,
  out encontro boolean
)
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_norm text;
  v_censurado text;
  v_mismo_largo boolean;
  v_ini int;
  v_fin int;
  v_pos int;
  r record;
begin
  texto := p_texto;
  encontro := false;
  if p_texto is null then
    return;
  end if;

  v_norm := lower(unaccent(p_texto));
  v_censurado := v_norm;
  -- unaccent casi siempre cambia 1 letra por 1 (á→a, ñ→n); si no (ß→ss, æ→ae),
  -- las posiciones no coinciden y se devuelve el texto normalizado ya tapado.
  v_mismo_largo := length(v_norm) = length(p_texto);

  for r in select g.patron from moderacion_grupos g where v_norm ~ g.patron loop
    encontro := true;
    v_pos := 1;
    loop
      v_ini := regexp_instr(v_norm, r.patron, v_pos);
      exit when v_ini = 0;
      v_fin := greatest(regexp_instr(v_norm, r.patron, v_pos, 1, 1), v_ini + 1);
      v_censurado := overlay(v_censurado placing repeat('*', v_fin - v_ini) from v_ini for v_fin - v_ini);
      if v_mismo_largo then
        texto := overlay(texto placing repeat('*', v_fin - v_ini) from v_ini for v_fin - v_ini);
      end if;
      v_pos := v_fin;
    end loop;
  end loop;

  if encontro and not v_mismo_largo then
    texto := v_censurado;
  end if;
end;
$$;
