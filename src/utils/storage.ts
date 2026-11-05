import {JournalEntry, MissionTemplate, TaskDifficulty, Todo} from '../types/app';

export const STORAGE_KEY = 'jedi-missions-v1';

export interface PersistedState {
  todos: Todo[];
  journal: JournalEntry[];
  templates: MissionTemplate[];
}

const EMPTY: PersistedState = {
  todos: [],
  journal: [],
  templates: [],
};

const DIFFICULTIES: TaskDifficulty[] = ['padawan', 'knight', 'master'];

const isDifficulty = (value: unknown): value is TaskDifficulty =>
  typeof value === 'string' && DIFFICULTIES.includes(value as TaskDifficulty);

const reviveTodo = (value: unknown): Todo | null => {
  if (!value || typeof value !== 'object') {
    return null;
  }
  const raw = value as Partial<Todo> & {createdAt?: string};
  const createdAt = new Date(raw.createdAt ?? '');
  if (typeof raw.id !== 'string' || typeof raw.text !== 'string' || !raw.text.trim()) {
    return null;
  }
  if (!isDifficulty(raw.difficulty) || Number.isNaN(createdAt.getTime())) {
    return null;
  }
  return {
    id: raw.id,
    text: raw.text,
    completed: Boolean(raw.completed),
    difficulty: raw.difficulty,
    createdAt,
  };
};

const reviveJournal = (value: unknown): JournalEntry | null => {
  if (!value || typeof value !== 'object') {
    return null;
  }
  const raw = value as Partial<JournalEntry>;
  if (typeof raw.id !== 'string' || typeof raw.text !== 'string' || typeof raw.completedAt !== 'string') {
    return null;
  }
  if (!isDifficulty(raw.difficulty) || Number.isNaN(new Date(raw.completedAt).getTime())) {
    return null;
  }
  return {
    id: raw.id,
    text: raw.text,
    difficulty: raw.difficulty,
    completedAt: raw.completedAt,
  };
};

const reviveTemplate = (value: unknown): MissionTemplate | null => {
  if (!value || typeof value !== 'object') {
    return null;
  }
  const raw = value as Partial<MissionTemplate>;
  if (typeof raw.id !== 'string' || typeof raw.text !== 'string' || !raw.text.trim()) {
    return null;
  }
  if (!isDifficulty(raw.difficulty)) {
    return null;
  }
  return {id: raw.id, text: raw.text.trim(), difficulty: raw.difficulty};
};

export const loadPersisted = (): PersistedState => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return EMPTY;
    }
    const parsed = JSON.parse(raw) as Partial<PersistedState>;
    return {
      todos: Array.isArray(parsed.todos)
        ? parsed.todos.map(reviveTodo).filter((todo): todo is Todo => todo !== null)
        : [],
      journal: Array.isArray(parsed.journal)
        ? parsed.journal.map(reviveJournal).filter((entry): entry is JournalEntry => entry !== null)
        : [],
      templates: Array.isArray(parsed.templates)
        ? parsed.templates.map(reviveTemplate).filter((template): template is MissionTemplate => template !== null)
        : [],
    };
  } catch {
    return EMPTY;
  }
};

export const savePersisted = (state: PersistedState): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Private mode or a full disk: keep the in-memory list for this visit.
  }
};
