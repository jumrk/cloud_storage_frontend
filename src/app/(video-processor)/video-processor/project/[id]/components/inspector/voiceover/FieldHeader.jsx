export default function FieldHeader({ label, value }) {
  return (
    <div className="flex items-center justify-between mb-2">
      <label className="text-xs font-medium text-text-muted">{label}</label>
      {value != null && (
        <span className="text-xs tabular-nums text-text-muted">{value}</span>
      )}
    </div>
  );
}

