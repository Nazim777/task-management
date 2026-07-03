'use client';

import { Task, TaskStatus, api } from '@/lib/api';

const STATUS_LABELS: Record<TaskStatus, string> = {
  TODO: 'To Do',
  IN_PROGRESS: 'In Progress',
  DONE: 'Done',
};

const STATUS_COLORS: Record<TaskStatus, string> = {
  TODO: 'bg-gray-100 text-gray-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  DONE: 'bg-green-100 text-green-700',
};

const NEXT_STATUS: Record<TaskStatus, TaskStatus | null> = {
  TODO: 'IN_PROGRESS',
  IN_PROGRESS: 'DONE',
  DONE: null,
};

interface Props {
  task: Task;
  onUpdate: (task: Task) => void;
  onDelete: (id: string) => void;
}

export default function TaskCard({ task, onUpdate, onDelete }: Props) {
  const nextStatus = NEXT_STATUS[task.status];

  async function handleAdvance() {
    if (!nextStatus) return;
    const updated = await api.updateTask(task.id, { status: nextStatus });
    onUpdate(updated);
  }

  async function handleDelete() {
    await api.deleteTask(task.id);
    onDelete(task.id);
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-gray-900 text-sm leading-snug">{task.title}</h3>
        <span className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[task.status]}`}>
          {STATUS_LABELS[task.status]}
        </span>
      </div>

      {task.description && (
        <p className="text-xs text-gray-500 leading-relaxed">{task.description}</p>
      )}

      <p className="text-xs text-gray-400">
        {new Date(task.createdAt).toLocaleDateString()}
      </p>

      <div className="flex gap-2 pt-1">
        {nextStatus && (
          <button
            onClick={handleAdvance}
            className="flex-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-3 py-1.5 transition-colors"
          >
            Move to {STATUS_LABELS[nextStatus]}
          </button>
        )}
        <button
          onClick={handleDelete}
          className="text-xs bg-red-50 hover:bg-red-100 text-red-600 rounded-lg px-3 py-1.5 transition-colors"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
