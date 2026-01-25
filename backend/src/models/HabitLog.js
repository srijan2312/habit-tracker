import mongoose from 'mongoose';

const HabitLogSchema = new mongoose.Schema({
  habit_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Habit', required: true },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: String, required: true }, // 'yyyy-MM-dd'
  completed: { type: Boolean, default: true },
  created_at: { type: Date, default: Date.now },
});

const HabitLog = mongoose.model('HabitLog', HabitLogSchema);
export default HabitLog;
