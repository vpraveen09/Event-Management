import { useEffect, useState } from "react";
import { Plus, Trash2, CheckCircle2, Circle } from "lucide-react";
import { api } from "../api.js";
import { useAuth } from "../auth.jsx";
import Modal from "./Modal.jsx";

export default function TaskListModal({ event, onClose }) {
  const { token } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");
  const [error, setError] = useState("");

  function load() {
    api
      .listTasks(event.id, token)
      .then(setTasks)
      .catch((err) => setError(err.message));
  }

  useEffect(load, [event.id, token]);

  async function handleAdd(e) {
    e.preventDefault();
    if (!title.trim()) return;
    try {
      await api.createTask({ event_id: event.id, title: title.trim() }, token);
      setTitle("");
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function toggleDone(task) {
    try {
      await api.updateTask(task.id, { done: !task.done }, token);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(id) {
    try {
      await api.deleteTask(id, token);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  const doneCount = tasks.filter((t) => t.done).length;

  return (
    <Modal
      title={`Tasks — ${event.name}`}
      subtitle={tasks.length ? `${doneCount} of ${tasks.length} complete` : "Event checklist"}
      onClose={onClose}
    >
      <form onSubmit={handleAdd} className="task-add-row">
        <input placeholder="Add a task, e.g. Book caterer" value={title} onChange={(e) => setTitle(e.target.value)} />
        <button type="submit">
          <Plus size={16} />
        </button>
      </form>

      {error && <p className="error">{error}</p>}

      {tasks.length === 0 ? (
        <p className="event-meta">No tasks yet.</p>
      ) : (
        <ul className="task-list">
          {tasks.map((task) => (
            <li key={task.id} className={task.done ? "task-done" : ""}>
              <button type="button" className="task-check" onClick={() => toggleDone(task)}>
                {task.done ? <CheckCircle2 size={18} /> : <Circle size={18} />}
              </button>
              <span>{task.title}</span>
              <button
                type="button"
                className="icon-button icon-button-danger"
                onClick={() => handleDelete(task.id)}
              >
                <Trash2 size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}
