// Template base para Claude — src/data/mock.ts
// Paleta AGENTS.md:145 | Fórmulas AGENTS.md:245 | Secciones Morrowasi_web.md:9

export type TaskCategory = 'ducha' | 'lavanderia' | 'riego' | 'cocina' | 'fugas' | 'otros';
export interface Task { id: string; text: string; litersSaved: number; completed: boolean; xp: number; category: TaskCategory; familyMember?: string; }
export interface WasiStage { number: number; name: string; description: string; }
export const WASI_STAGES: WasiStage[] = [
  { number: 1, name: 'Pequeño Brote', description: 'Inicio del ahorro' },
  { number: 2, name: 'Semilla Germinada', description: 'Primeros hábitos' },
  { number: 3, name: 'Jardín de Duna', description: 'Resiliencia' },
  { number: 4, name: 'Arbusto Resiliente', description: 'Constancia' },
  { number: 5, name: 'Oasis Temprano', description: 'Crecimiento' },
  { number: 6, name: 'Refugio Verde', description: 'Comunidad' },
  { number: 7, name: 'Flujo del Chira', description: 'Abundancia' },
  { number: 8, name: 'Bosque Seco', description: 'Ecosistema' },
  { number: 9, name: 'Santuario Hídrico', description: 'Maestría' },
  { number: 10, name: 'Oasis Sagrado', description: 'Leyenda' },
];
// Fórmula oficial AGENTS.md:245
export const calcPEW = (hydro: number, streak: number) => hydro + Math.min(streak * 10, 1000);
export const calcStage = (pew: number) => Math.min(10, Math.floor(pew / 500) + 1);
export const calcProgress = (pew: number) => pew % 500; // de 500
export const calcXpCustom = (liters: number) => Math.min(40, Math.max(5, Math.round(liters / 3)));

export const mockFamily = { name: 'Familia Piura', hydroPoints: 850, streak: 12, litersToday: 145, litersTotal: 1240, pew: 970, stage: 2 };
export const mockReservoir = { capacityLiters: 1000, currentLiters: 650, currentPercentage: 65, daysOfWaterCut: 2, familyMembersCount: 4 };
