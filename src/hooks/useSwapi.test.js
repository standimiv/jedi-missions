import {act, renderHook} from '@testing-library/react';
import {useSwapi} from './useSwapi';
import {SwapiClient} from '../utils/swapiClient';

jest.mock('../utils/swapiClient', () => ({
  SwapiClient: {
    getRandomItems: jest.fn(),
  },
}));

test('returns null and an error when SWAPI has no usable names', async () => {
  SwapiClient.getRandomItems.mockResolvedValue([]);

  const {result} = renderHook(() => useSwapi());
  let data;

  await act(async () => {
    data = await result.current.fetchRandomData();
  });

  expect(data).toBeNull();
  expect(result.current.error).toMatch(/no usable data/i);
  expect(result.current.isLoading).toBe(false);
});
