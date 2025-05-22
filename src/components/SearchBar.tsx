import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, X, Replace } from 'lucide-react';
import { useTodoContext } from '@/contexts/TodoContext';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

const SearchBar: React.FC = () => {
  const { searchQuery, setSearchQuery, clearSearch, replaceInTodos } = useTodoContext();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [inputValue, setInputValue] = React.useState('');
  const [replaceValue, setReplaceValue] = React.useState('');
  const [popoverOpen, setPopoverOpen] = React.useState(false);

  const handleClear = () => {
    clearSearch();
    setInputValue('');
    // Focus the input after clearing
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    
    // Only update the search query if the input has at least 3 characters
    // or if it's empty (to clear the search)
    if (value.length >= 3 || value.length === 0) {
      setSearchQuery(value);
    } else if (searchQuery) {
      // If we have fewer than 3 characters but had a previous search,
      // clear the search results
      setSearchQuery('');
    }
  };

  const handleReplaceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setReplaceValue(e.target.value);
  };

  const handleReplace = () => {
    if (searchQuery && searchQuery.length >= 3) {
      replaceInTodos(searchQuery, replaceValue);
      setPopoverOpen(false);
    }
  };

  const handleReplaceAll = () => {
    if (searchQuery && searchQuery.length >= 3) {
      replaceInTodos(searchQuery, replaceValue);
      setPopoverOpen(false);
    }
  };

  return (
    <div className="relative">
      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
        <Search className="h-4 w-4 text-muted-foreground" />
      </div>
      
      <Input
        ref={inputRef}
        type="text"
        placeholder="Search todos (min 3 characters)..."
        value={inputValue}
        onChange={handleInputChange}
        className="pl-10 pr-20"
      />
      
      <div className="absolute inset-y-0 right-0 flex items-center">
        {searchQuery && searchQuery.length >= 3 && (
          <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 mr-1"
                title="Replace"
              >
                <Replace className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-4">
              <div className="space-y-4">
                <h4 className="font-medium">Replace Text</h4>
                <div className="space-y-2">
                  <div className="grid gap-2">
                    <label htmlFor="search-text" className="text-sm font-medium">
                      Search for
                    </label>
                    <Input
                      id="search-text"
                      value={searchQuery}
                      readOnly
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid gap-2">
                    <label htmlFor="replace-text" className="text-sm font-medium">
                      Replace with
                    </label>
                    <Input
                      id="replace-text"
                      value={replaceValue}
                      onChange={handleReplaceChange}
                      className="col-span-3"
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setPopoverOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleReplaceAll}>
                    Replace All
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        )}
        
        {inputValue && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 mr-1"
            onClick={handleClear}
            title="Clear search"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default SearchBar;