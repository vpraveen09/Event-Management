import { useEffect, useRef, useState } from "react";
import { Clock } from "lucide-react";
import { formatTime12h } from "../format.js";

function to12(value) {
  if (!value) return { hour: 9, minute: 0, meridiem: "AM" };
  const [h, m] = value.split(":").map(Number);
  const meridiem = h >= 12 ? "PM" : "AM";
  let hour = h % 12;
  if (hour === 0) hour = 12;
  return { hour, minute: m, meridiem };
}

function to24(hour, minute, meridiem) {
  let h = hour % 12;
  if (meridiem === "PM") h += 12;
  return `${String(h).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

export default function TimePicker({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(() => to12(value));
  const containerRef = useRef(null);

  useEffect(() => {
    if (open) setDraft(to12(value));
  }, [open, value]);

  useEffect(() => {
    if (!open) return;
    function handleOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [open]);

  function apply() {
    onChange(to24(draft.hour, draft.minute, draft.meridiem));
    setOpen(false);
  }

  return (
    <div className="time-picker" ref={containerRef}>
      <button type="button" className="time-picker-trigger" onClick={() => setOpen((o) => !o)}>
        <Clock size={15} />
        {value ? formatTime12h(value) : "Select time"}
      </button>

      {open && (
        <div className="time-picker-popover">
          <p className="time-picker-title">Select Time</p>
          <div className="time-picker-fields">
            <label>
              Hour
              <input
                type="number"
                min="1"
                max="12"
                value={draft.hour}
                onChange={(e) =>
                  setDraft({ ...draft, hour: Math.min(12, Math.max(1, Number(e.target.value) || 1)) })
                }
              />
            </label>
            <label>
              Minute
              <input
                type="number"
                min="0"
                max="59"
                value={draft.minute}
                onChange={(e) =>
                  setDraft({ ...draft, minute: Math.min(59, Math.max(0, Number(e.target.value) || 0)) })
                }
              />
            </label>
          </div>
          <div className="time-picker-meridiem">
            <button
              type="button"
              className={draft.meridiem === "AM" ? "meridiem-active" : ""}
              onClick={() => setDraft({ ...draft, meridiem: "AM" })}
            >
              AM
            </button>
            <button
              type="button"
              className={draft.meridiem === "PM" ? "meridiem-active" : ""}
              onClick={() => setDraft({ ...draft, meridiem: "PM" })}
            >
              PM
            </button>
          </div>
          <button type="button" className="time-picker-apply" onClick={apply}>
            Apply
          </button>
        </div>
      )}
    </div>
  );
}
