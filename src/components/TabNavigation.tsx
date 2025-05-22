import React, { useState } from 'react';
import { useTodoLists, TodoList } from '@/contexts/TodoListsContext';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Plus, X, Edit, Check, Archive, ArchiveRestore, ChevronRight, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

export function TabNavigation() {
  const { 
    lists, 
    activeListId, 
    setActiveListId, 
    addList, 
    removeList, 
    renameList, 
    getListProgress, 
    getActiveLists, 
    getArchivedLists,
    archiveList,
    unarchiveList
  } = useTodoLists();
  
  const [editingTabId, setEditingTabId] = useState<string | null>(null);
  const [editingTabName, setEditingTabName] = useState<string>('');
  const [isAddingTab, setIsAddingTab] = useState<boolean>(false);
  const [newTabName, setNewTabName] = useState<string>('');
  const [isArchiveOpen, setIsArchiveOpen] = useState<boolean>(false);
  
  const activeLists = getActiveLists();
  const archivedLists = getArchivedLists();

  // Start editing a tab name
  const startEditingTab = (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingTabId(id);
    setEditingTabName(name);
  };

  // Save the edited tab name
  const saveEditedTabName = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (editingTabId && editingTabName.trim()) {
      renameList(editingTabId, editingTabName.trim());
      setEditingTabId(null);
      setEditingTabName('');
    }
  };

  // Cancel editing
  const cancelEditing = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingTabId(null);
    setEditingTabName('');
  };

  // Start adding a new tab
  const startAddingTab = () => {
    setIsAddingTab(true);
    setNewTabName('');
  };

  // Save the new tab
  const saveNewTab = () => {
    if (newTabName.trim()) {
      addList(newTabName.trim());
      setIsAddingTab(false);
      setNewTabName('');
    }
  };

  // Cancel adding a new tab
  const cancelAddingTab = () => {
    setIsAddingTab(false);
    setNewTabName('');
  };

  // Handle removing a list
  const handleRemoveList = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    removeList(id);
  };
  
  // Handle archiving a list
  const handleArchiveList = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    archiveList(id);
  };
  
  // Handle unarchiving a list
  const handleUnarchiveList = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    unarchiveList(id);
  };

  // Handle key press events for editing and adding tabs
  const handleKeyPress = (e: React.KeyboardEvent, action: 'edit' | 'add') => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (action === 'edit') {
        saveEditedTabName();
      } else {
        saveNewTab();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      if (action === 'edit') {
        cancelEditing();
      } else {
        cancelAddingTab();
      }
    }
  };
  
  // Render a tab for a list
  const renderListTab = (list: TodoList, isArchived: boolean) => {
    const progress = getListProgress(list.id);
    const progressClass = progress === 100 
      ? 'progress-complete' 
      : progress >= 75 
        ? 'progress-high' 
        : progress >= 40 
          ? 'progress-medium' 
          : 'progress-low';

    return (
      <TabsTrigger 
        key={list.id} 
        value={list.id}
        className={cn(
          "flex-col items-start justify-start px-4 py-2 h-auto relative group",
          activeListId === list.id ? "relative" : ""
        )}
        disabled={editingTabId === list.id}
      >
        {editingTabId === list.id ? (
          <div className="flex items-center w-full" onClick={(e) => e.stopPropagation()}>
            <Input
              value={editingTabName}
              onChange={(e) => setEditingTabName(e.target.value)}
              onKeyDown={(e) => handleKeyPress(e, 'edit')}
              className="h-7 min-w-[120px]"
              autoFocus
            />
            <div className="flex items-center ml-2">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6" 
                onClick={(e) => saveEditedTabName(e)}
              >
                <Check className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6" 
                onClick={(e) => cancelEditing(e)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between w-full">
              <span className="truncate max-w-[150px]">{list.name}</span>
              <div className="flex items-center ml-2">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6 opacity-70 hover:opacity-100 transition-opacity" 
                  onClick={(e) => startEditingTab(list.id, list.name, e)}
                >
                  <Edit className="h-3 w-3" />
                </Button>
                
                {isArchived ? (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6 opacity-70 hover:opacity-100 transition-opacity" 
                    onClick={(e) => handleUnarchiveList(list.id, e)}
                  >
                    <ArchiveRestore className="h-3 w-3" />
                  </Button>
                ) : (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6 opacity-70 hover:opacity-100 transition-opacity" 
                    onClick={(e) => handleArchiveList(list.id, e)}
                  >
                    <Archive className="h-3 w-3" />
                  </Button>
                )}
                
                {activeLists.length > 1 || isArchived ? (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6 opacity-70 hover:opacity-100 transition-opacity" 
                    onClick={(e) => handleRemoveList(list.id, e)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                ) : null}
              </div>
            </div>
            <div className="w-full mt-1">
              <Progress value={progress} className={progressClass} />
            </div>
          </>
        )}
      </TabsTrigger>
    );
  };

  return (
    <div className="mb-6">
      <Tabs value={activeListId} onValueChange={setActiveListId} className="w-full">
        <div className="flex flex-col space-y-2 mb-2">
          {/* Active Lists */}
          <div className="flex items-center space-x-2">
            <TabsList className="flex-1 h-auto p-1 overflow-x-auto">
              {activeLists.map(list => renderListTab(list, false))}

              {isAddingTab ? (
                <div className="flex items-center px-3 py-1">
                  <Input
                    value={newTabName}
                    onChange={(e) => setNewTabName(e.target.value)}
                    onKeyDown={(e) => handleKeyPress(e, 'add')}
                    placeholder="New list name"
                    className="h-7 min-w-[120px]"
                    autoFocus
                  />
                  <div className="flex items-center ml-2">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6" 
                      onClick={saveNewTab}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6" 
                      onClick={cancelAddingTab}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-9 w-9" 
                  onClick={startAddingTab}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              )}
            </TabsList>
          </div>
          
          {/* Archived Lists */}
          {archivedLists.length > 0 && (
            <Collapsible
              open={isArchiveOpen}
              onOpenChange={setIsArchiveOpen}
              className="border rounded-md"
            >
              <CollapsibleTrigger asChild>
                <div className="flex items-center justify-between p-2 cursor-pointer hover:bg-muted">
                  <div className="flex items-center">
                    <Archive className="h-4 w-4 mr-2" />
                    <span className="text-sm font-medium">Archived Lists ({archivedLists.length})</span>
                  </div>
                  {isArchiveOpen ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <TabsList className="flex-1 h-auto p-1 overflow-x-auto w-full bg-transparent">
                  {archivedLists.map(list => renderListTab(list, true))}
                </TabsList>
              </CollapsibleContent>
            </Collapsible>
          )}
        </div>
      </Tabs>
    </div>
  );
}