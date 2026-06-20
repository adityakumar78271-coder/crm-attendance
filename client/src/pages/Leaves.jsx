import React, { useEffect, useState } from 'react'
import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  MenuItem,
  Stack,
  TextField,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Chip
} from '@mui/material'
import { useDispatch, useSelector } from 'react-redux'
import { fetchLeaves, submitLeave, reviewLeave } from '../store/leaveSlice'
import { fetchEmployees } from '../store/employeeSlice'
import { format } from 'date-fns'

export default function Leaves() {
  const dispatch = useDispatch()
  const user = useSelector((state) => state.auth.user)
  const { leaves } = useSelector((state) => state.leaves)
  const { employees } = useSelector((state) => state.employees)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ leaveType: 'Casual', fromDate: '', toDate: '', reason: '' })
  const [reviewDialog, setReviewDialog] = useState(false)
  const [selectedLeave, setSelectedLeave] = useState(null)
  const [adminNotes, setAdminNotes] = useState('')

  useEffect(() => {
    dispatch(fetchLeaves())
    dispatch(fetchEmployees())
  }, [dispatch])

  const employeeMap = employees.reduce((acc, employee) => {
    acc[employee._id] = employee
    acc[employee.employeeId] = employee
    return acc
  }, {})

  const handleSubmit = () => {
    dispatch(submitLeave(form))
    setOpen(false)
  }

  const handleReview = (status) => {
    if (!selectedLeave) return
    dispatch(reviewLeave({ id: selectedLeave._id, status, adminNotes }))
    setReviewDialog(false)
    setSelectedLeave(null)
    setAdminNotes('')
  }

  const getEmployeeName = (leave) => {
    return (
      leave.employee?.name ||
      employeeMap[leave.employeeId]?.name ||
      employeeMap[leave.employee?._id]?.name ||
      'Employee'
    )
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" fontWeight={700}>Leaves</Typography>
        {(!user?.role || user.role === 'employee') && (
          <Button variant="contained" onClick={() => setOpen(true)}>Apply Leave</Button>
        )}
      </Box>
      <Card>
        <CardContent>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Employee</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>From</TableCell>
                <TableCell>To</TableCell>
                <TableCell>Status</TableCell>
                {user?.role === 'admin' && <TableCell>Action</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {leaves.map((leave) => (
                <TableRow key={leave._id}>
                  <TableCell>{getEmployeeName(leave)}</TableCell>
                  <TableCell>{leave.leaveType}</TableCell>
                  <TableCell>{format(new Date(leave.fromDate), 'MMM d, yyyy')}</TableCell>
                  <TableCell>{format(new Date(leave.toDate), 'MMM d, yyyy')}</TableCell>
                  <TableCell>
                    <Chip
                      label={leave.status}
                      color={leave.status === 'Approved' ? 'success' : leave.status === 'Rejected' ? 'error' : 'warning'}
                      size="small"
                    />
                  </TableCell>
                  {user?.role === 'admin' && (
                    <TableCell>
                      <Stack direction="row" spacing={1}>
                        <Button
                          size="small"
                          variant="contained"
                          color="success"
                          onClick={() => {
                            setSelectedLeave(leave)
                            setAdminNotes(leave.adminNotes || '')
                            setReviewDialog(true)
                          }}
                        >
                          Approve
                        </Button>
                        <Button
                          size="small"
                          variant="contained"
                          color="error"
                          onClick={() => {
                            setSelectedLeave(leave)
                            setAdminNotes(leave.adminNotes || '')
                            setReviewDialog(true)
                          }}
                        >
                          Reject
                        </Button>
                      </Stack>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Apply Leave</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}><TextField select fullWidth label="Leave Type" value={form.leaveType} onChange={(e) => setForm({ ...form, leaveType: e.target.value })}><MenuItem value="Casual">Casual</MenuItem><MenuItem value="Sick">Sick</MenuItem><MenuItem value="Annual">Annual</MenuItem><MenuItem value="Emergency">Emergency</MenuItem></TextField></Grid>
            <Grid item xs={12} sm={6}><TextField fullWidth label="From Date" type="date" InputLabelProps={{ shrink: true }} value={form.fromDate} onChange={(e) => setForm({ ...form, fromDate: e.target.value })} /></Grid>
            <Grid item xs={12} sm={6}><TextField fullWidth label="To Date" type="date" InputLabelProps={{ shrink: true }} value={form.toDate} onChange={(e) => setForm({ ...form, toDate: e.target.value })} /></Grid>
            <Grid item xs={12}><TextField fullWidth label="Reason" multiline minRows={3} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit}>Submit</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={reviewDialog} onClose={() => setReviewDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{selectedLeave?.status === 'Approved' ? 'Approve Leave' : selectedLeave?.status === 'Rejected' ? 'Reject Leave' : 'Review Leave'}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            minRows={3}
            label="Admin Notes"
            value={adminNotes}
            onChange={(e) => setAdminNotes(e.target.value)}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReviewDialog(false)}>Cancel</Button>
          <Button variant="contained" color="success" onClick={() => handleReview('Approved')}>Approve</Button>
          <Button variant="contained" color="error" onClick={() => handleReview('Rejected')}>Reject</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
