import { useEffect } from 'react'
import { io } from 'socket.io-client'
import { toast } from 'react-toastify'
import { API_BASE_URL } from '../services/api'

const SOCKET_URL = API_BASE_URL.replace(/\/api$/, '')

const socket = io(SOCKET_URL, {
  transports: ['websocket']
})

export const useSocket = ({ onAttendanceCreated, onAttendanceUpdated } = {}) => {
  useEffect(() => {
    socket.on('connect', () => {
      socket.emit('joinAdmin')
    })

    socket.on('attendanceCreated', (payload) => {
      toast.info(payload.message || 'New attendance created')
      onAttendanceCreated?.(payload)
    })

    socket.on('attendanceUpdated', (payload) => {
      toast.info(payload.message || 'Attendance updated')
      onAttendanceUpdated?.(payload)
    })

    return () => {
      socket.off('attendanceCreated')
      socket.off('attendanceUpdated')
    }
  }, [onAttendanceCreated, onAttendanceUpdated])

  return socket
}