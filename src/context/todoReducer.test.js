import {todoReducer} from './TodoContext';

const emptyState = () => ({
  todos: [],
  isLoading: false,
  error: 'old',
  swapiData: {people: [], planets: [], starships: [], species: []},
  journal: [],
  templates: [],
});

const todo = {
  id: 'task_1',
  text: 'Train with the remote',
  completed: false,
  difficulty: 'padawan',
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
};

test('add, complete once, and delete', () => {
  const added = todoReducer(emptyState(), {type: 'ADD_TODO', payload: todo});
  expect(added.todos).toHaveLength(1);
  expect(added.error).toBeNull();

  const completed = todoReducer(added, {type: 'TOGGLE_TODO', payload: 'task_1'});
  expect(completed.todos[0].completed).toBe(true);
  expect(completed.journal).toHaveLength(1);
  expect(completed.journal[0].text).toBe(todo.text);

  const reopened = todoReducer(completed, {type: 'TOGGLE_TODO', payload: 'task_1'});
  expect(reopened.todos[0].completed).toBe(false);
  expect(reopened.journal).toHaveLength(1);

  const removed = todoReducer(reopened, {type: 'DELETE_TODO', payload: 'task_1'});
  expect(removed.todos).toHaveLength(0);
  expect(removed.journal).toHaveLength(1);
});

test('replacing missions keeps the journal', () => {
  const withJournal = {
    ...emptyState(),
    journal: [{
      id: 'j',
      text: 'Train with the remote',
      difficulty: 'padawan',
      completedAt: '2026-01-01T00:00:00.000Z',
    }],
  };

  const next = todoReducer(withJournal, {type: 'SET_TODOS', payload: [todo]});
  expect(next.todos).toHaveLength(1);
  expect(next.journal).toHaveLength(1);
  expect(next.error).toBeNull();
});

test('edits only a custom mission', () => {
  const custom = {...todo, id: 'custom', custom: true};
  const added = todoReducer(emptyState(), {type: 'ADD_TODO', payload: custom});
  const edited = todoReducer(added, {
    type: 'UPDATE_TODO',
    payload: {id: 'custom', text: '  Revised watch  ', difficulty: 'master'},
  });
  expect(edited.todos[0].text).toBe('Revised watch');
  expect(edited.todos[0].difficulty).toBe('master');

  const generated = todoReducer(emptyState(), {type: 'ADD_TODO', payload: todo});
  const unchanged = todoReducer(generated, {
    type: 'UPDATE_TODO',
    payload: {id: 'task_1', text: 'Nope', difficulty: 'master'},
  });
  expect(unchanged.todos[0].text).toBe(todo.text);
});

test('saves a custom template once', () => {
  const template = {id: 't', text: 'Meditate', difficulty: 'knight'};
  const once = todoReducer(emptyState(), {type: 'ADD_TEMPLATE', payload: template});
  const twice = todoReducer(once, {type: 'ADD_TEMPLATE', payload: {...template, id: 't2'}});
  expect(twice.templates).toHaveLength(1);

  const cleared = todoReducer(twice, {type: 'DELETE_TEMPLATE', payload: 't'});
  expect(cleared.templates).toHaveLength(0);
});
