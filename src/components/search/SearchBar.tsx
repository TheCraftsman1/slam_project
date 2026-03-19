import React, { useState, useRef, useEffect } from 'react';
import { Search, Mic, X, Loader2, MapPin, Building2, Crosshair, Clock, Navigation } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAutocomplete, SearchSuggestion, SearchResultType } from '../../hooks';
import type { IareCollegeData } from '../../types';

interface SearchBarProps {
  searchQuery: string;
  isSearching: boolean;
  onSearchQueryChange: (query: string) => void;
  onSearch?: (e: React.FormEvent) => void;
  onClear: () => void;
  onSelectSuggestion?: (suggestion: SearchSuggestion) => void;
  iareCollege?: IareCollegeData;
  isMapLoaded?: boolean;
}

const ResultIcon = ({ type }: { type: SearchResultType }) => {
  switch (type) {
    case 'city': return <MapPin className="text-blue-400" size={16} />;
    case 'building': return <Building2 className="text-emerald-400" size={16} />;
    case 'address': return <MapPin className="text-orange-400" size={16} />;
    case 'coordinates': return <Crosshair className="text-purple-400" size={16} />;
    case 'recent': return <Clock className="text-slate-400" size={16} />;
    default: return <Navigation className="text-slate-400" size={16} />;
  }
};

export function SearchBar({
  searchQuery,
  isSearching,
  onSearchQueryChange,
  onSearch,
  onClear,
  onSelectSuggestion,
  iareCollege,
  isMapLoaded
}: SearchBarProps) {
  const [isFocused, setIsFocused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isListening, setIsListening] = useState(false);

  const { suggestions, addRecentSearch } = useAutocomplete(searchQuery, iareCollege, isMapLoaded);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (suggestion: SearchSuggestion) => {
    addRecentSearch(suggestion);
    onSearchQueryChange(suggestion.primaryText);
    setIsFocused(false);
    if (onSelectSuggestion) {
      onSelectSuggestion(suggestion);
    }
  };

  const handleVoiceSearch = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Voice search is not supported in your browser.');
      return;
    }
    
    // @ts-ignore
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.onstart = () => {
      setIsListening(true);
    };
    
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      onSearchQueryChange(transcript);
      if (onSearch) {
        // mock form submit
        onSearch({ preventDefault: () => {} } as React.FormEvent);
      }
      setIsListening(false);
    };
    
    recognition.onerror = () => {
      setIsListening(false);
    };
    
    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const showDropdown = isFocused && (suggestions.length > 0 || (searchQuery.length > 0 && !isSearching));

  return (
    <div ref={containerRef} className="relative flex-1">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setIsFocused(false);
          onSearch?.(e);
        }}
        className={`bg-[#141820]/95 backdrop-blur-2xl border border-white/[0.08] flex items-center px-4 py-3.5 shadow-2xl transition-all ${showDropdown ? 'rounded-t-2xl rounded-b-none' : 'rounded-2xl'} focus-within:border-blue-500/40 focus-within:shadow-[0_0_20px_rgba(59,130,246,0.1)]`}
      >
        {isSearching ? (
          <Loader2 className="text-blue-400 mr-3 animate-spin" size={18} />
        ) : (
          <Search className="text-slate-500 mr-3" size={18} />
        )}
        <input
          className="bg-transparent border-none focus:outline-none text-white placeholder:text-slate-500 w-full text-sm font-medium"
          placeholder="Search cities or IARE buildings..."
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchQueryChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => {
              onClear();
              setIsFocused(true);
            }}
            className="text-slate-400 hover:text-white mr-2 transition-colors"
          >
            <X size={16} />
          </button>
        )}
        <button type="button" onClick={handleVoiceSearch} className="focus:outline-none">
          {isListening ? (
            <span className="relative flex h-4 w-4 ml-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-blue-500"></span>
            </span>
          ) : (
            <Mic className="text-slate-500 ml-2 cursor-pointer hover:text-blue-400 transition-colors" size={18} />
          )}
        </button>
      </form>

      {/* Autocomplete Dropdown */}
      <AnimatePresence>
        {showDropdown && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 w-full bg-[#141820]/95 backdrop-blur-2xl border border-t-0 border-white/[0.08] rounded-b-2xl overflow-hidden shadow-2xl z-50 transform origin-top"
          >
            <div className="max-h-80 overflow-y-auto">
              {suggestions.length > 0 ? (
                suggestions.map((suggestion, index) => (
                  <button
                    key={`${suggestion.id}-${index}`}
                    type="button"
                    onClick={() => handleSelect(suggestion)}
                    className="w-full px-4 py-3 flex items-center gap-3 hover:bg-white/[0.05] transition-colors text-left border-b border-white/[0.02] last:border-none"
                  >
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-800/50 flex items-center justify-center">
                      <ResultIcon type={suggestion.type} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-white truncate">
                        {suggestion.primaryText}
                      </div>
                      <div className="text-xs text-slate-400 truncate">
                        {suggestion.secondaryText}
                      </div>
                    </div>
                  </button>
                ))
              ) : (
                <div className="px-6 py-10 flex flex-col items-center justify-center text-center">
                  <div className="w-12 h-12 rounded-full bg-white/[0.03] flex items-center justify-center mb-3">
                    <Search className="text-slate-600" size={20} />
                  </div>
                  <p className="text-sm font-medium text-slate-300">No results found for "{searchQuery}"</p>
                  <p className="text-xs text-slate-500 mt-1">Try check for typos or use different keywords.</p>
                </div>
              )}
            </div>
            
            {/* Footer indicator if showing recent */}
            {!searchQuery && suggestions.some(s => s.type === 'recent') && (
              <div className="px-4 py-2 bg-black/20 text-[10px] uppercase font-bold tracking-wider text-slate-500">
                Recent Searches
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
