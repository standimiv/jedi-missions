import {Todo, TaskTemplate, TemplateData, SwapiDataType} from '../types/app';
import {TASK_TEMPLATES} from './taskTemplates';

// Generate a unique ID for tasks
export const generateTaskId = (): string => {
  return `task_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
};

// Replace template placeholders with actual SWAPI data
const pickRandom = (items: string[]): string =>
  items[Math.floor(Math.random() * items.length)];

const replaceAllPlaceholder = (
  text: string,
  placeholder: string,
  items: string[] | undefined
): string => {
  if (!items || items.length === 0) {
    return text;
  }
  let result = text;
  while (result.includes(placeholder)) {
    result = result.replace(placeholder, pickRandom(items));
  }
  return result;
};

export const populateTemplate = (template: TaskTemplate, swapiData: TemplateData): string => {
  let populatedText = template.template;
  populatedText = replaceAllPlaceholder(populatedText, '{character}', swapiData.people);
  populatedText = replaceAllPlaceholder(populatedText, '{planet}', swapiData.planets);
  populatedText = replaceAllPlaceholder(populatedText, '{starship}', swapiData.starships);
  populatedText = replaceAllPlaceholder(populatedText, '{species}', swapiData.species);
  return populatedText;
};

// Check if we have the required data for a template
export const hasRequiredData = (template: TaskTemplate, swapiData: TemplateData): boolean => {
  // Templates without requirements are always valid
  if (template.requiredData.length === 0) {
    return true;
  }

  // Check each required data type
  return template.requiredData.every((dataType: SwapiDataType) => {
    switch (dataType) {
      case 'people':
        return swapiData.people && swapiData.people.length > 0;
      case 'planets':
        return swapiData.planets && swapiData.planets.length > 0;
      case 'starships':
        return swapiData.starships && swapiData.starships.length > 0;
      case 'species':
        return swapiData.species && swapiData.species.length > 0;
      default:
        return false;
    }
  });
};

// Get available templates based on current SWAPI data
export const getAvailableTemplates = (swapiData: TemplateData): TaskTemplate[] => {
  return TASK_TEMPLATES.filter(template => hasRequiredData(template, swapiData));
};

// Generate a single task
export const generateSingleTask = (swapiData: TemplateData, usedTemplateIds: Set<string> = new Set()): Todo | null => {
  const availableTemplates = getAvailableTemplates(swapiData);

  // Filter out already used templates to avoid duplicates
  const unusedTemplates = availableTemplates.filter(template => !usedTemplateIds.has(template.id));

  // If all templates are used, fall back to available templates
  const templatesToUse = unusedTemplates.length > 0 ? unusedTemplates : availableTemplates;

  if (templatesToUse.length === 0) {
    console.warn('No available templates for current SWAPI data');
    return null;
  }

  // Select random template
  const randomTemplate = templatesToUse[Math.floor(Math.random() * templatesToUse.length)];

  // Populate template with SWAPI data
  const populatedText = populateTemplate(randomTemplate, swapiData);

  // Create the todo item
  const todo: Todo = {
    id: generateTaskId(),
    text: populatedText,
    completed: false,
    difficulty: randomTemplate.difficulty,
    createdAt: new Date(),
  };

  return todo;
};

// Generate multiple tasks with balanced difficulty distribution
export const generateTasks = (
  swapiData: TemplateData,
  count: number = 10,
  ensureBalance: boolean = true
): Todo[] => {
  const tasks: Todo[] = [];
  const usedTemplateIds = new Set<string>();

  if (ensureBalance) {
    // Calculate how many tasks of each difficulty we want
    const padawanCount = Math.floor(count * 0.4); // 40%
    const knightCount = Math.floor(count * 0.4);  // 40%
    const masterCount = count - padawanCount - knightCount; // Remaining (≈20%)

    // Generate tasks for each difficulty level
    const generateForDifficulty = (difficulty: 'padawan' | 'knight' | 'master', targetCount: number) => {
      const availableTemplates = TASK_TEMPLATES.filter(
        template => template.difficulty === difficulty && hasRequiredData(template, swapiData)
      );

      for (let i = 0; i < targetCount && availableTemplates.length > 0; i++) {
        // Find unused templates for this difficulty
        const unusedTemplates = availableTemplates.filter(template => !usedTemplateIds.has(template.id));
        const templatesToUse = unusedTemplates.length > 0 ? unusedTemplates : availableTemplates;

        const randomTemplate = templatesToUse[Math.floor(Math.random() * templatesToUse.length)];
        const populatedText = populateTemplate(randomTemplate, swapiData);

        const task: Todo = {
          id: generateTaskId(),
          text: populatedText,
          completed: false,
          difficulty: randomTemplate.difficulty,
          createdAt: new Date(),
        };

        tasks.push(task);
        usedTemplateIds.add(randomTemplate.id);
      }
    };

    // Generate balanced tasks
    generateForDifficulty('padawan', padawanCount);
    generateForDifficulty('knight', knightCount);
    generateForDifficulty('master', masterCount);
  } else {
    // Generate tasks with random difficulties
    for (let i = 0; i < count; i++) {
      const task = generateSingleTask(swapiData, usedTemplateIds);
      if (task) {
        tasks.push(task);
        // Find which template was used and mark it
        const usedTemplate = TASK_TEMPLATES.find(template =>
          populateTemplate(template, swapiData) === task.text
        );
        if (usedTemplate) {
          usedTemplateIds.add(usedTemplate.id);
        }
      }
    }
  }

  // Shuffle the tasks to mix difficulties
  return shuffleArray(tasks);
};

// Fallback task generation when SWAPI data is not available
export const generateFallbackTasks = (count: number = 10): Todo[] => {
  const fallbackTemplates = TASK_TEMPLATES.filter(template => template.requiredData.length === 0);
  const tasks: Todo[] = [];

  for (let i = 0; i < Math.min(count, fallbackTemplates.length); i++) {
    const template = fallbackTemplates[i];
    const task: Todo = {
      id: generateTaskId(),
      text: template.template,
      completed: false,
      difficulty: template.difficulty,
      createdAt: new Date(),
    };
    tasks.push(task);
  }

  return shuffleArray(tasks);
};

// Utility function to shuffle an array
export const shuffleArray = <T>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// Generate a custom task (for manual task creation)
export const generateCustomTask = (text: string, difficulty: 'padawan' | 'knight' | 'master' = 'knight'): Todo => {
  return {
    id: generateTaskId(),
    text: text.trim(),
    completed: false,
    difficulty,
    createdAt: new Date(),
  };
};

// Get task statistics for debugging/analytics
export const getTaskStats = (tasks: Todo[]) => {
  const total = tasks.length;
  const completed = tasks.filter(task => task.completed).length;
  const byDifficulty = {
    padawan: tasks.filter(task => task.difficulty === 'padawan').length,
    knight: tasks.filter(task => task.difficulty === 'knight').length,
    master: tasks.filter(task => task.difficulty === 'master').length,
  };

  return {
    total,
    completed,
    remaining: total - completed,
    completionRate: total > 0 ? (completed / total) * 100 : 0,
    byDifficulty,
  };
};

const taskGenerator = {
  generateTasks,
  generateSingleTask,
  generateFallbackTasks,
  generateCustomTask,
  getTaskStats,
};

export default taskGenerator;