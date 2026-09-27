export default function TopBar({ mines, selectedMine, onSelectMine }) {
  return (
    <div className="topbar">
      <div className="brand">
        <div className="brand-mark">Mn</div>
        <div className="brand-text">
          <h1>OreNexa</h1>
          <p>MOIL RESERVE &amp; PRODUCTION INTELLIGENCE</p>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <span className="status-pill">
          <span className="status-dot" />
          Live model inference
        </span>
        <select
          className="mine-select"
          value={selectedMine || ""}
          onChange={(e) => onSelectMine(e.target.value || null)}
        >
          <option value="">All Mines (Group View)</option>
          {mines.map((m) => (
            <option key={m.mine_id} value={m.mine_id}>
              {m.mine_name} · {m.state}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
