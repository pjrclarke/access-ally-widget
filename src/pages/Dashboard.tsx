import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  Accessibility, 
  Key, 
  Palette, 
  Volume2, 
  Copy, 
  Check, 
  Plus, 
  Trash2, 
  ArrowLeft,
  Loader2,
  Settings,
  Code,
  LogOut
} from "lucide-react";

interface ApiKey {
  id: string;
  name: string;
  api_key: string;
  domain: string | null;
  is_active: boolean;
  request_count: number;
  primary_color: string;
  secondary_color: string;
  position: string;
  voice_rate: number;
  voice_pitch: number;
  created_at: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut } = useAuth();
  const { toast } = useToast();
  
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [selectedKey, setSelectedKey] = useState<ApiKey | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showSignOutDialog, setShowSignOutDialog] = useState(false);
  
  // Local state for appearance inputs (to avoid saving on every keystroke)
  const [localPrimaryColor, setLocalPrimaryColor] = useState("");
  const [localSecondaryColor, setLocalSecondaryColor] = useState("");
  
  // New key form
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyDomain, setNewKeyDomain] = useState("");
  const [creatingKey, setCreatingKey] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchApiKeys();
    }
  }, [user]);

  // Sync local color state when selected key changes
  useEffect(() => {
    if (selectedKey) {
      setLocalPrimaryColor(selectedKey.primary_color);
      setLocalSecondaryColor(selectedKey.secondary_color);
    }
  }, [selectedKey?.id]);

  const fetchApiKeys = async () => {
    try {
      const { data, error } = await supabase
        .from("widget_api_keys")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setApiKeys(data || []);
      if (data && data.length > 0 && !selectedKey) {
        setSelectedKey(data[0]);
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error loading API keys",
        description: error instanceof Error ? error.message : "An error occurred",
      });
    } finally {
      setLoading(false);
    }
  };

  const createApiKey = async () => {
    if (!newKeyName.trim()) {
      toast({
        variant: "destructive",
        title: "Name required",
        description: "Please enter a name for your API key",
      });
      return;
    }

    setCreatingKey(true);
    try {
      // Generate API key using the database function
      const { data: keyData, error: keyError } = await supabase
        .rpc("generate_widget_api_key");

      if (keyError) throw keyError;

      const { data, error } = await supabase
        .from("widget_api_keys")
        .insert({
          name: newKeyName.trim(),
          domain: newKeyDomain.trim() || null,
          api_key: keyData,
          user_id: user?.id,
        })
        .select()
        .single();

      if (error) throw error;

      setApiKeys(prev => [data, ...prev]);
      setSelectedKey(data);
      setNewKeyName("");
      setNewKeyDomain("");

      toast({
        title: "API key created!",
        description: "Your new API key is ready to use.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error creating API key",
        description: error instanceof Error ? error.message : "An error occurred",
      });
    } finally {
      setCreatingKey(false);
    }
  };

  const updateKeySettings = async (updates: Partial<ApiKey>) => {
    if (!selectedKey) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("widget_api_keys")
        .update(updates)
        .eq("id", selectedKey.id);

      if (error) throw error;

      setSelectedKey(prev => prev ? { ...prev, ...updates } : null);
      setApiKeys(prev => prev.map(k => k.id === selectedKey.id ? { ...k, ...updates } : k));

      toast({
        title: "Settings saved!",
        description: "Your widget customization has been updated.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error saving settings",
        description: error instanceof Error ? error.message : "An error occurred",
      });
    } finally {
      setSaving(false);
    }
  };

  const deleteApiKey = async (id: string) => {
    try {
      const { error } = await supabase
        .from("widget_api_keys")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setApiKeys(prev => prev.filter(k => k.id !== id));
      if (selectedKey?.id === id) {
        setSelectedKey(apiKeys.find(k => k.id !== id) || null);
      }

      toast({
        title: "API key deleted",
        description: "The API key has been removed.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error deleting API key",
        description: error instanceof Error ? error.message : "An error occurred",
      });
    }
  };

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getEmbedCode = (key: ApiKey) => {
    return `<script src="https://cdn.jsdelivr.net/gh/pjrclarke/a11ywidget@main/dist-embed/a11y-widget.iife.js"></script>
<script>
  window.A11yWidgetConfig = {
    apiKey: "${key.api_key}",
    position: "${key.position}",
    primaryColor: "${key.primary_color}"
  };
</script>`;
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </button>
            <div className="h-6 w-px bg-border" />
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-primary">
                <Accessibility className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-semibold">Dashboard</span>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setShowSignOutDialog(true)}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>

        {/* Sign Out Confirmation Dialog */}
        <AlertDialog open={showSignOutDialog} onOpenChange={setShowSignOutDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Sign out?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to sign out of your account? You'll need to sign in again to access your dashboard.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={signOut}>Sign Out</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </header>

      <main className="container py-8">
        <div className="grid gap-8 lg:grid-cols-[300px_1fr]">
          {/* Sidebar - API Keys List */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  Your API Keys
                </CardTitle>
                <CardDescription>
                  Select a key to customize its widget
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {apiKeys.map(key => (
                  <button
                    key={key.id}
                    onClick={() => setSelectedKey(key)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      selectedKey?.id === key.id 
                        ? "border-primary bg-primary/5" 
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{key.name}</span>
                      <Badge variant={key.is_active ? "default" : "secondary"} className="text-xs">
                        {key.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 truncate">
                      {key.domain || "No domain restriction"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {key.request_count.toLocaleString()} requests
                    </p>
                  </button>
                ))}

                {apiKeys.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No API keys yet. Create one below!
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Create New Key */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Create New Key
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="key-name">Name</Label>
                  <Input
                    id="key-name"
                    placeholder="My Website"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="key-domain">Domain (optional)</Label>
                  <Input
                    id="key-domain"
                    placeholder="example.com"
                    value={newKeyDomain}
                    onChange={(e) => setNewKeyDomain(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Lock this key to a specific domain for security
                  </p>
                </div>
                <Button 
                  className="w-full" 
                  onClick={createApiKey}
                  disabled={creatingKey}
                >
                  {creatingKey ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Create API Key
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Main Content - Customization */}
          {selectedKey ? (
            <div className="space-y-6">
              {/* Key Details */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{selectedKey.name}</CardTitle>
                      <CardDescription>
                        Created {new Date(selectedKey.created_at).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => deleteApiKey(selectedKey.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-muted px-3 py-2 rounded text-sm font-mono truncate">
                      {selectedKey.api_key}
                    </code>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(selectedKey.api_key, selectedKey.id)}
                    >
                      {copiedId === selectedKey.id ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                    🔒 This is a public key secured by domain-locking
                  </p>
                </CardContent>
              </Card>

              {/* Customization Tabs */}
              <Tabs defaultValue="appearance" className="space-y-4">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="appearance" className="flex items-center gap-2">
                    <Palette className="h-4 w-4" />
                    Appearance
                  </TabsTrigger>
                  <TabsTrigger value="voice" className="flex items-center gap-2">
                    <Volume2 className="h-4 w-4" />
                    Voice
                  </TabsTrigger>
                  <TabsTrigger value="embed" className="flex items-center gap-2">
                    <Code className="h-4 w-4" />
                    Embed Code
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="appearance">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Widget Appearance</CardTitle>
                      <CardDescription>
                        Customize colors and position to match your brand
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid gap-6 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="primary-color">Primary Color</Label>
                          <div className="flex gap-2">
                            <Input
                              id="primary-color"
                              type="color"
                              value={localPrimaryColor}
                              onChange={(e) => setLocalPrimaryColor(e.target.value)}
                              onBlur={() => {
                                if (localPrimaryColor !== selectedKey.primary_color) {
                                  updateKeySettings({ primary_color: localPrimaryColor });
                                }
                              }}
                              className="w-12 h-10 p-1 cursor-pointer"
                            />
                            <Input
                              value={localPrimaryColor}
                              onChange={(e) => setLocalPrimaryColor(e.target.value)}
                              onBlur={() => {
                                if (localPrimaryColor !== selectedKey.primary_color) {
                                  updateKeySettings({ primary_color: localPrimaryColor });
                                }
                              }}
                              placeholder="#6366f1"
                              className="flex-1"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="secondary-color">Secondary Color</Label>
                          <div className="flex gap-2">
                            <Input
                              id="secondary-color"
                              type="color"
                              value={localSecondaryColor}
                              onChange={(e) => setLocalSecondaryColor(e.target.value)}
                              onBlur={() => {
                                if (localSecondaryColor !== selectedKey.secondary_color) {
                                  updateKeySettings({ secondary_color: localSecondaryColor });
                                }
                              }}
                              className="w-12 h-10 p-1 cursor-pointer"
                            />
                            <Input
                              value={localSecondaryColor}
                              onChange={(e) => setLocalSecondaryColor(e.target.value)}
                              onBlur={() => {
                                if (localSecondaryColor !== selectedKey.secondary_color) {
                                  updateKeySettings({ secondary_color: localSecondaryColor });
                                }
                              }}
                              placeholder="#8b5cf6"
                              className="flex-1"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Widget Position</Label>
                        <Select
                          value={selectedKey.position}
                          onValueChange={(value) => updateKeySettings({ position: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="bottom-right">Bottom Right</SelectItem>
                            <SelectItem value="bottom-left">Bottom Left</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Preview */}
                      <div className="border rounded-lg p-6 bg-muted/30">
                        <p className="text-sm text-muted-foreground mb-4">Preview</p>
                        <div className="relative h-32 border rounded bg-background">
                          <div 
                            className={`absolute bottom-3 ${selectedKey.position === 'bottom-right' ? 'right-3' : 'left-3'} 
                              w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-all`}
                            style={{ backgroundColor: localPrimaryColor }}
                          >
                            <Accessibility className="h-6 w-6 text-white" />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="voice">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Voice Settings</CardTitle>
                      <CardDescription>
                        Adjust how the widget reads content aloud
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label>Speech Rate</Label>
                            <span className="text-sm text-muted-foreground">
                              {selectedKey.voice_rate.toFixed(1)}x
                            </span>
                          </div>
                          <Slider
                            value={[selectedKey.voice_rate]}
                            onValueChange={([value]) => updateKeySettings({ voice_rate: value })}
                            min={0.5}
                            max={2}
                            step={0.1}
                          />
                          <p className="text-xs text-muted-foreground">
                            Slower (0.5x) to Faster (2x)
                          </p>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label>Voice Pitch</Label>
                            <span className="text-sm text-muted-foreground">
                              {selectedKey.voice_pitch.toFixed(1)}
                            </span>
                          </div>
                          <Slider
                            value={[selectedKey.voice_pitch]}
                            onValueChange={([value]) => updateKeySettings({ voice_pitch: value })}
                            min={0.5}
                            max={2}
                            step={0.1}
                          />
                          <p className="text-xs text-muted-foreground">
                            Lower (0.5) to Higher (2.0)
                          </p>
                        </div>
                      </div>

                      <Button 
                        variant="outline" 
                        onClick={() => {
                          const utterance = new SpeechSynthesisUtterance("This is how your widget will sound.");
                          utterance.rate = selectedKey.voice_rate;
                          utterance.pitch = selectedKey.voice_pitch;
                          speechSynthesis.speak(utterance);
                        }}
                      >
                        <Volume2 className="mr-2 h-4 w-4" />
                        Test Voice
                      </Button>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="embed">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Embed Code</CardTitle>
                      <CardDescription>
                        Add this code to your website to enable the accessibility widget
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="relative">
                        <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                          <code>{getEmbedCode(selectedKey)}</code>
                        </pre>
                        <Button
                          variant="outline"
                          size="sm"
                          className="absolute top-2 right-2"
                          onClick={() => copyToClipboard(getEmbedCode(selectedKey), `embed-${selectedKey.id}`)}
                        >
                          {copiedId === `embed-${selectedKey.id}` ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>

                      <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                        <h4 className="font-medium text-sm flex items-center gap-2">
                          🔒 Security Note
                        </h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          This API key is <strong>public and safe to embed</strong>. Security is enforced through 
                          domain-locking, rate limiting, and server-side validation—not key secrecy.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          ) : (
            <Card className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-medium">No API Key Selected</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Create or select an API key to customize your widget
                </p>
              </div>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
