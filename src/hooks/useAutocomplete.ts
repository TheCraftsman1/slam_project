import { useState, useEffect, useMemo, useCallback } from 'react';
import type { IareCollegeData } from '../types';

export type SearchResultType = 'city' | 'building' | 'address' | 'coordinates' | 'recent' | 'suggested';

export interface SearchSuggestion {
  id: string;
  type: SearchResultType;
  primaryText: string;
  secondaryText: string;
  lat?: number;
  lng?: number;
  placeId?: string;
  icon?: string;
}

const RECENT_SEARCHES_KEY = 'ecosense_recent_searches';

export function useAutocomplete(query: string, iareCollege?: IareCollegeData, isLoaded?: boolean) {
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [recentSearches, setRecentSearches] = useState<SearchSuggestion[]>([]);
  
  const [autocompleteService, setAutocompleteService] = useState<google.maps.places.AutocompleteService | null>(null);

  useEffect(() => {
    if (isLoaded && window.google?.maps?.places) {
      if (!autocompleteService) {
        setAutocompleteService(new window.google.maps.places.AutocompleteService());
      }
    }
  }, [isLoaded, autocompleteService]);

  // Load recent searches
  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (stored) {
        setRecentSearches(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to load recent searches');
    }
  }, []);

  const addRecentSearch = useCallback((suggestion: SearchSuggestion) => {
    setRecentSearches((prev) => {
      const filtered = prev.filter(s => s.id !== suggestion.id);
      const updated = [suggestion, ...filtered].slice(0, 5); // Keep max 5
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Fetch suggestions
  useEffect(() => {
    if (!query || query.length < 2) {
      setSuggestions(recentSearches.slice(0, 6)); // default to recents
      return;
    }

    const currentQuery = query.toLowerCase();
    const newSuggestions: SearchSuggestion[] = [];

    // 1. Check coordinates
    const coordMatch = query.match(/^(-?\d+(\.\d+)?),\s*(-?\d+(\.\d+)?)$/);
    if (coordMatch) {
      newSuggestions.push({
        id: `coord-${query}`,
        type: 'coordinates',
        primaryText: query,
        secondaryText: 'Custom location',
        lat: parseFloat(coordMatch[1]),
        lng: parseFloat(coordMatch[3])
      });
    }

    // 2. Fuzzy match IARE buildings
    if (iareCollege) {
      const matchedBuildings = iareCollege.buildings.filter(b => {
        const bName = b.name.toLowerCase();
        const shortName = bName.split(' ').map(w => w[0]).join('');
        return bName.includes(currentQuery) || 
               shortName.includes(currentQuery) ||
               (currentQuery.includes('iare') && bName.includes(currentQuery.replace('iare','').trim()));
      });

      matchedBuildings.forEach(b => {
        newSuggestions.push({
          id: `building-${b.name}`,
          type: 'building',
          primaryText: b.name,
          secondaryText: 'IARE Campus',
          lat: b.lat,
          lng: b.lng
        });
      });
    }

    // 3. Google Places API
    if (autocompleteService) {
      // we only ask if we care about autocomplete
      autocompleteService.getPlacePredictions(
        { input: query, types: ['geocode', 'establishment'] },
        (predictions, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
            const placesSuggestions: SearchSuggestion[] = predictions.map(p => {
              const isCity = p.types.includes('locality') || p.types.includes('administrative_area_level_3');
              return {
                id: p.place_id,
                type: isCity ? 'city' : 'address',
                primaryText: p.structured_formatting.main_text,
                secondaryText: p.structured_formatting.secondary_text,
                placeId: p.place_id
              };
            });
            
            const merged = [...newSuggestions, ...placesSuggestions].slice(0, 6);
            setSuggestions(merged);
          } else {
             setSuggestions(newSuggestions.slice(0, 6));
          }
        }
      );
    } else {
      setSuggestions(newSuggestions.slice(0, 6));
    }
  }, [query, iareCollege, autocompleteService, recentSearches]);

  return { suggestions, addRecentSearch, recentSearches };
}