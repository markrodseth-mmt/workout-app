const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const GOAL_MIN = 1
const GOAL_MAX = 14

// Parse a 'YYYY-MM-DD' string as a *local* date (avoid the UTC shift that
// `new Date('YYYY-MM-DD')` applies, which can bump a session into the wrong week).
function parseLocal(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d)
}
function isoDate(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}
function addDays(date, n) {
  const c = new Date(date)
  c.setDate(c.getDate() + n)
  return c
}
// Monday that starts the week containing `date` (weeks run Mon–Sun).
function mondayOf(date) {
  const offset = (date.getDay() + 6) % 7 // days since Monday (Sun=6 … Sat=5)
  return addDays(new Date(date.getFullYear(), date.getMonth(), date.getDate()), -offset)
}

// One SVG donut per week: `goal` segments with small gaps; the first
// min(count, goal) are filled in the status colour, the rest sit on a faint track.
function WeekRing({ count, goal }) {
  const size = 48
  const sw = 5
  const r = (size - sw) / 2
  const c = 2 * Math.PI * r
  const cx = size / 2

  const status = count === 0 ? 'missed' : count >= goal ? 'met' : 'partial'
  const filled = Math.min(count, goal)
  const segAngle = 360 / goal
  const gapDeg = Math.min(18, segAngle * 0.28)
  const arc = c * ((segAngle - gapDeg) / 360)

  return (
    <svg className={`ring-svg ${status}`} width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img">
      <circle className="ring-track" cx={cx} cy={cx} r={r} fill="none" strokeWidth={sw} />
      {Array.from({ length: goal }, (_, i) => (
        i < filled && (
          <circle
            key={i}
            cx={cx}
            cy={cx}
            r={r}
            fill="none"
            stroke="currentColor"
            strokeWidth={sw}
            strokeLinecap="round"
            strokeDasharray={`${arc} ${c - arc}`}
            transform={`rotate(${-90 + i * segAngle} ${cx} ${cx})`}
          />
        )
      ))}
      <text className="ring-num" x={cx} y={cx} textAnchor="middle" dominantBaseline="central">{count}</text>
    </svg>
  )
}

export default function Activity({ sessions, settings, onSaveSettings }) {
  const goal = settings?.weeklyWorkoutGoal ?? 3

  // Count completed workouts per week, keyed by the week's Monday.
  const counts = new Map()
  for (const s of sessions) {
    if (!s.performed_on) continue
    const key = isoDate(mondayOf(parseLocal(s.performed_on)))
    counts.set(key, (counts.get(key) || 0) + 1)
  }

  const today = new Date()
  const latestMonday = mondayOf(today)
  // Start from the earliest session's week, or just this week if there's none.
  let earliestMonday = latestMonday
  for (const key of counts.keys()) {
    const m = parseLocal(key)
    if (m < earliestMonday) earliestMonday = m
  }

  // Chronological list of weeks, grouped into months by each week's Monday.
  const months = []
  for (let cur = new Date(earliestMonday); cur <= latestMonday; cur = addDays(cur, 7)) {
    const monday = new Date(cur)
    const mk = `${monday.getFullYear()}-${monday.getMonth()}`
    let month = months.length && months[months.length - 1].key === mk ? months[months.length - 1] : null
    if (!month) {
      month = { key: mk, label: `${MONTHS[monday.getMonth()]} ${monday.getFullYear()}`, weeks: [] }
      months.push(month)
    }
    month.weeks.push({ iso: isoDate(monday), day: monday.getDate(), count: counts.get(isoDate(monday)) || 0 })
  }
  months.reverse() // newest month first

  const setGoal = (next) => {
    const clamped = Math.max(GOAL_MIN, Math.min(GOAL_MAX, next))
    if (clamped !== goal) onSaveSettings({ weeklyWorkoutGoal: clamped })
  }

  return (
    <>
      <section className="card goal-card">
        <div className="goal-row">
          <div>
            <div className="goal-label">Weekly goal</div>
            <div className="small">workouts per week</div>
          </div>
          <div className="goal-stepper">
            <button className="step" onClick={() => setGoal(goal - 1)} disabled={goal <= GOAL_MIN} aria-label="Decrease goal">−</button>
            <span className="goal-value">{goal}</span>
            <button className="step" onClick={() => setGoal(goal + 1)} disabled={goal >= GOAL_MAX} aria-label="Increase goal">+</button>
          </div>
        </div>
        <div className="activity-legend">
          <span className="lg met"><i />Goal met</span>
          <span className="lg partial"><i />Partial</span>
          <span className="lg missed"><i />Missed</span>
        </div>
      </section>

      {sessions.length === 0 ? (
        <section className="card center">Complete a workout to start your activity history.</section>
      ) : (
        months.map((m) => (
          <section className="card activity-month" key={m.key}>
            <h3>{m.label}</h3>
            <div className="activity-weeks">
              {m.weeks.map((w) => (
                <div className="week-ring" key={w.iso}>
                  <WeekRing count={w.count} goal={goal} />
                  <span className="small week-cap">{w.day}</span>
                </div>
              ))}
            </div>
          </section>
        ))
      )}
    </>
  )
}
