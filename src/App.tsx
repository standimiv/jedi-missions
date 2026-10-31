import React, {useEffect} from 'react';
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
  const {
    data: swapiData,
    isLoading: swapiLoading,
    error: swapiError,
    fetchRandomData,
    hasData
  } = useSwapi();

  // Generate initial tasks when the app loads
  useEffect(() => {
    const initializeTasks = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch SWAPI data first
        await fetchRandomData();
      } catch (error) {
        console.error('Failed to fetch SWAPI data:', error);
        setError('Failed to load Star Wars data. Using fallback missions.');
      }
    };

    // Only initialize if we don't have todos yet
    if (state.todos.length === 0) {
      initializeTasks();
    }
  }, [fetchRandomData, setLoading, setError, state.todos.length]);

  // Sync hook loading into context only while the mission list is still empty
  useEffect(() => {
    if (state.todos.length === 0) {
      setLoading(swapiLoading);
    }
  }, [swapiLoading, setLoading, state.todos.length]);

  // Generate tasks when SWAPI data is available
  useEffect(() => {
    if (hasData && state.todos.length === 0) {
      try {
        setSwapiData(swapiData);
        const newTasks = generateTasks(swapiData, 10, true);
        if (newTasks.length === 0) {
          throw new Error('No missions could be generated from SWAPI data');
        }
        setTodos(newTasks);
        setLoading(false);
        console.log('Generated tasks with SWAPI data:', newTasks);
      } catch (error) {
        console.error('Failed to generate tasks:', error);
        setError('Failed to generate missions. Please try again.');
        setLoading(false);
      }
    }
  }, [hasData, swapiData, setSwapiData, setTodos, setLoading, setError, state.todos.length]);

  // Handle SWAPI errors and generate fallback tasks
  useEffect(() => {
    if (swapiError && state.todos.length === 0) {
      console.warn('SWAPI error, generating fallback tasks:', swapiError);
      try {
        const fallbackTasks = generateFallbackTasks(8);
        setTodos(fallbackTasks);
        setError('Using offline missions. Star Wars data unavailable.');
        setLoading(false);
      } catch (error) {
        console.error('Failed to generate fallback tasks:', error);
        setError('Failed to generate missions. Please refresh the page.');
        setLoading(false);
      }
    }
  }, [swapiError, setTodos, setError, setLoading, state.todos.length]);

  const handleGenerateNewMissions = async () => {
    setLoading(true);
    setError(null);

    try {
      // Clear current todos
      setTodos([]);

      // Fetch fresh SWAPI data
      await fetchRandomData();
    } catch (error) {
      console.error('Failed to generate new missions:', error);
      setError('Failed to generate new missions. Please try again.');
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="app-content">
        {/* Control Panel */}
        <div className="control-panel">
          <div className="panel-header">
            <h2 className="content-title">Mission Control</h2>
            <button
              className="generate-btn"
              onClick={handleGenerateNewMissions}
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