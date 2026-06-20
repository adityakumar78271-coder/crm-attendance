import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../services/api'

const initialState = {
  employees: [],
  loading: false,
  error: null
}

export const fetchEmployees = createAsyncThunk('employees/fetchEmployees', async (_, thunkAPI) => {
  try {
    const response = await api.get('/employees')
    return response.data
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to fetch employees')
  }
})

export const createEmployee = createAsyncThunk('employees/createEmployee', async (payload, thunkAPI) => {
  try {
    const response = await api.post('/employees', payload)
    return response.data
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to create employee')
  }
})

const employeeSlice = createSlice({
  name: 'employees',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchEmployees.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchEmployees.fulfilled, (state, action) => {
        state.loading = false
        state.employees = action.payload?.employees || action.payload?.data?.employees || []
      })
      .addCase(fetchEmployees.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      .addCase(createEmployee.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(createEmployee.fulfilled, (state, action) => {
        state.loading = false
        const employee = action.payload?.employee || action.payload?.data?.employee || action.payload
        if (employee) {
          state.employees = [employee, ...state.employees]
        }
      })
      .addCase(createEmployee.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
  }
})

export default employeeSlice.reducer
