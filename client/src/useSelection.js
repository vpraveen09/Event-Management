import { useState, useMemo } from "react";

export function useSelection(items) {
  const [selected, setSelected] = useState(() => new Set());

  const ids = useMemo(() => items.map((item) => item.id), [items]);
  const allSelected = ids.length > 0 && ids.every((id) => selected.has(id));
  const someSelected = selected.size > 0;

  function toggle(id) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected((prev) => (allSelected ? new Set() : new Set(ids)));
  }

  function clear() {
    setSelected(new Set());
  }

  return { selected, toggle, toggleAll, clear, allSelected, someSelected };
}
