import express from 'express'
import Leave from '../models/Leave.js'
import { protect, adminOnly } from '../middleware/authMiddleware.js'

const router = express.Router()

router.get('/', protect, async (req, res, next) => {
  try {
    const query = req.user.role === 'admin' ? {} : { employeeId: req.user.employeeId }
    const leaves = await Leave.find(query).sort({ createdAt: -1 })
    res.status(200).json({ success: true, leaves })
  } catch (error) {
    next(error)
  }
})

router.post('/', protect, async (req, res, next) => {
  try {
    const leave = await Leave.create({
      employeeId: req.user.employeeId,
      leaveType: req.body.leaveType,
      fromDate: req.body.fromDate,
      toDate: req.body.toDate,
      reason: req.body.reason,
      status: 'Pending'
    })
    res.status(201).json({ success: true, leave })
  } catch (error) {
    next(error)
  }
})

router.put('/:id', protect, adminOnly, async (req, res, next) => {
  try {
    const leave = await Leave.findByIdAndUpdate(req.params.id, req.body, { new: true })
    if (!leave) {
      return res.status(404).json({ success: false, message: 'Leave request not found' })
    }
    res.status(200).json({ success: true, leave })
  } catch (error) {
    next(error)
  }
})

export default router
