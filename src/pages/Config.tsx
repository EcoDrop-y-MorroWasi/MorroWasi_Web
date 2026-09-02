import React from "react";

type NotificationType = "daily" | "weekly" | "milestone" | "off";

export default function Config() {
  const [name, setName] = React.useState("Claudio Familia");
  const [selectedAvatar, setSelectedAvatar] = React.useState("/avatars/user-default.png");
  const [notificationType, setNotificationType] = React.useState<NotificationType>("daily");
  const [syncEnabled, setSyncEnabled] = React.useState(true);
  const [isDarkMode, setIsDarkMode] = React.useState(false);
  const [familyCapacity, setFamilyCapacity] = React.useState(1000);
  const [currentLiters, setCurrentLiters] = React.useState(342);

  const stages = [
    "Pequeño Brote",
    "Semilla Germinada",
    "Jardín de Duna",
    "Arbusto Resiliente",
    "Oasis Temprano",
    "Refugio Verde",
    "Flujo del Chira",
    "Bosque Seco",
    "Santuario Hídrico",
    "Oasis Sagrado",
  ];

  const stageIndex = Math.min(9, Math.floor(currentLiters / 100));

  return (
    <div className="mx-auto max-w-[900px] p-4 pb-24 space-y-4">
      <h2 className="text-xl font-extrabold text-[#1c1c11]"]>⚙️ Configuración</h2>

      {/* Perfil */}
      <section className="rounded-xl bg-white keyline shadow-[4px_4px_0_#1c1c11] p-4">
        <h3 className="font-extrabold text-[#1c1c11] mb-3">Perfil</h3>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-bold text-[#1c1c11]">Nombre familiar</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full rounded-lg border-2 border-[#1c1c11] px-3 py-2 text-sm"
              aria-label="Nombre familiar"
            />
          </div>
          <div className="flex items-center gap-3">
            <img
              src={selectedAvatar}
              alt="avatar"
              className="w-10 h-10 rounded-full object-cover border border-[#1c1c11]"
            />
            <button
              onClick={() => setSelectedAvatar("/avatars/user-default.png")}
              className="min-h-[48px] rounded-lg bg-[#99B4D8] border-2 border-[#1c1c11] px-4 font-extrabold shadow-[2px_2px_0_#1c1c11] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
            >
              Cambiar avatar
            </button>
          </div>
          <div>
            <span className="font-bold text-[#1c1c11]">Etapa Wasi actual</span>
            <span className="text-[18px] font-bold text-[#E26D5C]}"> {stages[stageIndex]} {stageIndex + 1}</span>
          </div>
        </div>
      </section>

      {/* Notificaciones */}
      <section className="rounded-xl bg-white keyline shadow-[4px_4px_0_#1c1c11] p-4">
        <h3 className="font-extrabold text-[#1c1c11] mb-3">Notificaciones</h3>
        <p className="text-sm text-[#1c1c11]/60]">Recibir recordatorios de misiones y logros</p>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <label className="flex items-center gap-2">
            <input
              checked={notificationType === "daily"}
              onChange={() => setNotificationType("daily")}
              className="rounded border-[#1c1c11] p-2"
              aria-label="Notificaciones diarias"
            />
            <span>Diarias</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              checked={notificationType === "weekly"}
              onChange={() => setNotificationType("weekly")}
              className="rounded border-[#1c1c11] p-2"
              aria-label="Notificaciones semanales"
            />
            <span>Semanal</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              checked={notificationType === "milestone"}
              onChange={() => setNotificationType("milestone")}
              className="rounded border-[#1c1c11] p-2"
              aria-label="Notificaciones de hitos"
            />
            <span>Hitos</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              checked={notificationType === "off"}
              onChange={() => setNotificationType("off")}
              className="rounded border-[#1c1c11] p-2"
              aria-label="Notificaciones desactivadas"
            />
            <span>Desactivado</span>
          </label>
        </div>
      </section>

      {/* Sincronización y cuenta */}
      <section className="rounded-xl bg-white keyline shadow-[4px_4px_0_#1c1c11] p-4">
        <h3 className="font-extrabold text-[#1c1c11] mb-3">Sincronización y Cuenta</h3>
        <p className="text-sm text-[#1c1c11]/60]">Backup en la nube y catálogo remoto</p>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-bold text-[#1c1c11]">Sincronizar con Firebase</label>
            <div className="mt-2 flex items-center gap-2">
              <input
                checked={syncEnabled}
                onChange={(e) => setSyncEnabled(e.target.checked)}
                className="rounded border-[#1c1c11] p-2"
                aria-label="Activar sincronización Firebase"
              />
              <span>Activado</span>
            </div>
            <p className="text-xs text-[#1c1c11]/60]">Se respaldarán HydroPuntos, progreso de cursos y misiones en la nube.</p>
          </div>
          <div>
            <label className="text-sm font-bold text-[#1c1c11]">Modo oscuro</label>
            <div className="mt-2 flex items-center gap-2">
              <input
                checked={isDarkMode}
                onChange={(e) => setIsDarkMode(e.target.checked)}
                className="rounded border-[#1c1c11] p-2"
                aria-label="Activar modo oscuro"
              />
              <span>Activado</span>
            </div>
            <p className="text-xs text-[#1c1c11]/60]">Interfaz con fondo oscuro (#0a0a0a).</p>
          </div>
          <div>
            <label className="text-sm font-bold text-[#1c1c11]">Capacidad del tanque familiar (L)</label>
            <input
              value={familyCapacity}
              onChange={(e) => setFamilyCapacity(Number(e.target.value) || 1000)}
              type="number"
              min={100}
              max={3000}
              className="mt-1 block w-full rounded-lg border-2 border-[#1c1c11] px-3 py-2 text-sm"
              aria-label="Capacidad del tanque en litros"
            />
            <p className="text-xs text-[#1c1c11]/60]">Meta familiar de ahorro.</p>
          </div>
          <div>
            <label className="text-sm font-bold text-[#1c1c11]">Litros actuales</label>
            <input
              value={currentLiters}
              onChange={(e) => setCurrentLiters(Number(e.target.value) || 0)}
              type="number"
              min={0}
              max={familyCapacity}
              className="mt-1 block w-full rounded-lg border-2 border-[#1c1c11] px-3 py-2 text-sm"
              aria-label="Litros ahorrados actuales"
            />
            <p className="text-xs text-[#1c1c11]/60]">Progreso hacia la meta familiar.</p>
          </div>
        </div>
      </section>

      {/* Botón de guardar */}
      <section className="mt-6">
        <button
          className="min-h-[48px] rounded-lg bg-[#99B4D8] border-2 border-[#1c1c11] px-6 font-extrabold shadow-[2px_2px_0_#1c1c11] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all hover:bg-[#88a5cc]"
        >
          Guardar cambios
        </button>
      </section>
    </div>
  );
}