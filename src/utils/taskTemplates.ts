import {TaskTemplate, TaskDifficulty} from '../types/app';

// Task templates with SWAPI data placeholders
export const TASK_TEMPLATES: TaskTemplate[] = [
  // PADAWAN LEVEL TASKS (Easy)
  {
    id: 'padawan_1',
    template: 'Deliver supplies to {planet}',
    difficulty: 'padawan',
    requiredData: ['planets'],
  },
  {
    id: 'padawan_2',
    template: 'Meet with {character} for training',
    difficulty: 'padawan',
    requiredData: ['people'],
  },
  {
    id: 'padawan_3',
    template: 'Study the customs of the {species}',
    difficulty: 'padawan',
    requiredData: ['species'],
  },
  {
    id: 'padawan_4',
    template: 'Perform maintenance on {starship}',
    difficulty: 'padawan',
    requiredData: ['starships'],
  },
  {
    id: 'padawan_5',
    template: 'Meditate on the nature of the Force',
    difficulty: 'padawan',
    requiredData: [],
  },
  {
    id: 'padawan_6',
    template: 'Practice lightsaber forms with {character}',
    difficulty: 'padawan',
    requiredData: ['people'],
  },
  {
    id: 'padawan_7',
    template: 'Learn the history of {planet}',
    difficulty: 'padawan',
    requiredData: ['planets'],
  },

  // KNIGHT LEVEL TASKS (Medium)
  {
    id: 'knight_1',
    template: 'Negotiate peace between warring factions on {planet}',
    difficulty: 'knight',
    requiredData: ['planets'],
  },
  {
    id: 'knight_2',
    template: 'Escort {character} safely through hostile territory',
    difficulty: 'knight',
    requiredData: ['people'],
  },
  {
    id: 'knight_3',
    template: 'Investigate disturbances in the Force on {planet}',
    difficulty: 'knight',
    requiredData: ['planets'],
  },
  {
    id: 'knight_4',
    template: 'Defend {starship} from pirate attacks',
    difficulty: 'knight',
    requiredData: ['starships'],
  },
  {
    id: 'knight_5',
    template: 'Rescue {character} from Imperial custody',
    difficulty: 'knight',
    requiredData: ['people'],
  },
  {
    id: 'knight_6',
    template: 'Establish diplomatic relations with the {species}',
    difficulty: 'knight',
    requiredData: ['species'],
  },
  {
    id: 'knight_7',
    template: 'Recover stolen Republic intelligence from {planet}',
    difficulty: 'knight',
    requiredData: ['planets'],
  },
  {
    id: 'knight_8',
    template: 'Pilot {starship} through an asteroid field',
    difficulty: 'knight',
    requiredData: ['starships'],
  },

  // MASTER LEVEL TASKS (Hard)
  {
    id: 'master_1',
    template: 'Confront the dark side corruption spreading across {planet}',
    difficulty: 'master',
    requiredData: ['planets'],
  },
  {
    id: 'master_2',
    template: 'Turn {character} back from the path of the dark side',
    difficulty: 'master',
    requiredData: ['people'],
  },
  {
    id: 'master_3',
    template: 'Lead a fleet including {starship} against Sith forces',
    difficulty: 'master',
    requiredData: ['starships'],
  },
  {
    id: 'master_4',
    template: 'Prevent the extinction of the {species} race',
    difficulty: 'master',
    requiredData: ['species'],
  },
  {
    id: 'master_5',
    template: 'Destroy the Sith stronghold on {planet}',
    difficulty: 'master',
    requiredData: ['planets'],
  },
  {
    id: 'master_6',
    template: 'Defeat {character} in single combat to restore balance',
    difficulty: 'master',
    requiredData: ['people'],
  },
  {
    id: 'master_7',
    template: 'Uncover the ancient Sith artifacts hidden on {planet}',
    difficulty: 'master',
    requiredData: ['planets'],
  },
  {
    id: 'master_8',
    template: 'Command {starship} in the final battle against the Empire',
    difficulty: 'master',
    requiredData: ['starships'],
  },
  {
    id: 'master_9',
    template: 'Master the forbidden Force techniques of the {species}',
    difficulty: 'master',
    requiredData: ['species'],
  },
  {
    id: 'master_10',
    template: 'Restore balance to the Force across the galaxy',
    difficulty: 'master',
    requiredData: [],
  },
];

// Difficulty distribution for balanced task generation
export const DIFFICULTY_WEIGHTS = {
  padawan: 0.4,  // 40% easy tasks
  knight: 0.4,   // 40% medium tasks  
  master: 0.2,   // 20% hard tasks
};

// Get templates by difficulty level
export const getTemplatesByDifficulty = (difficulty: TaskDifficulty): TaskTemplate[] => {
  return TASK_TEMPLATES.filter(template => template.difficulty === difficulty);
};

// Get a random template by difficulty
export const getRandomTemplateByDifficulty = (difficulty: TaskDifficulty): TaskTemplate | null => {
  const templates = getTemplatesByDifficulty(difficulty);
  if (templates.length === 0) return null;

  const randomIndex = Math.floor(Math.random() * templates.length);
  return templates[randomIndex];
};

// Get a completely random template
export const getRandomTemplate = (): TaskTemplate => {
  const randomIndex = Math.floor(Math.random() * TASK_TEMPLATES.length);
  return TASK_TEMPLATES[randomIndex];
};

// Get random difficulty based on weights
export const getRandomDifficulty = (): TaskDifficulty => {
  const random = Math.random();

  if (random < DIFFICULTY_WEIGHTS.padawan) {
    return 'padawan';
  } else if (random < DIFFICULTY_WEIGHTS.padawan + DIFFICULTY_WEIGHTS.knight) {
    return 'knight';
  } else {
    return 'master';
  }
};

// Validate template data requirements
export const validateTemplateData = (template: TaskTemplate, availableData: string[]): boolean => {
  return template.requiredData.every(dataType => {
    // Templates without data requirements are always valid
    if (template.requiredData.length === 0) return true;

    // Check if we have data for this type
    return availableData.length > 0;
  });
};

export default TASK_TEMPLATES;