import {useState, useEffect, useCallback} from 'react';
import {SwapiClient} from '../utils/swapiClient';
import {
  SwApiPerson,
  SwapiPlanet,
  SwapiStarship,
  SwapiSpecies
} from '../types/swapi';
import {TemplateData} from '../types/app';

// Hook state interface
interface SwapiHookState {
  data: TemplateData;
  isLoading: boolean;
  error: string | null;
}

// Hook for fetching random SWAPI data for task generation
export const useSwapi = () => {
  const [state, setState] = useState<SwapiHookState>({
    data: {
      people: [],
      planets: [],
      starships: [],
      species: [],
    },
    isLoading: false,
    error: null,
  });

  // Function to fetch random data from all resource types
  const fetchRandomData = useCallback(async () => {
    setState(prev => ({...prev, isLoading: true, error: null}));

    try {
      // Fetch random items from each resource type in parallel
      const [people, planets, starships, species] = await Promise.all([
        SwapiClient.getRandomItems<SwApiPerson>('people', 5),
        SwapiClient.getRandomItems<SwapiPlanet>('planets', 5),
        SwapiClient.getRandomItems<SwapiStarship>('starships', 5),
        SwapiClient.getRandomItems<SwapiSpecies>('species', 5),
      ]);

      // Extract just the names we need for templates
      const templateData: TemplateData = {
        people: people.map(person => person.name),
        planets: planets.map(planet => planet.name),
        starships: starships.map(ship => ship.name),
        species: species.map(species => species.name),
      };

      setState({
        data: templateData,
        isLoading: false,
        error: null,
      });

      console.log('SWAPI data fetched successfully:', templateData);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      console.error('Error fetching SWAPI data:', error);
    }
  }, []);

  // Function to retry fetching data
  const retry = useCallback(() => {
    fetchRandomData();
  }, [fetchRandomData]);

  // Function to clear current data
  const clearData = useCallback(() => {
    setState({
      data: {
        people: [],
        planets: [],
        starships: [],
        species: [],
      },
      isLoading: false,
      error: null,
    });
  }, []);

  return {
    // Current state
    data: state.data,
    isLoading: state.isLoading,
    error: state.error,

    // Actions
    fetchRandomData,
    retry,
    clearData,

    // Computed values
    hasData: Object.values(state.data).some(arr => arr && arr.length > 0),
    isEmpty: Object.values(state.data).every(arr => !arr || arr.length === 0),
  };
};

// Hook for fetching specific SWAPI resource
export const useSwapiResource = <T>(
  resourceType: 'people' | 'planets' | 'starships' | 'species',
  id: number | null
) => {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id === null) return;

    const fetchResource = async () => {
      setIsLoading(true);
      setError(null);

      try {
        let result: T;

        switch (resourceType) {
          case 'people':
            result = await SwapiClient.getPerson(id) as T;
            break;
          case 'planets':
            result = await SwapiClient.getPlanet(id) as T;
            break;
          case 'starships':
            result = await SwapiClient.getStarship(id) as T;
            break;
          case 'species':
            result = await SwapiClient.getSpeciesById(id) as T;
            break;
          default:
            throw new Error(`Unknown resource type: ${resourceType}`);
        }

        setData(result);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        setError(errorMessage);
        setData(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchResource();
  }, [resourceType, id]);

  return {data, isLoading, error};
};

export default useSwapi;