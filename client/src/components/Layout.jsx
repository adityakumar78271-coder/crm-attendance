import React, { useState } from 'react'
import {
  AppBar,
  Avatar,
  Box,
  CssBaseline,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
  Stack,
  Chip
} from '@mui/material'
import {
  Menu as MenuIcon,
  Dashboard,
  People,
  AssignmentTurnedIn,
  EventAvailable,
  Logout
} from '@mui/icons-material'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, useLocation } from 'react-router-dom'
import { logout } from '../store/authSlice'

const drawerWidth = 260

export default function Layout({ children }) {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const [mobileOpen, setMobileOpen] = useState(false)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const user = useSelector((state) => state.auth.user)

  const adminMenuItems = [
    { label: 'Dashboard', icon: <Dashboard />, path: '/dashboard' },
    { label: 'Employees', icon: <People />, path: '/employees' },
    { label: 'Attendance', icon: <AssignmentTurnedIn />, path: '/attendance' },
    { label: 'Leaves', icon: <EventAvailable />, path: '/leaves' }
  ]

  const employeeMenuItems = [
    { label: 'Dashboard', icon: <Dashboard />, path: '/dashboard' },
    { label: 'My Attendance', icon: <AssignmentTurnedIn />, path: '/attendance' },
    { label: 'My Leaves', icon: <EventAvailable />, path: '/leaves' }
  ]

  const menuItems = user?.role === 'admin' ? adminMenuItems : employeeMenuItems

  const handleDrawerToggle = () => setMobileOpen(!mobileOpen)

  const handleLogout = () => {
    dispatch(logout())
    navigate('/login')
  }

  const drawer = (
    <Box
      sx={{
        height: '100%',
        background: (theme) =>
          theme.palette.mode === 'dark'
            ? 'linear-gradient(180deg, #0f172a 0%, #0b1120 100%)'
            : 'linear-gradient(180deg, #f8fafc 0%, #eef4ff 100%)',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <Box sx={{ p: 3, pb: 2 }}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Avatar sx={{ width: 48, height: 48, bgcolor: 'primary.main' }}>AK</Avatar>
          <Box>
            <Typography variant="subtitle1" fontWeight={700}>AK Software</Typography>
            <Typography variant="caption" color="text.secondary">Attendance</Typography>
          </Box>
        </Stack>
      </Box>
      <Divider />
      <List sx={{ px: 1.5, py: 1.5 }}>
        {menuItems.map((item) => (
          <ListItem key={item.label} disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => {
                navigate(item.path)
                if (isMobile) setMobileOpen(false)
              }}
              sx={{
                borderRadius: 2,
                '&.Mui-selected': {
                  background: 'linear-gradient(90deg, rgba(37,99,235,0.12), rgba(37,99,235,0.04))',
                  color: 'primary.main'
                }
              }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Box sx={{ flexGrow: 1 }} />
      <Box sx={{ p: 2 }}>
        <Stack direction="row" alignItems="center" justifyContent="flex-end" sx={{ p: 1.5, borderRadius: 2, bgcolor: 'rgba(15,23,42,0.04)' }}>
          <IconButton onClick={handleLogout} color="error">
            <Logout />
          </IconButton>
        </Stack>
      </Box>
    </Box>
  )

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          bgcolor: 'background.paper',
          color: 'text.primary',
          boxShadow: '0 1px 0 rgba(148, 163, 184, 0.12)',
          backdropFilter: 'blur(10px)'
        }}
      >
        <Toolbar>
          <IconButton color="inherit" edge="start" onClick={handleDrawerToggle} sx={{ mr: 2, display: { md: 'none' } }}>
            <MenuIcon />
          </IconButton>
          <Stack direction="row" alignItems="center" spacing={1.5} sx={{ flexGrow: 1 }}>
            <Avatar sx={{ width: 36, height: 36, bgcolor: 'primary.main' }}>{user?.name?.charAt(0) || 'A'}</Avatar>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {user?.name || 'AK Attendance System'}
            </Typography>
          </Stack>
          <Chip label={user?.role === 'admin' ? 'Admin' : 'Employee'} color="primary" variant="outlined" />
        </Toolbar>
      </AppBar>
      <Box component="nav" sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}>
        <Drawer
          variant={isMobile ? 'temporary' : 'permanent'}
          open={isMobile ? mobileOpen : true}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              borderRight: '1px solid rgba(148, 163, 184, 0.12)'
            }
          }}
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, md: 3 },
          minHeight: '100vh',
          background: (theme) =>
            theme.palette.mode === 'dark'
              ? 'linear-gradient(180deg, #0b1120 0%, #020617 100%)'
              : 'linear-gradient(180deg, #f8fafc 0%, #eef4ff 100%)'
        }}
      >
        <Toolbar />
        {children}
      </Box>
    </Box>
  )
}
