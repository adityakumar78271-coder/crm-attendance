import express from 'express'
import fs from 'fs'
import path from 'path'
import Attendance from '../models/Attendance.js'
import User from '../models/User.js'
import { protect } from '../middleware/authMiddleware.js'
import { getIo } from '../utils/socket.js'

const router = express.Router()

const uploadsRoot = path.join(process.cwd(), 'uploads')
const attendanceUploadDir = path.join(uploadsRoot, 'attendance')

const normalizeLocation = (value) => {
  if (!value || typeof value !== 'object') return {}
  return {
    latitude: value.latitude ?? value.lat ?? null,
    longitude: value.longitude ?? value.lng ?? null,
    address: value.address || ''
  }
}

const formatTime = (value) => {
  const date = value ? new Date(value) : new Date()
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

const saveImageFromBase64 = async (imageValue) => {
  if (!imageValue) return ''

  let base64 = imageValue
  let mimeType = 'image/jpeg'

  if (typeof imageValue === 'object' && imageValue.base64) {
    base64 = imageValue.base64
    mimeType = imageValue.mimeType || imageValue.type || 'image/jpeg'
  }

  if (base64.startsWith('data:')) {
    const [header, data] = base64.split(',')
    mimeType = header.split(';')[0].split(':')[1] || mimeType
    base64 = data
  }

  const buffer = Buffer.from(base64, 'base64')
  if (!buffer.length) {
    throw new Error('Invalid image payload')
  }

  const extension = mimeType.includes('png') ? '.png' : '.jpg'
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}${extension}`
  const filePath = path.join(attendanceUploadDir, fileName)

  await fs.promises.mkdir(attendanceUploadDir, { recursive: true })
  await fs.promises.writeFile(filePath, buffer)

  return `/uploads/attendance/${fileName}`
}

const emitAttendanceEvent = async (eventName, record, employee, action) => {
  const io = getIo()
  const payload = {
    record,
    employee,
    action,
    message: `Employee ${employee?.name || 'Employee'} punched ${action === 'check-in' ? 'in' : 'out'} at ${formatTime(record[action === 'check-in' ? 'checkIn' : 'checkOut'])}`
  }
  io.to('admin').emit(eventName, payload)
}

router.get('/summary', protect, async (req, res, next) => {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const baseQuery = { date: { $gte: today } }
    const records = await Attendance.find(baseQuery)
    const totalEmployees = await User.countDocuments({ role: 'employee', isActive: true })
    const present = records.filter((record) => record.status === 'present' || record.checkIn).length
    const absent = Math.max(totalEmployees - present, 0)

    res.status(200).json({
      success: true,
      summary: {
        totalEmployees,
        present,
        absent,
        checkedIn: records.filter((record) => record.checkIn).length
      }
    })
  } catch (error) {
    next(error)
  }
})

router.get('/', protect, async (req, res, next) => {
  try {
    const query = req.user.role === 'admin' ? {} : { employeeId: req.user.employeeId }
    const records = await Attendance.find(query).sort({ date: -1 })
    res.status(200).json({ success: true, records })
  } catch (error) {
    next(error)
  }
})

router.post('/check-in', protect, async (req, res, next) => {
  try {
    const employeeId = req.user.employeeId
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const existing = await Attendance.findOne({ employeeId, date: { $gte: today } })
    if (existing?.checkIn) {
      return res.status(400).json({ success: false, message: 'You have already checked in today' })
    }

    const now = new Date()
    const location = normalizeLocation(req.body.location)
    const photoUrl = await saveImageFromBase64(req.body.image || req.body.imageBase64 || req.body.photo)

    const record = await Attendance.findOneAndUpdate(
      { employeeId, date: { $gte: today } },
      {
        employeeId,
        date: now,
        checkIn: now,
        status: 'present',
        checkInLocation: location,
        checkInPhoto: photoUrl || undefined
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    )

    const employee = await User.findById(req.user._id)
    await emitAttendanceEvent('attendanceCreated', record, employee, 'check-in')

    res.status(200).json({ success: true, record })
  } catch (error) {
    next(error)
  }
})

router.post('/check-out', protect, async (req, res, next) => {
  try {
    const employeeId = req.user.employeeId
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const record = await Attendance.findOne({ employeeId, date: { $gte: today } })
    if (!record || !record.checkIn) {
      return res.status(400).json({ success: false, message: 'You must check in first' })
    }

    const location = normalizeLocation(req.body.location)
    const photoUrl = await saveImageFromBase64(req.body.image || req.body.imageBase64 || req.body.photo)

    record.checkOut = new Date()
    record.checkOutLocation = location
    record.checkOutPhoto = photoUrl || record.checkOutPhoto
    record.workingHours = Math.max(
      Math.round(((record.checkOut - record.checkIn) / (1000 * 60 * 60)) * 10) / 10,
      0
    )

    await record.save()

    const employee = await User.findById(req.user._id)
    await emitAttendanceEvent('attendanceUpdated', record, employee, 'check-out')

    res.status(200).json({ success: true, record })
  } catch (error) {
    next(error)
  }
})

export default router
