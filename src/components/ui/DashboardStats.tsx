import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { fine } from "@/lib/fine";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Loader2 } from "lucide-react";

export function DashboardStats() {
  const [recentCalculations, setRecentCalculations] = useState<any[]>([]);
  const [specialtyStats, setSpecialtyStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { data: session } = fine.auth.useSession();
  
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!session?.user?.id) return;
      
      setLoading(true);
      try {
        // Fetch recent calculations with operation and hospital names
        const recentQuery = `
          SELECT 
            ch.id, ch.calculatedValue, ch.calculatedAt,
            o.name as operationName, h.name as hospitalName
          FROM calculationHistory ch
          JOIN operations o ON ch.operationId = o.id
          JOIN hospitals h ON ch.hospitalId = h.id
          WHERE ch.userId = ?
          ORDER BY ch.calculatedAt DESC
          LIMIT 5
        `;
        
        const recentData = await fine.execute(recentQuery, [session.user.id]);
        
        // Fetch specialty distribution
        const specialtyQuery = `
          SELECT 
            s.name as specialtyName,
            COUNT(ch.id) as calculationCount
          FROM calculationHistory ch
          JOIN operations o ON ch.operationId = o.id
          JOIN specialties s ON o.specialtyId = s.id
          WHERE ch.userId = ?
          GROUP BY s.id
          ORDER BY calculationCount DESC
          LIMIT 5
        `;
        
        const specialtyData = await fine.execute(specialtyQuery, [session.user.id]);
        
        if (recentData) {
          setRecentCalculations(recentData);
        }
        
        if (specialtyData) {
          setSpecialtyStats(specialtyData);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [session?.user?.id]);

  if (loading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card className="col-span-2 md:col-span-1">
        <CardHeader>
          <CardTitle>Recent Calculations</CardTitle>
          <CardDescription>Your last 5 operation valuations</CardDescription>
        </CardHeader>
        <CardContent>
          {recentCalculations.length === 0 ? (
            <p className="text-center text-muted-foreground">
              No calculations yet. Start by calculating an operation value.
            </p>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={recentCalculations}>
                  <XAxis 
                    dataKey="operationName" 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => value.length > 10 ? `${value.substring(0, 10)}...` : value}
                  />
                  <YAxis 
                    tickFormatter={(value) => `Q${value}`}
                  />
                  <Tooltip 
                    formatter={(value) => [`Q${value}`, 'Value']}
                    labelFormatter={(label) => `Operation: ${label}`}
                  />
                  <Bar dataKey="calculatedValue" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
      
      <Card className="col-span-2 md:col-span-1">
        <CardHeader>
          <CardTitle>Specialty Distribution</CardTitle>
          <CardDescription>Calculations by medical specialty</CardDescription>
        </CardHeader>
        <CardContent>
          {specialtyStats.length === 0 ? (
            <p className="text-center text-muted-foreground">
              No data available. Calculate operations from different specialties.
            </p>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={specialtyStats}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="calculationCount"
                    nameKey="specialtyName"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {specialtyStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} calculations`, 'Count']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}