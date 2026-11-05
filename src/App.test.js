import {render, screen} from '@testing-library/react';
import App from './App';

jest.mock('./hooks/useSwapi', () => {
  const fetchRandomData = jest.fn(() => Promise.resolve());
  return {
    useSwapi: () => ({
      data: {people: [], planets: [], starships: [], species: []},
      isLoading: false,
      error: null,
      fetchRandomData,
      hasData: false,
    }),
  };
});

jest.mock('./components/StarField', () => () => null);

test('renders Jedi Missions heading', () => {
  render(<App />);
  expect(screen.getByRole('heading', {name: /jedi missions/i})).toBeInTheDocument();
});

test('shows mission control when loaded', () => {
  render(<App />);
  expect(screen.getByRole('heading', {name: /mission control/i})).toBeInTheDocument();
});
