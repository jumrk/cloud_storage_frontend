export default function RatioBadge({ value }) {
  if (value === "canvas") {
    return (
      <span className="grid h-6 w-6 place-items-center rounded-md border border-border bg-white">
        <span className="block h-4 w-4 rounded border-2 border-dashed border-border" />
      </span>
    );
  }
  const [w, h] = value.split(":").map(Number);
  const box = 18;
  const wide = w >= h;
  const iw = wide ? box : Math.round((w / h) * box);
  const ih = wide ? Math.round((h / w) * box) : box;
  return (
    <span className="grid h-6 w-6 place-items-center rounded-md border border-border bg-white">
      <span
        className="block rounded-[2px] bg-brand-500/70"
        style={{ width: `${iw}px`, height: `${ih}px` }}
      />
    </span>
  );
}
