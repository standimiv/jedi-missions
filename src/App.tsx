import React, {useCallback, useEffect, useRef, useState} from 'react';
import {TodoProvider, useTodoContext} from './context/TodoContext';
import AppLayout from './components/AppLayout';
import TodoList from './components/TodoList';
import AddTodo from './components/AddTodo';
import ErrorBoundary from './components/ErrorBoundary';
import {useSwapi} from './hooks/useSwapi';
import {generateTasks, generateFallbackTasks} from './utils/taskGenerator';
import {hasSwapiNames, parsePersisted} from './utils/storage';
import './App.css';

// Main app content component (needs to be inside TodoProvider)
const AppContent: React.FC = () => {
  const {setTodos, setLoading, setError, setSwapiData, restoreSave, state} = useTodoContext();
  const {fetchRandomData} = useSwapi();
  const requestId = useRef(0);
  const missionCount = useRef(state.todos.length);
  const swapiDataRef = useRef(state.swapiData);
  const skipInitialFetch = useRef(state.todos.length > 0);
  const fileRef = useRef<HTMLInputElement>(null);
  const [notice, setNotice] = useState<string | null>(null);
  missionCount.current = state.todos.length;
  swapiDataRef.current = state.swapiData;

  const applyFallback = useCallback(() => {
    if (missionCount.current > 0) {
      setError('Star Wars data unavailable. Current missions kept.');
      return;
    }

    try {
      setTodos(generateFallbackTasks(8));
      setError('Using offline missions. Star Wars data unavailable.');
    } catch (error) {
      console.error('Failed to generate fallback tasks:', error);
      setError('Failed to generate missions. Please refresh the page.');
    }
  }, [setError, setTodos]);

  const applySavedNamesOrFallback = useCallback(() => {
    const saved = swapiDataRef.current;
    if (hasSwapiNames(saved)) {
      try {
        const fromSaved = generateTasks(saved, 10, true);
        if (fromSaved.length > 0) {
          setTodos(fromSaved);
          setNotice('SWAPI is offline. Generated missions from saved names.');
          return;
        }
      } catch (error) {
        console.error('Failed to generate missions from saved names:', error);
      }
    }
    applyFallback();
  }, [applyFallback, setNotice, setTodos]);

  const loadMissions = useCallback(async () => {
    const id = ++requestId.current;
    setError(null);
    setNotice(null);
    setLoading(true);

    try {
      const data = await fetchRandomData();
      if (id !== requestId.current) {
        return;
      }

      if (!data) {
        applySavedNamesOrFallback();
        return;
      }

      setSwapiData(data);
      const newTasks = generateTasks(data, 10, true);
      if (newTasks.length === 0) {
        if (missionCount.current === 0) {
          applyFallback();
          return;
        }
        setError('Failed to generate missions. Please try again.');
        return;
      }

      setTodos(newTasks);
      if (newTasks.length < 10) {
        setNotice(`Generated ${newTasks.length} of 10 missions.`);
      }
    } catch (error) {
      console.error('Failed to generate missions:', error);
      if (id !== requestId.current) {
        return;
      }
      applySavedNamesOrFallback();
    } finally {
      if (id === requestId.current) {
        setLoading(false);
      }
    }
  }, [applyFallback, fetchRandomData, setError, setLoading, setSwapiData, setTodos, applySavedNamesOrFallback]);

  const requestNewMissions = () => {
    if (state.todos.length > 0 && !window.confirm('Replace the current missions? Your journal and templates stay.')) {
      return;
    }
    loadMissions();
  };

  const exportSave = () => {
    const blob = new Blob([JSON.stringify({
      todos: state.todos,
      journal: state.journal,
      templates: state.templates,
      swapiData: state.swapiData,
    })], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'jedi-missions.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  const importSave = async (file: File) => {
    const parsed = parsePersisted(await file.text());
    if (!parsed) {
      setError('That file is not a Jedi Missions save.');
      return;
    }
    if (!window.confirm('Replace your missions, journal, and templates with this file?')) {
      return;
    }
    restoreSave(parsed);
    setNotice(null);
  };

  useEffect(() => {
    if (skipInitialFetch.current) {
      return;
    }
    loadMissions();
  }, [loadMissions]);

  return (
    <AppLayout>
      <div className="app-content">
        {/* Control Panel */}
        <div className="control-panel">
          <div className="panel-header">
            <h2 className="content-title">Mission Control</h2>
            <button
              className="generate-btn"
              onClick={requestNewMissions}
              disabled={state.isLoading}
            >
              <span className="btn-icon">🔄</span>
              <span className="btn-text">
                {state.isLoading ? 'Generating...' : 'New Missions'}
              </span>
            </button>
          </div>

          {/* Add Todo Component */}
          <AddTodo />
          <div className="save-actions">
            <button type="button" className="status-retry" onClick={exportSave}>
              Export save
            </button>
            <button type="button" className="status-retry" onClick={() => fileRef.current?.click()}>
              Import save
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              hidden
              aria-label="Import save file"
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = '';
                if (file) {
                  importSave(file);
                }
              }}
            />
          </div>
        </div>

        {/* Mission List */}
        <div className="mission-section">
          <TodoList onRetry={loadMissions} />
        </div>

        {/* Status Information */}
        {state.error && (
          <div className="status-message error" role="status">
            <span className="status-icon">⚠️</span>
            <span>{state.error}</span>
            <button
              type="button"
              className="status-retry"
              onClick={requestNewMissions}
              disabled={state.isLoading}
            >
              Retry SWAPI
            </button>
          </div>
        )}
        {notice && !state.error && (
          <div className="status-message notice" role="status">
            <span className="status-icon">ℹ️</span>
            <span>{notice}</span>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

// Main App component
function App() {
  return (
    <ErrorBoundary>
      <TodoProvider>
        <AppContent />
      </TodoProvider>
    </ErrorBoundary>
  );
}

export default App;