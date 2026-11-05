import React, {useMemo, useState} from 'react';
import {useTodoContext} from '../context/TodoContext';
import TodoItem from './TodoItem';
import {JournalEntry, TaskDifficulty, Todo} from '../types/app';
import './TodoList.css';
import Loading from './Loading';

interface TodoListProps {
  onRetry?: () => void;
}

type DifficultyFilter = 'all' | TaskDifficulty;
type StatusFilter = 'all' | 'active' | 'completed';

const matchesFilter = (todo: Todo, query: string, difficulty: DifficultyFilter): boolean => {
  if (difficulty !== 'all' && todo.difficulty !== difficulty) {
    return false;
  }
  const needle = query.trim().toLowerCase();
  return needle.length === 0 || todo.text.toLowerCase().includes(needle);
};

const Journal: React.FC<{entries: JournalEntry[]}> = ({entries}) => {
  if (entries.length === 0) {
    return null;
  }

  const recent = entries.slice(-8).reverse();

  return (
    <section className="mission-journal" aria-labelledby="journal-heading">
      <h3 id="journal-heading" className="section-title">
        <span className="title-icon" aria-hidden="true">📖</span>
        Mission journal
      </h3>
      <ul className="journal-list">
        {recent.map(entry => (
          <li key={entry.id}>
            <time dateTime={entry.completedAt}>
              {new Date(entry.completedAt).toLocaleString()}
            </time>
            <span className={`journal-difficulty difficulty-${entry.difficulty}`}>
              {entry.difficulty}
            </span>
            <span>{entry.text}</span>
          </li>
        ))}
      </ul>
    </section>
  );
};

const DifficultyStat: React.FC<{
  label: string;
  completed: number;
  total: number;
}> = ({label, completed, total}) => {
  const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
  const tone = label.toLowerCase();

  return (
    <div className={`stat-item stat-${tone}`}>
      <span className="stat-label">{label}</span>
      <span
        className="stat-value"
        aria-label={`${completed} of ${total} ${label} missions completed`}
      >
        {completed}/{total}
      </span>
      <span className="stat-bar" aria-hidden="true">
        <span className="stat-bar-fill" style={{width: `${rate}%`}} />
      </span>
    </div>
  );
};

const TodoList: React.FC<TodoListProps> = ({onRetry}) => {
  const {
    state,
    incompleteTodos,
    completedTodos,
    totalTodos,
    completionByDifficulty,
  } = useTodoContext();
  const [query, setQuery] = useState('');
  const [difficulty, setDifficulty] = useState<DifficultyFilter>('all');
  const [status, setStatus] = useState<StatusFilter>('all');

  const activeMissions = useMemo(
    () => incompleteTodos.filter(todo => matchesFilter(todo, query, difficulty)),
    [incompleteTodos, query, difficulty]
  );
  const completedMissions = useMemo(
    () => completedTodos.filter(todo => matchesFilter(todo, query, difficulty)),
    [completedTodos, query, difficulty]
  );
  const filtersHideEverything = totalTodos > 0
    && (status === 'completed' || activeMissions.length === 0)
    && (status === 'active' || completedMissions.length === 0);

  if (state.isLoading) {
    return (
      <div className="todo-list-container" id="mission-list">
        <Loading
          message="Consulting the Force for your missions..."
          size="large"
          variant="force"
        />
      </div>
    );
  }

  const retry = () => {
    if (onRetry) {
      onRetry();
      return;
    }
    window.location.reload();
  };

  return (
    <div className="todo-list-container" id="mission-list" tabIndex={-1} aria-label="Mission list">
      {state.error && totalTodos === 0 ? (
        <div className="error-state">
          <h3>Disturbance in the Force</h3>
          <p>{state.error}</p>
          <button type="button" className="retry-button" onClick={retry}>
            Try Again
          </button>
        </div>
      ) : totalTodos === 0 ? (
        <div className="empty-state">
          <h3>No Active Missions</h3>
          <p>The galaxy is at peace... for now.</p>
          <p className="empty-hint">Generate your Jedi missions to begin your journey.</p>
        </div>
      ) : (
        <>
          <div className="mission-stats" role="region" aria-labelledby="stats-heading">
            <h3 id="stats-heading" className="sr-only">Mission Statistics</h3>
            <DifficultyStat label="Padawan" {...completionByDifficulty.padawan} />
            <DifficultyStat label="Knight" {...completionByDifficulty.knight} />
            <DifficultyStat label="Master" {...completionByDifficulty.master} />
          </div>

          <div className="mission-filters">
            <label className="filter-field">
              <span className="sr-only">Search missions</span>
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search missions"
                aria-label="Search missions"
              />
            </label>
            <label className="filter-field">
              <span className="sr-only">Difficulty</span>
              <select
                value={difficulty}
                aria-label="Filter by difficulty"
                onChange={(event) => setDifficulty(event.target.value as DifficultyFilter)}
              >
                <option value="all">All difficulties</option>
                <option value="padawan">Padawan</option>
                <option value="knight">Knight</option>
                <option value="master">Master</option>
              </select>
            </label>
            <label className="filter-field">
              <span className="sr-only">Status</span>
              <select
                value={status}
                aria-label="Filter by status"
                onChange={(event) => setStatus(event.target.value as StatusFilter)}
              >
                <option value="all">Active and completed</option>
                <option value="active">Active only</option>
                <option value="completed">Completed only</option>
              </select>
            </label>
          </div>

          {filtersHideEverything && (
            <div className="empty-state">
              <h3>No matching missions</h3>
              <p>Try a different search, difficulty, or status.</p>
            </div>
          )}

          {status !== 'completed' && activeMissions.length > 0 && (
            <section className="mission-section" aria-labelledby="active-missions-heading">
              <h3 id="active-missions-heading" className="section-title">
                <span className="title-icon" aria-hidden="true">⚔️</span>
                Active Missions
              </h3>
              <ul className="todo-grid" aria-label="Active missions">
                {activeMissions.map(todo => (
                  <TodoItem key={todo.id} todo={todo} />
                ))}
              </ul>
            </section>
          )}

          {status !== 'active' && completedMissions.length > 0 && (
            <section className="mission-section completed-section" aria-labelledby="completed-missions-heading">
              <h3 id="completed-missions-heading" className="section-title">
                <span className="title-icon" aria-hidden="true">✨</span>
                Completed Missions
              </h3>
              <ul className="todo-grid" aria-label="Completed missions">
                {completedMissions.map(todo => (
                  <TodoItem key={todo.id} todo={todo} />
                ))}
              </ul>
            </section>
          )}
        </>
      )}

      <Journal entries={state.journal} />
    </div>
  );
};

export default TodoList;
