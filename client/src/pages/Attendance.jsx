import React, { useEffect, useMemo, useState } from 'react'
import {
  Avatar,
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
  Chip,
  TextField,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow
} from '@mui/material'
import { useDispatch, useSelector } from 'react-redux'
import { checkIn, checkOut, fetchAttendance } from '../store/attendanceSlice'
import { fetchEmployees } from '../store/employeeSlice'
import { fetchLeaves } from '../store/leaveSlice'
import { useSocket } from '../hooks/useSocket'
import { API_BASE_URL } from '../services/api'
import { format } from 'date-fns'
import * as XLSX from 'xlsx'

export default function Attendance() {
  const dispatch = useDispatch()
  const user = useSelector((state) => state.auth.user)
  const isAdmin = user?.role === 'admin'
  const { records } = useSelector((state) => state.attendance)
  const { employees } = useSelector((state) => state.employees)
  const { leaves } = useSelector((state) => state.leaves)
  const fileBaseUrl = API_BASE_URL.replace(/\/api$/, '')
  const [attendanceFilter, setAttendanceFilter] = useState('today')
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'))
  const [searchTerm, setSearchTerm] = useState('')

  useSocket({
    onAttendanceCreated: () => dispatch(fetchAttendance()),
    onAttendanceUpdated: () => dispatch(fetchAttendance())
  })

  useEffect(() => {
    dispatch(fetchAttendance())
    dispatch(fetchEmployees())
    if (isAdmin) {
      dispatch(fetchLeaves())
    }
  }, [dispatch, isAdmin])

  const employeeMap = employees.reduce((acc, employee) => {
    acc[employee._id] = employee
    acc[employee.employeeId] = employee
    return acc
  }, {})

  const getEmployeeName = (record) => {
    return (
      record.employee?.name ||
      employeeMap[record.employeeId]?.name ||
      employeeMap[record.employee?._id]?.name ||
      'Employee'
    )
  }

  const getFilterRange = () => {
    if (attendanceFilter === 'day') {
      const start = new Date(selectedDate)
      const end = new Date(selectedDate)
      end.setHours(23, 59, 59, 999)
      return { start, end }
    }

    if (attendanceFilter === 'month') {
      const [year, month] = selectedMonth.split('-').map(Number)
      const start = new Date(year, month - 1, 1)
      const end = new Date(year, month, 0, 23, 59, 59, 999)
      return { start, end }
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    return { start: today, end: tomorrow }
  }

  const { start, end } = getFilterRange()

  const filteredRecords = records.filter((record) => {
    const recordDate = new Date(record.date)
    return recordDate >= start && recordDate <= end
  })

  const filteredAttendanceRows = useMemo(() => filteredRecords
    .map((record) => {
      const employee = employeeMap[record.employeeId] || employeeMap[record.employee?._id] || null
      const checkInTime = record.checkIn ? new Date(record.checkIn) : null
      const checkOutTime = record.checkOut ? new Date(record.checkOut) : null
      const workingHours = record.workingHours || (
        checkInTime && checkOutTime
          ? Math.max(
              Math.round(((checkOutTime - checkInTime) / (1000 * 60 * 60)) * 10) / 10,
              0
            )
          : 0
      )
      return {
        record,
        employee,
        date: format(new Date(record.date), 'dd MMM yyyy'),
        checkIn: checkInTime ? format(checkInTime, 'hh:mm a') : '-',
        checkOut: checkOutTime ? format(checkOutTime, 'hh:mm a') : '-',
        status: record.status || 'present',
        location: record.checkInLocation?.address || record.checkOutLocation?.address || '—',
        workingHours,
        checkInPhoto: record.checkInPhoto || '',
        checkOutPhoto: record.checkOutPhoto || ''
      }
    })
    .filter((row) => {
      if (!searchTerm) return true
      const value = searchTerm.toLowerCase()
      return (
        row.employee?.name?.toLowerCase().includes(value) ||
        row.employee?.employeeId?.toLowerCase().includes(value) ||
        row.employee?.username?.toLowerCase().includes(value)
      )
    }), [filteredRecords, employeeMap, searchTerm])

  const filteredLeaveRecords = leaves.filter((leave) => {
    const from = new Date(leave.fromDate)
    const to = new Date(leave.toDate)
    return from <= end && to >= start
  })

  const searchSummaryRows = employees
    .filter((employee) => {
      if (!searchTerm) return true
      const value = searchTerm.toLowerCase()
      return (
        employee.name?.toLowerCase().includes(value) ||
        employee.employeeId?.toLowerCase().includes(value) ||
        employee.username?.toLowerCase().includes(value)
      )
    })
    .map((employee) => {
      const empRecords = filteredRecords.filter(
        (record) =>
          record.employeeId === employee.employeeId ||
          record.employeeId === employee._id ||
          record.employee?._id === employee._id
      )
      const empLeaves = filteredLeaveRecords.filter(
        (leave) =>
          leave.employeeId === employee.employeeId ||
          leave.employeeId === employee._id ||
          leave.employee?._id === employee._id
      )
      const periodDays = Math.max(
        Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1,
        1
      )
      const absent = Math.max(periodDays - empRecords.length - empLeaves.length, 0)

      return {
        employee,
        totalAttendance: empRecords.length,
        totalLeave: empLeaves.length,
        totalAbsent: absent
      }
    })

  const todayRecord = records.find((record) => {
    const recordDate = new Date(record.date)
    const today = new Date()
    return recordDate.toDateString() === today.toDateString()
  })

  const handleExport = () => {
    const exportRows = isAdmin
      ? filteredAttendanceRows.map((row) => ({
          EmployeeID: row.employee?.employeeId || '',
          EmployeeName: row.employee?.name || 'Employee',
          Date: row.record?.date ? format(new Date(row.record.date), 'yyyy-MM-dd') : '',
          Status: row.status,
          CheckIn: row.checkIn,
          CheckOut: row.checkOut
        }))
      : records.map((record) => ({
          EmployeeID: record.employeeId || '',
          EmployeeName: getEmployeeName(record),
          Date: format(new Date(record.date), 'yyyy-MM-dd'),
          Status: record.status || 'present',
          CheckIn: record.checkIn ? format(new Date(record.checkIn), 'hh:mm a') : '-',
          CheckOut: record.checkOut ? format(new Date(record.checkOut), 'hh:mm a') : '-'
        }))

    const worksheet = XLSX.utils.json_to_sheet(exportRows)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance')
    XLSX.writeFile(workbook, `attendance-${format(new Date(), 'yyyyMMdd-HHmmss')}.xlsx`)
  }

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} mb={3}>
        {isAdmin ? 'Attendance Management' : 'My Attendance'}
      </Typography>
      {!isAdmin && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center" justifyContent="space-between">
              <Box>
                <Typography variant="h6">Today</Typography>
                <Typography color="text.secondary">{format(new Date(), 'EEEE, MMM d, yyyy')}</Typography>
              </Box>
              <Box>
                <Button variant="contained" onClick={() => dispatch(checkIn())} disabled={!!todayRecord?.checkIn}>Check In</Button>
                <Button variant="outlined" sx={{ ml: 1 }} onClick={() => dispatch(checkOut())} disabled={!todayRecord?.checkIn || todayRecord?.checkOut}>Check Out</Button>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      )}
      {isAdmin && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ xs: 'stretch', md: 'center' }} justifyContent="space-between" mb={2}>
              <Typography variant="h6">Attendance Management</Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                <TextField
                  select
                  size="small"
                  label="Filter"
                  value={attendanceFilter}
                  onChange={(e) => setAttendanceFilter(e.target.value)}
                  sx={{ minWidth: 140 }}
                >
                  <MenuItem value="today">Today</MenuItem>
                  <MenuItem value="day">Day Wise</MenuItem>
                  <MenuItem value="month">Monthly</MenuItem>
                </TextField>
                {attendanceFilter === 'day' && (
                  <TextField
                    size="small"
                    label="Select Date"
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                )}
                {attendanceFilter === 'month' && (
                  <TextField
                    size="small"
                    label="Select Month"
                    type="month"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                )}
                <TextField
                  size="small"
                  label="Search Employee"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Button variant="contained" onClick={handleExport}>Export Excel</Button>
              </Stack>
            </Stack>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Employee Name</TableCell>
                  <TableCell>Employee Photo</TableCell>
                  <TableCell>Check In Photo</TableCell>
                  <TableCell>Check Out Photo</TableCell>
                  <TableCell>Check In Time</TableCell>
                  <TableCell>Check Out Time</TableCell>
                  <TableCell>Location</TableCell>
                  <TableCell>Working Hours</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredAttendanceRows.map((row) => (
                  <TableRow key={`${row.employee?._id || 'unknown'}-${row.date}`}>
                    <TableCell>{row.employee?.name || 'Employee'}</TableCell>
                    <TableCell>
                      {row.employee?.avatar ? <Avatar src={`${fileBaseUrl}${row.employee.avatar}`} /> : <Avatar>{row.employee?.name?.charAt(0) || 'E'}</Avatar>}
                    </TableCell>
                    <TableCell>
                      {row.checkInPhoto ? <Avatar variant="rounded" src={`${fileBaseUrl}${row.checkInPhoto}`} sx={{ width: 56, height: 56 }} /> : '—'}
                    </TableCell>
                    <TableCell>
                      {row.checkOutPhoto ? <Avatar variant="rounded" src={`${fileBaseUrl}${row.checkOutPhoto}`} sx={{ width: 56, height: 56 }} /> : '—'}
                    </TableCell>
                    <TableCell>{row.checkIn}</TableCell>
                    <TableCell>{row.checkOut}</TableCell>
                    <TableCell>{row.location}</TableCell>
                    <TableCell>{row.workingHours || 0} hrs</TableCell>
                    <TableCell>
                      <Chip label={row.status} color={row.status === 'present' ? 'success' : 'warning'} size="small" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {isAdmin && (
        <Card>
          <CardContent>
            <Typography variant="h6" mb={2}>Employee Summary</Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Employee</TableCell>
                  <TableCell>Date Range</TableCell>
                  <TableCell>Total Attendance</TableCell>
                  <TableCell>Total Leave</TableCell>
                  <TableCell>Total Absent</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {searchSummaryRows.map(({ employee, totalAttendance, totalLeave, totalAbsent }) => (
                  <TableRow key={employee._id}>
                    <TableCell>{employee.name}</TableCell>
                    <TableCell>{format(start, 'dd MMM yyyy')} - {format(end, 'dd MMM yyyy')}</TableCell>
                    <TableCell>{totalAttendance}</TableCell>
                    <TableCell>{totalLeave}</TableCell>
                    <TableCell>{totalAbsent}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {!isAdmin && (
        <Card>
          <CardContent>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center" justifyContent="space-between" mb={2}>
              <Typography variant="h6">Attendance Log</Typography>
              <Button variant="contained" onClick={handleExport}>Export Excel</Button>
            </Stack>
            {records.map((record) => (
              <Box key={record._id} sx={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #eee', py: 1 }}>
                <Typography>{getEmployeeName(record)}</Typography>
                <Typography>{format(new Date(record.date), 'MMM d, yyyy')}</Typography>
                <Chip label={record.status || 'present'} color={record.status === 'present' ? 'success' : 'warning'} />
              </Box>
            ))}
          </CardContent>
        </Card>
      )}
    </Box>
  )
}
