'use client';

import { useEffect, useState } from 'react';
import { Task, TaskStatus, api } from '@/lib/api';
import AddTaskForm from '@/components/AddTaskForm';
import TaskColumn from '@/components/TaskColumn';

const STATUSES: TaskStatus[] = ['TODO', 'IN_PROGRESS', 'DONE'];

export default function HomePage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getTasks()
      .then(setTasks)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  function handleAdd(task: Task) {
    setTasks((prev) => [task, ...prev]);
  }

  function handleUpdate(updated: Task) {
    setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
  }

  function handleDelete(id: string) {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto flex flex-col gap-6">
        <header>
          <h1 className="text-2xl font-bold text-gray-900">Task Manager</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your tasks across stages</p>
        </header>

        <AddTaskForm onAdd={handleAdd} />

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
            {error} — make sure the backend is running on port 3000.
          </div>
        )}

        {loading ? (
          <p className="text-sm text-gray-500 text-center py-12">Loading tasks…</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {STATUSES.map((status) => (
              <TaskColumn
                key={status}
                status={status}
                tasks={tasks.filter((t) => t.status === status)}
                onUpdate={handleUpdate}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
