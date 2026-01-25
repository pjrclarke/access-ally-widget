import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Key, Activity, Globe, Mail, Calendar, FileText, Loader2 } from "lucide-react";

type SubscriptionPlan = "free" | "starter" | "pro" | "enterprise" | "admin";
type SubscriptionStatus = "active" | "cancelled" | "past_due" | "trialing";

interface Company {
  id: string;
  name: string;
  email: string;
  website: string | null;
  plan: SubscriptionPlan;
  plan_status: SubscriptionStatus;
  monthly_request_limit: number;
  notes: string | null;
  created_at: string;
}

interface ApiKey {
  id: string;
  api_key: string;
  name: string;
  domain: string | null;
  is_active: boolean;
  request_count: number;
  last_used_at: string | null;
  created_at: string;
}

interface UsageStats {
  total_requests: number;
  requests_this_month: number;
  avg_response_time: number;
  success_rate: number;
  endpoints: { endpoint: string; count: number }[];
}

interface CompanyDashboardProps {
  company: Company;
  onBack: () => void;
}

const CompanyDashboard = ({ company, onBack }: CompanyDashboardProps) => {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, [company.id]);

  const fetchData = async () => {
    setLoading(true);
    
    // Fetch API keys for this company
    const { data: keysData, error: keysError } = await supabase
      .from("widget_api_keys")
      .select("*")
      .eq("company_id", company.id)
      .order("created_at", { ascending: false });

    if (keysError) {
      toast({ title: "Error loading API keys", description: keysError.message, variant: "destructive" });
    } else {
      setApiKeys(keysData || []);
    }

    // Fetch usage logs for this company
    const { data: logsData, error: logsError } = await supabase
      .from("usage_logs")
      .select("*")
      .eq("company_id", company.id);

    if (logsError) {
      toast({ title: "Error loading usage data", description: logsError.message, variant: "destructive" });
    } else {
      const logs = logsData || [];
      
      // Calculate stats
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      
      const thisMonthLogs = logs.filter(
        (log) => new Date(log.created_at) >= startOfMonth
      );
      
      const successLogs = logs.filter(
        (log) => log.response_status && log.response_status >= 200 && log.response_status < 400
      );
      
      const responseTimes = logs
        .filter((log) => log.response_time_ms !== null)
        .map((log) => log.response_time_ms as number);
      
      const avgResponseTime = responseTimes.length > 0
        ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
        : 0;

      // Count endpoints
      const endpointCounts: Record<string, number> = {};
      logs.forEach((log) => {
        endpointCounts[log.endpoint] = (endpointCounts[log.endpoint] || 0) + 1;
      });
      
      const endpoints = Object.entries(endpointCounts)
        .map(([endpoint, count]) => ({ endpoint, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      setUsageStats({
        total_requests: logs.length,
        requests_this_month: thisMonthLogs.length,
        avg_response_time: avgResponseTime,
        success_rate: logs.length > 0 ? Math.round((successLogs.length / logs.length) * 100) : 100,
        endpoints,
      });
    }

    setLoading(false);
  };

  const getPlanBadgeVariant = (plan: SubscriptionPlan) => {
    switch (plan) {
      case "admin": return "destructive";
      case "enterprise": return "default";
      case "pro": return "default";
      case "starter": return "secondary";
      default: return "outline";
    }
  };

  const getStatusBadgeVariant = (status: SubscriptionStatus) => {
    switch (status) {
      case "active": return "default";
      case "trialing": return "secondary";
      case "past_due": return "destructive";
      case "cancelled": return "outline";
      default: return "outline";
    }
  };

  const usagePercentage = usageStats 
    ? Math.min(100, Math.round((usageStats.requests_this_month / company.monthly_request_limit) * 100))
    : 0;

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold">{company.name}</h2>
          <p className="text-muted-foreground">Company Dashboard</p>
        </div>
        <Badge variant={getPlanBadgeVariant(company.plan)} className="capitalize text-sm px-3 py-1">
          {company.plan}
        </Badge>
        <Badge variant={getStatusBadgeVariant(company.plan_status)} className="capitalize text-sm px-3 py-1">
          {company.plan_status.replace("_", " ")}
        </Badge>
      </div>

      {/* Company Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Company Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="text-sm font-medium">{company.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Website</p>
                <p className="text-sm font-medium">{company.website || "—"}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Created</p>
                <p className="text-sm font-medium">{new Date(company.created_at).toLocaleDateString()}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Notes</p>
                <p className="text-sm font-medium">{company.notes || "—"}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Usage Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">This Month</p>
                <p className="text-2xl font-bold">{usageStats?.requests_this_month.toLocaleString() || 0}</p>
              </div>
              <Activity className="h-8 w-8 text-primary" />
            </div>
            <div className="mt-2">
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>{usagePercentage}% of limit</span>
                <span>{company.monthly_request_limit.toLocaleString()}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-primary rounded-full h-2 transition-all" 
                  style={{ width: `${usagePercentage}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total Requests</p>
            <p className="text-2xl font-bold">{usageStats?.total_requests.toLocaleString() || 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Avg Response Time</p>
            <p className="text-2xl font-bold">{usageStats?.avg_response_time || 0}ms</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Success Rate</p>
            <p className="text-2xl font-bold">{usageStats?.success_rate || 100}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Top Endpoints */}
      {usageStats && usageStats.endpoints.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Top Endpoints</CardTitle>
            <CardDescription>Most used API endpoints</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {usageStats.endpoints.map((ep) => (
                <div key={ep.endpoint} className="flex items-center justify-between py-2 border-b last:border-0">
                  <code className="text-sm bg-muted px-2 py-1 rounded">{ep.endpoint}</code>
                  <Badge variant="secondary">{ep.count.toLocaleString()} requests</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* API Keys */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Key className="h-5 w-5" />
            API Keys ({apiKeys.length})
          </CardTitle>
          <CardDescription>API keys associated with this company</CardDescription>
        </CardHeader>
        <CardContent>
          {apiKeys.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">No API keys for this company</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Domain</TableHead>
                  <TableHead>Requests</TableHead>
                  <TableHead>Last Used</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {apiKeys.map((key) => (
                  <TableRow key={key.id}>
                    <TableCell className="font-medium">{key.name}</TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-2 py-1 rounded">{key.domain || "Any"}</code>
                    </TableCell>
                    <TableCell>{key.request_count.toLocaleString()}</TableCell>
                    <TableCell>
                      {key.last_used_at 
                        ? new Date(key.last_used_at).toLocaleDateString()
                        : "Never"
                      }
                    </TableCell>
                    <TableCell>
                      <Badge variant={key.is_active ? "default" : "outline"}>
                        {key.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CompanyDashboard;
