import { Navigate } from "react-router-dom";

// Ahorro se fusionó con Noticias (bottom nav rename Ahorro → Noticias). Redirección de compatibilidad
// para cualquier enlace/marcador antiguo a /ahorro; toda la lógica vive ahora en pages/Noticias.tsx.
export default function Ahorro() {
  return <Navigate to="/noticias" replace />;
}
