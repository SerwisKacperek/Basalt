import React, { useState } from "react";
import {Search, Plus, Inbox, PanelLeftClose, PanelLeftOpen, Settings, User, ChevronDown, ChevronRight} from "lucide-react";

const PRIVATE_NOTES = [
  { id: "1", title: "First Note" },
  { id: "2", title: "Shopping List" },
  { id: "3", title: "Trip Plan" },
  { id: "4", title: "Notatki" },
  { id: "5", title: "Nauka" },
];

const TEAMSPACES = [
  { id: "t1", name: "Marta's Teamspace" },
  { id: "t2", name: "Drużyna Pierścienia" },
  { id: "t3", name: "Drużyna A" },
  { id: "t4", name: "Drużyna AA" },
  { id: "t5", name: "Team Numero Uno" },
];

export function Sidebar() {
  const [activeNote, setActiveNote] = useState("1");
  const [isPrivateOpen, setIsPrivateOpen] = useState(true);
  const [isTeamsOpen, setIsTeamsOpen] = useState(true);
  const [width, setWidth] = useState(240);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const initResize = (mouseDownEvent: React.MouseEvent) => {
    mouseDownEvent.preventDefault();
    const doResize = (mouseMoveEvent: MouseEvent) => {
      const newWidth = mouseMoveEvent.clientX;
      if (newWidth >= 200 && newWidth <= 500) setWidth(newWidth);
    };
    const stopResize = () => {
      window.removeEventListener("mousemove", doResize);
      window.removeEventListener("mouseup", stopResize);
    };
    window.addEventListener("mousemove", doResize);
    window.addEventListener("mouseup", stopResize);
  };

  if (isCollapsed) {
    return (
      <div className="fixed top-4 left-4 z-50 animate-in fade-in duration-200">
        <button 
          onClick={() => setIsCollapsed(false)}
          className="p-2 bg-sidebar border border-primary text-text/70 hover:text-primary rounded-md transition-colors cursor-pointer shadow-md flex items-center justify-center"
        >
          <PanelLeftOpen size={25} />
        </button>
      </div>
    );
  }

  return (
    <aside style={{ width: `${width}px` }} className="relative flex flex-col h-screen overflow-hidden bg-sidebar border-r border-primary select-none shrink-0">
      
      <div className="flex items-center justify-between p-4 border-b border-primary">
        <div className="flex items-center gap-4 text-text/70">
          <button className="hover:text-primary transition-colors cursor-pointer">
            <Search size={25} />
          </button>
          <button className="hover:text-primary transition-colors cursor-pointer">
            <Plus size={25} />
          </button>
          <button className="hover:text-primary transition-colors cursor-pointer">
            <Inbox size={25} />
          </button>
        </div>
        <button onClick={() => setIsCollapsed(true)} className="text-text/50 hover:text-primary transition-colors cursor-pointer">
          <PanelLeftClose size={25} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-none">
        
        <div>
          <button 
            onClick={() => setIsPrivateOpen(!isPrivateOpen)}
            className="flex items-center gap-1 w-full text-sm font-bold tracking-wider text-primary mb-3 px-2 uppercase cursor-pointer"
          >
            {isPrivateOpen ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
            Private
          </button>
          
          {isPrivateOpen && (
            <ul className="space-y-0.5">
              {PRIVATE_NOTES.map((note) => {
                const isActive = note.id === activeNote;
                return (
                  <li key={note.id}>
                    <button
                      onClick={() => setActiveNote(note.id)}
                      className={`flex items-center gap-2 w-full text-left px-4 py-1.5 text-sm transition-colors cursor-pointer
                        ${isActive 
                          ? "bg-primary/20 text-text font-medium" 
                          : "text-text/80 hover:bg-primary/5 hover:text-text"
                        }`}
                    >
                      <span className="text-xs text-primary/70">•</span>
                      {note.title}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div>
          <button 
            onClick={() => setIsTeamsOpen(!isTeamsOpen)}
            className="flex items-center gap-1 w-full text-left text-sm font-bold tracking-wider text-primary mb-3 px-2 uppercase cursor-pointer"
          >
            {isTeamsOpen ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
            Teamspaces
          </button>
          
          {isTeamsOpen && (
            <ul className="space-y-0.5">
              {TEAMSPACES.map((team) => (
                <li key={team.id}>
                  <button className="w-full text-left px-6 py-1.5 text-sm text-text/80 rounded-sm hover:bg-primary/5 hover:text-text transition-colors cursor-pointer">
                    {team.name}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

      </div>

      <div className="border-t border-primary p-4 flex items-center justify-between bg-sidebar">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-primary">
            <User size={25} />
          </div>
          <span className="text-sm font-medium">Username</span>
        </div>
        <button className=" hover:text-primary transition-colors cursor-pointer">
          <Settings size={25} />
        </button>
      </div>
      <div 
        onMouseDown={initResize} 
        className="absolute top-0 right-0 w-1.5 h-full cursor-col-resize hover:bg-primary/40 active:bg-primary transition-colors z-50 translate-x-[3px]"
      />
    </aside>
  );
}