import mongoose from 'mongoose'

const leaveSchema = new mongoose.Schema({
  employeeId: { type: String, required: true, trim: true },
  leaveType: { type: String, enum: ['Casual', 'Sick', 'Annual', 'Emergency', 'Other'], required: true },
  fromDate: { type: Date, required: true },
  toDate: { type: Date, required: true },
  reason: { type: String, required: true },
  status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
  adminNotes: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true })

export default mongoose.model('Leave', leaveSchema)
