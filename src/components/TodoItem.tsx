import React, {useState, memo} from 'react';
import {Todo} from '../types/app';
import {useTodoContext} from '../context/TodoContext';
import './TodoItem.css';

interface TodoItemProps {
  todo: Todo;
}

const TodoItem: React.FC<TodoItemProps> = ({todo}) => {
  const [isAnimating, setIsAnimating] = useState<'completing' | 'deleting' | null>(null);
  const {toggleTodo, deleteTodo} = useTodoContext();

  const handleToggle = () => {
    setIsAnimating('completing');
    setTimeout(() => {
      toggleTodo(todo.id);
      setIsAnimating(null);
    }, 600);
  };

  const handleDelete = () => {
    setIsAnimating('deleting');
    setTimeout(() => {
      deleteTodo(todo.id);
    }, 500);
  };

  const getDifficultyIcon = (difficulty: string) => {
    switch (difficulty) {
      case 'padawan':
        return '🌟';
      case 'knight':
        return '⚔️';
      case 'master':
        return '🔥';
      default:
        return '📋';
    }
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
      {/* Difficulty Badge */}
      <div className="difficulty-badge" id={`todo-difficulty-${todo.id}`}>
        <span className="difficulty-icon" aria-hidden="true">{getDifficultyIcon(todo.difficulty)}</span>
        <span className="difficulty-label">{getDifficultyLabel(todo.difficulty)} Level</span>
      </div>

      {/* Mission Content */}
      <div className="mission-content">
        <div className="mission-text" id={`todo-text-${todo.id}`}>
          {todo.text}
        </div>

        {/* Mission Date */}
        <div className="mission-date" id={`todo-date-${todo.id}`}>
          <span className="sr-only">Assigned on </span>
          {todo.createdAt.toLocaleDateString()}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="action-buttons" role="group" aria-label="Task actions">
        <button
          className={`action-btn complete-btn ${todo.completed ? 'completed' : ''}`}
          onClick={handleToggle}
          aria-label={todo.completed ? `Mark "${todo.text}" as incomplete` : `Mark "${todo.text}" as complete`}
          disabled={isAnimating !== null}
        >
          <span className="btn-icon" aria-hidden="true">
            {todo.completed ? '↩️' : '✅'}
          </span>
          <span className="btn-text">
            {todo.completed ? 'Reopen' : 'Complete'}
          </span>
        </button>

        <button
          className="action-btn delete-btn"
          onClick={handleDelete}
          aria-label={`Delete mission "${todo.text}"`}
          disabled={isAnimating !== null}
        >
          <span className="btn-icon" aria-hidden="true">🗡️</span>
          <span className="btn-text">Abandon</span>
        </button>
      </div>

      {/* Force Effect Overlay for Completed Items */}
      {todo.completed && (
        <div className="force-overlay">
          <div className="force-particles">
            <span className="particle">✨</span>
            <span className="particle">⭐</span>
            <span className="particle">✨</span>
          </div>
        </div>
      )}
    </li>
  );
};

export default memo(TodoItem);