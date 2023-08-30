export default function Slider({
  value,
  onValueChange
}) {
  return (
    <div className="w-full flex items-center">
      <input type="range" onChange={onValueChange} value={value}
        className="w-full appearance-none cursor-pointer h-1 rounded-lg bg-real-navy/40"
      />
    </div>
  );
}
