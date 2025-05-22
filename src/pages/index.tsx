import React, { useState } from "react";
import Head from "next/head";
import Header from "@/components/Header";
import DraggableTodoList from "@/components/DraggableTodoList";
import { TodoProvider } from "@/contexts/TodoContext";
import { TodoListsProvider } from "@/contexts/TodoListsContext";
import { TabNavigation } from "@/components/TabNavigation";
import { TimeCalendarDialog } from "@/components/TimeCalendarDialog";
import ActivityHeatmap from "@/components/ActivityHeatmap";
import { Separator } from "@/components/ui/separator";
import { Footer } from "@/components/Footer";

export default function Home() {
  const [timeCalendarOpen, setTimeCalendarOpen] = useState(false);
  
  const handleOpenTimeCalendar = () => {
    setTimeCalendarOpen(true);
  };
  
  return (
    <>
      <Head>
        <title>MindMyTodos</title>
        <meta name="description" content="Advanced nested todo list with smart status propagation, notes, and organization features" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="bg-background min-h-screen flex flex-col">
        <Header onOpenTimeCalendar={handleOpenTimeCalendar} />
        <main className="flex-1 p-4 md:p-6 container mx-auto max-w-[1024px]">
          <TodoListsProvider>
            <TabNavigation />
            <TodoProvider>
              <DraggableTodoList />
              {/* Place TimeCalendarDialog inside TodoProvider to access todos */}
              <TimeCalendarDialog 
                open={timeCalendarOpen} 
                onOpenChange={setTimeCalendarOpen} 
              />
              
              {/* Activity Heatmap */}
              <Separator className="my-6" />
              <ActivityHeatmap />
            </TodoProvider>
          </TodoListsProvider>
        </main>
        <div className="container mx-auto max-w-[1024px] px-4 md:px-6">
          <Footer />
        </div>
      </div>
    </>
  );
}