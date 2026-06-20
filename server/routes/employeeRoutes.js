import express from 'express'
import bcrypt from 'bcryptjs'
import User from '../models/User.js'
import { protect, adminOnly } from '../middleware/authMiddleware.js'

const router = express.Router()

router.get('/', protect, adminOnly, async (req, res, next) => {
  try {
    const employees = await User.find().sort({ createdAt: -1 })
    res.status(200).json({ success: true, employees })
  } catch (error) {
    next(error)
  }
})

router.post('/', protect, adminOnly, async (req, res, next) => {
  try {
    const {
      employeeId,
      name,
      email,
      mobile,
      username,
      password,
      role,
      department,
      designation,
      joiningDate,
      isActive = true
    } = req.body

    if (!employeeId || !name || !email || !mobile || !username || !password) {
      return res.status(400).json({ success: false, message: 'Required employee fields are missing' })
    }

    const existing = await User.findOne({ $or: [{ email }, { username }, { mobile }, { employeeId }] })
    if (existing) {
      return res.status(400).json({ success: false, message: 'Employee already exists' })
    }

    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)

    const employee = await User.create({
      employeeId,
      name,
      email,
      mobile,
      username,
      password: hashedPassword,
      role: role || 'employee',
      department,
      designation,
      joiningDate,
      isActive
    })

    res.status(201).json({ success: true, employee })
  } catch (error) {
    next(error)
  }
})

router.put('/:id', protect, adminOnly, async (req, res, next) => {
  try {
    const employee = await User.findByIdAndUpdate(req.params.id, req.body, { new: true })
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' })
    }
    res.status(200).json({ success: true, employee })
  } catch (error) {
    next(error)
  }
})

router.put('/:id/reset-password', protect, adminOnly, async (req, res, next) => {
  try {
    const { newPassword } = req.body
    if (!newPassword) {
      return res.status(400).json({ success: false, message: 'New password is required' })
    }

    const employee = await User.findById(req.params.id)
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' })
    }

    const salt = await bcrypt.genSalt(10)
    employee.password = await bcrypt.hash(newPassword, salt)
    await employee.save()

    res.status(200).json({ success: true, message: 'Password reset successfully' })
  } catch (error) {
    next(error)
  }
})

router.put('/:id/toggle-status', protect, adminOnly, async (req, res, next) => {
  try {
    const employee = await User.findById(req.params.id)
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' })
    }

    employee.isActive = !employee.isActive
    await employee.save()

    res.status(200).json({ success: true, employee })
  } catch (error) {
    next(error)
  }
})

router.delete('/:id', protect, adminOnly, async (req, res, next) => {
  try {
    const employee = await User.findByIdAndDelete(req.params.id)
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' })
    }
    res.status(200).json({ success: true, message: 'Employee deleted' })
  } catch (error) {
    next(error)
  }
})

export default router
