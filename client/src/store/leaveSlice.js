import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../services/api'

const initialState = {
  leaves: [],
  loading: false,
  error: null
}

export const fetchLeaves = createAsyncThunk('leaves/fetchLeaves', async () => {
  const response = await api.get('/leaves')
  return response.data
})

export const submitLeave = createAsyncThunk('leaves/submitLeave', async (payload) => {
  const response = await api.post('/leaves', payload)
  return response.data
})

export const reviewLeave = createAsyncThunk('leaves/reviewLeave', async ({ id, status, adminNotes }, thunkAPI) => {
  try {
    const response = await api.put(`/leaves/${id}`, { status, adminNotes })
    return response.data
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to update leave')
  }
})

const leaveSlice = createSlice({
  name: 'leaves',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchLeaves.pending, (state) => {
        state.loading = true
      })
      .addCase(fetchLeaves.fulfilled, (state, action) => {
        state.loading = false
        state.leaves = action.payload.leaves
      })
      .addCase(submitLeave.fulfilled, (state, action) => {
        state.leaves = [action.payload.leave, ...state.leaves]
      })
      .addCase(reviewLeave.fulfilled, (state, action) => {
        state.leaves = state.leaves.map((leave) =>
          leave._id === action.payload.leave._id ? action.payload.leave : leave
        )
      })
  }
})

export default leaveSlice.reducer
