import {JournalEntry, MissionSubjects, MissionTemplate, TaskDifficulty, TemplateData, Todo} from '../types/app';

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

const SUBJECT_KEYS = ['character', 'planet', 'starship', 'species'] as const;

const reviveSubjects = (value: unknown): MissionSubjects | undefined => {
  if (!value || typeof value !== 'object') {
    return undefined;
  }
  const raw = value as Record<string, unknown>;
  const subjects: MissionSubjects = {};
  SUBJECT_KEYS.forEach(key => {
    const name = raw[key];
    if (typeof name === 'string' && name.trim()) {
      subjects[key] = name.trim().slice(0, 80);
    }
  });
  return Object.keys(subjects).length > 0 ? subjects : undefined;
};

const reviveTodo = (value: unknown): Todo | null => {
  if (!value || typeof value !== 'object') {
    return null;
  }
  const raw = value as Partial<Todo> & {createdAt?: string; subjects?: unknown};
  const createdAt = new Date(raw.createdAt ?? '');
  if (typeof raw.id !== 'string' || typeof raw.text !== 'string' || !raw.text.trim()) {
    return null;
  }
  if (!isDifficulty(raw.difficulty) || Number.isNaN(createdAt.getTime())) {
    return null;
  }
  const subjects = reviveSubjects(raw.subjects);
  return {
    id: raw.id,
    text: raw.text,
    completed: Boolean(raw.completed),
    difficulty: raw.difficulty,
    createdAt,
    ...(raw.custom === true ? {custom: true} : {}),
    ...(subjects ? {subjects} : {}),
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

const isSaveFile = (value: object): value is Partial<PersistedState> => {
  const record = value as Record<string, unknown>;
  const knownKeys = ['todos', 'journal', 'templates', 'swapiData'].filter(key =>
    Object.prototype.hasOwnProperty.call(record, key)
  );
  if (knownKeys.length === 0) {
    return false;
  }
  if ('todos' in record && !Array.isArray(record.todos)) {
    return false;
  }
  if ('journal' in record && !Array.isArray(record.journal)) {
    return false;
  }
  if ('templates' in record && !Array.isArray(record.templates)) {
    return false;
  }
  if ('swapiData' in record) {
    const data = record.swapiData;
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      return false;
    }
  }
  return true;
};

export const parsePersisted = (raw: string): PersistedState | null => {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed) || !isSaveFile(parsed)) {
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
