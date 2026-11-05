import {useEffect} from 'react';
import {render, screen} from '@testing-library/react';
import {TodoProvider, useTodoContext} from '../context/TodoContext';
import {STORAGE_KEY} from '../utils/storage';
import TodoList from './TodoList';

beforeEach(() => {
  localStorage.clear();
});

test('renders saved missions instead of the offline error', () => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    todos: [{
      id: 'live',
      text: 'Deliver the plans',
      completed: false,
      difficulty: 'knight',
      createdAt: '2026-02-01T00:00:00.000Z',
    }],
    journal: [],
    templates: [],
  }));

  render(
    <TodoProvider>
      <TodoList />
    </TodoProvider>
  );

  expect(screen.getByText('Deliver the plans')).toBeInTheDocument();
  expect(screen.queryByText(/disturbance in the force/i)).not.toBeInTheDocument();
  expect(screen.getByRole('searchbox', {name: /search missions/i})).toBeInTheDocument();
});

const OfflineSeed = ({children}) => {
  const {setError} = useTodoContext();
  useEffect(() => {
    setError('Using offline missions. Star Wars data unavailable.');
  }, [setError]);
  return children;
};

test('offers retry when the offline list could not be loaded', async () => {
  const onRetry = jest.fn();

  render(
    <TodoProvider>
      <OfflineSeed>
        <TodoList onRetry={onRetry} />
      </OfflineSeed>
    </TodoProvider>
  );

  const retry = await screen.findByRole('button', {name: /try again/i});
  retry.click();
  expect(onRetry).toHaveBeenCalledTimes(1);
  expect(screen.getByText(/using offline missions/i)).toBeInTheDocument();
});
