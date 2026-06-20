import React, { useState } from 'react'
import {
  Box,
  Button,
  Card,
  CardContent,
  TextField,
  Typography,
  Alert,
  CircularProgress,
  Stack,
  Divider,
  InputAdornment,
  Avatar
} from '@mui/material'
import { useDispatch, useSelector } from 'react-redux'
import { login } from '../store/authSlice'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import PersonIcon from '@mui/icons-material/Person'
import LockIcon from '@mui/icons-material/Lock'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { loading, error } = useSelector((state) => state.auth)

  const handleSubmit = async (e) => {
    e.preventDefault()
    const result = await dispatch(login({ username, password }))
    if (result.meta.requestStatus === 'fulfilled') {
      toast.success('Logged in successfully')
      navigate('/dashboard')
    } else {
      toast.error(result.payload || 'Login failed')
    }
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        px: 2,
        background: 'radial-gradient(circle at top, #1e3a8a 0%, #0b1120 45%, #020617 100%)'
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          top: '8%',
          left: '10%',
          width: 220,
          height: 220,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(37,99,235,0.18), rgba(37,99,235,0))',
          filter: 'blur(8px)'
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: '8%',
          right: '10%',
          width: 280,
          height: 280,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(16,185,129,0.12), rgba(16,185,129,0))',
          filter: 'blur(10px)'
        }}
      />
      <Card
        elevation={0}
        sx={{
          position: 'relative',
          zIndex: 1,
          maxWidth: 500,
          width: '100%',
          borderRadius: 4,
          overflow: 'hidden',
          bgcolor: 'rgba(9, 14, 28, 0.82)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(148, 163, 184, 0.18)',
          boxShadow: '0 24px 60px rgba(15, 23, 42, 0.65)'
        }}
      >
        <Box
          sx={{
            background: 'linear-gradient(90deg, #0f172a 0%, #1d4ed8 100%)',
            py: 3,
            px: 4,
            textAlign: 'center'
          }}
        >
          <Avatar sx={{ width: 68, height: 68, mx: 'auto', mb: 1.5, bgcolor: 'white', color: 'primary.main' }}>AK</Avatar>
          <Typography
            variant="h5"
            fontWeight={700}
            color="white"
            sx={{
              textShadow: '0 0 10px rgba(255,255,255,0.22), 0 0 22px rgba(37,99,235,0.28)'
            }}
          >
            AK Software Services
          </Typography>
          <Typography
            variant="body2"
            color="rgba(255,255,255,0.9)"
            sx={{
              textShadow: '0 0 8px rgba(255,255,255,0.12), 0 0 16px rgba(37,99,235,0.18)'
            }}
          >
            AK Attendance System
          </Typography>
        </Box>
        <CardContent sx={{ p: 4 }}>
          <Stack spacing={1} mb={3}>
            <Typography
              variant="h5"
              fontWeight={700}
              color="white"
              sx={{ textShadow: '0 0 8px rgba(255,255,255,0.08), 0 0 18px rgba(59,130,246,0.18)' }}
            >
              Login
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ textShadow: '0 0 6px rgba(148,163,184,0.08)' }}
            >
              Access your attendance dashboard securely
            </Typography>
          </Stack>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              margin="normal"
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: 'rgba(15, 23, 42, 0.8)',
                  color: 'white'
                },
                '& .MuiInputLabel-root': { color: 'text.secondary' }
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonIcon sx={{ color: 'text.secondary' }} />
                  </InputAdornment>
                )
              }}
            />
            <TextField
              fullWidth
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              margin="normal"
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: 'rgba(15, 23, 42, 0.8)',
                  color: 'white'
                },
                '& .MuiInputLabel-root': { color: 'text.secondary' }
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon sx={{ color: 'text.secondary' }} />
                  </InputAdornment>
                )
              }}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              sx={{
                mt: 2,
                py: 1.2,
                fontWeight: 600,
                background: 'linear-gradient(90deg, #2563eb 0%, #1d4ed8 100%)'
              }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
            </Button>
          </Box>
          <Divider sx={{ my: 3, borderColor: 'rgba(148, 163, 184, 0.18)' }} />
          <Typography variant="caption" color="text.secondary" align="center" display="block">
            © 2026 AK Software Services
          </Typography>
        </CardContent>
      </Card>
    </Box>
  )
}
