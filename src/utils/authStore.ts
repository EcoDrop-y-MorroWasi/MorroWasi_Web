import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabaseClient";

// Sesión real de Supabase (reemplaza el login falso admin/1234 en localStorage).
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
