import { useEffect, useState } from "react";
import {
  AlertCircle,
  BarChart3,
  Bot,
  ChevronsUpDown,
  Loader2,
  LogIn,
  LogOut,
  Settings,
  Sun,
  User,
} from "lucide-react";
import {
  Avatar,
  AvatarFallback,
  Badge,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
  Input,
  Label,
  Progress,
  Separator,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  useTheme,
} from "@basalt/ui";
import { useAuth, type AuthUser } from "~/hooks/useAuth";

interface AiConfig {
  endpoint: string;
  model: string;
  apiKey: string;
}

interface SimpleAi {
  getConfig: () => Promise<AiConfig>;
  setConfig: (config: Partial<AiConfig>) => Promise<void>;
  listModels: () => Promise<string[]>;
}

type ConnectionStatus =
  | { kind: "success"; message: string }
  | { kind: "error"; message: string }
  | null;

export interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

export interface SettingsPanelProps {
  ai: SimpleAi;
  /** Controlled open state. When provided, the dialog is controlled externally. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Hide the built-in settings icon trigger (e.g. when opened from a menu). */
  hideTrigger?: boolean;
  /** Auth state from parent. If omitted, the panel manages its own auth state. */
  auth?: AuthState;
}

export function SettingsPanel({
  ai,
  open,
  onOpenChange,
  hideTrigger = false,
  auth: authProp,
}: SettingsPanelProps) {
  const internalAuth = useAuth();
  const auth = authProp ?? internalAuth;
  const { theme, setTheme } = useTheme();

  // Local AI providers need direct localhost access, which the browser blocks
  // via CORS/COEP. The feature is therefore desktop-only.
  const isDesktop = __TARGET__ === "electron";

  const [aiEndpoint, setAiEndpoint] = useState("");
  const [aiModel, setAiModel] = useState("");
  const [aiApiKey, setAiApiKey] = useState("");
  const [availableModels, setAvailableModels] = useState<string[]>([]);

  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authConfirm, setAuthConfirm] = useState('');
  const [authError, setAuthError] = useState('');
  const [authSubmitting, setAuthSubmitting] = useState(false);

  function switchAuthMode(mode: 'login' | 'register') {
    setAuthMode(mode);
    setAuthEmail('');
    setAuthPassword('');
    setAuthConfirm('');
    setAuthError('');
  }

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    if (authMode === 'register' && authPassword !== authConfirm) {
      setAuthError('Passwords do not match');
      return;
    }
    setAuthSubmitting(true);
    try {
      if (authMode === 'login') {
        await auth.login(authEmail, authPassword);
      } else {
        await auth.register(authEmail, authPassword);
      }
      setAuthEmail('');
      setAuthPassword('');
      setAuthConfirm('');
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : authMode === 'login' ? 'Login failed' : 'Registration failed');
    } finally {
      setAuthSubmitting(false);
    }
  };
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>(null);
  const [isTesting, setIsTesting] = useState<boolean>(false);

  // Always offer the saved model in the picker, even before models are fetched.
  const modelOptions = Array.from(
    new Set([...availableModels, aiModel].filter(Boolean)),
  );

  const stats = { notesCount: 142, usedSpace: 4.2, maxSpace: 50 };
  const progressPercent = Math.min(
    (stats.usedSpace / stats.maxSpace) * 100,
    100,
  );

  useEffect(() => {
    const loadSettings = async () => {
      const config = await ai.getConfig();
      setAiEndpoint(config.endpoint);
      setAiModel(config.model);
      setAiApiKey(config.apiKey);
    };

    loadSettings().catch(() => {
      setAiEndpoint("");
      setAiModel("");
      setAiApiKey("");
    });
  }, [ai]);

  const persistAiConfig = () =>
    ai.setConfig({
      endpoint: aiEndpoint.trim(),
      model: aiModel.trim(),
      apiKey: aiApiKey.trim(),
    });

  const saveAiConfig = async () => {
    await persistAiConfig();
    setConnectionStatus({
      kind: "success",
      message: "AI settings saved.",
    });
  };

  const testAiConnection = async () => {
    setIsTesting(true);
    setConnectionStatus(null);
    try {
      await persistAiConfig();
      const models = await ai.listModels();
      setAvailableModels(models);
      // Auto-select a model if none is set or the saved one is unavailable.
      if (!aiModel || !models.includes(aiModel)) {
        const firstModel = models[0];
        if (firstModel) {
          setAiModel(firstModel);
          await ai.setConfig({ model: firstModel });
        }
      }
      setConnectionStatus({
        kind: "success",
        message: `Connected. ${models.length} model${
          models.length === 1 ? "" : "s"
        } available.`,
      });
    } catch (error) {
      setConnectionStatus({
        kind: "error",
        message:
          error instanceof Error
            ? error.message
            : "Couldn't reach the AI endpoint.",
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {!hideTrigger && (
        <DialogTrigger asChild>
          <Button variant="outline" size="icon" aria-label="Settings">
            <Settings className="h-4 w-4" />
          </Button>
        </DialogTrigger>
      )}

      <DialogContent
        aria-describedby={undefined}
        className="sm:max-w-150 h-112.5 flex flex-col p-0 gap-0 overflow-hidden border-border"
      >
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="text-xl font-semibold">Settings</DialogTitle>
        </DialogHeader>

        <Tabs
          defaultValue="account"
          orientation="vertical"
          className="flex flex-1 flex-col gap-0 overflow-hidden border-t border-border sm:flex-row"
        >
          {/* Side menu */}
          <TabsList className="flex h-auto justify-start gap-1 rounded-none border-b border-border bg-muted/40 p-2 sm:w-40 sm:flex-col sm:border-b-0 sm:border-r">
            <TabsTrigger
              value="account"
              className="w-full justify-start gap-2 px-3 data-[state=active]:bg-secondary"
            >
              <User className="h-4 w-4" /> <span>Account</span>
            </TabsTrigger>
            <TabsTrigger
              value="appearance"
              className="w-full justify-start gap-2 px-3 data-[state=active]:bg-secondary"
            >
              <Sun className="h-4 w-4" /> <span>Appearance</span>
            </TabsTrigger>
            {isDesktop && (
              <TabsTrigger
                value="ai"
                className="w-full justify-start gap-2 px-3 data-[state=active]:bg-secondary"
              >
                <Bot className="h-4 w-4" /> <span>AI</span>
              </TabsTrigger>
            )}
            <TabsTrigger
              value="stats"
              className="w-full justify-start gap-2 px-3 data-[state=active]:bg-secondary"
            >
              <BarChart3 className="h-4 w-4" /> <span>Stats</span>
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto p-6">
            {/* Tab: Account */}
            <TabsContent value="account" className="mt-0">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium">Profile & sync</h3>
                  <p className="text-xs text-muted-foreground">
                    Sign in to sync your notes across devices.
                  </p>
                </div>
                <Separator />

                {auth.loading ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : auth.user ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-2 bg-muted/30 rounded-lg border border-border">
                      <Avatar className="h-10 w-10 border border-primary/40">
                        <AvatarFallback className="bg-primary/10 text-sm font-bold text-primary">
                          {auth.user.email.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium leading-none truncate">
                          {auth.user.email}
                        </p>
                      </div>
                      <Badge variant="outline">Active</Badge>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="w-full gap-2"
                      onClick={() => auth.logout()}
                    >
                      <LogOut className="h-4 w-4" /> Log out
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex rounded-lg border border-border p-0.5 bg-muted/40">
                      <button
                        type="button"
                        onClick={() => switchAuthMode('login')}
                        className={`flex-1 rounded-md py-1 text-xs font-medium transition-colors ${authMode === 'login' ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                      >
                        Log in
                      </button>
                      <button
                        type="button"
                        onClick={() => switchAuthMode('register')}
                        className={`flex-1 rounded-md py-1 text-xs font-medium transition-colors ${authMode === 'register' ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                      >
                        Register
                      </button>
                    </div>
                    <form onSubmit={handleAuthSubmit} className="space-y-3">
                      <div className="grid gap-1.5">
                        <Label htmlFor="auth-email">Email</Label>
                        <Input
                          id="auth-email"
                          type="email"
                          placeholder="you@example.com"
                          value={authEmail}
                          onChange={(e) => setAuthEmail(e.target.value)}
                          autoComplete="email"
                          required
                        />
                      </div>
                      <div className="grid gap-1.5">
                        <Label htmlFor="auth-password">Password</Label>
                        <Input
                          id="auth-password"
                          type="password"
                          placeholder="••••••••"
                          value={authPassword}
                          onChange={(e) => setAuthPassword(e.target.value)}
                          autoComplete={authMode === 'login' ? 'current-password' : 'new-password'}
                          required
                        />
                      </div>
                      {authMode === 'register' && (
                        <div className="grid gap-1.5">
                          <Label htmlFor="auth-confirm">Confirm password</Label>
                          <Input
                            id="auth-confirm"
                            type="password"
                            placeholder="••••••••"
                            value={authConfirm}
                            onChange={(e) => setAuthConfirm(e.target.value)}
                            autoComplete="new-password"
                            required
                          />
                        </div>
                      )}
                      {authError && (
                        <p className="flex items-center gap-1 text-xs text-destructive">
                          <AlertCircle className="h-3 w-3" /> {authError}
                        </p>
                      )}
                      <Button
                        type="submit"
                        size="sm"
                        className="w-full gap-2"
                        disabled={authSubmitting}
                      >
                        {authSubmitting
                          ? <Loader2 className="h-4 w-4 animate-spin" />
                          : <LogIn className="h-4 w-4" />}
                        {authMode === 'login' ? 'Log in' : 'Create account'}
                      </Button>
                    </form>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Tab: Appearance */}
            <TabsContent value="appearance" className="mt-0">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium">App theme</h3>
                  <p className="text-xs text-muted-foreground">
                    Pick the accent color for your interface.
                  </p>
                </div>
                <Separator />
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    variant={theme === "theme-green" ? "default" : "outline"}
                    className="flex flex-col gap-1.5 h-16 pt-2"
                    onClick={() => setTheme("theme-green")}
                  >
                    <div className="h-4 w-4 rounded-full bg-[#889E81]" />
                    <span className="text-[11px]">Green</span>
                  </Button>

                  <Button
                    variant={theme === "theme-blue" ? "default" : "outline"}
                    className="flex flex-col gap-1.5 h-16 pt-2"
                    onClick={() => setTheme("theme-blue")}
                  >
                    <div className="h-4 w-4 rounded-full bg-[#5DADE2]" />
                    <span className="text-[11px]">Blue</span>
                  </Button>

                  <Button
                    variant={theme === "theme-purple" ? "default" : "outline"}
                    className="flex flex-col gap-1.5 h-16 pt-2"
                    onClick={() => setTheme("theme-purple")}
                  >
                    <div className="h-4 w-4 rounded-full bg-[#9B59B6]" />
                    <span className="text-[11px]">Purple</span>
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* Tab: AI (desktop only — browsers block localhost providers) */}
            {isDesktop && (
              <TabsContent value="ai" className="mt-0">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium">AI provider</h3>
                  <p className="text-xs text-muted-foreground">
                    Connect any OpenAI-compatible chat completions endpoint
                    (OpenAI, OpenRouter, a local server, etc.).
                  </p>
                </div>
                <Separator />
                <div className="space-y-2">
                  <Label htmlFor="ai-endpoint">Endpoint URL</Label>
                  <Input
                    id="ai-endpoint"
                    type="url"
                    placeholder="https://api.openai.com/v1/chat/completions"
                    value={aiEndpoint}
                    onChange={(event) => {
                      setAiEndpoint(event.target.value);
                      setConnectionStatus(null);
                    }}
                    disabled={isTesting}
                  />
                  <p className="text-xs text-muted-foreground">
                    Must point at the full /v1/chat/completions path.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ai-model">Model</Label>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        id="ai-model"
                        variant="outline"
                        disabled={isTesting}
                        className="w-full justify-between font-normal"
                      >
                        <span
                          className={aiModel ? "" : "text-muted-foreground"}
                        >
                          {aiModel || "Select a model"}
                        </span>
                        <ChevronsUpDown className="h-4 w-4 opacity-50" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="start"
                      className="max-h-64 w-[var(--radix-dropdown-menu-trigger-width)] overflow-y-auto"
                    >
                      {modelOptions.length === 0 ? (
                        <DropdownMenuItem disabled>
                          Test the connection to load models
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuRadioGroup
                          value={aiModel}
                          onValueChange={(value) => {
                            setAiModel(value);
                            setConnectionStatus(null);
                          }}
                        >
                          {modelOptions.map((model) => (
                            <DropdownMenuRadioItem key={model} value={model}>
                              {model}
                            </DropdownMenuRadioItem>
                          ))}
                        </DropdownMenuRadioGroup>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <p className="text-xs text-muted-foreground">
                    Test the connection to load the models your endpoint
                    offers.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ai-api-key">API key</Label>
                  <Input
                    id="ai-api-key"
                    type="password"
                    autoComplete="off"
                    placeholder="sk-…"
                    value={aiApiKey}
                    onChange={(event) => {
                      setAiApiKey(event.target.value);
                      setConnectionStatus(null);
                    }}
                    disabled={isTesting}
                  />
                  <p className="text-xs text-muted-foreground">
                    Sent as a Bearer token. Leave empty for servers that
                    don&apos;t require authentication.
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
                    onClick={testAiConnection}
                    disabled={isTesting}
                  >
                    {isTesting && <Loader2 className="h-4 w-4 animate-spin" />}
                    {isTesting ? "Testing…" : "Test connection"}
                  </Button>
                  <Button onClick={saveAiConfig} disabled={isTesting}>
                    Save
                  </Button>
                </div>
              </div>
              </TabsContent>
            )}

            {/* Tab: Stats */}
            <TabsContent value="stats" className="mt-0">
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Your usage</h3>
                <Separator />
                <Card>
                  <CardContent className="p-3 flex justify-between items-center">
                    <span className="text-xs font-medium text-muted-foreground">
                      Total notes
                    </span>
                    <Badge variant="secondary" className="font-bold">
                      {stats.notesCount}
                    </Badge>
                  </CardContent>
                </Card>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Used space</span>
                    <span className="font-medium">
                      {stats.usedSpace} MB / {stats.maxSpace} MB
                    </span>
                  </div>
                  <Progress value={progressPercent} className="h-1.5" />
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
