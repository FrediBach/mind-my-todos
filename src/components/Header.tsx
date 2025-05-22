import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Logo from './Logo';
import { ThemeToggle } from './ThemeToggle';
import { TextSizeToggle } from './TextSizeToggle';
import { TimerControls } from './TimerControls';
import HelpDialog from './HelpDialog';
import ConfigDialog from './ConfigDialog';
import { CheckSquare, Clock, MessageSquare, Sparkles, FileUp, FileDown, Search } from 'lucide-react';

interface HeaderProps {
  onOpenTimeCalendar?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onOpenTimeCalendar }) => {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  
  // Only render TimerControls on client-side to avoid SSR issues
  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <div className="w-full">
      <div className="flex flex-col container mx-auto max-w-[1024px]">
        <div className="flex justify-between items-center py-4 px-4 sm:px-6 lg:px-8">
          <div className="cursor-pointer" onClick={() => router.push("/")}>
            <Logo />
          </div>
          <div className="flex items-center gap-4">
            {isMounted && <TimerControls onOpenCalendar={onOpenTimeCalendar} />}
            <TextSizeToggle />
            <div className="ml-1">
              <ThemeToggle />
            </div>
            <div className="ml-2">
              <ConfigDialog />
            </div>
            <div className="ml-2">
              <HelpDialog />
            </div>
          </div>
        </div>
        
        {/* App description below all header elements */}
        <div className="text-sm text-muted-foreground px-4 sm:px-6 lg:px-8 pb-4">
          <div className="w-full space-y-3">
            <div className="flex flex-wrap gap-x-6 gap-y-2 mb-1">
              <div className="flex items-center gap-1">
                <CheckSquare size={16} className="flex-shrink-0" />
                <span>Nested todos</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock size={16} className="flex-shrink-0" />
                <span>Time tracking</span>
              </div>
              <div className="flex items-center gap-1">
                <MessageSquare size={16} className="flex-shrink-0" />
                <span>Markdown</span>
              </div>
              <div className="flex items-center gap-1">
                <Sparkles size={16} className="flex-shrink-0 text-purple-500" />
                <span>AI assistance</span>
              </div>
              <div className="flex items-center gap-1">
                <FileUp size={16} className="flex-shrink-0" />
                <FileDown size={16} className="flex-shrink-0" />
                <span>Import/Export</span>
              </div>
              <div className="flex items-center gap-1">
                <Search size={16} className="flex-shrink-0" />
                <span>Search & Replace</span>
              </div>
            </div>
            <p>
              Organize tasks with drag-and-drop functionality, colored notes, automatic local storage, 
              undo/redo history, keyboard shortcuts, emoticon conversion, and comprehensive time tracking with detailed reports.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;