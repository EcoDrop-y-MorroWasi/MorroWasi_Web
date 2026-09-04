export interface StatsChartData {
  label: string
  value: number | string
}

export const statsChartData: StatsChartData[] = [
  { label: 'Litros ahorrados total', value: '284,300 L' },
  { label: 'Familias activas', value: 128 },
  { label: 'Colegios participantes', value: 6 },
  { label: 'Cursos completados', value: 512 },
]

export const litrosPorFamilia: StatsChartData[] = [
  { label: 'Familia Salvatierra', value: 3240 },
  { label: 'Familia Rodríguez', value: 2980 },
  { label: 'Familia Méndez', value: 2650 },
  { label: 'Familia Gutiérrez', value: 2210 },
  { label: 'Resto familias', value: 3870 },
]

export const participacionPorDistrito: { label: string; value: number }[] = [
  { label: 'Piura', value: 45 },
  { label: 'Morropón', value: 30 },
  { label: 'Lima', value: 15 },
  { label: 'Otras', value: 10 },
]

export const progresoCursos: { course: string; completed: number; total: number }[] = [
  { course: 'SODIS', completed: 45, total: 60 },
  { course: 'Aguas Grises', completed: 32, total: 50 },
  { course: 'Filtros Caseros', completed: 28, total: 45 },
  { course: 'Riego Goteo', completed: 22, total: 40 },
  { course: 'Cosecha Lluvia', completed: 18, total: 35 },
  { course: 'Humedales', completed: 12, total: 30 },
]

export const rachaSemanal: { label: string; value: number }[] = [
  { label: '7 días', value: 42 },
  { label: '6 días', value: 38 },
  { label: '5 días', value: 35 },
  { label: '4 días', value: 28 },
  { label: '3 días', value: 25 },
  { label: '2 días', value: 20 },
  { label: '1 día', value: 15 },
]