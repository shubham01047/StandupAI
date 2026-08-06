import React from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { useTask } from '../context/TaskContext';
import { TaskStatus } from '../types/task';
import { Sparkles, CheckCircle2, Clock, AlertOctagon, Circle, GripVertical, User as UserIcon } from 'lucide-react';

interface ColumnConfig {
  id: TaskStatus;
  title: string;
  badgeClass: string;
  headerBorder: string;
  icon: React.ElementType;
}

const COLUMNS: ColumnConfig[] = [
  {
    id: 'todo',
    title: 'To Do',
    badgeClass: 'bg-slate-800 text-slate-300 border-slate-700',
    headerBorder: 'border-slate-700',
    icon: Circle,
  },
  {
    id: 'in-progress',
    title: 'In Progress',
    badgeClass: 'bg-brand-500/10 text-brand-300 border-brand-500/30',
    headerBorder: 'border-brand-500/40',
    icon: Clock,
  },
  {
    id: 'blocked',
    title: 'Blocked',
    badgeClass: 'bg-rose-500/10 text-rose-300 border-rose-500/30',
    headerBorder: 'border-rose-500/40',
    icon: AlertOctagon,
  },
  {
    id: 'done',
    title: 'Done',
    badgeClass: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
    headerBorder: 'border-emerald-500/40',
    icon: CheckCircle2,
  },
];

export const KanbanBoard: React.FC = () => {
  const { tasks, loading, updateTaskStatus } = useTask();

  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const newStatus = destination.droppableId as TaskStatus;
    updateTaskStatus(draggableId, newStatus);
  };

  if (loading) {
    return (
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-12 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
      {/* Board Header */}
      <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center space-x-2">
            <span>Team Kanban Board</span>
            <span className="px-2.5 py-0.5 rounded-full text-xs bg-brand-500/10 text-brand-400 border border-brand-500/20 font-normal">
              {tasks.length} total tasks
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Tasks extracted via AI and organized by status. Drag cards to change progress.
          </p>
        </div>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {COLUMNS.map((col) => {
            const ColumnIcon = col.icon;
            const columnTasks = tasks.filter((t) => t.status === col.id);

            return (
              <div
                key={col.id}
                className="flex flex-col bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 min-h-[500px]"
              >
                {/* Column Header */}
                <div className={`flex items-center justify-between pb-3 mb-4 border-b ${col.headerBorder}`}>
                  <div className="flex items-center space-x-2">
                    <ColumnIcon className="w-4 h-4 text-slate-400" />
                    <span className="text-sm font-bold text-white tracking-tight">{col.title}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${col.badgeClass}`}>
                    {columnTasks.length}
                  </span>
                </div>

                {/* Droppable Area */}
                <Droppable droppableId={col.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`flex-1 space-y-3 transition-colors rounded-xl p-1 ${
                        snapshot.isDraggingOver ? 'bg-slate-900/80 ring-2 ring-brand-500/40' : ''
                      }`}
                    >
                      {columnTasks.length === 0 ? (
                        <div className="h-32 flex items-center justify-center text-xs text-slate-600 border border-dashed border-slate-800 rounded-xl">
                          No tasks in {col.title}
                        </div>
                      ) : (
                        columnTasks.map((task, index) => {
                          const owner = typeof task.ownerId === 'object' ? task.ownerId : null;
                          const ownerName = owner?.name || 'Unassigned';

                          return (
                            <Draggable key={task._id} draggableId={task._id} index={index}>
                              {(dragProvided, dragSnapshot) => (
                                <div
                                  ref={dragProvided.innerRef}
                                  {...dragProvided.draggableProps}
                                  className={`p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-md hover:border-slate-700 transition-all space-y-3 ${
                                    dragSnapshot.isDragging ? 'shadow-2xl ring-2 ring-brand-500 bg-slate-850' : ''
                                  }`}
                                >
                                  {/* Task Title & Drag Handle */}
                                  <div className="flex items-start justify-between gap-2">
                                    <h4 className="text-xs font-medium text-white leading-relaxed flex-1">
                                      {task.title}
                                    </h4>
                                    <div
                                      {...dragProvided.dragHandleProps}
                                      className="text-slate-600 hover:text-slate-400 cursor-grab active:cursor-grabbing p-0.5 rounded"
                                    >
                                      <GripVertical className="w-4 h-4" />
                                    </div>
                                  </div>

                                  {/* Badges & Owner Footer */}
                                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-[10px]">
                                    <div className="flex items-center space-x-1.5">
                                      {task.extractedByAI && (
                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">
                                          <Sparkles className="w-2.5 h-2.5 mr-0.5" /> AI
                                        </span>
                                      )}
                                      <span className="uppercase font-semibold tracking-wider text-slate-500">
                                        {task.category}
                                      </span>
                                    </div>

                                    <div className="flex items-center space-x-1 text-slate-400">
                                      <UserIcon className="w-3 h-3 text-brand-400" />
                                      <span className="truncate max-w-[80px]">{ownerName}</span>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          );
                        })
                      )}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>
    </div>
  );
};
