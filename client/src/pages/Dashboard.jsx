import React, { useEffect, useMemo, useState } from 'react'
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  LinearProgress,
  MenuItem,
  Stack,
  TextField,
  Typography
} from '@mui/material'
import {
  AccessTime,
  BadgeOutlined,
  CalendarMonth,
  CheckCircle,
  EventAvailable,
  Groups,
  Notifications,
  Refresh,
  Schedule,
  TrendingUp,
  WorkHistory
} from '@mui/icons-material'
import { useDispatch, useSelector } from 'react-redux'
import {
  fetchSummary,
  fetchAttendance,
  checkIn,
  checkOut
} from '../store/attendanceSlice'
import { fetchEmployees } from '../store/employeeSlice'
import { fetchLeaves, submitLeave, reviewLeave } from '../store/leaveSlice'
import { useSocket } from '../hooks/useSocket'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import {
  addDays,
  eachDayOfInterval,
  endOfMonth,
  format,
  isSameDay,
  isWithinInterval,
  startOfMonth,
  subDays
} from 'date-fns'

const COLORS = ['#22c55e', '#f97316', '#3b82f6', '#a855f7']

export default function Dashboard() {
  const dispatch = useDispatch()
  const user = useSelector((state) => state.auth.user)
  const isAdmin = user?.role === 'admin'
  const { summary, records } = useSelector((state) => state.attendance)
  const { employees } = useSelector((state) => state.employees)
  const { leaves } = useSelector((state) => state.leaves)
  const [openLeaveDialog, setOpenLeaveDialog] = useState(false)
  const [leaveForm, setLeaveForm] = useState({
    leaveType: 'Casual',
    fromDate: '',
    toDate: '',
    reason: ''
  })
  const [now, setNow] = useState(new Date())

  useSocket({
    onAttendanceCreated: () => {
      dispatch(fetchAttendance())
      dispatch(fetchSummary())
    },
    onAttendanceUpdated: () => {
      dispatch(fetchAttendance())
      dispatch(fetchSummary())
    }
  })

  useEffect(() => {
    const loadDashboardData = () => {
      dispatch(fetchAttendance())
      dispatch(fetchLeaves())
      if (isAdmin) {
        dispatch(fetchSummary())
        dispatch(fetchEmployees())
      }
    }

    loadDashboardData()
    const timer = setInterval(() => {
      loadDashboardData()
      setNow(new Date())
    }, 30000)

    return () => clearInterval(timer)
  }, [dispatch, isAdmin])

  useEffect(() => {
    const clock = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(clock)
  }, [])

  const today = new Date()
  const todayDateString = format(today, 'yyyy-MM-dd')

  const todayRecords = records.filter((record) => {
    const recordDate = new Date(record.date)
    return format(recordDate, 'yyyy-MM-dd') === todayDateString
  })

  const todayPresent = todayRecords.filter((record) => record.status === 'present' || record.checkIn).length
  const todayAbsent = Math.max((employees.length || 0) - todayPresent, 0)
  const lateArrivals = todayRecords.filter((record) => {
    const checkIn = record.checkIn ? new Date(record.checkIn) : null
    return checkIn && checkIn.getHours() > 9
  }).length

  const onLeaveToday = leaves.filter((leave) => {
    const status = leave.status?.toLowerCase()
    if (status !== 'approved') return false
    const from = new Date(leave.fromDate)
    const to = new Date(leave.toDate)
    return isWithinInterval(today, { start: from, end: to })
  }).length

  const pendingLeaves = leaves.filter((leave) => leave.status === 'Pending').length

  const monthStart = startOfMonth(today)
  const monthEnd = endOfMonth(today)
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd })
  const currentMonthRecords = records.filter((record) => {
    const recordDate = new Date(record.date)
    return recordDate >= monthStart && recordDate <= monthEnd
  })
  const presentDays = currentMonthRecords.filter((record) => record.status === 'present' || record.checkIn).length
  const attendanceRate = monthDays.length
    ? Math.min(100, Math.round((presentDays / Math.max(employees.length, 1)) * 100))
    : 0

  const weeklyData = useMemo(() => {
    return Array.from({ length: 7 }, (_, index) => {
      const date = subDays(today, 6 - index)
      const dayRecord = records.find((record) => isSameDay(new Date(record.date), date))
      return {
        day: format(date, 'EEE'),
        present: dayRecord?.status === 'present' || dayRecord?.checkIn ? 1 : 0,
        hours: dayRecord?.workingHours || 0
      }
    })
  }, [records, today])

  const monthlyHoursData = useMemo(() => {
    return Array.from({ length: 6 }, (_, index) => {
      const date = addDays(monthStart, index * 5)
      const label = format(date, 'MMM d')
      const value = records
        .filter((record) => {
          const recordDate = new Date(record.date)
          return recordDate >= date && recordDate <= addDays(date, 4)
        })
        .reduce((sum, item) => sum + (item.workingHours || 0), 0)
      return { label, hours: value }
    })
  }, [monthStart, records])

  const employeeDepartmentData = useMemo(() => {
    const counts = employees.reduce((acc, employee) => {
      const department = employee.department || 'General'
      acc[department] = (acc[department] || 0) + 1
      return acc
    }, {})
    return Object.entries(counts).map(([name, value]) => ({ name, value }))
  }, [employees])

  const pieData = [
    { name: 'Present', value: summary.present || 0 },
    { name: 'Absent', value: summary.absent || 0 },
    { name: 'Late', value: summary.late || lateArrivals || 0 },
    { name: 'Leave', value: summary.onLeave || onLeaveToday || 0 }
  ]

  const recentRecords = records.slice(0, 6)
  const employeeMap = employees.reduce((acc, employee) => {
    acc[employee._id] = employee
    acc[employee.employeeId] = employee
    return acc
  }, {})

  const handleLeaveSubmit = () => {
    dispatch(submitLeave(leaveForm))
    setOpenLeaveDialog(false)
    setLeaveForm({
      leaveType: 'Casual',
      fromDate: '',
      toDate: '',
      reason: ''
    })
  }

  const handleReviewLeave = (id, status) => {
    dispatch(reviewLeave({ id, status, adminNotes: `${status} by admin` }))
  }

  const handleRefresh = () => {
    dispatch(fetchAttendance())
    dispatch(fetchLeaves())
    if (isAdmin) {
      dispatch(fetchSummary())
      dispatch(fetchEmployees())
    }
  }

  const todayRecord = records.find((record) => {
    const recordDate = new Date(record.date)
    return format(recordDate, 'yyyy-MM-dd') === todayDateString
  })
  const liveWorkingSeconds = todayRecord?.checkIn && !todayRecord?.checkOut
    ? Math.floor((now.getTime() - new Date(todayRecord.checkIn).getTime()) / 1000)
    : 0
  const liveWorkingHours = `${String(Math.floor(liveWorkingSeconds / 3600)).padStart(2, '0')}:${String(
    Math.floor((liveWorkingSeconds % 3600) / 60)
  ).padStart(2, '0')}:${String(liveWorkingSeconds % 60).padStart(2, '0')}`

  const statCard = (label, value, icon, color, subtitle = '') => (
    <Card
      sx={{
        height: '100%',
        background: 'linear-gradient(135deg, rgba(15,23,42,0.92), rgba(15,23,42,0.72))',
        border: '1px solid rgba(148,163,184,0.12)',
        backdropFilter: 'blur(10px)',
        boxShadow: '0 18px 40px rgba(15,23,42,0.3)',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        '&:hover': {
          transform: 'translateY(-3px)',
          boxShadow: '0 22px 50px rgba(15,23,42,0.45)'
        }
      }}
    >
      <CardContent>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="body2" color="text.secondary">{label}</Typography>
            <Typography variant="h4" fontWeight={700} mt={1}>{value}</Typography>
            {subtitle && <Typography variant="caption" color="text.secondary">{subtitle}</Typography>}
          </Box>
          <Avatar sx={{ bgcolor: color, width: 56, height: 56 }}>{icon}</Avatar>
        </Stack>
      </CardContent>
    </Card>
  )

  return (
    <Box sx={{ pb: 5 }}>
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }} spacing={1.5} mb={3}>
        <Box>
          <Typography variant="h4" fontWeight={700}>Welcome back, {user?.name}</Typography>
          <Typography variant="body2" color="text.secondary">{format(today, 'EEEE, MMM d, yyyy')}</Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <IconButton onClick={handleRefresh} color="primary">
            <Refresh />
          </IconButton>
          <Chip icon={<Notifications />} label="Live updates" color="primary" variant="outlined" />
        </Stack>
      </Stack>

      {isAdmin ? (
        <>
          <Grid container spacing={3} mb={3}>
            <Grid item xs={12} sm={6} md={4} lg={2.4}>{statCard('Total Employees', employees.length, <Groups />, '#2563eb', 'Across all departments')}</Grid>
            <Grid item xs={12} sm={6} md={4} lg={2.4}>{statCard('Present Today', todayPresent, <CheckCircle />, '#22c55e', `${Math.round((todayPresent / Math.max(employees.length, 1)) * 100)}% of team`)}</Grid>
            <Grid item xs={12} sm={6} md={4} lg={2.4}>{statCard('Absent Today', todayAbsent, <BadgeOutlined />, '#f97316', 'Pending attendance')}</Grid>
            <Grid item xs={12} sm={6} md={4} lg={2.4}>{statCard('On Leave', onLeaveToday, <EventAvailable />, '#8b5cf6', 'Approved today')}</Grid>
            <Grid item xs={12} sm={6} md={4} lg={2.4}>{statCard('Late Arrivals', lateArrivals, <AccessTime />, '#eab308', 'After 9:00 AM')}</Grid>
            <Grid item xs={12} sm={6} md={4} lg={2.4}>{statCard('Attendance Rate', `${attendanceRate}%`, <TrendingUp />, '#06b6d4', 'This month')}</Grid>
          </Grid>

          <Grid container spacing={3} mb={3}>
            <Grid item xs={12} lg={8}>
              <Card sx={{ background: 'linear-gradient(180deg, rgba(15,23,42,0.96), rgba(9,14,28,0.92))', height: '100%' }}>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6">Attendance Analytics</Typography>
                    <Chip label="This week" color="primary" variant="outlined" />
                  </Stack>
                  <Box sx={{ height: 360 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={weeklyData}>
                        <defs>
                          <linearGradient id="attendanceArea" x1="0" x2="0" y1="0" y2="1">
                            <stop offset="0%" stopColor="#22c55e" stopOpacity={0.25} />
                            <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" />
                        <XAxis dataKey="day" stroke="#94a3b8" />
                        <YAxis stroke="#94a3b8" />
                        <Tooltip />
                        <Area type="monotone" dataKey="present" stroke="#22c55e" fill="url(#attendanceArea)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} lg={4}>
              <Card sx={{ background: 'linear-gradient(180deg, rgba(15,23,42,0.96), rgba(9,14,28,0.92))', height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" mb={2}>Attendance Overview</Typography>
                  <Box sx={{ height: 320 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={pieData} dataKey="value" innerRadius={48} outerRadius={78} paddingAngle={4}>
                          {pieData.map((entry, index) => (
                            <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Grid container spacing={3} mb={3}>
            <Grid item xs={12} lg={7}>
              <Card sx={{ background: 'linear-gradient(180deg, rgba(15,23,42,0.96), rgba(9,14,28,0.92))' }}>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6">Leave Approval Panel</Typography>
                    <Chip label={`${pendingLeaves} pending`} color="warning" variant="outlined" />
                  </Stack>
                  <Stack spacing={2}>
                    {leaves.slice(0, 5).map((leave) => (
                      <Box key={leave._id} sx={{ p: 2, borderRadius: 2, bgcolor: 'rgba(148,163,184,0.06)' }}>
                        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={1}>
                          <Box>
                            <Typography fontWeight={600}>{leave.employee?.name || employeeMap[leave.employeeId]?.name || 'Employee'}</Typography>
                            <Typography variant="body2" color="text.secondary">{leave.leaveType} • {leave.fromDate} to {leave.toDate}</Typography>
                          </Box>
                          <Stack direction="row" spacing={1}>
                            <Button size="small" color="success" variant="outlined" onClick={() => handleReviewLeave(leave._id, 'Approved')}>Approve</Button>
                            <Button size="small" color="error" variant="outlined" onClick={() => handleReviewLeave(leave._id, 'Rejected')}>Reject</Button>
                          </Stack>
                        </Stack>
                      </Box>
                    ))}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </>
      ) : (
        <>
          <Grid container spacing={3} mb={3}>
            <Grid item xs={12} sm={6} md={3}>{statCard('Monthly Attendance', `${attendanceRate}%`, <TrendingUp />, '#22c55e')}</Grid>
            <Grid item xs={12} sm={6} md={3}>{statCard('Working Hours', `${(currentMonthRecords.reduce((sum, item) => sum + (item.workingHours || 0), 0) / 10).toFixed(1)}h`, <WorkHistory />, '#3b82f6')}</Grid>
            <Grid item xs={12} sm={6} md={3}>{statCard('Leave Balance', Math.max(18 - onLeaveToday, 0), <EventAvailable />, '#8b5cf6')}</Grid>
            <Grid item xs={12} sm={6} md={3}>{statCard('Pending Leaves', pendingLeaves, <Schedule />, '#eab308')}</Grid>
          </Grid>

          <Grid container spacing={3} mb={3}>
            <Grid item xs={12} xl={8}>
              <Card sx={{ background: 'linear-gradient(180deg, rgba(15,23,42,0.96), rgba(9,14,28,0.92))', border: '1px solid rgba(148,163,184,0.12)', backdropFilter: 'blur(12px)' }}>
                <CardContent>
                  <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={2}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Live Working Hours</Typography>
                      <Typography variant="h3" fontWeight={700}>{liveWorkingHours}</Typography>
                    </Box>
                    <Box sx={{ minWidth: 180 }}>
                      <Typography variant="body2" color="text.secondary">Today Progress</Typography>
                      <LinearProgress variant="determinate" value={Math.min((liveWorkingSeconds / 28800) * 100, 100)} sx={{ mt: 1, height: 8, borderRadius: 5 }} />
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card sx={{ background: 'linear-gradient(180deg, rgba(15,23,42,0.96), rgba(9,14,28,0.92))', height: '100%' }}>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Box>
                      <Typography variant="body2" color="text.secondary">Check In / Out</Typography>
                      <Typography variant="h6" fontWeight={700}>{todayRecord?.checkIn ? 'Checked In' : 'Ready to Start'}</Typography>
                    </Box>
                    <Button
                      variant="contained"
                      onClick={() => {
                        if (todayRecord?.checkIn) {
                          dispatch(checkOut())
                        } else {
                          dispatch(checkIn())
                        }
                      }}
                    >
                      {todayRecord?.checkIn ? 'Check Out' : 'Check In'}
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Grid container spacing={3} mb={3}>
            <Grid item xs={12} md={6}>
              <Card sx={{ background: 'linear-gradient(180deg, rgba(15,23,42,0.96), rgba(9,14,28,0.92))', height: '100%' }}>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6">Attendance Calendar</Typography>
                    <Chip icon={<CalendarMonth />} label={format(today, 'MMM yyyy')} variant="outlined" />
                  </Stack>
                  <Grid container spacing={1}>
                    {monthDays.map((day) => {
                      const hasRecord = currentMonthRecords.some((record) => isSameDay(new Date(record.date), day))
                      const isToday = isSameDay(day, today)
                      return (
                        <Grid item xs={1.7} key={day.toISOString()}>
                          <Box
                            sx={{
                              minHeight: 38,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderRadius: 2,
                              bgcolor: isToday ? 'primary.main' : hasRecord ? 'rgba(34,197,94,0.12)' : 'rgba(148,163,184,0.06)',
                              color: isToday ? 'white' : 'text.primary',
                              fontWeight: 600,
                              border: isToday ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(148,163,184,0.08)'
                            }}
                          >
                            {format(day, 'd')}
                          </Box>
                        </Grid>
                      )
                    })}
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card sx={{ background: 'linear-gradient(180deg, rgba(15,23,42,0.96), rgba(9,14,28,0.92))', height: '100%' }}>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6">Weekly Attendance</Typography>
                    <Chip label="Last 7 days" color="primary" variant="outlined" />
                  </Stack>
                  <Box sx={{ height: 280 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={weeklyData}>
                        <defs>
                          <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" />
                        <XAxis dataKey="day" stroke="#94a3b8" />
                        <YAxis stroke="#94a3b8" />
                        <Tooltip />
                        <Area type="monotone" dataKey="hours" stroke="#2563eb" fillOpacity={1} fill="url(#colorHours)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Grid container spacing={3} mb={3}>
            <Grid item xs={12} md={8}>
              <Card sx={{ background: 'linear-gradient(180deg, rgba(15,23,42,0.96), rgba(9,14,28,0.92))', height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" mb={2}>Monthly Working Hours</Typography>
                  <Box sx={{ height: 320 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={monthlyHoursData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" />
                        <XAxis dataKey="label" stroke="#94a3b8" />
                        <YAxis stroke="#94a3b8" />
                        <Tooltip />
                        <Line type="monotone" dataKey="hours" stroke="#22c55e" strokeWidth={3} />
                      </LineChart>
                    </ResponsiveContainer>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card sx={{ background: 'linear-gradient(180deg, rgba(15,23,42,0.96), rgba(9,14,28,0.92))', height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" mb={2}>Attendance Overview</Typography>
                  <Box sx={{ height: 280 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={pieData} dataKey="value" innerRadius={50} outerRadius={80} paddingAngle={3}>
                          {pieData.map((entry, index) => (
                            <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
            <Button variant="contained" onClick={() => setOpenLeaveDialog(true)}>Apply Leave</Button>
          </Box>
        </>
      )}

      <Dialog open={openLeaveDialog} onClose={() => setOpenLeaveDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Apply Leave</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              select
              label="Leave Type"
              value={leaveForm.leaveType}
              onChange={(e) => setLeaveForm({ ...leaveForm, leaveType: e.target.value })}
            >
              <MenuItem value="Casual">Casual</MenuItem>
              <MenuItem value="Sick">Sick</MenuItem>
              <MenuItem value="Annual">Annual</MenuItem>
              <MenuItem value="Emergency">Emergency</MenuItem>
            </TextField>
            <TextField
              label="From Date"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={leaveForm.fromDate}
              onChange={(e) => setLeaveForm({ ...leaveForm, fromDate: e.target.value })}
            />
            <TextField
              label="To Date"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={leaveForm.toDate}
              onChange={(e) => setLeaveForm({ ...leaveForm, toDate: e.target.value })}
            />
            <TextField
              label="Reason"
              multiline
              minRows={3}
              value={leaveForm.reason}
              onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenLeaveDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleLeaveSubmit}>Submit</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
