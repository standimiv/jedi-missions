import axios, {AxiosResponse} from 'axios';
import {SwapiPaginatedResponse} from '../types/swapi';

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

interface CacheEntry<T = unknown> {
  data: T;
  timestamp: number;
}

// Simple in-memory cache to avoid repeat requests
const cache = new Map<string, CacheEntry>();
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

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
    return cacheEntry.data as T;
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
      while (pagesToLoad.size < extraPageCount && totalPages > 1) {
        pagesToLoad.add(Math.floor(Math.random() * (totalPages - 1)) + 2);
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
}

export default SwapiClient;