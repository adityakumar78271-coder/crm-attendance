import mongoose from 'mongoose'

const userSchema = new mongoose.Schema({
  employeeId: { type: String, required: true, unique: true, trim: true },
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  mobile: { type: String, required: true, trim: true },
  username: { type: String, required: true, unique: true, trim: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'employee'], default: 'employee' },
  department: { type: String, trim: true },
  designation: { type: String, trim: true },
  joiningDate: { type: Date },
  isActive: { type: Boolean, default: true },
  avatar: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true })

export default mongoose.model('User', userSchema)
