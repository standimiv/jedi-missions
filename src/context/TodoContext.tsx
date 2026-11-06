import React, {createContext, useContext, useReducer, ReactNode, useMemo, useCallback, useEffect, useRef, useState} from 'react';
import {Todo, AppState, TodoAction, TemplateData, MissionTemplate, TaskDifficulty} from '../types/app';
import {loadPersisted, PersistedState, savePersisted} from '../utils/storage';

// Initial state. Saved missions skip the loading screen; an empty store still fetches.
const createInitialState = (): AppState => {
  const persisted = loadPersisted();
  return {
    todos: persisted.todos,
    isLoading: persisted.todos.length === 0,
    error: null,
    swapiData: persisted.swapiData,
    journal: persisted.journal,
    templates: persisted.templates,
  };
};

const nextId = (prefix: string): string =>
  `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

// Reducer function
export const todoReducer = (state: AppState, action: TodoAction): AppState => {
  switch (action.type) {
    case 'SET_TODOS':
      return {
        ...state,
        todos: action.payload,
        error: null,
      };

    case 'ADD_TODO':
      return {
        ...state,
        todos: [...state.todos, action.payload],
        error: null,
      };

    case 'TOGGLE_TODO': {
      const target = state.todos.find(todo => todo.id === action.payload);
      const completedNow = Boolean(target && !target.completed);
      return {
        ...state,
        todos: state.todos.map(todo =>
          todo.id === action.payload
            ? {...todo, completed: !todo.completed}
            : todo
        ),
        journal: completedNow && target
          ? [
            ...state.journal,
            {
              id: nextId('journal'),
              text: target.text,
              difficulty: target.difficulty,
              completedAt: new Date().toISOString(),
            },
          ].slice(-40)
          : state.journal,
        error: null,
      };
    }

    case 'DELETE_TODO':
      return {
        ...state,
        todos: state.todos.filter(todo => todo.id !== action.payload),
        error: null,
      };

    case 'UPDATE_TODO': {
      const text = action.payload.text.trim().slice(0, 200);
      if (!text) {
        return state;
      }
      return {
        ...state,
        todos: state.todos.map(todo =>
          todo.id === action.payload.id && todo.custom
            ? {...todo, text, difficulty: action.payload.difficulty}
            : todo
        ),
      };
    }

    case 'RESTORE':
      return {
        ...state,
        todos: action.payload.todos,
        journal: action.payload.journal.slice(-40),
        templates: action.payload.templates.slice(0, 20),
        swapiData: action.payload.swapiData,
        error: null,
        isLoading: false,
      };

    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };

    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        isLoading: action.payload ? false : state.isLoading,
      };

    case 'SET_SWAPI_DATA':
      return {
        ...state,
        swapiData: action.payload,
        error: null,
      };

    case 'ADD_TEMPLATE': {
      const alreadySaved = state.templates.some(
        template => template.text === action.payload.text && template.difficulty === action.payload.difficulty
      );
      if (alreadySaved || state.templates.length >= 20) {
        return state;
      }
      return {
        ...state,
        templates: [...state.templates, action.payload],
      };
    }

    case 'DELETE_TEMPLATE':
      return {
        ...state,
        templates: state.templates.filter(template => template.id !== action.payload),
      };

    default:
      return state;
  }
};

// Context type definition
interface TodoContextType {
  // State
  state: AppState;

  // Todo actions
  addTodo: (todo: Todo) => void;
  toggleTodo: (id: string) => void;
  deleteTodo: (id: string) => void;
  updateTodo: (id: string, text: string, difficulty: TaskDifficulty) => void;
  undoDelete: () => void;
  undoTodo: Todo | null;
  restoreSave: (saved: PersistedState) => void;
  setTodos: (todos: Todo[]) => void;

  // App state actions
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSwapiData: (data: TemplateData) => void;
  addTemplate: (template: MissionTemplate) => void;
  deleteTemplate: (id: string) => void;

  // Computed values
  completedTodos: Todo[];
  incompleteTodos: Todo[];
  totalTodos: number;
  completionPercentage: number;

  // Task statistics by difficulty
  todosByDifficulty: {
    padawan: Todo[];
    knight: Todo[];
    master: Todo[];
  };

  completionByDifficulty: {
    padawan: {completed: number; total: number};
    knight: {completed: number; total: number};
    master: {completed: number; total: number};
  };
}

// Create context
const TodoContext = createContext<TodoContextType | undefined>(undefined);

// Provider component props
interface TodoProviderProps {
  children: ReactNode;
}

// Provider component
export const TodoProvider: React.FC<TodoProviderProps> = ({children}) => {
  const [state, dispatch] = useReducer(todoReducer, undefined, createInitialState);

  const [undoTodo, setUndoTodo] = useState<Todo | null>(null);
  const undoRef = useRef<Todo | null>(null);
  const todosRef = useRef(state.todos);
  todosRef.current = state.todos;

  useEffect(() => {
    savePersisted({
      todos: state.todos,
      journal: state.journal,
      templates: state.templates,
      swapiData: state.swapiData,
    });
  }, [state.todos, state.journal, state.templates, state.swapiData]);

  useEffect(() => {
    if (!undoTodo) {
      return;
    }
    const timer = window.setTimeout(() => {
      undoRef.current = null;
      setUndoTodo(null);
    }, 5000);
    return () => window.clearTimeout(timer);
  }, [undoTodo]);

  // Action creators (wrapped with useCallback for performance)
  const addTodo = useCallback((todo: Todo) => {
    dispatch({type: 'ADD_TODO', payload: todo});
  }, []);

  const toggleTodo = useCallback((id: string) => {
    dispatch({type: 'TOGGLE_TODO', payload: id});
  }, []);

  const deleteTodo = useCallback((id: string) => {
    const todo = todosRef.current.find(item => item.id === id) ?? null;
    undoRef.current = todo;
    setUndoTodo(todo);
    dispatch({type: 'DELETE_TODO', payload: id});
  }, []);

  const updateTodo = useCallback((id: string, text: string, difficulty: TaskDifficulty) => {
    dispatch({type: 'UPDATE_TODO', payload: {id, text, difficulty}});
  }, []);

  const undoDelete = useCallback(() => {
    const todo = undoRef.current;
    undoRef.current = null;
    setUndoTodo(null);
    if (todo) {
      dispatch({type: 'ADD_TODO', payload: todo});
    }
  }, []);

  const restoreSave = useCallback((saved: PersistedState) => {
    undoRef.current = null;
    setUndoTodo(null);
    dispatch({type: 'RESTORE', payload: saved});
  }, []);

  const setTodos = useCallback((todos: Todo[]) => {
    undoRef.current = null;
    setUndoTodo(null);
    dispatch({type: 'SET_TODOS', payload: todos});
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    dispatch({type: 'SET_LOADING', payload: loading});
  }, []);

  const setError = useCallback((error: string | null) => {
    dispatch({type: 'SET_ERROR', payload: error});
  }, []);

  const setSwapiData = useCallback((data: TemplateData) => {
    dispatch({type: 'SET_SWAPI_DATA', payload: data});
  }, []);

  const addTemplate = useCallback((template: MissionTemplate) => {
    dispatch({type: 'ADD_TEMPLATE', payload: template});
  }, []);

  const deleteTemplate = useCallback((id: string) => {
    dispatch({type: 'DELETE_TEMPLATE', payload: id});
  }, []);

  const completedTodos = useMemo(
    () => state.todos.filter(todo => todo.completed),
    [state.todos]
  );
  const incompleteTodos = useMemo(
    () => state.todos.filter(todo => !todo.completed),
    [state.todos]
  );
  const totalTodos = state.todos.length;
  const completionPercentage = totalTodos > 0 ? (completedTodos.length / totalTodos) * 100 : 0;

  const todosByDifficulty = useMemo(() => ({
    padawan: state.todos.filter(todo => todo.difficulty === 'padawan'),
    knight: state.todos.filter(todo => todo.difficulty === 'knight'),
    master: state.todos.filter(todo => todo.difficulty === 'master'),
  }), [state.todos]);

  const completionByDifficulty = useMemo(() => ({
    padawan: {
      completed: todosByDifficulty.padawan.filter(todo => todo.completed).length,
      total: todosByDifficulty.padawan.length,
    },
    knight: {
      completed: todosByDifficulty.knight.filter(todo => todo.completed).length,
      total: todosByDifficulty.knight.length,
    },
    master: {
      completed: todosByDifficulty.master.filter(todo => todo.completed).length,
      total: todosByDifficulty.master.length,
    },
  }), [todosByDifficulty]);

  const contextValue: TodoContextType = useMemo(() => ({
    // State
    state,

    // Actions
    addTodo,
    toggleTodo,
    deleteTodo,
    updateTodo,
    undoDelete,
    undoTodo,
    restoreSave,
    setTodos,
    setLoading,
    setError,
    setSwapiData,
    addTemplate,
    deleteTemplate,

    // Computed values
    completedTodos,
    incompleteTodos,
    totalTodos,
    completionPercentage,
    todosByDifficulty,
    completionByDifficulty,
  }), [
    state,
    addTodo,
    toggleTodo,
    deleteTodo,
    updateTodo,
    undoDelete,
    undoTodo,
    restoreSave,
    setTodos,
    setLoading,
    setError,
    setSwapiData,
    addTemplate,
    deleteTemplate,
    completedTodos,
    incompleteTodos,
    totalTodos,
    completionPercentage,
    todosByDifficulty,
    completionByDifficulty,
  ]);

  return (
    <TodoContext.Provider value={contextValue}>
      {children}
    </TodoContext.Provider>
  );
};
// Custom hook to use the context
export const useTodoContext = (): TodoContextType => {
  const context = useContext(TodoContext);
  if (context === undefined) {
    throw new Error('useTodoContext must be used within a TodoProvider');
  }
  return context;
};
export default TodoContext;