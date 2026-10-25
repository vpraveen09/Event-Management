import { formatNumber } from "../format.js";

export default function NumberInput({ value, onChange, ...props }) {
  function handleChange(e) {
    const raw = e.target.value.replace(/,/g, "");
    if (raw === "" || /^\d*\.?\d*$/.test(raw)) {
      onChange(raw);
    }
  }

  const display = value === "" || value === null || value === undefined ? "" : formatNumber(value);

  return <input type="text" inputMode="decimal" value={display} onChange={handleChange} {...props} />;
}
