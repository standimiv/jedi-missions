import {STORAGE_KEY, loadPersisted, savePersisted} from './storage';

beforeEach(() => {
  localStorage.clear();
});

test('round-trips missions and ignores corrupt storage', () => {
  savePersisted({
    todos: [{
      id: '1',
      text: 'Keep watch',
      completed: false,
      difficulty: 'knight',
      createdAt: new Date('2026-01-02T00:00:00.000Z'),
    }],
    journal: [{
      id: 'j',
      text: 'Keep watch',
      difficulty: 'knight',
      completedAt: '2026-01-03T00:00:00.000Z',
    }],
    templates: [{id: 't', text: 'Meditate', difficulty: 'padawan'}],
  });

  const loaded = loadPersisted();
  expect(loaded.todos[0].createdAt).toBeInstanceOf(Date);
  expect(loaded.todos[0].text).toBe('Keep watch');
  expect(loaded.journal).toHaveLength(1);
  expect(loaded.templates[0].text).toBe('Meditate');

  localStorage.setItem(STORAGE_KEY, '{');
  expect(loadPersisted()).toEqual({todos: [], journal: [], templates: []});
});
