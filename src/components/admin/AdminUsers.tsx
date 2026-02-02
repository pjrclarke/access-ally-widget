import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Shield, Plus, Trash2, Loader2, UserPlus } from "lucide-react";

interface AdminUser {
  id: string;
  user_id: string;
  created_at: string;
}

const AdminUsers = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [newUserId, setNewUserId] = useState("");
  const [adding, setAdding] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);

  useEffect(() => {
    fetchAdminUsers();
  }, []);

  const fetchAdminUsers = async () => {
    try {
      const { data, error } = await supabase
        .from("admin_users")
        .select("*")
        .order("created_at", { ascending: true });

      if (error) throw error;
      setAdminUsers(data || []);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error loading admin users",
        description: error instanceof Error ? error.message : "An error occurred",
      });
    } finally {
      setLoading(false);
    }
  };

  const addAdminUser = async () => {
    if (!newUserId.trim()) {
      toast({
        variant: "destructive",
        title: "User ID required",
        description: "Please enter a valid user ID (UUID)",
      });
      return;
    }

    // Basic UUID validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(newUserId.trim())) {
      toast({
        variant: "destructive",
        title: "Invalid UUID",
        description: "Please enter a valid UUID format",
      });
      return;
    }

    setAdding(true);
    try {
      const { error } = await supabase
        .from("admin_users")
        .insert({ user_id: newUserId.trim() });

      if (error) {
        if (error.code === "23505") {
          throw new Error("This user is already an admin");
        }
        throw error;
      }

      await fetchAdminUsers();
      setNewUserId("");
      toast({
        title: "Admin added",
        description: "The user now has admin privileges",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error adding admin",
        description: error instanceof Error ? error.message : "An error occurred",
      });
    } finally {
      setAdding(false);
    }
  };

  const removeAdminUser = async (adminUser: AdminUser) => {
    try {
      const { error } = await supabase
        .from("admin_users")
        .delete()
        .eq("id", adminUser.id);

      if (error) throw error;

      setAdminUsers((prev) => prev.filter((a) => a.id !== adminUser.id));
      toast({
        title: "Admin removed",
        description: "The user no longer has admin privileges",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error removing admin",
        description: error instanceof Error ? error.message : "An error occurred",
      });
    } finally {
      setDeleteTarget(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Add Admin Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Add Admin User
          </CardTitle>
          <CardDescription>
            Grant admin privileges to a user by entering their User ID (found in auth logs or database)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <div className="flex-1 space-y-2">
              <Label htmlFor="user-id" className="sr-only">User ID</Label>
              <Input
                id="user-id"
                placeholder="e.g., 2bba75b7-2940-4ecc-82bc-c7e02d8406be"
                value={newUserId}
                onChange={(e) => setNewUserId(e.target.value)}
              />
            </div>
            <Button onClick={addAdminUser} disabled={adding}>
              {adding ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Admin
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Admin Users List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Current Admins
          </CardTitle>
          <CardDescription>
            {adminUsers.length} admin user{adminUsers.length !== 1 ? "s" : ""} with full access
          </CardDescription>
        </CardHeader>
        <CardContent>
          {adminUsers.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No admin users found</p>
          ) : (
            <div className="space-y-3">
              {adminUsers.map((adminUser) => (
                <div
                  key={adminUser.id}
                  className="flex items-center justify-between p-4 rounded-lg border bg-card"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Shield className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <code className="text-sm font-mono">{adminUser.user_id}</code>
                        {adminUser.user_id === user?.id && (
                          <Badge variant="secondary">You</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Added {new Date(adminUser.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  {adminUser.user_id !== user?.id && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => setDeleteTarget(adminUser)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove admin access?</AlertDialogTitle>
            <AlertDialogDescription>
              This will revoke admin privileges for this user. They will no longer be able to access the admin dashboard or manage companies, API keys, or billing.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && removeAdminUser(deleteTarget)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove Admin
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminUsers;