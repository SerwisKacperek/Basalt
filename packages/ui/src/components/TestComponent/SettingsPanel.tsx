import { useEffect, useState } from "react";
import {
  BarChart3,
  Bot,
  Loader2,
  LogIn,
  LogOut,
  Settings,
  Sun,
  User,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { Separator } from "../ui/separator";
import { Badge } from "../ui/badge";
import { useTheme } from "../theme-provider";

interface SimpleOllama {
  getEndpoint: () => Promise<string>;
  setEndpoint: (endpoint: string) => Promise<void>;
  testConnection: () => Promise<void>;
}

type ConnectionStatus =
  | { kind: "success"; message: string }
  | { kind: "error"; message: string }
  | null;

export interface SettingsPanelProps {
  ollama: SimpleOllama;
}

export function SettingsPanel({
  ollama,
}: SettingsPanelProps) {

  const [activeTab, setActiveTab] = useState<'account' | 'appearance' | 'stats' | 'ai'>('account');
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const { theme, setTheme } = useTheme();

  const [ollamaEndpoint, setOllamaEndpoint] = useState("");
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>(null);
  const [isTesting, setIsTesting] = useState<boolean>(false);

  const stats = { notesCount: 142, usedSpace: 4.2, maxSpace: 50 };
  const progressPercent = Math.min(
    (stats.usedSpace / stats.maxSpace) * 100,
    100,
  );

  useEffect(() => {
    const loadSettings = async () => {
      const endpoint = await ollama.getEndpoint();
      setOllamaEndpoint(endpoint);
    };

    loadSettings().catch(() => {
      setOllamaEndpoint("");
    });
  }, [ollama]);

  const saveOllamaEndpoint = async () => {
    const endpoint = ollamaEndpoint.trim();
    await ollama.setEndpoint(endpoint);
    setConnectionStatus({
      kind: "success",
      message: "Endpoint Ollamy został zapisany.",
    });
  };

  const testOllamaConnection = async () => {
    setIsTesting(true);
    setConnectionStatus(null);
    try {
      await ollama.setEndpoint(ollamaEndpoint.trim());
      await ollama.testConnection();
      setConnectionStatus({
        kind: "success",
        message: "Połączenie z Ollamą działa poprawnie.",
      });
    } catch (error) {
      setConnectionStatus({
        kind: "error",
        message:
          error instanceof Error
            ? error.message
            : "Nie udało się przetestować połączenia z Ollamą.",
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" aria-label="Ustawienia">
          <Settings className="h-4 w-4" />
        </Button>
      </DialogTrigger>

      <DialogContent
        aria-describedby={undefined}
        className="sm:max-w-150 h-112.5 flex flex-col p-0 gap-0 overflow-hidden border-primary"
      >
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="text-xl font-semibold">
            Ustawienia
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex flex-col sm:flex-row h-full overflow-hidden border-t border-primary">
          {/* Menu boczne */}
          <div className="flex sm:flex-col justify-start bg-muted/40 p-2 sm:w-40 space-y-0 sm:space-y-1 space-x-1 sm:space-x-0 border-r border-primary">
            <Button
              variant={activeTab === 'account' ? 'secondary' : 'ghost'}
              className="w-full justify-start gap-2 px-3 h-9 text-sm"
              onClick={() => setActiveTab('account')}
            >
              <User className="h-4 w-4" /> <span>Konto</span>
            </Button>
            <Button
              variant={activeTab === 'appearance' ? 'secondary' : 'ghost'}
              className="w-full justify-start gap-2 px-3 h-9 text-sm"
              onClick={() => setActiveTab('appearance')}
            >
              <Sun className="h-4 w-4" /> <span>Wygląd</span>
            </Button>
            <Button
              variant={activeTab === 'ai' ? 'secondary' : 'ghost'}
              className="w-full justify-start gap-2 px-3 h-9 text-sm"
              onClick={() => setActiveTab('ai')}
            >
              <Bot className="h-4 w-4" /> <span>AI</span>
            </Button>
            <Button
              variant={activeTab === 'stats' ? 'secondary' : 'ghost'}
              className="w-full justify-start gap-2 px-3 h-9 text-sm"
              onClick={() => setActiveTab('stats')}
            >
              <BarChart3 className="h-4 w-4" /> <span>Statystyki</span>
            </Button>
          </div>

          <div className="flex-1 p-6 overflow-y-auto">
            {/* Zakładka: Konto */}
            {activeTab === 'account' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium">
                    Profil i synchronizacja
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Opcje logowania (na przyszłość).
                  </p>
                </div>
                <Separator />

                {isLoggedIn ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-2 bg-muted/30 rounded-lg border border-primary">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-sm text-primary">
                        U
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium leading-none">
                          Zalogowany użytkownik
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          user@example.com
                        </p>
                      </div>
                      <Badge variant="outline">Aktywny</Badge>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="w-full gap-2"
                      onClick={() => setIsLoggedIn(false)}
                    >
                      <LogOut className="h-4 w-4" /> Wyloguj się
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-4 text-center space-y-3">
                    <div className="p-2.5 bg-muted rounded-full">
                      <User className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <Button
                      size="sm"
                      className="w-full gap-2"
                      onClick={() => setIsLoggedIn(true)}
                    >
                      <LogIn className="h-4 w-4" /> Zaloguj się (Mock)
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Zakładka: Wygląd */}
            {activeTab === 'appearance' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium">Motyw aplikacji</h3>
                  <p className="text-xs text-muted-foreground">Wybierz kolor przewodni dla swojego interfejsu.</p>
                </div>
                <Separator />
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    variant={theme === "theme-green" ? "default" : "outline"}
                    className="flex flex-col gap-1.5 h-16 pt-2"
                    onClick={() => setTheme("theme-green")}
                  >
                    <div className="h-4 w-4 rounded-full bg-[#889E81]" />
                    <span className="text-[11px]">Zielony</span>
                  </Button>

                  <Button
                    variant={theme === "theme-blue" ? "default" : "outline"}
                    className="flex flex-col gap-1.5 h-16 pt-2"
                    onClick={() => setTheme("theme-blue")}
                  >
                    <div className="h-4 w-4 rounded-full bg-[#5DADE2]" />
                    <span className="text-[11px]">Niebieski</span>
                  </Button>

                  <Button
                    variant={theme === "theme-purple" ? "default" : "outline"}
                    className="flex flex-col gap-1.5 h-16 pt-2"
                    onClick={() => setTheme("theme-purple")}
                  >
                    <div className="h-4 w-4 rounded-full bg-[#9B59B6]" />
                    <span className="text-[11px]">Fioletowy</span>
                  </Button>
                </div>
              </div>
            )}
            {activeTab === "ai" && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium">Lokalna Ollama</h3>
                  <p className="text-xs text-muted-foreground">
                    Basalt łączy się bezpośrednio z API Ollamy z poziomu
                    frontendu.
                  </p>
                </div>
                <Separator />
                <div className="space-y-2">
                  <Label htmlFor="ollama-endpoint">Endpoint Ollamy</Label>
                  <Input
                    id="ollama-endpoint"
                    type="url"
                    value={ollamaEndpoint}
                    onChange={(event) => {
                      setOllamaEndpoint(event.target.value);
                      setConnectionStatus(null);
                    }}
                    disabled={isTesting}
                  />
                  <p className="text-xs text-muted-foreground">
                    Domyślny model: llama3.2:latest. Bezpośredni fetch może
                    wymagać poprawnego OLLAMA_ORIGINS.
                  </p>
                </div>

                {connectionStatus && (
                  <p
                    role={
                      connectionStatus.kind === "error" ? "alert" : "status"
                    }
                    className={
                      connectionStatus.kind === "error"
                        ? "text-sm text-destructive"
                        : "text-sm text-success"
                    }
                  >
                    {connectionStatus.message}
                  </p>
                )}

                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={testOllamaConnection}
                    disabled={isTesting}
                  >
                    {isTesting && <Loader2 className="h-4 w-4 animate-spin" />}
                    {isTesting ? "Testowanie..." : "Testuj połączenie"}
                  </Button>
                  <Button onClick={saveOllamaEndpoint} disabled={isTesting}>
                    Zapisz
                  </Button>
                </div>
              </div>
            )}

            {/* Zakładka: Statystyki */}
            {activeTab === 'stats' && (
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Twoje zasoby</h3>
                <Separator />
                <Card>
                  <CardContent className="p-3 flex justify-between items-center">
                    <span className="text-xs font-medium text-muted-foreground">
                      Łącznie notatek
                    </span>
                    <Badge variant="secondary" className="font-bold">
                      {stats.notesCount}
                    </Badge>
                  </CardContent>
                </Card>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">
                      Zajęte miejsce
                    </span>
                    <span className="font-medium">
                      {stats.usedSpace} MB / {stats.maxSpace} MB
                    </span>
                  </div>
                  <div className="w-full bg-secondary h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-primary h-full transition-all duration-300"
                      style={{ width: `${progressPercent}%` }}
                    />
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
