import React, {createContext, useContext, useReducer, ReactNode, useMemo, useCallback} from 'react';
import {Todo, AppState, TodoAction, TemplateData} from '../types/app';

// Initial state
const initialState: AppState = {
  todos: [],
  isLoading: false,
  error: null,
  swapiData: {
    people: [],
    planets: [],
    starships: [],
    species: [],
  },
};

// Reducer function
const todoReducer = (state: AppState, action: TodoAction): AppState => {
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

    case 'TOGGLE_TODO':
      return {
        ...state,
        todos: state.todos.map(todo =>
          todo.id === action.payload
            ? {...todo, completed: !todo.completed}
            : todo
        ),
        error: null,
      };

    case 'DELETE_TODO':
      return {
        ...state,
        todos: state.todos.filter(todo => todo.id !== action.payload),
        error: null,
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
        isLoading: false,
      };

    case 'SET_SWAPI_DATA':
      return {
        ...state,
        swapiData: action.payload,
        error: null,
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
  setTodos: (todos: Todo[]) => void;

  // App state actions
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSwapiData: (data: TemplateData) => void;

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
  const [state, dispatch] = useReducer(todoReducer, initialState);

  // Action creators (wrapped with useCallback for performance)
  const addTodo = useCallback((todo: Todo) => {
    dispatch({type: 'ADD_TODO', payload: todo});
  }, []);

  const toggleTodo = useCallback((id: string) => {
    dispatch({type: 'TOGGLE_TODO', payload: id});
  }, []);

  const deleteTodo = useCallback((id: string) => {
    dispatch({type: 'DELETE_TODO', payload: id});
  }, []);

  const setTodos = useCallback((todos: Todo[]) => {
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

  // Computed values
  const completedTodos = state.todos.filter(todo => todo.completed);
  const incompleteTodos = state.todos.filter(todo => !todo.completed);
  const totalTodos = state.todos.length;
  const completionPercentage = totalTodos > 0 ? (completedTodos.length / totalTodos) * 100 : 0;

  // Group todos by difficulty
  const todosByDifficulty = {
    padawan: state.todos.filter(todo => todo.difficulty === 'padawan'),
    knight: state.todos.filter(todo => todo.difficulty === 'knight'),
    master: state.todos.filter(todo => todo.difficulty === 'master'),
  };

  // Calculate completion stats by difficulty
  const completionByDifficulty = {
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
  };

  const contextValue: TodoContextType = useMemo(() => ({
    // State
    state,

    // Actions
    addTodo,
    toggleTodo,
    deleteTodo,
    setTodos,
    setLoading,
    setError,
    setSwapiData,

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
    setTodos,
    setLoading,
    setError,
    setSwapiData,
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