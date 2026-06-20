import React, { useEffect, useState } from 'react'
import {
  Alert,
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
  TextField,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  CircularProgress
} from '@mui/material'
import { useDispatch, useSelector } from 'react-redux'
import { fetchEmployees, createEmployee } from '../store/employeeSlice'
import { toast } from 'react-toastify'

export default function Employees() {
  const dispatch = useDispatch()
  const { employees, loading, error } = useSelector((state) => state.employees)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({
    employeeId: '',
    name: '',
    email: '',
    mobile: '',
    username: '',
    password: '',
    department: '',
    designation: '',
    joiningDate: ''
  })

  useEffect(() => {
    dispatch(fetchEmployees())
  }, [dispatch])

  const handleSubmit = async () => {
    const result = await dispatch(createEmployee(form))
    if (result.meta.requestStatus === 'fulfilled') {
      await dispatch(fetchEmployees())
      toast.success('Employee created successfully')
      setOpen(false)
      setForm({
        employeeId: '',
        name: '',
        email: '',
        mobile: '',
        username: '',
        password: '',
        department: '',
        designation: '',
        joiningDate: ''
      })
    } else {
      toast.error(result.payload || 'Unable to create employee')
    }
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" fontWeight={700}>Employees</Typography>
        <Button variant="contained" onClick={() => setOpen(true)}>Add Employee</Button>
      </Box>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Card>
        <CardContent>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Employee ID</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Mobile</TableCell>
                <TableCell>Username</TableCell>
                <TableCell>Department</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {employees.map((employee) => (
                <TableRow key={employee._id}>
                  <TableCell>{employee.name}</TableCell>
                  <TableCell>{employee.employeeId}</TableCell>
                  <TableCell>{employee.email}</TableCell>
                  <TableCell>{employee.mobile}</TableCell>
                  <TableCell>{employee.username}</TableCell>
                  <TableCell>{employee.department}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Add Employee</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}><TextField fullWidth label="Employee ID" value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })} /></Grid>
            <Grid item xs={12} sm={6}><TextField fullWidth label="Full Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Grid>
            <Grid item xs={12} sm={6}><TextField fullWidth label="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Grid>
            <Grid item xs={12} sm={6}><TextField fullWidth label="Mobile" value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} /></Grid>
            <Grid item xs={12} sm={6}><TextField fullWidth label="Username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} /></Grid>
            <Grid item xs={12} sm={6}><TextField fullWidth label="Password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></Grid>
            <Grid item xs={12} sm={6}><TextField fullWidth label="Department" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} /></Grid>
            <Grid item xs={12} sm={6}><TextField fullWidth label="Designation" value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} /></Grid>
            <Grid item xs={12} sm={6}><TextField fullWidth label="Joining Date" type="date" InputLabelProps={{ shrink: true }} value={form.joiningDate} onChange={(e) => setForm({ ...form, joiningDate: e.target.value })} /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit} disabled={loading}>
            {loading ? <CircularProgress size={22} color="inherit" /> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
