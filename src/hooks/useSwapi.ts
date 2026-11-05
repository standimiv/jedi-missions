import {useState, useCallback} from 'react';
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
  const fetchRandomData = useCallback(async (): Promise<TemplateData | null> => {
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
        species: species.map(speciesItem => speciesItem.name),
      };

      const hasAnyNames = Object.values(templateData).some(
        names => names && names.length > 0
      );

      setState({
        data: templateData,
        isLoading: false,
        error: hasAnyNames ? null : 'No usable data returned from SWAPI',
      });

      return hasAnyNames ? templateData : null;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      console.error('Error fetching SWAPI data:', error);
      return null;
    }
  }, []);

  return {
    data: state.data,
    isLoading: state.isLoading,
    error: state.error,
    fetchRandomData,
  };
};

export default useSwapi;