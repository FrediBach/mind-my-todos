import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { HelpCircle, Plus, ChevronDown, ChevronRight, CheckSquare, Undo, Redo, Search, MessageSquare, Trash, Copy, FileUp, Scissors, Clock, Play, Pause, StopCircle, ArrowDownAZ, ArrowUpZA, Sparkles, FileDown, Lightbulb, Calendar, X, Pin, DollarSign, Timer, Link, ExternalLink, FileText, Ruler } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface HelpDialogProps {
  trigger?: React.ReactNode;
}

export const HelpDialog: React.FC<HelpDialogProps> = ({ 
  trigger = (
    <Button variant="ghost" size="icon" className="h-7 w-7">
      <HelpCircle size={16} />
    </Button>
  )
}) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Todoist Help</DialogTitle>
          <DialogDescription>
            Learn how to use all the features of Todoist
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Basic Features</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <Plus size={18} className="mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-medium">Add Todo</span> - Create a new todo item at the root level or as a child of another todo
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <CheckSquare size={18} className="mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-medium">Complete Todo</span> - Mark a todo as complete. When a parent todo is completed, all children are automatically completed
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <div className="flex gap-1 mt-0.5 flex-shrink-0">
                    <ChevronDown size={18} />
                    <ChevronRight size={18} />
                  </div>
                  <div>
                    <span className="font-medium">Expand/Collapse</span> - Expand or collapse a todo's children. Use the buttons in the toolbar to expand all, collapse all, or collapse completed todos
                  </div>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Advanced Features</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <div className="mt-0.5 flex-shrink-0">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div>
                    <span className="font-medium">Context Menu</span> - Right-click on any todo to access a menu with actions like delete, duplicate, add subtask, and more
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <MessageSquare size={18} className="mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-medium">Notes</span> - Add notes to any todo. Todos with notes show a speech bubble indicator. Notes support markdown formatting and can be colored (red, orange, green, or blue) for better organization
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <Trash size={18} className="mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-medium">Delete</span> - Remove a todo and all its children. The Clear All button (trash icon) in the toolbar removes all todos after confirmation
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <Copy size={18} className="mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-medium">Duplicate</span> - Create a copy of a todo and all its children
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <Scissors size={18} className="mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-medium">Split</span> - When editing a todo, split it at the cursor position into two separate todos
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 flex-shrink-0 text-lg">😊</span>
                  <div>
                    <span className="font-medium">Emoticons</span> - Text emoticons like :-) are automatically converted to emoji equivalents (😊) in todos and notes
                  </div>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Due Dates</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <Calendar size={18} className="mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-medium">Due Dates</span> - Add optional due dates to any todo by right-clicking and selecting "Add due date" from the context menu. When a parent todo is assigned a due date, all its children inherit the same date
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <div className="flex items-center gap-1 mt-0.5 flex-shrink-0">
                    <Calendar size={16} />
                    <span className="text-xs text-red-500">Tomorrow</span>
                  </div>
                  <div>
                    <span className="font-medium">Quick Date Selection</span> - Choose from common options like "Today", "Tomorrow", "Next week", or enter dates using natural language like "in 3 days" or "next month"
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <div className="flex items-center gap-1 mt-0.5 flex-shrink-0">
                    <Calendar size={16} />
                    <span className="text-xs text-yellow-500">In 5 days</span>
                  </div>
                  <div>
                    <span className="font-medium">Visual Warnings</span> - Due dates are color-coded based on urgency: red for imminent (0-1 days), orange for approaching (2-3 days), and yellow for upcoming (4-7 days)
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <div className="flex gap-1 mt-0.5 flex-shrink-0">
                    <Calendar size={16} />
                    <X size={16} />
                  </div>
                  <div>
                    <span className="font-medium">Future Dates Only</span> - The date picker prevents selecting dates in the past, ensuring all due dates are actionable
                  </div>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Time Tracking</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <Clock size={18} className="mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-medium">Time Tracking</span> - Track time spent on tasks. The timer is global and will be applied to the next todo you complete. Time is displayed next to todos that have tracked time
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <div className="flex gap-1 mt-0.5 flex-shrink-0">
                    <Play size={18} />
                    <Pause size={18} />
                  </div>
                  <div>
                    <span className="font-medium">Start/Pause Timer</span> - Start or pause the global timer. The timer will continue running until paused or stopped
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <StopCircle size={18} className="mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-medium">Stop Timer</span> - Stop the timer and reset it to zero. The accumulated time will be added to the next todo you complete
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <div className="flex items-center gap-1 mt-0.5 flex-shrink-0">
                    <Clock size={16} />
                    <span className="text-xs">00:05:30</span>
                  </div>
                  <div>
                    <span className="font-medium">Time Display</span> - Tracked time is displayed next to todos and in the list header. Parent todos show the cumulative time spent on them and all their nested children
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <div className="flex items-center gap-1 mt-0.5 flex-shrink-0">
                    <Clock size={16} />
                    <span className="text-xs">01:30:45</span>
                  </div>
                  <div>
                    <span className="font-medium">Cumulative Time</span> - For parent todos, hover over the time display to see both the total cumulative time (including all nested subtasks) and the time spent on the parent task itself
                  </div>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Pinned Todos</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <Pin size={18} className="mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-medium">Pin Important Todos</span> - Temporarily pin important todos to the top of your list for easier access. Pinned todos appear in a separate section at the top of your list
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <div className="flex items-center gap-1 mt-0.5 flex-shrink-0">
                    <Pin size={16} className="fill-primary text-primary" />
                    <span className="text-xs">→</span>
                    <span className="text-xs">Original</span>
                  </div>
                  <div>
                    <span className="font-medium">Linked References</span> - Pinned todos are not copies but references to the original todos. Any changes made to a pinned todo will be reflected in the original todo and vice versa
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <div className="flex gap-1 mt-0.5 flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5"></path>
                      <path d="M8.5 8.5v.01"></path>
                      <path d="M16 15.5v.01"></path>
                      <path d="M12 12v.01"></path>
                      <path d="M11 17v.01"></path>
                      <path d="M7 14v.01"></path>
                    </svg>
                    <Pin size={16} />
                  </div>
                  <div>
                    <span className="font-medium">Right-Click to Pin</span> - Pin or unpin a todo by right-clicking on it and selecting "Pin todo" or "Unpin todo" from the context menu
                  </div>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Organization</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <div className="mt-0.5 flex-shrink-0">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 4V20M4 12H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div>
                    <span className="font-medium">Drag and Drop</span> - Reorder todos by dragging them. Drop a todo onto another to make it a child
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <Search size={18} className="mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-medium">Search</span> - Find todos by text content. The search only matches plain text, not any HTML formatting. Enter at least 3 characters to start searching.
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <div className="flex gap-1 mt-0.5 flex-shrink-0">
                    <Search size={16} />
                    <span className="text-xs">→</span>
                    <span className="text-xs">Replace</span>
                  </div>
                  <div>
                    <span className="font-medium">Search & Replace</span> - When a search is active, click the replace icon to open the replace dialog. You can replace all occurrences of the search term with new text.
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <div className="flex gap-1 mt-0.5 flex-shrink-0">
                    <FileUp size={18} />
                    <FileDown size={18} />
                  </div>
                  <div>
                    <span className="font-medium">Import/Export</span> - Import todos from various formats (using the FileUp icon) or export your todos for backup (using the FileDown icon)
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <MessageSquare size={18} className="mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-medium">Global Notes</span> - Access global notes by clicking the sticky note icon in the toolbar. These notes are shared across all todos and support markdown formatting
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <div className="flex gap-1 mt-0.5 flex-shrink-0">
                    <ArrowDownAZ size={18} />
                    <ArrowUpZA size={18} />
                  </div>
                  <div>
                    <span className="font-medium">Sorting</span> - Sort root-level todos alphabetically (A-Z or Z-A) using the sorting icons in the toolbar. For nested todos, use the context menu (right-click) to sort children
                  </div>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">AI Features</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <Sparkles size={18} className="mt-0.5 flex-shrink-0 text-purple-500" />
                  <div>
                    <span className="font-medium">Generate with AI</span> - Create structured todo lists from a description using AI. The purple button with sparkles animation provides intelligent task breakdown
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <Lightbulb size={18} className="mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-medium">AI Assistant</span> - Access AI-powered features for individual todos:
                    <ul className="ml-5 mt-1 space-y-1 list-disc">
                      <li><span className="font-medium">Cleanup Todo</span> - Improve clarity and actionability of a selected todo</li>
                      <li><span className="font-medium">Explain Todo</span> - Get contextual explanations of a todo in relation to your project, global notes, and other todos</li>
                      <li><span className="font-medium">Suggest Todos</span> - Receive AI-generated suggestions for new todos based on your current list</li>
                    </ul>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <FileText size={18} className="mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-medium">Prompt Templates</span> - Customize AI behavior with editable prompt templates:
                    <ul className="ml-5 mt-1 space-y-1 list-disc">
                      <li><span className="font-medium">Create Templates</span> - Design custom templates for different AI operations (cleanup, suggest, explain, generate)</li>
                      <li><span className="font-medium">Edit System Prompts</span> - Modify how the AI understands its role and purpose for each operation</li>
                      <li><span className="font-medium">Customize User Prompts</span> - Tailor the specific instructions and format for AI interactions</li>
                      <li><span className="font-medium">Template Variables</span> - Use variables like <code>{'{{todoText}}'}</code> or <code>{'{{globalNotes}}'}</code> that are automatically replaced with actual content</li>
                    </ul>
                  </div>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">History</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <div className="flex gap-1 mt-0.5 flex-shrink-0">
                    <Undo size={18} />
                    <Redo size={18} />
                  </div>
                  <div>
                    <span className="font-medium">Undo/Redo</span> - Undo or redo actions using the toolbar buttons or keyboard shortcuts (Ctrl+Z, Ctrl+Y)
                  </div>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Storage</h3>
              <p>All your todos are automatically saved to your browser's local storage. They will persist between sessions on the same device.</p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Colored Notes</h3>
              <p className="mb-2">When adding or editing a note, you can select one of four colors to help categorize and organize your notes:</p>
              <ul className="space-y-2 ml-5 list-disc">
                <li><span className="font-medium text-red-500 dark:text-red-400">Red</span> - For high priority or urgent items</li>
                <li><span className="font-medium text-orange-500 dark:text-orange-400">Orange</span> - For medium priority or important items</li>
                <li><span className="font-medium text-green-500 dark:text-green-400">Green</span> - For completed items or positive notes</li>
                <li><span className="font-medium text-blue-500 dark:text-blue-400">Blue</span> - For informational or reference notes</li>
              </ul>
              <p className="mt-2">The note and its parent todo will be highlighted with a subtle background color matching your selection.</p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Emoticons</h3>
              <p className="mb-2">Common text emoticons are automatically converted to emoji equivalents when displayed. Here are some examples:</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 ml-5">
                <div>:-) → 😊</div>
                <div>:) → 🙂</div>
                <div>:-D → 😀</div>
                <div>;-) → 😉</div>
                <div>:-( → 😞</div>
                <div>:( → 😔</div>
                <div>:-P → 😛</div>
                <div>{"<3"} → ❤️</div>
              </div>
              <p className="mt-2">This works in both todo text and notes. The original text emoticons are preserved when editing.</p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Custom Metrics</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <Ruler size={18} className="mt-0.5 flex-shrink-0 text-amber-700 dark:text-amber-600" />
                  <div>
                    <span className="font-medium">Custom Metrics</span> - Add multiple custom numeric measurements to any todo by right-clicking and selecting "Add custom metric" from the context menu. This allows tracking of any quantifiable aspect of your tasks
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <div className="flex items-center gap-1 mt-0.5 flex-shrink-0">
                    <Ruler size={16} className="text-amber-700 dark:text-amber-600" />
                    <span className="text-xs text-amber-700 dark:text-amber-600">5 kg</span>
                  </div>
                  <div>
                    <span className="font-medium">Multiple Metrics</span> - Add as many different metrics as needed to a single todo. Each metric has a value and a unit (e.g., 5 kg, 10 miles, 3 points)
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <div className="flex items-center gap-1 mt-0.5 flex-shrink-0">
                    <Ruler size={16} className="text-amber-700 dark:text-amber-600" />
                    <span className="text-xs text-amber-700 dark:text-amber-600">15 kg</span>
                  </div>
                  <div>
                    <span className="font-medium">Automatic Aggregation</span> - For parent todos, metrics are automatically aggregated by unit. For example, if child todos have metrics of "5 kg" and "10 kg", the parent will show "15 kg"
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <div className="flex gap-1 mt-0.5 flex-shrink-0">
                    <Ruler size={16} className="text-amber-700 dark:text-amber-600" />
                    <span className="text-xs">Manage</span>
                  </div>
                  <div>
                    <span className="font-medium">Metric Management</span> - View, add, and remove custom metrics through the custom metric dialog. Each metric must have a unique unit for proper aggregation
                  </div>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Cost Tracking</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <DollarSign size={18} className="mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-medium">Cost Assignment</span> - Assign monetary costs to any todo by right-clicking and selecting "Set cost" from the context menu. Costs help track financial implications of tasks
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <div className="flex items-center gap-1 mt-0.5 flex-shrink-0">
                    <DollarSign size={16} />
                    <span className="text-xs">$25.00</span>
                  </div>
                  <div>
                    <span className="font-medium">Cost Display</span> - Costs are displayed next to todos with a dollar sign icon. Parent todos show the cumulative cost of all their nested children
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <div className="flex items-center gap-1 mt-0.5 flex-shrink-0">
                    <DollarSign size={16} className="text-green-500" />
                    <span className="text-xs">$150.00</span>
                  </div>
                  <div>
                    <span className="font-medium">Cumulative Costs</span> - For parent todos, the total cost includes both the parent's cost and the sum of all child costs. Hover over the cost display to see a breakdown
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <div className="flex gap-1 mt-0.5 flex-shrink-0">
                    <DollarSign size={16} />
                    <span className="text-xs">Total</span>
                  </div>
                  <div>
                    <span className="font-medium">Cost Summary</span> - The total cost of all todos is displayed in the list header, providing a quick overview of the financial impact of your tasks
                  </div>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Time Estimation</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <Timer size={18} className="mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-medium">Time Estimates</span> - Set estimated time for completing tasks by right-clicking and selecting "Set time estimate" from the context menu. This helps with planning and evaluating efficiency
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <div className="flex items-center gap-1 mt-0.5 flex-shrink-0">
                    <Timer size={16} />
                    <span className="text-xs">Est: 2h</span>
                  </div>
                  <div>
                    <span className="font-medium">Estimate Display</span> - Time estimates are displayed next to todos with a timer icon. Estimates can be set in minutes, hours, or days
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <div className="flex items-center gap-1 mt-0.5 flex-shrink-0">
                    <Timer size={16} className="text-green-500" />
                    <Clock size={16} className="text-blue-500" />
                  </div>
                  <div>
                    <span className="font-medium">Efficiency Tracking</span> - The app compares estimated time with actual time spent (from time tracking) to calculate efficiency. Color-coded icons indicate if tasks were completed under, at, or over the estimated time
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <div className="flex items-center gap-1 mt-0.5 flex-shrink-0">
                    <Timer size={16} />
                    <span className="text-xs">85%</span>
                  </div>
                  <div>
                    <span className="font-medium">Efficiency Metrics</span> - Hover over time estimates to see detailed metrics including efficiency percentage, estimated vs. actual time, and cumulative statistics for parent todos
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <div className="flex gap-1 mt-0.5 flex-shrink-0">
                    <Timer size={16} />
                    <span className="text-xs">Summary</span>
                  </div>
                  <div>
                    <span className="font-medium">Time Summary</span> - The list header displays a summary of time estimates and actual time spent across all todos, providing an overview of your project's time efficiency
                  </div>
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-2">List References</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <Link size={18} className="mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-medium">Link to Lists</span> - Reference another todo list as a subtask by right-clicking and selecting "Link to list" from the context menu. This is useful for managing large projects with multiple components
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <div className="flex items-center gap-1 mt-0.5 flex-shrink-0">
                    <ExternalLink size={16} />
                    <span className="text-xs">Linked List</span>
                  </div>
                  <div>
                    <span className="font-medium">Linked List Display</span> - Linked lists are indicated with an external link icon. Hover over the icon to see detailed statistics about the linked list
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <div className="flex items-center gap-1 mt-0.5 flex-shrink-0">
                    <ExternalLink size={16} className="text-blue-500" />
                    <span className="text-xs">75%</span>
                  </div>
                  <div>
                    <span className="font-medium">Automatic Updates</span> - Statistics from linked lists (completion percentage, costs, time estimates) are automatically included in the parent todo's statistics, providing a comprehensive view of your project
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <div className="flex gap-1 mt-0.5 flex-shrink-0">
                    <Link size={16} />
                    <span className="text-xs">Edit</span>
                  </div>
                  <div>
                    <span className="font-medium">Manage References</span> - Edit or remove list references at any time through the context menu. Changes to the referenced list are automatically reflected in the parent todo
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default HelpDialog;