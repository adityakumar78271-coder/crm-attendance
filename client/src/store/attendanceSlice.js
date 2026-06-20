import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../services/api'

const initialState = {
  records: [],
  summary: {},
  loading: false,
  error: null
}

export const fetchAttendance = createAsyncThunk('attendance/fetchAttendance', async () => {
  const response = await api.get('/attendance')
  return response.data
})

export const fetchSummary = createAsyncThunk('attendance/fetchSummary', async () => {
  const response = await api.get('/attendance/summary')
  return response.data
})

export const checkIn = createAsyncThunk('attendance/checkIn', async () => {
  const response = await api.post('/attendance/check-in')
  return response.data
})

export const checkOut = createAsyncThunk('attendance/checkOut', async () => {
  const response = await api.post('/attendance/check-out')
  return response.data
})

const attendanceSlice = createSlice({
  name: 'attendance',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAttendance.pending, (state) => {
        state.loading = true
      })
      .addCase(fetchAttendance.fulfilled, (state, action) => {
        state.loading = false
        state.records = action.payload.records
      })
      .addCase(fetchSummary.fulfilled, (state, action) => {
        state.summary = action.payload.summary
      })
      .addCase(checkIn.fulfilled, (state, action) => {
        state.records = [action.payload.record, ...state.records]
      })
      .addCase(checkOut.fulfilled, (state, action) => {
        state.records = state.records.map((record) =>
          record._id === action.payload.record._id ? action.payload.record : record
        )
      })
  }
})

export default attendanceSlice.reducer
