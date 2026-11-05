import {populateTemplate, generateFallbackTasks} from './taskGenerator';

test('populateTemplate replaces every placeholder occurrence', () => {
  const result = populateTemplate(
    {
      id: 'test',
      template: 'Visit {planet}, then return to {planet}',
      difficulty: 'padawan',
      requiredData: ['planets'],
    },
    {planets: ['Tatooine', 'Hoth']}
  );

  expect(result).not.toMatch(/\{planet\}/);
  expect(result).toMatch(/Visit .+, then return to .+/);
});

test('generateFallbackTasks returns offline missions', () => {
  const tasks = generateFallbackTasks(5);
  expect(tasks.length).toBeGreaterThan(0);
  expect(tasks.length).toBeLessThanOrEqual(5);
  expect(tasks.every(task => task.text.length > 0)).toBe(true);
});
