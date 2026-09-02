import type { RankingEntry } from '../data/ranking.mock'

const getStageName = (stage: number) => {
  const wasiStages: Record<number, string> = {
    1: 'Pequeño Brote',
    2: 'Semilla Germinada',
    3: 'Jardín de Duna',
    4: 'Arbusto Resiliente',
    5: 'Oasis Temprano',
    6: 'Refugio Verde',
    7: 'Flujo del Chira',
    8: 'Bosque Seco',
    9: 'Santuario Hídrico',
    10: 'Oasis Sagrado',
  }
  return wasiStages[stage] ?? 'N/A'
}

export const RankingTable = ({ entries }: { entries: RankingEntry[] }) => {
  return (
    <div className="keyline-border rounded-2xl bg-bg-light p-6">
      <h2 className="font-display text-lg font-bold mb-4">Ranking de Familias</h2>
      <div className="overflow-x-auto">
        <table className="w-full rounded-border border-2 border-[#1c1c11]">
          <thead>
            <tr className="text-left text-xs font-semibold text-ink/60 border-b-2 border-[#1c1c11]">
              <th className="p-4">#</th>
              <th className="p-4">Familia</th>
              <th className="p-4">HydroPuntos</th>
              <th className="p-4">Etapa Wasi</th>
              <th className="p-4">Racha</th>
              <th className="p-4">Litros Guardados</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry.family.name} className="border-b-2 border-[#1c1c11]">
                <td className="p-4 font-semibold">{entry.rank}.</td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl" aria-hidden="true">{entry.family.avatar}</span>
                    <span>{entry.family.name}</span>
                  </div>
                </td>
                <td className="p-4 font-display text-accent">{entry.family.hydroPoints}</td>
                <td className="p-4">
                  <span className="text-sm">{getStageName(entry.stage)}</span>
                </td>
                <td className="p-4">
                  <span className="text-sm font-body">
                    {entry.streakDays} {entry.streakDays === 1 ? 'día' : 'días'}
                  </span>
                </td>
                <td className="p-4 font-body">{entry.totalLitersSaved} L</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}