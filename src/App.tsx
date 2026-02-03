import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from '@/lib/AuthContext'
import Navbar from '@/components/Navbar'
import Home from '@/pages/Home'
import Instructors from '@/pages/Instructors'
import Login from '@/pages/Login'
import Schedule from '@/pages/Schedule'
import InstructorDashboard from '@/pages/InstructorDashboard'
import StudentDashboard from '@/pages/StudentDashboard'

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/instructors" element={<Instructors />} />
            <Route path="/schedule" element={<Schedule />} />
            <Route path="/dashboard/instructor" element={<InstructorDashboard />} />
            <Route path="/dashboard/student" element={<StudentDashboard />} />
            <Route path="/login" element={<Login />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App