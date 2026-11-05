import React, {useCallback, useEffect, useRef} from 'react';
import {TodoProvider, useTodoContext} from './context/TodoContext';
import AppLayout from './components/AppLayout';
import TodoList from './components/TodoList';
import AddTodo from './components/AddTodo';
import ErrorBoundary from './components/ErrorBoundary';
import {useSwapi} from './hooks/useSwapi';
import {generateTasks, generateFallbackTasks} from './utils/taskGenerator';
import './App.css';

// Main app content component (needs to be inside TodoProvider)
const AppContent: React.FC = () => {
  const {setTodos, setLoading, setError, setSwapiData, state} = useTodoContext();
  const {fetchRandomData} = useSwapi();
  const requestId = useRef(0);
  const hasMissions = useRef(false);

  const applyFallback = useCallback(() => {
    if (hasMissions.current) {
      setError('Using offline missions. Star Wars data unavailable.');
      return;
    }

    try {
      setTodos(generateFallbackTasks(8));
      hasMissions.current = true;
      setError('Using offline missions. Star Wars data unavailable.');
    } catch (error) {
      console.error('Failed to generate fallback tasks:', error);
      setError('Failed to generate missions. Please refresh the page.');
    }
  }, [setError, setTodos]);

  const loadMissions = useCallback(async () => {
    const id = ++requestId.current;
    setError(null);
    setLoading(true);

    try {
      const data = await fetchRandomData();
      if (id !== requestId.current) {
        return;
      }

      if (!data) {
        applyFallback();
        return;
      }

      setSwapiData(data);
      const newTasks = generateTasks(data, 10, true);
      if (newTasks.length === 0) {
        if (!hasMissions.current) {
          applyFallback();
          return;
        }
        setError('Failed to generate missions. Please try again.');
        return;
      }

      setTodos(newTasks);
      hasMissions.current = true;
    } catch (error) {
      console.error('Failed to generate missions:', error);
      if (id !== requestId.current) {
        return;
      }
      applyFallback();
    } finally {
      if (id === requestId.current) {
        setLoading(false);
      }
    }
  }, [applyFallback, fetchRandomData, setError, setLoading, setSwapiData, setTodos]);

  useEffect(() => {
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
              onClick={loadMissions}
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
        </div>

        {/* Mission List */}
        <div className="mission-section">
          <TodoList />
        </div>

        {/* Status Information */}
        {state.error && (
          <div className="status-message error">
            <span className="status-icon">⚠️</span>
            {state.error}
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