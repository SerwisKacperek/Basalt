import { useState, useEffect } from 'react';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { Separator } from "../ui/separator";
import { Badge } from "../ui/badge";

import { Moon, Sun, Monitor, User, Settings, BarChart3, LogIn, LogOut } from "lucide-react";

interface SimpleStorage {
  saveData: (key: string, data: any) => Promise<void>;
  getData: (key: string) => Promise<any>;
}

interface SettingsModalProps {
  storage: SimpleStorage; 
}

export function SettingsModal({ storage }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<'account' | 'appearance' | 'stats'>('account');
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');

  const stats = { notesCount: 142, usedSpace: 4.2, maxSpace: 50 };
  const progressPercent = Math.min((stats.usedSpace / stats.maxSpace) * 100, 100);

  useEffect(() => {
    const loadSettings = async () => {
      const saved = await storage.getData('app-settings');
      if (saved?.theme) {
        setTheme(saved.theme);
        applyTheme(saved.theme);
      }
    };
    loadSettings();
  }, [storage]);


  const applyTheme = (t: 'light' | 'dark' | 'system') => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark');

    if (t === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(t);
    }
  };

  const handleThemeChange = async (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
    applyTheme(newTheme);
    await storage.saveData('app-settings', { theme: newTheme });
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon">
          <Settings className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      
      <DialogContent 
        aria-describedby={undefined} 
        className="sm:max-w-[600px] h-[450px] flex flex-col p-0 gap-0 overflow-hidden"
      >
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="text-xl font-semibold">Ustawienia</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 flex flex-col sm:flex-row h-full overflow-hidden border-t">
          {/* Menu boczne */}
          <div className="flex sm:flex-col justify-start bg-muted/40 p-2 sm:w-40 space-y-0 sm:space-y-1 space-x-1 sm:space-x-0 border-r">
            <Button 
              variant={activeTab === 'account' ? 'secondary' : 'ghost'} 
              className="w-full justify-start gap-2 px-3 h-9 text-sm"
              onClick={() => setActiveTab('account')}
            >
              <User className="h-4 w-4" />
              <span>Konto</span>
            </Button>
            <Button 
              variant={activeTab === 'appearance' ? 'secondary' : 'ghost'} 
              className="w-full justify-start gap-2 px-3 h-9 text-sm"
              onClick={() => setActiveTab('appearance')}
            >
              <Sun className="h-4 w-4" />
              <span>Wygląd</span>
            </Button>
            <Button 
              variant={activeTab === 'stats' ? 'secondary' : 'ghost'} 
              className="w-full justify-start gap-2 px-3 h-9 text-sm"
              onClick={() => setActiveTab('stats')}
            >
              <BarChart3 className="h-4 w-4" />
              <span>Statystyki</span>
            </Button>
          </div>

          {/* Zawartość */}
          <div className="flex-1 p-6 overflow-y-auto">
            {activeTab === 'account' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium">Profil i synchronizacja</h3>
                  <p className="text-xs text-muted-foreground">Opcje logowania (na przyszłość).</p>
                </div>
                <Separator />
                
                {isLoggedIn ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-2 bg-muted/30 rounded-lg border">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-sm text-primary">U</div>
                      <div className="flex-1">
                        <p className="text-sm font-medium leading-none">Zalogowany Użytkownik</p>
                        <p className="text-xs text-muted-foreground mt-1">user@example.com</p>
                      </div>
                      <Badge variant="outline">Aktywny</Badge>
                    </div>
                    <Button variant="destructive" size="sm" className="w-full gap-2" onClick={() => setIsLoggedIn(false)}>
                      <LogOut className="h-4 w-4" /> Wyloguj się
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-4 text-center space-y-3">
                    <div className="p-2.5 bg-muted rounded-full">
                      <User className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <Button size="sm" className="w-full gap-2" onClick={() => setIsLoggedIn(true)}>
                      <LogIn className="h-4 w-4" /> Zaloguj się (Mock)
                    </Button>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'appearance' && (
              <div className="space-y-4">
                <div><h3 className="text-sm font-medium">Motyw aplikacji</h3></div>
                <Separator />
                <div className="grid grid-cols-3 gap-2">
                  <Button variant={theme === "light" ? "default" : "outline"} className="flex flex-col gap-1.5 h-16 pt-2" onClick={() => handleThemeChange("light")}>
                    <Sun className="h-4 w-4" /> <span className="text-[11px]">Jasny</span>
                  </Button>
                  <Button variant={theme === "dark" ? "default" : "outline"} className="flex flex-col gap-1.5 h-16 pt-2" onClick={() => handleThemeChange("dark")}>
                    <Moon className="h-4 w-4" /> <span className="text-[11px]">Ciemny</span>
                  </Button>
                  <Button variant={theme === "system" ? "default" : "outline"} className="flex flex-col gap-1.5 h-16 pt-2" onClick={() => handleThemeChange("system")}>
                    <Monitor className="h-4 w-4" /> <span className="text-[11px]">System</span>
                  </Button>
                </div>
              </div>
            )}

            {activeTab === 'stats' && (
              <div className="space-y-4">
                <div><h3 className="text-sm font-medium">Twoje zasoby</h3></div>
                <Separator />
                <div className="space-y-4">
                  <Card>
                    <CardContent className="p-3 flex justify-between items-center">
                      <span className="text-xs font-medium text-muted-foreground">Łącznie notatek</span>
                      <Badge variant="secondary" className="font-bold">{stats.notesCount}</Badge>
                    </CardContent>
                  </Card>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Zajęte miejsce</span>
                      <span className="font-medium">{stats.usedSpace} MB / {stats.maxSpace} MB</span>
                    </div>
                    <div className="w-full bg-secondary h-1.5 rounded-full overflow-hidden">
                      <div className="bg-primary h-full transition-all duration-300" style={{ width: `${progressPercent}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}