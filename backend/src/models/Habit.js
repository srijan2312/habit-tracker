import mongoose from 'mongoose';

const HabitSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  description: { type: String },
  frequency: { type: String, required: true },
  custom_days: [{ type: Number }],
  start_date: { type: String },
  reminder_time: { type: String },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
  tracking: [{ date: String, completed: Boolean }]
});

export default mongoose.model('Habit', HabitSchema);
