// Tipos del dominio MorroWasi Web (MVP visual, sin Firebase)

export interface WasiStage {
  number: number
  name: string
}

export interface FamilyProgress {
  name: string
  avatar: string
  hydroPoints: number
  streakDays: number
  litersToday: number
  totalLitersSaved: number
}

export interface ReservoirConfig {
  capacityLiters: number
  currentLiters: number
  daysOfWaterCut: number
  familyMembersCount: number
}
