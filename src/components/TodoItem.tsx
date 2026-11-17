import React, {useEffect, useRef, useState} from 'react';
import {TaskDifficulty, Todo} from '../types/app';
import {useTodoContext} from '../context/TodoContext';
import DifficultyMark from './DifficultyMark';
import './TodoItem.css';

interface TodoItemProps {
  todo: Todo;
}

const motionDelay = (ms: number): number => {
  if (typeof window.matchMedia === 'function'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return 0;
  }
  return ms;
};

const TodoItem: React.FC<TodoItemProps> = ({todo}) => {
  const [isAnimating, setIsAnimating] = useState<'completing' | 'deleting' | null>(null);
  const [announcement, setAnnouncement] = useState('');
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(todo.text);
  const [draftDifficulty, setDraftDifficulty] = useState<TaskDifficulty>(todo.difficulty);
  const {toggleTodo, deleteTodo, updateTodo} = useTodoContext();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleToggle = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsAnimating('completing');
    const completing = !todo.completed;
    timeoutRef.current = setTimeout(() => {
      timeoutRef.current = null;
      toggleTodo(todo.id);
      setAnnouncement(completing ? `Mission completed: ${todo.text}` : `Mission reopened: ${todo.text}`);
      setIsAnimating(null);
    }, motionDelay(600));
  };

  const handleDelete = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsAnimating('deleting');
    timeoutRef.current = setTimeout(() => {
      timeoutRef.current = null;
      deleteTodo(todo.id);
      document.getElementById('mission-list')?.focus();
    }, motionDelay(500));
  };

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case 'padawan':
        return 'Padawan';
      case 'knight':
        return 'Knight';
      case 'master':
        return 'Master';
      default:
        return 'Unknown';
    }
  };

  return (
    <li
      className={`todo-item ${todo.completed ? 'completed' : ''} difficulty-${todo.difficulty} ${isAnimating === 'completing' ? 'force-completing' : ''
        } ${isAnimating === 'deleting' ? 'lightsaber-deleting' : ''}`}
      aria-labelledby={`todo-text-${todo.id}`}
      aria-describedby={`todo-difficulty-${todo.id} todo-date-${todo.id}`}
    >
      <span className="completion-flash" aria-hidden="true" />

      {/* Difficulty Badge */}
      <div className="difficulty-badge" id={`todo-difficulty-${todo.id}`}>
        <DifficultyMark difficulty={todo.difficulty} />
        <span className="difficulty-label">{getDifficultyLabel(todo.difficulty)} Level</span>
      </div>

      {/* Mission Content */}
      <div className="mission-content">
        {editing ? (
          <form
            className="mission-edit"
            onSubmit={(event) => {
              event.preventDefault();
              const text = draft.trim();
              if (!text) {
                return;
              }
              updateTodo(todo.id, text, draftDifficulty);
              setEditing(false);
            }}
          >
            <label className="sr-only" htmlFor={`edit-${todo.id}`}>Mission text</label>
            <textarea
              id={`edit-${todo.id}`}
              value={draft}
              maxLength={200}
              rows={3}
              onChange={(event) => setDraft(event.target.value)}
            />
            <label className="sr-only" htmlFor={`edit-difficulty-${todo.id}`}>Difficulty</label>
            <select
              id={`edit-difficulty-${todo.id}`}
              value={draftDifficulty}
              onChange={(event) => setDraftDifficulty(event.target.value as TaskDifficulty)}
            >
              <option value="padawan">Padawan</option>
              <option value="knight">Knight</option>
              <option value="master">Master</option>
            </select>
            <div className="mission-edit-actions">
              <button type="button" onClick={() => setEditing(false)}>Cancel</button>
              <button type="submit" disabled={!draft.trim()}>Save</button>
            </div>
          </form>
        ) : (
          <div className="mission-text" id={`todo-text-${todo.id}`}>
            {todo.text}
          </div>
        )}

        {/* Mission Date */}
        <div className="mission-date" id={`todo-date-${todo.id}`}>
          <span className="sr-only">Assigned on </span>
          {todo.createdAt.toLocaleDateString()}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="sr-only" aria-live="polite">{announcement}</div>

      <div className="action-buttons" role="group" aria-label="Task actions">
        <button
          className={`action-btn complete-btn ${todo.completed ? 'completed' : ''}`}
          onClick={handleToggle}
          aria-label={todo.completed ? `Mark "${todo.text}" as incomplete` : `Mark "${todo.text}" as complete`}
          disabled={isAnimating !== null}
        >
          <span className="btn-icon" aria-hidden="true">
            <DifficultyMark difficulty={todo.completed ? 'knight' : 'padawan'} />
          </span>
          <span className="btn-text">
            {todo.completed ? 'Reopen' : 'Complete'}
          </span>
        </button>

        {todo.custom && !editing && (
          <button
            type="button"
            className="action-btn"
            onClick={() => {
              setDraft(todo.text);
              setDraftDifficulty(todo.difficulty);
              setEditing(true);
            }}
            aria-label={`Edit mission "${todo.text}"`}
            disabled={isAnimating !== null}
          >
            <span className="btn-icon" aria-hidden="true">
              <DifficultyMark difficulty="knight" />
            </span>
            <span className="btn-text">Edit</span>
          </button>
        )}

        <button
          className="action-btn delete-btn"
          onClick={handleDelete}
          aria-label={`Delete mission "${todo.text}"`}
          disabled={isAnimating !== null}
        >
          <span className="btn-icon" aria-hidden="true">
            <DifficultyMark difficulty="master" />
          </span>
          <span className="btn-text">Abandon</span>
        </button>
      </div>

    </li>
  );
};

export default TodoItem;