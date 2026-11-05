import {act, render, screen, waitFor} from '@testing-library/react';
import App from './App';

const swapi = {
  names: {
    people: ['Luke Skywalker'],
    planets: ['Tatooine'],
    starships: ['X-wing'],
    species: ['Human'],
  },
};

jest.mock('./hooks/useSwapi', () => {
  const fetchRandomData = () => Promise.resolve(swapi.names);

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

test('renders Jedi Missions heading', async () => {
  render(<App />);
  expect(screen.getByRole('heading', {name: /jedi missions/i})).toBeInTheDocument();
  expect((await screen.findAllByText(/Luke Skywalker/)).length).toBeGreaterThan(0);
});

test('shows mission control when loaded', async () => {
  render(<App />);
  expect(screen.getByRole('heading', {name: /mission control/i})).toBeInTheDocument();
  expect((await screen.findAllByText(/Tatooine/)).length).toBeGreaterThan(0);
});

test('failed refresh fills offline missions when the list is empty', async () => {
  const liveNames = swapi.names;
  render(<App />);

  const abandonButtons = await screen.findAllByRole('button', {name: /delete mission/i});
  act(() => {
    abandonButtons.forEach((button) => button.click());
  });

  await waitFor(() => {
    expect(screen.queryByRole('button', {name: /delete mission/i})).not.toBeInTheDocument();
  });

  swapi.names = null;
  try {
    act(() => {
      screen.getByRole('button', {name: /new missions/i}).click();
    });
    expect(await screen.findByText(/using offline missions/i)).toBeInTheDocument();
    expect(await screen.findAllByRole('button', {name: /delete mission/i})).toHaveLength(8);
  } finally {
    swapi.names = liveNames;
  }
});
