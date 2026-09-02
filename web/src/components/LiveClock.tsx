import { useEffect, useState } from 'react'

const TIME_ZONE = 'America/Lima'

const dateFormatter = new Intl.DateTimeFormat('es-PE', {
  timeZone: TIME_ZONE,
  weekday: 'short',
  day: '2-digit',
  month: 'short',
})

const timeFormatter = new Intl.DateTimeFormat('es-PE', {
  timeZone: TIME_ZONE,
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: true,
})

// Reloj en vivo del header: se fija a la hora de inicio de sesión y avanza solo,
// segundo a segundo, según la hora real (America/Lima) — no un valor congelado.
export default function LiveClock() {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(id)
  }, [])

  return (
    <div className="flex items-center gap-1.5 text-xs font-semibold text-ink/70 sm:text-sm" aria-live="off">
      <span aria-hidden>🕒</span>
      <span className="capitalize">{dateFormatter.format(now)}</span>
      <span className="tabular-nums">{timeFormatter.format(now)}</span>
    </div>
  )
}
