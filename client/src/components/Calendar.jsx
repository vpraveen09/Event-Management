import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, CalendarClock, MapPin, User } from "lucide-react";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function sameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function buildMonthGrid(monthDate) {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const startOffset = firstOfMonth.getDay();
  const gridStart = new Date(year, month, 1 - startOffset);

  const days = [];
  for (let i = 0; i < 42; i++) {
    days.push(new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i));
  }
  return days;
}

export default function Calendar({ events }) {
  const [monthDate, setMonthDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState(() => new Date());

  const days = useMemo(() => buildMonthGrid(monthDate), [monthDate]);
  const today = useMemo(() => new Date(), []);

  const eventsByDay = useMemo(() => {
    const map = new Map();
    for (const event of events) {
      if (!event.start_time) continue;
      const d = new Date(event.start_time);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(event);
    }
    return map;
  }, [events]);

  function keyFor(date) {
    return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
  }

  function goToMonth(delta) {
    setMonthDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
  }

  const monthLabel = monthDate.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  const selectedEvents = eventsByDay.get(keyFor(selectedDate)) || [];

  return (
    <div className="calendar-wrapper">
      <div className="calendar">
        <div className="calendar-header">
          <button type="button" className="icon-button" onClick={() => goToMonth(-1)} aria-label="Previous month">
            <ChevronLeft size={18} />
          </button>
          <h2>{monthLabel}</h2>
          <button type="button" className="icon-button" onClick={() => goToMonth(1)} aria-label="Next month">
            <ChevronRight size={18} />
          </button>
        </div>

        <div className="calendar-weekdays">
          {WEEKDAYS.map((d) => (
            <div key={d} className="calendar-weekday">
              {d}
            </div>
          ))}
        </div>

        <div className="calendar-grid">
          {days.map((day) => {
            const isCurrentMonth = day.getMonth() === monthDate.getMonth();
            const isToday = sameDay(day, today);
            const isSelected = sameDay(day, selectedDate);
            const dayEvents = eventsByDay.get(keyFor(day)) || [];

            return (
              <button
                type="button"
                key={day.toISOString()}
                onClick={() => setSelectedDate(day)}
                className={`calendar-cell ${isCurrentMonth ? "" : "calendar-cell-muted"} ${
                  isToday ? "calendar-cell-today" : ""
                } ${isSelected ? "calendar-cell-selected" : ""}`}
              >
                <span className="calendar-date">{day.getDate()}</span>
                {dayEvents.length > 0 && <span className="calendar-dot-count">{dayEvents.length}</span>}
              </button>
            );
          })}
        </div>
      </div>

      <div className="card calendar-agenda">
        <h3>
          Events on{" "}
          {selectedDate.toLocaleDateString(undefined, { dateStyle: "long" })}
        </h3>
        {selectedEvents.length === 0 ? (
          <p className="event-meta">No events on this day.</p>
        ) : (
          selectedEvents.map((event) => (
            <div key={event.id} className="agenda-item">
              <div className="agenda-item-header">
                <strong>{event.title}</strong>
                {event.status && (
                  <span className={`badge badge-status-${event.status.toLowerCase()}`}>{event.status}</span>
                )}
              </div>
              <div className="event-meta">
                <CalendarClock size={13} /> {event.time || "00:00"}:00
                {event.location && (
                  <>
                    {" "}at <MapPin size={13} style={{ verticalAlign: "-2px" }} /> {event.location}
                  </>
                )}
              </div>
              {event.client_name && (
                <div className="event-meta">
                  <User size={13} /> {event.client_name}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
