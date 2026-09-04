-- Sin esto, ChatWidget.tsx se suscribe a postgres_changes pero nunca recibe eventos:
-- una tabla solo emite por Realtime si está agregada a la publicación supabase_realtime.
alter publication supabase_realtime add table messages;
alter publication supabase_realtime add table chat_participants;
