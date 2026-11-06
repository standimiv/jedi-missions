import {JournalEntry, MissionTemplate, TaskDifficulty, TemplateData, Todo} from '../types/app';

export const STORAGE_KEY = 'jedi-missions-v1';

export interface PersistedState {
  todos: Todo[];
  journal: JournalEntry[];
  templates: MissionTemplate[];
  swapiData: TemplateData;
}

const emptySwapiData = (): TemplateData => ({
  people: [],
  planets: [],
  starships: [],
  species: [],
});

const emptyPersisted = (): PersistedState => ({
  todos: [],
  journal: [],
  templates: [],
  swapiData: emptySwapiData(),
});

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
    ...(raw.custom === true ? {custom: true} : {}),
  };
};

const reviveNames = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .filter((name): name is string => typeof name === 'string' && name.trim().length > 0)
    .map(name => name.trim().slice(0, 80))
    .slice(0, 30);
};

export const reviveSwapiData = (value: unknown): TemplateData => {
  const raw = value && typeof value === 'object' ? value as TemplateData : {};
  return {
    people: reviveNames(raw.people),
    planets: reviveNames(raw.planets),
    starships: reviveNames(raw.starships),
    species: reviveNames(raw.species),
  };
};

export const hasSwapiNames = (data: TemplateData): boolean =>
  [data.people, data.planets, data.starships, data.species].some(names => names && names.length > 0);

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

const reviveState = (parsed: Partial<PersistedState>): PersistedState => ({
  todos: Array.isArray(parsed.todos)
    ? parsed.todos.map(reviveTodo).filter((todo): todo is Todo => todo !== null)
    : [],
  journal: Array.isArray(parsed.journal)
    ? parsed.journal.map(reviveJournal).filter((entry): entry is JournalEntry => entry !== null).slice(-40)
    : [],
  templates: Array.isArray(parsed.templates)
    ? parsed.templates.map(reviveTemplate).filter((template): template is MissionTemplate => template !== null).slice(0, 20)
    : [],
  swapiData: reviveSwapiData(parsed.swapiData),
});

export const parsePersisted = (raw: string): PersistedState | null => {
  try {
    const parsed = JSON.parse(raw) as Partial<PersistedState>;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return null;
    }
    return reviveState(parsed);
  } catch {
    return null;
  }
};

export const loadPersisted = (): PersistedState => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return emptyPersisted();
    }
    return parsePersisted(raw) ?? emptyPersisted();
  } catch {
    return emptyPersisted();
  }
};

export const savePersisted = (state: PersistedState): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Private mode or a full disk: keep the in-memory list for this visit.
  }
};
