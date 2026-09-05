-- Fix: moderar_mensaje() (0005) detectaba por substring puro
-- (`position(word in texto) > 0`), así que "hola" disparaba el filtro por
-- contener "hol" (palabrota neerlandesa) — mismo problema con "con" (fr),
-- "am"/"got" (tr), "cu" (pt, 2 letras) y varias más de 2-4 letras que son
-- substrings de palabras comunes en español.
--
-- Fix: exigir límite de palabra (\y, metasintaxis de regex avanzado de
-- Postgres) para idiomas que separan palabras con espacios. Para chino y
-- japonés (sin espacios entre palabras) se mantiene el match por substring,
-- que ahí sí es lo correcto — imponerles límite de palabra rompería la
-- detección real en esos dos idiomas.

create or replace function moderar_mensaje()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_texto_normalizado text;
  v_patron text;
  v_encontro boolean := false;
  v_count int;
  r record;
begin
  v_texto_normalizado := lower(unaccent(NEW.text));

  for r in
    select b.word, b.lang
    from banned_words b
    where
      case
        when b.lang in ('zh', 'ja') then position(b.word in v_texto_normalizado) > 0
        else v_texto_normalizado ~* ('\y' || regexp_replace(b.word, '([.^$*+?()\[\]{}|\\])', '\\\1', 'g') || '\y')
      end
  loop
    v_encontro := true;
    v_patron := regexp_replace(r.word, '([.^$*+?()\[\]{}|\\])', '\\\1', 'g');
    if r.lang not in ('zh', 'ja') then
      v_patron := '\y' || v_patron || '\y';
    end if;
    NEW.text := regexp_replace(NEW.text, v_patron, repeat('*', length(r.word)), 'gi');
  end loop;

  if not v_encontro then
    return NEW;
  end if;

  insert into chat_warnings (chat_id, user_id, count)
  values (NEW.chat_id, NEW.sender_id, 1)
  on conflict (chat_id, user_id) do update set count = chat_warnings.count + 1
  returning count into v_count;

  if v_count >= 3 then
    delete from chats where id = NEW.chat_id;
    return null; -- cancela este insert — la sala ya no existe
  end if;

  return NEW;
end;
$$;
