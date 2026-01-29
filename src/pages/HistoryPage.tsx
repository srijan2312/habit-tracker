import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/useAuth';
import { Header } from '@/components/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Download, Clock, CheckCircle2, Plus, Trash2 } from 'lucide-react';
import { API_URL } from '@/config/api';

interface Activity {
  id: string;
  habit_name: string;
  action: string;
  created_at: string;
  details?: any;
}

export default function HistoryPage() {
  const { user } = useAuth();
  const token = localStorage.getItem('token');
  const [filterAction, setFilterAction] = useState('all');
  const [downloading, setDownloading] = useState<'csv' | 'json' | null>(null);

  const activitiesQuery = useQuery({
    queryKey: ['activity-history', filterAction],
    enabled: Boolean(token),
    queryFn: async () => {
      const url = new URL(`${API_URL}/api/activity/history`);
      if (filterAction !== 'all') {
        url.searchParams.append('action', filterAction);
      }

      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to load activity history');
      const data = await res.json();
      return data.activities || [];
    },
  });

  const handleExport = async (format: 'csv' | 'json') => {
    setDownloading(format);
    try {
      const res = await fetch(`${API_URL}/api/activity/export/${format}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error('Failed to export');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `habit-activity.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success(`Exported as ${format.toUpperCase()}`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to export');
    } finally {
      setDownloading(null);
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'created':
        return <Plus className="h-4 w-4 text-blue-500" />;
      case 'deleted':
        return <Trash2 className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Completed</Badge>;
      case 'created':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Created</Badge>;
      case 'deleted':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Deleted</Badge>;
      case 'edited':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Edited</Badge>;
      default:
        return <Badge variant="secondary">{action}</Badge>;
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />

      <main className="flex-1 py-6 sm:py-10">
        <div className="container max-w-4xl px-4 sm:px-6 space-y-6 sm:space-y-8">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-primary" />
              <p className="text-sm font-medium text-primary">Timeline</p>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold">Activity History</h1>
            <p className="text-muted-foreground max-w-2xl">
              View all your habit actions and export your data.
            </p>
          </div>

          {/* Export and Filter */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Filter by Action</label>
              <Select value={filterAction} onValueChange={setFilterAction}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="created">Created</SelectItem>
                  <SelectItem value="edited">Edited</SelectItem>
                  <SelectItem value="deleted">Deleted</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Export Data</label>
              <Button
                variant="outline"
                onClick={() => handleExport('csv')}
                disabled={downloading !== null}
                className="w-full"
              >
                <Download className="h-4 w-4 mr-2" />
                {downloading === 'csv' ? 'Exporting...' : 'CSV'}
              </Button>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">&nbsp;</label>
              <Button
                variant="outline"
                onClick={() => handleExport('json')}
                disabled={downloading !== null}
                className="w-full"
              >
                <Download className="h-4 w-4 mr-2" />
                {downloading === 'json' ? 'Exporting...' : 'JSON'}
              </Button>
            </div>
          </div>

          {/* Activity List */}
          {activitiesQuery.isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Card key={i}>
                  <CardContent className="pt-6">
                    <Skeleton className="h-12 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : activitiesQuery.data?.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p>No activity history yet.</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {activitiesQuery.data?.map((activity: Activity) => (
                <Card key={activity.id}>
                  <CardContent className="pt-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="mt-1">{getActionIcon(activity.action)}</div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold truncate">{activity.habit_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(activity.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-2 sm:flex-col sm:items-end">
                        {getActionBadge(activity.action)}
                        {activity.details && Object.keys(activity.details).length > 0 && (
                          <span className="text-xs text-muted-foreground">
                            {Object.entries(activity.details)
                              .map(([key, val]) => `${key}: ${val}`)
                              .join(', ')}
                          </span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* GDPR Info */}
          <Card className="bg-muted/40">
            <CardHeader>
              <CardTitle className="text-base">Your Data</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>✓ All your personal data is encrypted and stored securely.</p>
              <p>✓ You can export your data at any time in CSV or JSON format.</p>
              <p>✓ You can delete your account anytime from Settings > Danger Zone.</p>
              <p>
                ✓ We comply with GDPR and data protection regulations. Your privacy is our priority.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
