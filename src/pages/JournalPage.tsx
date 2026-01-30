import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { BookOpen, Edit2, Save, X, Trash2, Plus, Calendar } from 'lucide-react';
import { API_URL } from '@/config/api';
import { format } from 'date-fns';

const getErrorMessage = (err: unknown) => {
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  return 'Something went wrong';
};

interface Note {
  id: string;
  habit_id: string;
  completed_date: string;
  note: string;
  created_at: string;
  habits: {
    name: string;
    category?: string;
  };
}

interface Habit {
  id: string;
  title: string;
  description?: string;
}

export default function JournalPage() {
  const { user } = useAuth();
  const token = localStorage.getItem('token');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newNote, setNewNote] = useState({ habitId: '', date: format(new Date(), 'yyyy-MM-dd'), note: '' });

  const notesQuery = useQuery({
    queryKey: ['habit-journal'],
    enabled: Boolean(token),
    queryFn: async () => {
      const res = await fetch(`${API_URL}/api/notes/recent/all?limit=100`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to load notes');
      const data = await res.json();
      return data.notes || [];
    },
  });

  const handleStartEdit = (note: Note) => {
    setEditingNoteId(note.id);
    setEditText(note.note);
  };

  const handleSaveEdit = async (noteId: string) => {
    if (!editText.trim()) {
      toast.error('Note cannot be empty');
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/notes/${noteId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ note: editText.trim() }),
      });

      if (!res.ok) throw new Error('Failed to update note');
      
      toast.success('Note updated!');
      setEditingNoteId(null);
      notesQuery.refetch();
    } catch (err) {
      toast.error(getErrorMessage(err) || 'Failed to update note');
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('Delete this note?')) return;

    try {
      const res = await fetch(`${API_URL}/api/notes/${noteId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error('Failed to delete note');
      
      toast.success('Note deleted');
      notesQuery.refetch();
    } catch (err) {
      toast.error(getErrorMessage(err) || 'Failed to delete note');
    }
  };

  // Fetch user's habits for the dropdown
  const habitsQuery = useQuery({
    queryKey: ['habits', user?._id],
    enabled: Boolean(token && user?._id),
    queryFn: async () => {
      console.log('Fetching habits for user:', user?._id);
      const res = await fetch(`${API_URL}/api/habits/${user?._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('Habits response status:', res.status);
      if (!res.ok) {
        const errorText = await res.text();
        console.error('Failed to load habits:', errorText);
        throw new Error('Failed to load habits');
      }
      const data = await res.json();
      console.log('Habits data:', data);
      return Array.isArray(data) ? data : [];
    },
  });

  const handleAddNote = async () => {
    if (!newNote.habitId || !newNote.date || !newNote.note.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/notes/habit/${newNote.habitId}/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          completedDate: newNote.date,
          note: newNote.note.trim(),
        }),
      });

      if (!res.ok) throw new Error('Failed to add note');
      
      toast.success('Note added!');
      setIsAddDialogOpen(false);
      setNewNote({ habitId: '', date: format(new Date(), 'yyyy-MM-dd'), note: '' });
      notesQuery.refetch();
    } catch (err) {
      toast.error(getErrorMessage(err) || 'Failed to add note');
    }
  };

  const filteredNotes = notesQuery.data?.filter((note: Note) =>
    note.note.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.habits?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <main className="flex-1 py-6 sm:py-10">
        <div className="container max-w-4xl px-4 sm:px-6 space-y-6 sm:space-y-8">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <BookOpen className="h-5 w-5 text-primary" />
              <p className="text-sm font-medium text-primary">Journal</p>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold">Habit Journal</h1>
            <p className="text-muted-foreground max-w-2xl">
              View and manage all your habit completion notes in one place.
            </p>
          </div>

          <div className="flex gap-2">
            <Input
              placeholder="Search notes or habits..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Note
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Journal Entry</DialogTitle>
                  <DialogDescription>
                    Add a note for any habit on any date.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="habit">Habit</Label>
                    <Select
                      value={newNote.habitId}
                      onValueChange={(value) => setNewNote({ ...newNote, habitId: value })}
                    >
                      <SelectTrigger id="habit">
                        <SelectValue placeholder="Select a habit" />
                      </SelectTrigger>
                      <SelectContent>Habit
                        {habitsQuery.isLoading ? (
                          <div className="p-2 text-sm text-muted-foreground">Loading habits...</div>
                        ) : habitsQuery.data?.length === 0 ? (
                          <div className="p-2 text-sm text-muted-foreground">No habits found</div>
                        ) : (
                          habitsQuery.data?.map((habit: any) => (
                            <SelectItem key={habit.id} value={habit.id}>
                              {habit.title}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date">Date</Label>
                    <div className="relative">
                      <Input
                        id="date"
                        type="date"
                        value={newNote.date}
                        onChange={(e) => setNewNote({ ...newNote, date: e.target.value })}
                        max={format(new Date(), 'yyyy-MM-dd')}
                        className="pr-10 [&::-webkit-calendar-picker-indicator]:opacity-100 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:dark:invert"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="note">Note</Label>
                    <Textarea
                      id="note"
                      placeholder="Write your thoughts..."
                      value={newNote.note}
                      onChange={(e) => setNewNote({ ...newNote, note: e.target.value })}
                      rows={4}
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddNote}>
                      <Save className="h-4 w-4 mr-2" />
                      Save Note
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {notesQuery.isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="pt-6">
                    <Skeleton className="h-20 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredNotes.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8 text-muted-foreground">
                  <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p>No notes yet. Add notes when completing your habits!</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredNotes.map((note: Note) => (
                <Card key={note.id}>
                  <CardHeader className="pb-3">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                      <div>
                        <CardTitle className="text-lg">{note.habits?.name}</CardTitle>
                        <CardDescription>
                          {new Date(note.completed_date).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </CardDescription>
                      </div>
                      {editingNoteId !== note.id && (
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleStartEdit(note)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteNote(note.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    {editingNoteId === note.id ? (
                      <>
                        <Textarea
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          rows={4}
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleSaveEdit(note.id)}
                          >
                            <Save className="h-4 w-4 mr-2" />
                            Save
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingNoteId(null)}
                          >
                            <X className="h-4 w-4 mr-2" />
                            Cancel
                          </Button>
                        </div>
                      </>
                    ) : (
                      <p className="text-foreground whitespace-pre-wrap break-words">
                        {note.note}
                      </p>
                    )}

                    <p className="text-xs text-muted-foreground">
                      Added {new Date(note.created_at).toLocaleString()}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
