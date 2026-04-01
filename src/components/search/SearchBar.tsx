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
  const iconClass = "w-4 h-4";
  switch (type) {
    case 'city': return <MapPin className={`text-blue-400 ${iconClass}`} />;
    case 'building': return <Building2 className={`text-emerald-400 ${iconClass}`} />;
    case 'address': return <MapPin className={`text-orange-400 ${iconClass}`} />;
    case 'coordinates': return <Crosshair className={`text-purple-400 ${iconClass}`} />;
    case 'recent': return <Clock className={`text-slate-400 ${iconClass}`} />;
    default: return <Navigation className={`text-slate-400 ${iconClass}`} />;
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
    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      onSearchQueryChange(transcript);
      if (onSearch) {
        onSearch({ preventDefault: () => {} } as React.FormEvent);
      }
      setIsListening(false);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
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
        className={`bg-card flex items-center px-4 py-3 shadow-sm border border-border-subtle transition-all duration-250 ${
          showDropdown ? 'rounded-t-2xl rounded-b-none' : 'rounded-2xl'
        } ${
          isFocused ? 'border-accent shadow-minimal' : ''
        }`}
      >
        {isSearching ? (
          <Loader2 className="text-accent mr-3 animate-spin flex-shrink-0" size={18} />
        ) : (
          <Search className="text-slate-500 mr-3 flex-shrink-0" size={18} />
        )}
        <input
          className="bg-transparent border-none focus:outline-none text-text-main placeholder:text-text-sub w-full text-[13px] font-medium"
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
            className="text-text-sub hover:text-text-main mr-2 transition-colors flex-shrink-0 active:scale-90"
          >
            <X size={15} />
          </button>
        )}
        <button type="button" onClick={handleVoiceSearch} className="focus:outline-none flex-shrink-0 ml-1">
          {isListening ? (
            <span className="relative flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
              <span className="relative inline-flex rounded-full h-4 w-4 bg-accent" />
            </span>
          ) : (
            <Mic className="text-text-sub cursor-pointer hover:text-accent transition-colors" size={17} />
          )}
        </button>
      </form>

      {/* ── Autocomplete Dropdown ── */}
      <AnimatePresence>
        {showDropdown && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 w-full bg-card rounded-b-2xl overflow-hidden shadow-minimal border border-border-subtle z-50 border-t-0"
          >
            <div className="max-h-80 overflow-y-auto">
              {suggestions.length > 0 ? (
                suggestions.map((suggestion, index) => (
                  <button
                    key={`${suggestion.id}-${index}`}
                    type="button"
                    onClick={() => handleSelect(suggestion)}
                    className="w-full px-4 py-3 flex items-center gap-3 hover:bg-surface transition-colors text-left border-b border-border-subtle last:border-none group"
                  >
                    <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-surface flex items-center justify-center group-hover:bg-border-subtle transition-colors">
                      <ResultIcon type={suggestion.type} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-medium text-text-main truncate">
                        {suggestion.primaryText}
                      </div>
                      <div className="text-[11px] text-text-sub truncate">
                        {suggestion.secondaryText}
                      </div>
                    </div>
                  </button>
                ))
              ) : (
                <div className="px-6 py-10 flex flex-col items-center justify-center text-center">
                  <div className="w-11 h-11 rounded-2xl bg-surface flex items-center justify-center mb-3">
                    <Search className="text-text-sub" size={18} />
                  </div>
                  <p className="text-[13px] font-medium text-text-main">No results for "{searchQuery}"</p>
                  <p className="text-[11px] text-text-sub mt-1">Check for typos or try different keywords.</p>
                </div>
              )}
            </div>
            
            {!searchQuery && suggestions.some(s => s.type === 'recent') && (
              <div className="px-4 py-2 bg-surface text-[9px] uppercase font-bold tracking-[0.16em] text-text-sub">
                Recent Searches
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
