import React, { useState } from "react";
import {Search, Plus, Inbox, PanelLeftClose, Settings, User, ChevronDown, ChevronRight} from "lucide-react";

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

  return (
    <aside className="flex flex-col h-screen max-w-[500px] bg-sidebar border-r border-primary text-text select-none">
      
      <div className="flex items-center justify-between p-4 border-b border-primary">
        <div className="flex items-center gap-4 text-text/70">
          <button className="hover:text-primary transition-colors cursor-pointer">
            <Search size={30} />
          </button>
          <button className="hover:text-primary transition-colors cursor-pointer">
            <Plus size={30} />
          </button>
          <button className="hover:text-primary transition-colors cursor-pointer">
            <Inbox size={30} />
          </button>
        </div>
        <button className="text-text/50 hover:text-primary transition-colors cursor-pointer">
          <PanelLeftClose size={30} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-4 px-2 space-y-6 scrollbar-none">
        
        <div>
          <button 
            onClick={() => setIsPrivateOpen(!isPrivateOpen)}
            className="flex items-center gap-1 w-full text-left text-xs font-bold tracking-wider text-primary mb-2 px-2 uppercase hover:opacity-80 cursor-pointer"
          >
            {isPrivateOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
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
                      className={`flex items-center gap-2 w-full text-left px-4 py-1.5 text-sm rounded-sm transition-colors cursor-pointer
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
            className="flex items-center gap-1 w-full text-left text-xs font-bold tracking-wider text-primary mb-2 px-2 uppercase hover:opacity-80 cursor-pointer"
          >
            {isTeamsOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
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

      <div className="border-t border-primary/20 p-4 flex items-center justify-between bg-sidebar">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-primary">
            <User size={30} />
          </div>
          <span className="text-sm font-medium text-text/90">Username</span>
        </div>
        <button className="text-text/60 hover:text-primary transition-colors cursor-pointer">
          <Settings size={30} />
        </button>
      </div>

    </aside>
  );
}