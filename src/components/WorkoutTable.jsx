export default function WorkoutTable({ exercises, inputs, onChange }) {
  return (
    <div>
      <div className="card row head">
        <div>Exercise</div>
        <div>Target</div>
        <div>Planned weight</div>
        <div>Actual weight</div>
        <div>Actual reps / notes</div>
      </div>
      {exercises.map((x, i) => (
        <div className="card row" key={i}>
          <div>
            <div className="exercise">{x[0]}</div>
            <div className="small">{x[1]} sets × {x[2]}</div>
          </div>
          <div>{x[1]} × {x[2]}</div>
          <div>{x[3]}</div>
          <div>
            <input
              placeholder="e.g. 18kg each"
              value={inputs[`w-${i}`] || ''}
              onChange={(e) => onChange(`w-${i}`, e.target.value)}
            />
          </div>
          <div>
            <input
              placeholder="e.g. 8,8,7,6 OK"
              value={inputs[`r-${i}`] || ''}
              onChange={(e) => onChange(`r-${i}`, e.target.value)}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
