import {act, fireEvent, render, screen} from '@testing-library/react';
import App from './App';

const swapi = {
  calls: 0,
  gate: null,
  names: {
    people: ['Luke Skywalker'],
    planets: ['Tatooine'],
    starships: ['X-wing'],
    species: ['Human'],
  },
};

jest.mock('./hooks/useSwapi', () => {
  const fetchRandomData = () => {
    swapi.calls += 1;
    return swapi.gate || Promise.resolve(swapi.names);
  };

  return {
    useSwapi: () => ({
      data: {people: [], planets: [], starships: [], species: []},
      isLoading: false,
      error: null,
      fetchRandomData,
    }),
  };
});

jest.mock('./components/StarField', () => () => null);

const liveNames = {
  people: ['Luke Skywalker'],
  planets: ['Tatooine'],
  starships: ['X-wing'],
  species: ['Human'],
};

beforeEach(() => {
  localStorage.clear();
  swapi.calls = 0;
  swapi.gate = null;
  swapi.names = liveNames;
  window.confirm = () => true;
});

test('renders Jedi Missions heading', async () => {
  render(<App />);
  expect(screen.getByRole('heading', {name: /jedi missions/i})).toBeInTheDocument();
  expect((await screen.findAllByText(/Luke Skywalker|Tatooine|X-wing|Human/)).length).toBeGreaterThan(0);
});

test('shows mission control when loaded', async () => {
  render(<App />);
  expect(screen.getByRole('heading', {name: /mission control/i})).toBeInTheDocument();
  expect(await screen.findAllByRole('button', {name: /delete mission/i})).toHaveLength(10);
});

test('failed refresh keeps the current list when no names are saved', async () => {
  localStorage.setItem('jedi-missions-v1', JSON.stringify({
    todos: [{
      id: 'kept',
      text: 'Hold the line',
      completed: false,
      difficulty: 'knight',
      createdAt: '2026-01-01T00:00:00.000Z',
    }],
    journal: [],
    templates: [],
  }));
  swapi.names = null;
  render(<App />);
  expect(await screen.findByText('Hold the line')).toBeInTheDocument();

  act(() => {
    screen.getByRole('button', {name: /new missions/i}).click();
  });

  expect(await screen.findByText(/current missions kept/i)).toBeInTheDocument();
  expect(screen.getByText('Hold the line')).toBeInTheDocument();
});

test('failed refresh uses saved names', async () => {
  localStorage.setItem('jedi-missions-v1', JSON.stringify({
    todos: [{
      id: 'old',
      text: 'Hold the line',
      completed: false,
      difficulty: 'knight',
      createdAt: '2026-01-01T00:00:00.000Z',
    }],
    journal: [],
    templates: [],
    swapiData: liveNames,
  }));
  swapi.names = null;
  render(<App />);
  expect(await screen.findByText('Hold the line')).toBeInTheDocument();

  act(() => {
    screen.getByRole('button', {name: /new missions/i}).click();
  });

  expect(await screen.findByText(/saved names/i)).toBeInTheDocument();
  expect(screen.queryByText('Hold the line')).not.toBeInTheDocument();
  expect(screen.getAllByRole('button', {name: /delete mission/i}).length).toBeGreaterThan(0);
});

test('New Missions waits for confirmation', async () => {
  localStorage.setItem('jedi-missions-v1', JSON.stringify({
    todos: [{
      id: 'kept',
      text: 'Hold the line',
      completed: false,
      difficulty: 'knight',
      createdAt: '2026-01-01T00:00:00.000Z',
    }],
    journal: [],
    templates: [],
  }));
  window.confirm = () => false;
  render(<App />);
  expect(await screen.findByText('Hold the line')).toBeInTheDocument();

  act(() => {
    screen.getByRole('button', {name: /new missions/i}).click();
  });

  expect(swapi.calls).toBe(0);
  expect(screen.getByText('Hold the line')).toBeInTheDocument();
});

