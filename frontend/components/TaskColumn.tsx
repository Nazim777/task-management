import { Task, TaskStatus } from '@/lib/api';
import TaskCard from './TaskCard';

const COLUMN_STYLES: Record<TaskStatus, { border: string; header: string }> = {
  TODO: { border: 'border-t-gray-400', header: 'text-gray-600' },
  IN_PROGRESS: { border: 'border-t-blue-500', header: 'text-blue-600' },
  DONE: { border: 'border-t-green-500', header: 'text-green-600' },
};

const LABELS: Record<TaskStatus, string> = {
  TODO: 'To Do',
  IN_PROGRESS: 'In Progress',
  DONE: 'Done',
};

interface Props {
  status: TaskStatus;
  tasks: Task[];
  onUpdate: (task: Task) => void;
  onDelete: (id: string) => void;
}

export default function TaskColumn({ status, tasks, onUpdate, onDelete }: Props) {
  const style = COLUMN_STYLES[status];
  return (
    <div className={`flex flex-col gap-3 bg-gray-50 rounded-xl p-4 border-t-4 ${style.border}`}>
      <div className="flex items-center justify-between">
        <h2 className={`font-semibold text-sm ${style.header}`}>{LABELS[status]}</h2>
        <span className="text-xs bg-gray-200 text-gray-600 rounded-full px-2 py-0.5">{tasks.length}</span>
      </div>
      {tasks.length === 0 && (
        <p className="text-xs text-gray-400 text-center py-6">No tasks here</p>
      )}
      {tasks.map((task) => (
        <TaskCard key={task.id} task={task} onUpdate={onUpdate} onDelete={onDelete} />
      ))}
    </div>
  );
}
