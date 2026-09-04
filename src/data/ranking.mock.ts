import type { FamilyProgress } from '../types'

export interface RankingEntry {
  rank: number
  family: FamilyProgress
  pew: number
  stage: number
  streakDays: number
  litersToday: number
  totalLitersSaved: number
}

export const rankingMock: RankingEntry[] = [
  {
    rank: 1,
    family: {
      name: 'Familia Salvatierra',
      avatar: '🌊',
      hydroPoints: 1520,
      streakDays: 18,
      litersToday: 65,
      totalLitersSaved: 3240,
    },
    pew: 1740,
    stage: 8,
    streakDays: 18,
    litersToday: 65,
    totalLitersSaved: 3240,
  },
  {
    rank: 2,
    family: {
      name: 'Familia Rodríguez',
      avatar: '🌱',
      hydroPoints: 1450,
      streakDays: 15,
      litersToday: 55,
      totalLitersSaved: 2980,
    },
    pew: 1670,
    stage: 8,
    streakDays: 15,
    litersToday: 55,
    totalLitersSaved: 2980,
  },
  {
    rank: 3,
    family: {
      name: 'Familia Méndez',
      avatar: '💧',
      hydroPoints: 1380,
      streakDays: 10,
      litersToday: 45,
      totalLitersSaved: 2650,
    },
    pew: 1530,
    stage: 7,
    streakDays: 10,
    litersToday: 45,
    totalLitersSaved: 2650,
  },
  {
    rank: 4,
    family: {
      name: 'Familia Gutiérrez',
      avatar: '🪴',
      hydroPoints: 1240,
      streakDays: 7,
      litersToday: 30,
      totalLitersSaved: 2210,
    },
    pew: 1390,
    stage: 7,
    streakDays: 7,
    litersToday: 30,
    totalLitersSaved: 2210,
  },
  {
    rank: 5,
    family: {
      name: 'Familia Pérez',
      avatar: '🌿',
      hydroPoints: 1120,
      streakDays: 5,
      litersToday: 25,
      totalLitersSaved: 1890,
    },
    pew: 1170,
    stage: 6,
    streakDays: 5,
    litersToday: 25,
    totalLitersSaved: 1890,
  },
  {
    rank: 6,
    family: {
      name: 'Familia Sánchez',
      avatar: '💚',
      hydroPoints: 980,
      streakDays: 3,
      litersToday: 20,
      totalLitersSaved: 1560,
    },
    pew: 1060,
    stage: 5,
    streakDays: 3,
    litersToday: 20,
    totalLitersSaved: 1560,
  },
  {
    rank: 7,
    family: {
      name: 'Familia Flores',
      avatar: '🌵',
      hydroPoints: 850,
      streakDays: 1,
      litersToday: 15,
      totalLitersSaved: 1230,
    },
    pew: 930,
    stage: 5,
    streakDays: 1,
    litersToday: 15,
    totalLitersSaved: 1230,
  },
  {
    rank: 8,
    family: {
      name: 'Familia Torres',
      avatar: '🌾',
      hydroPoints: 720,
      streakDays: 0,
      litersToday: 10,
      totalLitersSaved: 980,
    },
    pew: 720,
    stage: 4,
    streakDays: 0,
    litersToday: 10,
    totalLitersSaved: 980,
  },
  {
    rank: 9,
    family: {
      name: 'Familia Kumar',
      avatar: '🌾',
      hydroPoints: 560,
      streakDays: 0,
      litersToday: 8,
      totalLitersSaved: 750,
    },
    pew: 560,
    stage: 4,
    streakDays: 0,
    litersToday: 8,
    totalLitersSaved: 750,
  },
  {
    rank: 10,
    family: {
      name: 'Familia Nakamura',
      avatar: '🌙',
      hydroPoints: 430,
      streakDays: 0,
      litersToday: 5,
      totalLitersSaved: 520,
    },
    pew: 430,
    stage: 3,
    streakDays: 0,
    litersToday: 5,
    totalLitersSaved: 520,
  },
]