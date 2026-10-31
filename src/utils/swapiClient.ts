import axios, {AxiosResponse} from 'axios';
import {
  SwApiPerson,
  SwapiPlanet,
  SwapiStarship,
  SwapiSpecies,
  SwapiPaginatedResponse
} from '../types/swapi';

// SWAPI base URL
const SWAPI_BASE_URL = 'https://swapi.py4e.com/api';

// Create axios instance with default config
const swapiApi = axios.create({
  baseURL: SWAPI_BASE_URL,
  timeout: 10000, // 10 second timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Simple in-memory cache to avoid repeat requests
const cache = new Map<string, any>();
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

interface CacheEntry {
  data: any;
  timestamp: number;
}

// Helper function to check if cache entry is still valid
const isCacheValid = (entry: CacheEntry): boolean => {
  return Date.now() - entry.timestamp < CACHE_DURATION;
};

// Generic function to fetch data with caching
const fetchWithCache = async <T>(url: string): Promise<T> => {
  // Check cache first
  const cacheEntry = cache.get(url);
  if (cacheEntry && isCacheValid(cacheEntry)) {
    console.log(`Cache hit for: ${url}`);
    return cacheEntry.data;
  }

  try {
    console.log(`Fetching from API: ${url}`);
    const response: AxiosResponse<T> = await swapiApi.get(url);

    // Store in cache
    cache.set(url, {
      data: response.data,
      timestamp: Date.now(),
    });

    return response.data;
  } catch (error) {
    console.error(`Error fetching ${url}:`, error);
    throw new Error(`Failed to fetch data from SWAPI: ${error}`);
  }
};

// SWAPI Client class
export class SwapiClient {
  // Fetch all people (paginated)
  static async getPeople(page: number = 1): Promise<SwapiPaginatedResponse<SwApiPerson>> {
    return fetchWithCache<SwapiPaginatedResponse<SwApiPerson>>(`/people/?page=${page}`);
  }

  // Fetch specific person by ID
  static async getPerson(id: number): Promise<SwApiPerson> {
    return fetchWithCache<SwApiPerson>(`/people/${id}/`);
  }

  // Fetch all planets (paginated)
  static async getPlanets(page: number = 1): Promise<SwapiPaginatedResponse<SwapiPlanet>> {
    return fetchWithCache<SwapiPaginatedResponse<SwapiPlanet>>(`/planets/?page=${page}`);
  }

  // Fetch specific planet by ID
  static async getPlanet(id: number): Promise<SwapiPlanet> {
    return fetchWithCache<SwapiPlanet>(`/planets/${id}/`);
  }

  // Fetch all starships (paginated)
  static async getStarships(page: number = 1): Promise<SwapiPaginatedResponse<SwapiStarship>> {
    return fetchWithCache<SwapiPaginatedResponse<SwapiStarship>>(`/starships/?page=${page}`);
  }

  // Fetch specific starship by ID
  static async getStarship(id: number): Promise<SwapiStarship> {
    return fetchWithCache<SwapiStarship>(`/starships/${id}/`);
  }

  // Fetch all species (paginated)
  static async getSpecies(page: number = 1): Promise<SwapiPaginatedResponse<SwapiSpecies>> {
    return fetchWithCache<SwapiPaginatedResponse<SwapiSpecies>>(`/species/?page=${page}`);
  }

  // Fetch specific species by ID
  static async getSpeciesById(id: number): Promise<SwapiSpecies> {
    return fetchWithCache<SwapiSpecies>(`/species/${id}/`);
  }

  // Utility method to get random items from a resource type
  static async getRandomItems<T extends {name: string}>(
    resourceType: 'people' | 'planets' | 'starships' | 'species',
    count: number = 5
  ): Promise<T[]> {
    try {
      const firstPage = await fetchWithCache<SwapiPaginatedResponse<T>>(
        `/${resourceType}/?page=1`
      );
      const pageSize = firstPage.results.length || 10;
      const totalPages = Math.max(1, Math.ceil(firstPage.count / pageSize));
      const pool: T[] = [...firstPage.results];

      const extraPageCount = Math.min(3, totalPages) - 1;
      const pagesToLoad = new Set<number>();
      while (pagesToLoad.size < extraPageCount) {
        pagesToLoad.add(Math.floor(Math.random() * totalPages) + 1);
      }

      for (const page of Array.from(pagesToLoad)) {
        if (page === 1) {
          continue;
        }
        const pageData = await fetchWithCache<SwapiPaginatedResponse<T>>(
          `/${resourceType}/?page=${page}`
        );
        pool.push(...pageData.results);
      }

      const shuffled = [...pool];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }

      return shuffled.slice(0, Math.min(count, shuffled.length));
    } catch (error) {
      console.error(`Error fetching random ${resourceType}:`, error);
      return [];
    }
  }

  // Clear cache (useful for testing or if we want fresh data)
  static clearCache(): void {
    cache.clear();
    console.log('SWAPI cache cleared');
  }

  // Get cache stats (useful for debugging)
  static getCacheStats(): {size: number; entries: string[]} {
    return {
      size: cache.size,
      entries: Array.from(cache.keys()),
    };
  }
}

export default SwapiClient;