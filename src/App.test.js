import {render, screen} from '@testing-library/react';
import App from './App';

jest.mock('./hooks/useSwapi', () => {
  const fetchRandomData = () => Promise.resolve({
    people: ['Luke Skywalker'],
    planets: ['Tatooine'],
    starships: ['X-wing'],
    species: ['Human'],
  });

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
