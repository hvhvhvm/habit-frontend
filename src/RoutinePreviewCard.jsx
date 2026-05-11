function RoutinePreviewCard({
  routine,
  isSelected,
  onClick
}) {

  return (

    <article
      className={`dashboard-routine-card ${
        isSelected ? "is-selected" : ""
      }`}
      onClick={onClick}
    >

      <div className="dashboard-routine-card-top">

        <div>

          <span className="dashboard-routine-emoji">
            {routine.emoji}
          </span>

          <h3>{routine.name}</h3>

        </div>

        <span className="dashboard-routine-progress">
          {routine.progress || 0}%
        </span>

      </div>

      <p>
        {routine.total || 0} habits
      </p>

      <div className="dashboard-focus-progress-track">

        <div
          className="dashboard-focus-progress-fill"
          style={{
            width: `${routine.progress || 0}%`
          }}
        />

      </div>

    </article>

  );

}

export default RoutinePreviewCard;