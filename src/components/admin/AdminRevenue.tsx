import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, TrendingUp, DollarSign, Users, Activity } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

interface Company {
  id: string;
  plan: string;
  plan_status: string;
  created_at: string;
}

interface Invoice {
  amount_cents: number;
  status: string;
  created_at: string;
}

interface ApiKey {
  request_count: number;
  created_at: string;
}

const PLAN_COLORS = {
  free: "hsl(var(--muted))",
  starter: "hsl(var(--secondary))",
  pro: "hsl(var(--primary))",
  enterprise: "hsl(var(--accent))",
};

const AdminRevenue = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalMRR: 0,
    totalCompanies: 0,
    paidCompanies: 0,
    totalRequests: 0,
    planDistribution: [] as { name: string; value: number }[],
    revenueByMonth: [] as { month: string; revenue: number }[],
  });

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);

      const [companiesRes, invoicesRes, keysRes] = await Promise.all([
        supabase.from("companies").select("id, plan, plan_status, created_at"),
        supabase.from("invoices").select("amount_cents, status, created_at"),
        supabase.from("widget_api_keys").select("request_count, created_at"),
      ]);

      const companies: Company[] = companiesRes.data || [];
      const invoices: Invoice[] = invoicesRes.data || [];
      const apiKeys: ApiKey[] = keysRes.data || [];

      // Calculate plan distribution
      const planCounts: Record<string, number> = {};
      companies.forEach((c) => {
        planCounts[c.plan] = (planCounts[c.plan] || 0) + 1;
      });
      const planDistribution = Object.entries(planCounts).map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value,
      }));

      // Calculate MRR (monthly recurring revenue from paid invoices in last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const recentPaidInvoices = invoices.filter(
        (i) => i.status === "paid" && new Date(i.created_at) >= thirtyDaysAgo
      );
      const totalMRR = recentPaidInvoices.reduce((sum, i) => sum + i.amount_cents, 0) / 100;

      // Calculate revenue by month
      const revenueByMonth: Record<string, number> = {};
      invoices
        .filter((i) => i.status === "paid")
        .forEach((invoice) => {
          const date = new Date(invoice.created_at);
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
          revenueByMonth[monthKey] = (revenueByMonth[monthKey] || 0) + invoice.amount_cents / 100;
        });

      // Sort and format for chart
      const sortedMonths = Object.entries(revenueByMonth)
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-12) // Last 12 months
        .map(([month, revenue]) => ({
          month: new Date(month + "-01").toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
          revenue,
        }));

      // Total requests
      const totalRequests = apiKeys.reduce((sum, k) => sum + k.request_count, 0);

      // Paid companies (not on free plan)
      const paidCompanies = companies.filter((c) => c.plan !== "free" && c.plan_status === "active").length;

      setStats({
        totalMRR,
        totalCompanies: companies.length,
        paidCompanies,
        totalRequests,
        planDistribution,
        revenueByMonth: sortedMonths,
      });

      setLoading(false);
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${stats.totalMRR.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Companies</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCompanies}</div>
            <p className="text-xs text-muted-foreground">{stats.paidCompanies} paying</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalCompanies > 0
                ? ((stats.paidCompanies / stats.totalCompanies) * 100).toFixed(1)
                : 0}
              %
            </div>
            <p className="text-xs text-muted-foreground">Free to paid</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">API Requests</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRequests.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Revenue Over Time</CardTitle>
            <CardDescription>Monthly revenue from paid invoices</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.revenueByMonth.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No revenue data yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={stats.revenueByMonth}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" tickFormatter={(v) => `$${v}`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number) => [`$${value.toFixed(2)}`, "Revenue"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="hsl(var(--primary))"
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Plan Distribution</CardTitle>
            <CardDescription>Companies by subscription tier</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.planDistribution.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No companies yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={stats.planDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    fill="#8884d8"
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {stats.planDistribution.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={PLAN_COLORS[entry.name.toLowerCase() as keyof typeof PLAN_COLORS] || "hsl(var(--muted))"}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminRevenue;
