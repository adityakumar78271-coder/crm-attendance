import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import { MongoMemoryServer } from 'mongodb-memory-server'
import User from '../models/User.js'

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/attendance-crm')
    console.log(`MongoDB Connected: ${conn.connection.host}`)
    await seedDefaultAdmin()
  } catch (error) {
    try {
      const mongoServer = await MongoMemoryServer.create()
      const mongoUri = mongoServer.getUri()
      const conn = await mongoose.connect(mongoUri)
      console.log(`MongoDB Connected via in-memory server: ${conn.connection.host}`)
      await seedDefaultAdmin()
    } catch (memoryError) {
      console.error(`MongoDB connection failed: ${error.message}`)
      console.error(`In-memory MongoDB fallback failed: ${memoryError.message}`)
      process.exit(1)
    }
  }
}

const seedDefaultAdmin = async () => {
  try {
    const adminExists = await User.findOne({ role: 'admin' })
    if (adminExists) {
      return
    }

    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash('Admin@1234', salt)

    await User.create({
      employeeId: 'ADM001',
      name: 'System Admin',
      email: 'admin@attendancecrm.com',
      mobile: '9999999999',
      username: 'admin',
      password: hashedPassword,
      role: 'admin',
      department: 'Administration',
      designation: 'Administrator',
      joiningDate: new Date(),
      isActive: true
    })

    console.log('Default admin created with username: admin and password: Admin@1234')
  } catch (error) {
    console.error(`Default admin seed failed: ${error.message}`)
  }
}

export default connectDB
