import { useState, useMemo } from 'react';
import { useHabits, HabitWithStats } from '@/hooks/useHabits';
import { Header } from '@/components/Header';
import { HabitCard } from '@/components/HabitCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, X } from 'lucide-react';

type SortType = 'name' | 'frequency' | 'streak' | 'created';
type StatusFilter = 'all' | 'completed' | 'pending';

type HabitCategory = string | { name?: string } | null | undefined;
type HabitWithCategory = HabitWithStats & { category?: HabitCategory };

const hasName = (value: unknown): value is { name?: string } => {
  return typeof value === 'object' && value !== null && 'name' in value;
};

const normalizeCategory = (value: unknown) => {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed ? trimmed : 'Uncategorized';
  }
  if (hasName(value)) {
    const name = String(value.name ?? '').trim();
    return name ? name : 'Uncategorized';
  }
  return 'Uncategorized';
};

export default function SearchPage() {
  const { habits, isLoading } = useHabits();
  const typedHabits = habits as HabitWithCategory[];
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortType>('name');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<StatusFilter>('all');

  const categories = useMemo(() => {
    const set = new Set<string>();
    typedHabits.forEach((habit) => set.add(normalizeCategory(habit.category)));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [typedHabits]);

  const filteredAndSorted = useMemo(() => {
    let result = typedHabits;

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (h) =>
          h.title.toLowerCase().includes(query) ||
          (h.description?.toLowerCase().includes(query) ?? false)
      );
    }

    // Filter by category
    if (filterCategory !== 'all') {
      result = result.filter((h) => normalizeCategory(h.category) === filterCategory);
    }

    // Filter by completion status
    if (filterStatus === 'completed') {
      result = result.filter((h) => h.isCompletedToday);
    } else if (filterStatus === 'pending') {
      result = result.filter((h) => !h.isCompletedToday);
    }

    // Sort
    result = [...result].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.title.localeCompare(b.title);
        case 'frequency': {
          const freqMap = { daily: 1, weekly: 2, monthly: 3 };
          return (
            (freqMap[a.frequency as keyof typeof freqMap] || 0) -
            (freqMap[b.frequency as keyof typeof freqMap] || 0)
          );
        }
        case 'streak':
          return (b.currentStreak ?? 0) - (a.currentStreak ?? 0);
        case 'created':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        default:
          return 0;
      }
    });

    return result;
  }, [typedHabits, searchQuery, sortBy, filterCategory, filterStatus]);

  const handleClearFilters = () => {
    setSearchQuery('');
    setSortBy('name');
    setFilterCategory('all');
    setFilterStatus('all');
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />

      <main className="flex-1 py-6 sm:py-10">
        <div className="container max-w-6xl px-4 sm:px-6 space-y-6 sm:space-y-8">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Search className="h-5 w-5 text-primary" />
              <p className="text-sm font-medium text-primary">Discover</p>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold">Search & Filter</h1>
            <p className="text-muted-foreground max-w-2xl">
              Find and organize your habits by name, category, frequency, and more.
            </p>
          </div>

          {/* Search and Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Search</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="Search habits by name or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10"
              />

              <Separator />

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Sort By</label>
                  <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortType)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name">Name (A-Z)</SelectItem>
                      <SelectItem value="frequency">Frequency</SelectItem>
                      <SelectItem value="streak">Longest Streak</SelectItem>
                      <SelectItem value="created">Recently Created</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Category</label>
                  <Select value={filterCategory} onValueChange={(v) => setFilterCategory(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Status</label>
                  <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as StatusFilter)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Habits</SelectItem>
                      <SelectItem value="completed">Completed Today</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {(searchQuery || filterCategory !== 'all' || filterStatus !== 'all' || sortBy !== 'name') && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearFilters}
                  className="w-full"
                >
                  <X className="h-4 w-4 mr-2" />
                  Clear All Filters
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Results */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">
                Results{' '}
                <span className="text-muted-foreground">({filteredAndSorted.length})</span>
              </h2>
            </div>

            {isLoading ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="rounded-lg border bg-card p-4">
                    <Skeleton className="h-6 w-32 mb-2" />
                    <Skeleton className="h-4 w-full mb-3" />
                    <Skeleton className="h-8 w-16" />
                  </div>
                ))}
              </div>
            ) : filteredAndSorted.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8 text-muted-foreground">
                    <Search className="h-10 w-10 mx-auto mb-3 opacity-30" />
                    <p>No habits match your search criteria.</p>
                    <p className="text-sm mt-1">Try adjusting your filters or creating a new habit.</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredAndSorted.map((habit) => (
                  <HabitCard
                    key={habit._id}
                    habit={habit}
                    onEdit={() => {}}
                    onDelete={() => {}}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Category Stats */}
          {filteredAndSorted.length > 0 && (
            <>
              <Separator />
              <div>
                <h3 className="text-lg font-semibold mb-4">Category Breakdown</h3>
                <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                  {categories.map((cat) => {
                    const count = filteredAndSorted.filter((h) => normalizeCategory(h.category) === cat).length;
                    if (count === 0) return null;
                    return (
                      <Card key={cat}>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">{cat}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-2xl font-bold">{count}</p>
                          <p className="text-xs text-muted-foreground">
                            {(count / filteredAndSorted.length * 100).toFixed(0)}% of results
                          </p>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
