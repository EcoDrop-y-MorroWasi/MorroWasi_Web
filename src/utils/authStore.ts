import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabaseClient";

// A diferencia de hydroStore/expStore no hace falta un evento custom: supabase-js
// ya emite onAuthStateChange en cualquier pestaña donde haya sesión activa.
export function useAuthSession(): { session: Session | null; loading: boolean } {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setLoading(false);
    });

    return () => subscription.subscription.unsubscribe();
  }, []);

  return { session, loading };
}

/**
 * Sesión anónima de Supabase: sin correo, sin Google, sin contraseña — solo un
 * auth.uid() real para que sigan funcionando las RLS existentes (chats, etc).
 * El progreso en sí no depende de esto (vive en localStorage / código corto,
 * ver progressSync.ts); esta sesión es lo mínimo que pide Supabase Auth para
 * dejar pasar al resto de la app.
 */
export async function signInAnonymously() {
  const { error } = await supabase.auth.signInAnonymously();
  if (error) throw error;
}

export async function signOut() {
  await supabase.auth.signOut();
}

/**
 * Borra SOLO lo propio del chat (parte de "Eliminar cuenta" en Perfil): los
 * mensajes que esta persona escribió, su participación en cada sala, y su
 * historial de advertencias de moderación. Las policies de DELETE (0022)
 * ya acotan cada borrado a auth.uid() = esta sesión, así que no puede tocar
 * nada de otro participante — la sala y los mensajes ajenos quedan intactos.
 */
export async function deleteMyChatData(): Promise<void> {
  const { data } = await supabase.auth.getSession();
  const uid = data.session?.user.id;
  if (!uid) return;
  const [m, p, w] = await Promise.all([
    supabase.from("messages").delete().eq("sender_id", uid),
    supabase.from("chat_participants").delete().eq("user_id", uid),
    supabase.from("chat_warnings").delete().eq("user_id", uid),
  ]);
  const error = m.error ?? p.error ?? w.error;
  if (error) throw error;
}
