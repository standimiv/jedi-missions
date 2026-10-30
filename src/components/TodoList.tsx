import React from 'react';
import {useTodoContext} from '../context/TodoContext';
import TodoItem from './TodoItem';
import './TodoList.css';
import Loading from './Loading';

const TodoList: React.FC = () => {
  const {
    state,
    incompleteTodos,
    completedTodos,
    totalTodos,
    todosByDifficulty
  } = useTodoContext();

  // Show loading state
  if (state.isLoading) {
    return (
      <div className="todo-list-container">
        <Loading
          message="Consulting the Force for your missions..."
          size="large"
          variant="force"
        />
      </div>
    );
  }

  // Show error state
  if (state.error) {
    return (
      <div className="todo-list-container">
        <div className="error-state">
          <h3>Disturbance in the Force</h3>
          <p>{state.error}</p>
          <button className="retry-button" onClick={() => window.location.reload()}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Show empty state
  if (totalTodos === 0) {
    return (
      <div className="todo-list-container">
        <div className="empty-state">
          <h3>No Active Missions</h3>
          <p>The galaxy is at peace... for now.</p>
          <p className="empty-hint">Generate your Jedi missions to begin your journey.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="todo-list-container" role="main" aria-label="Mission list">
      {/* Mission Statistics */}
      <div className="mission-stats" role="region" aria-labelledby="stats-heading">
        <h3 id="stats-heading" className="sr-only">Mission Statistics</h3>
        <div className="stat-item">
          <span className="stat-label">Padawan</span>
          <span className="stat-value" aria-label={`${todosByDifficulty.padawan.length} Padawan level missions`}>
            {todosByDifficulty.padawan.length}
          </span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Knight</span>
          <span className="stat-value" aria-label={`${todosByDifficulty.knight.length} Knight level missions`}>
            {todosByDifficulty.knight.length}
          </span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Master</span>
          <span className="stat-value" aria-label={`${todosByDifficulty.master.length} Master level missions`}>
            {todosByDifficulty.master.length}
          </span>
        </div>
      </div>

      {/* Active Missions */}
      {incompleteTodos.length > 0 && (
        <section className="mission-section" aria-labelledby="active-missions-heading">
          <h3 id="active-missions-heading" className="section-title">
            <span className="title-icon" aria-hidden="true">⚔️</span>
            Active Missions
          </h3>
          <ul className="todo-grid" aria-label="Active missions">
            {incompleteTodos.map(todo => (
              <TodoItem key={todo.id} todo={todo} />
            ))}
          </ul>
        </section>
      )}

      {/* Completed Missions */}
      {completedTodos.length > 0 && (
        <section className="mission-section completed-section" aria-labelledby="completed-missions-heading">
          <h3 id="completed-missions-heading" className="section-title">
            <span className="title-icon" aria-hidden="true">✨</span>
            Completed Missions
          </h3>
          <ul className="todo-grid" aria-label="Completed missions">
            {completedTodos.map(todo => (
              <TodoItem key={todo.id} todo={todo} />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
};

export default TodoList;