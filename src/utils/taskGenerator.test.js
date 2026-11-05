import {populateTemplate, generateFallbackTasks} from './taskGenerator';

test('populateTemplate replaces the first occurrence of each placeholder', () => {
  const result = populateTemplate(
    {
      id: 'test',
      template: 'Visit {planet}, then return to {planet}',
      difficulty: 'padawan',
      requiredData: ['planets'],
    },
    {planets: ['Tatooine', 'Hoth']}
  );

  expect(result).toMatch(/^Visit (Tatooine|Hoth), then return to \{planet\}$/);
});

test('generateFallbackTasks returns offline missions', () => {
  const tasks = generateFallbackTasks(5);
  expect(tasks.length).toBeGreaterThan(0);
  expect(tasks.length).toBeLessThanOrEqual(5);
  expect(tasks.every(task => task.text.length > 0)).toBe(true);
  expect(tasks.every(task => !task.text.includes('{'))).toBe(true);
});

test('generateFallbackTasks fills the offline set of eight', () => {
  const tasks = generateFallbackTasks(8);
  expect(tasks).toHaveLength(8);
  expect(tasks.every(task => !task.text.includes('{'))).toBe(true);
});
