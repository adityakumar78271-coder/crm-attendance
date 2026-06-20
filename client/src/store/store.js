import { configureStore } from '@reduxjs/toolkit'
import authReducer from './authSlice'
import attendanceReducer from './attendanceSlice'
import employeeReducer from './employeeSlice'
import leaveReducer from './leaveSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    attendance: attendanceReducer,
    employees: employeeReducer,
    leaves: leaveReducer
  }
})
