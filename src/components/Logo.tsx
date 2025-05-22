import React from 'react';
import { CheckSquare } from 'lucide-react';

const Logo: React.FC = () => {
  return (
    <div className="flex items-center gap-2">
      <CheckSquare className="h-6 w-6 text-primary" />
      <div className="text-xl font-bold">MindMyTodos</div>
    </div>
  );
};

export default Logo;