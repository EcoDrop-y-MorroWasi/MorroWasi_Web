import React from "react";
import RankingTable from "../../components/RankingTable";

type Achievement = {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  badgeColor: string;
};

type StreakEntry = {
  name: string;
  days: number;
  active: boolean;
};

const MOCK_LEADERSHIP_FAMILIES = [
  { name: "Familia Rodríguez", hydroPoints: 1890, litersSaved: 510, streakDays: 21, avatar: "/avatars/fam-rodriguez.png" },
  { name: "Familia Pérez", hydroPoints: 1240, litersSaved: 342, streakDays: 12, avatar: "/avatars/fam-perez.png" },
  { name: "Familia Gómez", hydroPoints: 980, litersSaved: 287, streakDays: 7, avatar: "/avatars/fam-gomez.png" },
];

const MOCK_LEADERSHIP_COLLEGES = [
  { name: "Instituto Nacional Piura", hydroPoints: 4850, litersSaved: 1250, rank: 1, avatar: "/avatars/col-piura.png" },
  { name: "Colegio San José", hydroPoints: 3920, litersSaved: 980, rank: 2, avatar: "/avatars/col-sanjose.png" },
  { name: "Instituto Educativo Santa María", hydroPoints: 3450, litersSaved: 870, rank: 3, avatar: "/avatars/col-santamaria.png" },
];

const MOCK_ACHIEVEMENTS: Achievement[] = [
  { id: "ach-1", title: "Cero Goteos", description: "Completar misión de detección de fugas", icon: "🚰", unlocked: true, badgeColor: "#99B4D8" },
  { id: "ach-2", title: "Ducha Flash", description: "Registrar ducha de 5 min o menos", icon: "🚿", unlocked: true, badgeColor: "#FFB793" },
  { id: "ach-3", title: "Reuso Agua Gris", description: "Reutilizar agua grises en el hogar", icon: "♻️", unlocked: false, badgeColor: "#E26D5C" },
  { id: "ach-4", title: "Racha 15 Días", description: "Mantener 15 días consecutivos activo", icon: "🔥", unlocked: true, badgeColor: "#99B4D8" },
  { id: "ach-5", title: "1000 L Metas", description: "Ahorrar 1000 litros en total", icon: "💧", unlocked: true, badgeColor: "#FFB793" },
];

const MOCK_STREAKS: StreakEntry[] = [
  { name: "Familia Rodríguez", days: 21, active: true },
  { name: "Familia Pérez", days: 12, active: true },
  { name: "Familia Gómez", days: 7, active: true },
  { name: "Colegio San José", days: 5, active: true },
];

export default function Ranking() {
  return (
    <div className="mx-auto max-w-[900px] p-4 pb-24 space-y-4">
      <h2 className="text-xl font-extrabold text-[#1c1c11]">🏆 Ranking</h2>

      {/* Familias líderes */}
      <section className="rounded-xl bg-gradient-to-br from-[#99B4D8] to-[#b8d4f0] keyline shadow-[4px_4px_0_#1c1c11] p-6 text-center" aria-label="Familias líderes">
        <h3 className="font-extrabold text-[#1c1c11] mb-3">Familias Líderes HydroPuntos</h3>
        <p className="text-sm text-[#1c1c11]/60">Top familias por puntos y ahorro</p>
        <RankingTable entries={MOCK_LEADERSHIP_FAMILIES.map((f, i) => ({
          rank: i + 1,
          name: f.name,
          role: "familia" as const,
          hydroPoints: f.hydroPoints,
          litersSaved: f.litersSaved,
          streakDays: f.streakDays,
          avatar: f.avatar,
        }))} />
      </section>

      {/* Colegios líderes */}
      <section className="mt-6 rounded-xl bg-gradient-to-br from-[#99B4D8] to-[#b8d4f0] keyline shadow-[4px_4px_0_#1c1c11] p-6 text-center" aria-label="Colegios líderes">
        <h3 className="font-extrabold text-[#1c1c11] mb-3">Colegios Líderes Ahorro Agua</h3>
        <p className="text-sm text-[#1c1c11]/60">Top instituciones por litros ahorrados</p>
        <RankingTable entries={MOCK_LEADERSHIP_COLLEGES.map((c, i) => ({
          rank: i + 1,
          name: c.name,
          role: "colegio" as const,
          hydroPoints: c.hydroPoints,
          litersSaved: c.litersSaved,
          streakDays: 0,
          avatar: c.avatar,
        }))} />
      </section>

      {/* Rachas activas */}
      <section className="mt-6 rounded-xl bg-white keyline shadow-[4px_4px_0_#1c1c11] p-4">
        <h3 className="font-extrabold text-[#1c1c11] mb-3">Rachas de Actividad</h3>
        <p className="text-sm text-[#1c1c11]/60">Días consecutivos de hábitos activos</p>
        <div className="space-y-3">
          {MOCK_STREAKS.map((streak) => (
            <div
              key={streak.name}
              className={`flex items-center justify-between rounded-lg bg-[#fdfae7] p-3 border-2 border-[#1c1c11] ${streak.active ? "bg-[#d4edda] border-[#1c6b34]" : "bg[e2e8f0]"}`
            >
              <div className="flex items-center gap-3">
                {streak.active && (
                  <img
                    src="/avatars/user-default.png"
                    alt="avatar"
                    className="w-5 h-5 rounded-full object-cover"
                  />
                )}
                <span className="font-bold text-[#1c1c11]">{streak.name}</span>
              </div>
              <div>
                <div className="text-2xl font-black text-[#E26D5C]">{streak.days}</div>
                <div className="text-xs text-[#1c1c11]/60">días</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Logros */}
      <section className="mt-6 rounded-xl bg-white keyline shadow-[4px_4px_0_#1c1c11] p-4">
        <h3 className="font-extrabold text-[#1c1c11] mb-3">Logros Desbloqueados</h3>
        <p className="text-sm text-[#1c1c11]/60"]>Logros especiales conseguidos</p>
        <div className="grid grid-cols-2 gap-3">
          {MOCK_ACHIEVEMENTS.map((ach) => (
            <div
              key={ach.id}
              className={`rounded-lg px-3 py-2 text-center ${ach.unlocked ? "bg-[#d4edda] border-[#1c6b34]" : "bg-[#f3e8e5] border-[#e26d5c]"}`}
            >
              <div className="text-2xl" aria-hidden>{ach.icon}</div>
              <div className="mt-1 font-bold text-[#1c1c11] {ach.title}</div>
              <div className="text-xs text-[#1c1c11]/60] {ach.description}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}