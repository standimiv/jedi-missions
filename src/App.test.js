import {act, render, screen, waitFor} from '@testing-library/react';
import App from './App';

const swapi = {
  calls: 0,
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
    return Promise.resolve(swapi.names);
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
  swapi.names = liveNames;
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

test('failed refresh keeps the current list', async () => {
  render(<App />);
  const before = await screen.findAllByRole('button', {name: /delete mission/i});

  swapi.names = null;
  act(() => {
    screen.getByRole('button', {name: /new missions/i}).click();
  });

  expect(await screen.findByText(/current missions kept/i)).toBeInTheDocument();
  expect(screen.getAllByRole('button', {name: /delete mission/i})).toHaveLength(before.length);
  expect(screen.queryByText(/using offline missions/i)).not.toBeInTheDocument();
});

test('failed refresh fills offline missions when the list is empty', async () => {
  render(<App />);

  const abandonButtons = await screen.findAllByRole('button', {name: /delete mission/i});
  act(() => {
    abandonButtons.forEach((button) => button.click());
  });

  await waitFor(() => {
    expect(screen.queryByRole('button', {name: /delete mission/i})).not.toBeInTheDocument();
  });

  swapi.names = null;
  act(() => {
    screen.getByRole('button', {name: /new missions/i}).click();
  });
  expect(await screen.findByText(/using offline missions/i)).toBeInTheDocument();
  expect(await screen.findAllByRole('button', {name: /delete mission/i})).toHaveLength(8);
  expect(screen.getByRole('button', {name: /retry swapi/i})).toBeInTheDocument();
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
