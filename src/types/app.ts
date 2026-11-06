// Difficulty levels for tasks
export type TaskDifficulty = 'padawan' | 'knight' | 'master';

// Individual todo item
export interface Todo {
  id: string;
  text: string;
  completed: boolean;
  difficulty: TaskDifficulty;
  createdAt: Date;
  custom?: boolean;
}

// One line written when a mission is completed
export interface JournalEntry {
  id: string;
  text: string;
  difficulty: TaskDifficulty;
  completedAt: string;
}

// A reusable custom mission the user saved locally
export interface MissionTemplate {
  id: string;
  text: string;
  difficulty: TaskDifficulty;
}

// Task template for generation
export interface TaskTemplate {
  id: string;
  template: string; // Template with placeholders like "{character}" or "{planet}"
  difficulty: TaskDifficulty;
  requiredData: SwapiDataType[]; // What SWAPI data this template needs
}

// Types of SWAPI data we can use in templates
export type SwapiDataType = 'people' | 'planets' | 'starships' | 'species';

// Data structure for populated template data
export interface TemplateData {
  people?: string[];
  planets?: string[];
  starships?: string[];
  species?: string[];
}

// App state structure
export interface AppState {
  todos: Todo[];
  isLoading: boolean;
  error: string | null;
  swapiData: TemplateData;
  journal: JournalEntry[];
  templates: MissionTemplate[];
}

// Actions for todo management
export type TodoAction =
  | {type: 'ADD_TODO'; payload: Todo}
  | {type: 'TOGGLE_TODO'; payload: string}
  | {type: 'DELETE_TODO'; payload: string}
  | {type: 'SET_TODOS'; payload: Todo[]}
  | {type: 'SET_LOADING'; payload: boolean}
  | {type: 'SET_ERROR'; payload: string | null}
  | {type: 'SET_SWAPI_DATA'; payload: TemplateData}
  | {type: 'UPDATE_TODO'; payload: {id: string; text: string; difficulty: TaskDifficulty}}
  | {type: 'ADD_TEMPLATE'; payload: MissionTemplate}
  | {type: 'DELETE_TEMPLATE'; payload: string}
  | {type: 'RESTORE'; payload: {todos: Todo[]; journal: JournalEntry[]; templates: MissionTemplate[]; swapiData: TemplateData}};