import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Calendar, Clock, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { HabitWithStats } from '@/hooks/useHabits';

interface HabitFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (habit: {
    title: string;
    description: string | null;
    frequency: string;
    custom_days: number[] | null;
    start_date: string;
    reminder_time: string | null;
  }) => void;
  habit?: HabitWithStats | null;
  isLoading?: boolean;
}

const DAYS = [
  { value: 0, label: 'Sun' },
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
];

export const HabitFormModal: React.FC<HabitFormModalProps> = ({
  open,
  onClose,
  onSubmit,
  habit,
  isLoading,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [frequency, setFrequency] = useState('daily');
  const [customDays, setCustomDays] = useState<number[]>([]);
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [reminderTime, setReminderTime] = useState('');

  useEffect(() => {
    if (habit) {
      setTitle(habit.title);
      setDescription(habit.description || '');
      setFrequency(habit.frequency);
      setCustomDays(habit.custom_days || []);
      setStartDate(habit.start_date);
      setReminderTime(habit.reminder_time || '');
    } else {
      setTitle('');
      setDescription('');
      setFrequency('daily');
      setCustomDays([]);
      setStartDate(format(new Date(), 'yyyy-MM-dd'));
      setReminderTime('');
    }
  }, [habit, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      title: title.trim(),
      description: description.trim() || null,
      frequency,
      custom_days: frequency === 'custom' ? customDays : null,
      start_date: startDate,
      reminder_time: reminderTime || null,
    });
  };

  const toggleDay = (day: number) => {
    setCustomDays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day].sort()
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">
            {habit ? 'Edit Habit' : 'Create New Habit'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="title">Habit Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Morning meditation"
              required
              maxLength={100}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add some notes about this habit..."
              rows={3}
              maxLength={500}
            />
          </div>

          <div className="space-y-2">
            <Label>Frequency</Label>
            <Select value={frequency} onValueChange={setFrequency}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="custom">Custom Days</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {frequency === 'custom' && (
            <div className="space-y-2">
              <Label>Select Days</Label>
              <div className="flex flex-wrap gap-2">
                {DAYS.map(day => (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => toggleDay(day.value)}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                      customDays.includes(day.value)
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                    }`}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="startDate" className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-foreground" />
                Start Date
              </Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reminderTime" className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-foreground" />
                Reminder (optional)
              </Label>
              <Input
                id="reminderTime"
                type="time"
                value={reminderTime}
                onChange={(e) => setReminderTime(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!title.trim() || isLoading}>
              {isLoading ? 'Saving...' : habit ? 'Save Changes' : 'Create Habit'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default HabitFormModal;