// SWAPI Base Types
export interface SwapiResource {
  created: string;
  edited: string;
  url: string;
}

// SWAPI Person/Character
export interface SwApiPerson extends SwapiResource {
  name: string;
  height: string;
  mass: string;
  hair_color: string;
  skin_color: string;
  eye_color: string;
  birth_year: string;
  gender: string;
  homeworld: string;
  films: string[];
  species: string[];
  vehicles: string[];
  starships: string[];
}

// SWAPI Planet
export interface SwapiPlanet extends SwapiResource {
  name: string;
  rotation_period: string;
  orbital_period: string;
  diameter: string;
  climate: string;
  gravity: string;
  terrain: string;
  surface_water: string;
  population: string;
  residents: string[];
  films: string[];
}

// SWAPI Starship
export interface SwapiStarship extends SwapiResource {
  name: string;
  model: string;
  manufacturer: string;
  cost_in_credits: string;
  length: string;
  max_atmosphering_speed: string;
  crew: string;
  passengers: string;
  cargo_capacity: string;
  consumables: string;
  hyperdrive_rating: string;
  MGLT: string;
  starship_class: string;
  pilots: string[];
  films: string[];
}

// SWAPI Species
export interface SwapiSpecies extends SwapiResource {
  name: string;
  classification: string;
  designation: string;
  average_height: string;
  skin_colors: string;
  hair_colors: string;
  eye_colors: string;
  average_lifespan: string;
  homeworld: string | null;
  language: string;
  people: string[];
  films: string[];
}

// SWAPI Paginated Response
export interface SwapiPaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// Union type for all SWAPI resources
export type SwapiResourceType = SwApiPerson | SwapiPlanet | SwapiStarship | SwapiSpecies;