test('first load uses offline missions when nothing is saved', async () => {
  swapi.names = null;
  render(<App />);
  expect(await screen.findByText(/using offline missions/i)).toBeInTheDocument();
  expect(await screen.findAllByRole('button', {name: /delete mission/i})).toHaveLength(8);
  expect(screen.getByRole('button', {name: /retry swapi/i})).toBeInTheDocument();
});

test('undo puts an abandoned mission back', async () => {
  localStorage.setItem('jedi-missions-v1', JSON.stringify({
    todos: [{
      id: 'kept',
      text: 'Hold the line',
      completed: false,
      difficulty: 'knight',
      createdAt: '2026-01-01T00:00:00.000Z',
      custom: true,
    }],
    journal: [],
    templates: [],
  }));
  render(<App />);
  const abandon = await screen.findByRole('button', {name: /delete mission "hold the line"/i});
  act(() => {
    abandon.click();
  });
  const undo = await screen.findByRole('button', {name: /^undo$/i});
  act(() => {
    undo.click();
  });
  expect(screen.getByText('Hold the line')).toBeInTheDocument();
});

test('an in-flight load does not replace an imported save', async () => {
  let releaseFetch;
  swapi.gate = new Promise((resolve) => {
    releaseFetch = resolve;
  });
  render(<App />);
  expect(screen.getByRole('button', {name: /import save/i})).toBeDisabled();

  const input = screen.getByLabelText(/import save file/i);
  const contents = JSON.stringify({
    todos: [{
      id: 'imported',
      text: 'Imported mission',
      completed: false,
      difficulty: 'padawan',
      createdAt: '2026-01-01T00:00:00.000Z',
    }],
    journal: [],
    templates: [],
  });
  const file = new File([contents], 'jedi-missions.json', {type: 'application/json'});
  file.text = () => Promise.resolve(contents);

  await act(async () => {
    fireEvent.change(input, {target: {files: [file]}});
  });
  expect(await screen.findByText('Imported mission')).toBeInTheDocument();

  await act(async () => {
    releaseFetch(liveNames);
  });
  expect(screen.getByText('Imported mission')).toBeInTheDocument();
  expect(screen.queryByText(/Luke Skywalker|Tatooine|X-wing|Human/)).not.toBeInTheDocument();
});

test('a bad import file does not offer Retry SWAPI', async () => {
  localStorage.setItem('jedi-missions-v1', JSON.stringify({
    todos: [{
      id: 'kept',
      text: 'Hold the line',
      completed: false,
      difficulty: 'knight',
      createdAt: '2026-01-01T00:00:00.000Z',
    }],
    journal: [],
    templates: [],
  }));
  render(<App />);
  expect(await screen.findByText('Hold the line')).toBeInTheDocument();

  const input = screen.getByLabelText(/import save file/i);
  const file = new File(['not json'], 'notes.txt', {type: 'text/plain'});
  file.text = () => Promise.resolve('not json');
  await act(async () => {
    fireEvent.change(input, {target: {files: [file]}});
  });

  expect(await screen.findByText(/not a jedi missions save/i)).toBeInTheDocument();
  expect(screen.queryByRole('button', {name: /retry swapi/i})).not.toBeInTheDocument();
  expect(screen.getByText('Hold the line')).toBeInTheDocument();
});

test('shows saved missions without calling SWAPI', async () => {
  localStorage.setItem('jedi-missions-v1', JSON.stringify({
    todos: [{
      id: 'saved',
      text: 'Saved meditation',
      completed: true,
      difficulty: 'master',
      createdAt: '2026-01-01T00:00:00.000Z',
    }],
    journal: [],
    templates: [],
  }));

  render(<App />);

  expect(await screen.findByText('Saved meditation')).toBeInTheDocument();
  expect(screen.getByText('1/1')).toBeInTheDocument();
  expect(swapi.calls).toBe(0);
});
