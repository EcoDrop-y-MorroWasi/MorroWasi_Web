import React from "react";

type MonthData = {
  month: string;
  liters: number;
  tasksCompleted: number;
  coursesCompleted: number;
  minigamesPlayed: number;
};

const MOCK_MONTHLY_DATA: MonthData[] = [
  { month: "Ene", liters: 420, tasksCompleted: 8, coursesCompleted: 2, minigamesPlayed: 5 },
  { month: "Feb", liters: 380, tasksCompleted: 6, coursesCompleted: 1, minigamesPlayed: 3 },
  { month: "Mar", liters: 510, tasksCompleted: 10, coursesCompleted: 3, minigamesPlayed: 6 },
  { month: "Abr", liters: 470, tasksCompleted: 9, coursesCompleted: 2, minigamesPlayed: 4 },
  { month: "May", liters: 630, tasksCompleted: 12, coursesCompleted: 4, minigamesPlayed: 7 },
  { month: "Jun", liters: 550, tasksCompleted: 11, coursesCompleted: 3, minigamesPlayed: 5 },
];

const MOCK_PARTICIPATION_DISTRICTS = [
  { district: "Morropón", families: 45, students: 1200, liters: 2850 },
  { district: "Piura", families: 62, students: 1850, liters: 4200 },
  { district: "Sullana", families: 38, students: 950, liters: 2100 },
  { district: "Talara", families: 25, students: 680, liters: 1450 },
];

const MOCK_COURSE_PROGRESS = {
  totalCourses: 6,
  completedCourses: 4,
  totalXPFromCourses: 850,
  progressPercentage: Math.round((4 / 6) * 100),
};

const MOCK_MINIGAMES_STATS = {
  totalPlayed: 89,
  totalXPEarned: 4500,
  bestTypes: [
    { type: "FUGAS_DETECT", count: 32, xp: 2160 },
    { type: "HUELLA_HIDRICA", count: 24, xp: 1320 },
    { type: "COSECHA_LLUVIA", count: 18, xp: 1560 },
    { type: "RIEGO_OPT", count: 15, xp: 840 },
  ],
};

