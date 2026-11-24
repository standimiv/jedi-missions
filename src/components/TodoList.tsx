import React, {useMemo, useState} from 'react';
import {useTodoContext, UNDO_WINDOW_MS} from '../context/TodoContext';
import TodoItem from './TodoItem';
import {JournalEntry, TaskDifficulty, Todo} from '../types/app';
import './TodoList.css';
import Loading from './Loading';

interface TodoListProps {
  onRetry?: () => void;
  pane?: 'missions' | 'journal';
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
  const {clearJournal} = useTodoContext();
  const days: {label: string; entries: JournalEntry[]}[] = [];
  [...entries].reverse().forEach(entry => {
    const label = new Date(entry.completedAt).toLocaleDateString();
    const current = days[days.length - 1];
    if (current && current.label === label) {
      current.entries.push(entry);
      return;
    }
    days.push({label, entries: [entry]});
  });

  const clear = () => {
    if (entries.length === 0) {
      return;
    }
    if (!window.confirm('Clear the mission journal? Your missions stay.')) {
      return;
    }
    clearJournal();
  };

  return (
    <section className="mission-journal" aria-labelledby="journal-heading">
      <div className="journal-header">
        <h3 id="journal-heading" className="section-title">
          Mission journal
        </h3>
        <button type="button" onClick={clear} disabled={entries.length === 0}>
          Clear journal
        </button>
      </div>
      {entries.length === 0 ? (
        <p className="filter-empty">No completions yet.</p>
      ) : days.map(day => (
        <section key={day.label} className="journal-day">
          <h4>{day.label}</h4>
          <ul className="journal-list">
            {day.entries.map(entry => (
              <li key={entry.id} className={`journal-entry difficulty-${entry.difficulty}`}>
                <time dateTime={entry.completedAt}>
                  {new Date(entry.completedAt).toLocaleTimeString()}
                </time>
                <span className={`journal-difficulty difficulty-${entry.difficulty}`}>
                  {entry.difficulty}
                </span>
                <span>{entry.text}</span>
              </li>
            ))}
          </ul>
        </section>
      ))}
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

const TodoList: React.FC<TodoListProps> = ({onRetry, pane = 'missions'}) => {
  const {
    state,
    undoTodo,
    undoDelete,
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

  if (pane === 'journal') {
    return (
      <div className="todo-list-container" id="mission-journal" tabIndex={-1} aria-label="Mission journal">
        <Journal entries={state.journal} />
      </div>
    );
  }

  if (state.isLoading) {
    return (
      <div className="todo-list-container" id="mission-list">
        <Loading
          message="Consulting the Force for your missions..."
          size="large"
          variant="lightsaber"
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
      {undoTodo && (
        <div className="undo-bar" role="status">
          <span>Abandoned: {undoTodo.text}</span>
          <button type="button" onClick={undoDelete}>Undo</button>
          <span className="undo-blade" aria-hidden="true">
            <span
              className="undo-blade-fill"
              style={{animationDuration: `${UNDO_WINDOW_MS}ms`}}
            />
          </span>
        </div>
      )}
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
            <p className="filter-empty">No matching missions</p>
          )}

          {status !== 'completed' && activeMissions.length > 0 && (
            <section className="mission-section" aria-labelledby="active-missions-heading">
              <h3 id="active-missions-heading" className="section-title">
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
    </div>
  );
};

export default TodoList;
