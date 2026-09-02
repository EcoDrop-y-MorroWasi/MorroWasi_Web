import { RankingTable } from '../components/RankingTable'
import { rankingMock } from '../data/ranking.mock'

export const Ranking = () => {
  const entries = [...rankingMock].sort(
    (a, b) => b.family.hydroPoints - a.family.hydroPoints,
  )

  return (
    <div className="keyline-border rounded-2xl bg-bg-light p-6">
      <h2 className="font-display text-lg font-bold mb-6">Ranking General</h2>
      <RankingTable entries={entries} />
    </div>
  )
}