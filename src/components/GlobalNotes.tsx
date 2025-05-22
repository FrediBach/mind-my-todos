import React, { useState } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronDown, ChevronRight, Edit, Save } from 'lucide-react';
import { HighlightedMarkdown } from './HighlightedMarkdown';
import { truncateString } from '@/util/string';

interface GlobalNotesProps {
  notes: string;
  onNotesChange: (notes: string) => void;
}

const GlobalNotes: React.FC<GlobalNotesProps> = ({ notes, onNotesChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedNotes, setEditedNotes] = useState(notes);

  const handleSave = () => {
    onNotesChange(editedNotes);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedNotes(notes);
    setIsEditing(false);
  };

  return (
    <Card className="w-full mb-4 mt-4">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Button 
            variant="ghost" 
            className="w-full flex justify-between items-center p-3 h-auto"
          >
            <div className="font-medium flex items-center gap-1 overflow-hidden">
              <span>
                {notes ? 'Global Notes' : 'Add Global Notes (Markdown supported)'}
              </span>
              {!isOpen && notes && (
                <>
                  <span className="mx-1 text-muted-foreground">-</span>
                  <span className="text-muted-foreground text-sm overflow-hidden">
                    <HighlightedMarkdown 
                      text={truncateString(notes.replace(/\n/g, ' '), 20)} 
                      inline={true} 
                      className="max-w-[200px] overflow-hidden"
                    />
                  </span>
                </>
              )}
            </div>
            {isOpen ? <ChevronDown className="h-4 w-4 flex-shrink-0" /> : <ChevronRight className="h-4 w-4 flex-shrink-0" />}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-2">
            {isEditing ? (
              <div className="space-y-2">
                <Textarea
                  value={editedNotes}
                  onChange={(e) => setEditedNotes(e.target.value)}
                  placeholder="Add notes, links, or any information in Markdown format..."
                  className="min-h-[150px] w-full"
                />
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={handleCancel}>
                    Cancel
                  </Button>
                  <Button onClick={handleSave}>
                    <Save className="mr-2 h-4 w-4" />
                    Save
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {notes ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <HighlightedMarkdown text={notes} fullMarkdown={true} />
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">
                    No global notes added yet. Click edit to add information, links, or descriptions.
                  </p>
                )}
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setIsEditing(true)}
                  className="mt-2"
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Button>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

export default GlobalNotes;