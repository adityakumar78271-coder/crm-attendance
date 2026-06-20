import mongoose from 'mongoose'

const attendanceSchema = new mongoose.Schema({
  employeeId: { type: String, required: true, trim: true },
  date: { type: Date, required: true },
  checkIn: { type: Date },
  checkOut: { type: Date },
  workingHours: { type: Number, default: 0 },
  status: { type: String, enum: ['present', 'absent', 'half-day', 'leave'], default: 'present' },
  checkInPhoto: { type: String, default: '' },
  checkOutPhoto: { type: String, default: '' },
  checkInLocation: {
    latitude: { type: Number },
    longitude: { type: Number },
    address: { type: String, default: '' }
  },
  checkOutLocation: {
    latitude: { type: Number },
    longitude: { type: Number },
    address: { type: String, default: '' }
  },
  notes: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true })

export default mongoose.model('Attendance', attendanceSchema)
