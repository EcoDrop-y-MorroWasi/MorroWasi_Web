import type { FamilyProgress, ReservoirConfig, WasiStage } from '../types'

// Datos simulados — sin llamadas a Firebase (AGENTS.md §2, offline-first MVP)

export const WASI_STAGES: WasiStage[] = [
  { number: 1, name: 'Pequeño Brote' },
  { number: 2, name: 'Semilla Germinada' },
  { number: 3, name: 'Jardín de Duna' },
  { number: 4, name: 'Arbusto Resiliente' },
  { number: 5, name: 'Oasis Temprano' },
  { number: 6, name: 'Refugio Verde' },
  { number: 7, name: 'Flujo del Chira' },
  { number: 8, name: 'Bosque Seco' },
  { number: 9, name: 'Santuario Hídrico' },
  { number: 10, name: 'Oasis Sagrado' },
]

// Configuración predeterminada de una cuenta nueva (sin Firebase todavía: esto
// arranca cuando el localStorage está vacío). hydroPoints/totalLitersSaved viven
// en sus propios stores (hydroStore.ts / litersStore.ts) — acá solo quedan los
// campos que aún no tienen store propio.
export const mockFamily: FamilyProgress = {
  name: 'Familia MorroWasi',
  avatar: '🌊',
  hydroPoints: 0,
  streakDays: 0,
  litersToday: 0,
  totalLitersSaved: 0,
}

export const mockReservoir: ReservoirConfig = {
  capacityLiters: 0,
  currentLiters: 0,
  daysOfWaterCut: 0,
  familyMembersCount: 1,
}

// RN-06 SRS / morrowasi-preview.html: xp = round(litros/3) acotado 5-40
export function customMissionXp(liters: number): number {
  return Math.max(5, Math.min(40, Math.round(liters / 3)))
}

// RN-11 SRS / AGENTS.md §5: PEW = EXP (ganada en Misiones) + min(racha*10, 1000).
// EXP es lo que hace crecer al Wasi — separado de HydroPuntos (Juegos + Cursos
// completados), que es la moneda para desbloqueos/tienda y no mueve al Wasi.
export function calcPew(exp: number, streakDays: number): number {
  return exp + Math.min(streakDays * 10, 1000)
}

// PEW acumulado requerido para ALCANZAR cada etapa (índice 0 = etapa 1, arranca en 0).
// Curva creciente: cada etapa pide más que la anterior, hasta 1,000,000 PEW en la etapa 10.
export const WASI_STAGE_THRESHOLDS = [0, 1000, 3000, 7000, 15000, 30000, 60000, 150000, 400000, 1000000] as const

// etapa = la más alta cuyo umbral acumulado ya se superó (máx. 10, no retrocede).
// progressInStage = PEW ganado dentro de la etapa actual; xpParaSiguiente = lo que pide esa etapa completa.
export function calcWasiStage(pew: number): { stage: number; progressInStage: number; xpParaSiguiente: number } {
  let stage = 1
  for (let i = WASI_STAGE_THRESHOLDS.length - 1; i >= 0; i--) {
    if (pew >= WASI_STAGE_THRESHOLDS[i]) {
      stage = i + 1
      break
    }
  }
  stage = Math.min(10, stage)
  const inicioEtapa = WASI_STAGE_THRESHOLDS[stage - 1]
  const finEtapa = WASI_STAGE_THRESHOLDS[Math.min(stage, WASI_STAGE_THRESHOLDS.length - 1)]
  const xpParaSiguiente = stage < 10 ? finEtapa - inicioEtapa : WASI_STAGE_THRESHOLDS[9] - WASI_STAGE_THRESHOLDS[8]
  const progressInStage = stage < 10 ? pew - inicioEtapa : xpParaSiguiente
  return { stage, progressInStage, xpParaSiguiente }
}
