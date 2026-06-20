import express from 'express'
import Department from '../models/Department.js'
import { protect, adminOnly } from '../middleware/authMiddleware.js'

const router = express.Router()

router.get('/', protect, async (req, res, next) => {
  try {
    const departments = await Department.find().sort({ createdAt: -1 })
    res.status(200).json({ success: true, departments })
  } catch (error) {
    next(error)
  }
})

router.post('/', protect, adminOnly, async (req, res, next) => {
  try {
    const department = await Department.create(req.body)
    res.status(201).json({ success: true, department })
  } catch (error) {
    next(error)
  }
})

router.put('/:id', protect, adminOnly, async (req, res, next) => {
  try {
    const department = await Department.findByIdAndUpdate(req.params.id, req.body, { new: true })
    if (!department) {
      return res.status(404).json({ success: false, message: 'Department not found' })
    }
    res.status(200).json({ success: true, department })
  } catch (error) {
    next(error)
  }
})

router.delete('/:id', protect, adminOnly, async (req, res, next) => {
  try {
    const department = await Department.findByIdAndDelete(req.params.id)
    if (!department) {
      return res.status(404).json({ success: false, message: 'Department not found' })
    }
    res.status(200).json({ success: true, message: 'Department deleted' })
  } catch (error) {
    next(error)
  }
})

export default router
