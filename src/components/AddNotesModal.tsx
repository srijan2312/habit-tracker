import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { API_URL } from '@/config/api';

interface AddNotesModalProps {
  open: boolean;
  onClose: () => void;
  habitId: string;
  habitName: string;
  completedDate: string;
  onSuccess?: () => void;
  token: string | null;
}

export const AddNotesModal: React.FC<AddNotesModalProps> = ({
  open,
  onClose,
  habitId,
  habitName,
  completedDate,
  onSuccess,
  token,
}) => {
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!note.trim()) {
      toast.error('Please add a note');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/notes/habit/${habitId}/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          completedDate,
          note: note.trim(),
        }),
      });

      if (!res.ok) throw new Error('Failed to add note');
      
      toast.success('Note added!');
      setNote('');
      onClose();
      onSuccess?.();
    } catch (err: any) {
      toast.error(err.message || 'Failed to add note');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Note</DialogTitle>
          <DialogDescription>
            Add a note for completing "{habitName}" on {new Date(completedDate).toLocaleDateString()}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="note">What happened today?</Label>
            <Textarea
              id="note"
              placeholder="e.g., Great workout at the gym, felt energized..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Adding...' : 'Add Note'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