export default function Estadisticas() {
  const totalLiters = MOCK_MONTHLY_DATA.reduce((sum, m) => sum + m.liters, 0);
  const totalTasks = MOCK_MONTHLY_DATA.reduce((sum, m) => sum + m.tasksCompleted, 0);
  const totalCourses = MOCK_MONTHLY_DATA.reduce((sum, m) => sum + m.coursesCompleted, 0);
  const totalMinigames = MOCK_MONTHLY_DATA.reduce((sum, m) => sum + m.minigamesPlayed, 0);

  return (
    <div className="mx-auto max-w-[900px] p-4 pb-24 space-y-4">
      <h2 className="text-xl font-extrabold text-[#1c1c11]">📊 Estadísticas</h2>

      {/* Resumen general */}
      <section className="grid grid-cols-2 gap-4 mb-6">
        <div className="rounded-xl bg-gradient-to-br from-[#99B4D8] to-[#b8d4f0] keyline shadow-[4px_4px_0_#1c1c11] p-4 text-center">
          <div className="text-3xl font-black text-[#1c1c11]">{totalLiters.toLocaleString("es-PE")} L</div>
          <div className="text-sm font-bold text-[#1c1c11]/70">Litros ahorrados</div>
        </div>
        <div className="rounded-xl bg-gradient-to-br from-[#99B4D8] to-[#b8d4f0] keyline shadow-[4px_4px_0_#1c1c11] p-4 text-center">
          <div className="text-3xl font-black text-[#1c1c11]}">{totalTasks}</div>
          <div className="text-sm font-bold text-[#1c1c11]/70">Misiones completadas</div>
        </div>
        <div className="rounded-xl bg-gradient-to-br from-[#99B4D8] to-[#b8d4f0] keyline shadow-[4px_4px_0_#1c1c11] p-4 text-center">
          <div className="text-3xl font-black text-[#1c1c11]}">{totalCourses}</div>
          <div className="text-sm font-bold text-[#1c1c11]/70">Cursos completados</div>
        </div>
        <div className="rounded-xl bg-gradient-to-br from-[#99B4D8] to-[#b8d4f0] keyline shadow-[4px_4px_0_#1c1c11] p-4 text-center">
          <div className="text-3xl font-black text-[#1c1c11]}">{totalMinigames}</div>
          <div className="text-sm font-bold text-[#1c1c11]/70">Mini-juegos jugados</div>
        </div>
      </section>

      {/* Progreso de cursos */}
      <section className="rounded-xl bg-white keyline shadow-[4px_4px_0_#1c1c11] p-4">
        <h3 className="font-extrabold text-[#1c1c11] mb-3">Progreso de Cursos</h3>
        <div className="space-y-3">
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-[#1c1c11]">Cursos completados</span>
              <span className="text-[#E26D5C]} font-bold">{MOCK_COURSE_PROGRESS.completedCourses} / {MOCK_COURSE_PROGRESS.totalCourses}</span>
            </div>
            <div className="h-2 rounded-full bg-[#fdfae7] border border-[#1c1c11] overflow-hidden">
              <div className="h-full rounded-lg bg-[#E26D5C]}" style={{ width: `${MOCK_COURSE_PROGRESS.progressPercentage}%` }} />
            </div>
            <div className="text-xs text-[#1c1c11]/60]"> {MOCK_COURSE_PROGRESS.progressPercentage}% de progreso</div>
          </div>
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-[#1c1c11]">XP obtenidos de cursos</span>
              <span className="text-[#E26D5C]} font-bold">{MOCK_COURSE_PROGRESS.totalXPFromCourses} XP</span>
            </div>
            <div className="h-2 rounded-full bg-[#fdfae7] border border-[#1c1c11] overflow-hidden">
              <div className="h-full rounded-lg bg-[#99B4D8]}" style={{ width: `${MOCK_COURSE_PROGRESS.progressPercentage}%` }} />
            </div>
          </div>
        </div>
      </section>

      {/* Estadísticas de mini-juegos */}
      <section className="mt-6 rounded-xl bg-white keyline shadow-[4px_4px_0_#1c1c11] p-4">
        <h3 className="font-extrabold text-[#1c1c11] mb-3">Mini-juegos Gamificados</h3>
        <p className="text-sm text-[#1c1c11]/60]">Estadísticas de desempeño</p>
        <div className="grid grid-cols-2 gap-3">
          {MOCK_MINIGAMES_STATS.bestTypes.map((type) => (
            <div
              key={type.type}
              className={`rounded-lg bg-[#fdfae7] border border-[#1c1c11] p-3`}
            >
              <div className="flex justify-between mb-1">
                <span className="text-[#1c1c11]">{type.type}</span>
                <span className="text-sm text-[#E26D5C]}">XP: {type.xp}</span>
              </div>
              <div className="h-2 rounded-full bg-white overflow-hidden">
                <div className="h-full rounded-lg bg-[#99B4D8]}" style={{ width: `${(type.count / MOCK_MINIGAMES_STATS.totalPlayed) * 100}%` }} />
              </div>
              <div className="text-xs text-[#1c1c11]/60]">{type.count} partidas</div>
            </div>
          ))}
        </div>
      </section>

      {/* Participación por distrito */}
      <section className="mt-6 rounded-xl bg-white keyline shadow-[4px_4px_0_#1c1c11] p-4">
        <h3 className="font-extrabold text-[#1c1c11] mb-3">Participación por Distrito</h3>
        <p className="text-sm text-[#1c1c11]/60]">Distritos de Morropón y Piura</p>
        <div className="space-y-3">
          {MOCK_PARTICIPATION_DISTRICTS.map((dist) => (
            <div
              key={dist.district}
              className={`flex items-center justify-between rounded-lg bg-[#fdfae7] p-3 border-2 border-[#1c1c11]`}
            >
              <div className="flex items-center gap-3">
                {dist.district !== "Morropón" && (
                  <img
                    src="/avatars/district-default.png"
                    alt={dist.district}
                    className="w-5 h-5 rounded-full object-cover"
                  />
                )}
                <span className="font-bold text-[#1c1c11]">{dist.district}</span>
              </div>
              <div className="text-right">
                <div className="text-sm text-[#1c1c11]">{dist.families} familias</div>
                <div className="text-sm text-[#1c1c11]">{dist.students} estudiantes</div>
                <div className="text-lg font-bold text-[#E26D5C]}">{dist.liters.toLocaleString("es-PE")} L</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Tendencias mensuales */}
      <section className="mt-6 rounded-xl bg-white keyline shadow-[4px_4px_0_#1c1c11] p-4">
        <h3 className="font-extrabold text-[#1c1c11] mb-3">Tendencias Mensuales</h3>
        <p className="text-sm text-[#1c1c11]/60]">Evolución de litros ahorrados por mes</p>
        <div className="h-8 rounded-full bg-[#fdfae7] border border-[#1c1c11] overflow-hidden">
          {MOCK_MONTHLY_DATA.map((month, i) => (
            <div
              key={month.month}
              className="h-full bg-[#E26D5C] rounded-t w-[${(month.liters / totalLiters) * 100}%] transition-all duration-500"
            />
          ))}
        </div>
        <div className="mt-3 flex justify-between text-xs text-[#1c1c11]/70]">
          {MOCK_MONTHLY_DATA.map((month) => (
            <span key={month.month}>{month.month}</span>
          ))}
        </div>
      </section>
    </div>
  );
}