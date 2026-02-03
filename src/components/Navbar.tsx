import { Link } from 'react-router-dom'
import { useAuth } from '@/lib/AuthContext'

export default function Navbar() {
  const { user, profile, signOut } = useAuth()

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <span className="text-2xl font-display font-bold text-violet-600">
                Violet Violin Studio
              </span>
            </Link>
          </div>

          <div className="hidden md:flex items-center space-x-8">
            <Link
              to="/"
              className="text-gray-700 hover:text-violet-600 font-medium transition-colors"
            >
              Home
            </Link>
            <Link
              to="/instructors"
              className="text-gray-700 hover:text-violet-600 font-medium transition-colors"
            >
              Instructors
            </Link>
            {user && (
              <>
                <Link
                  to="/schedule"
                  className="text-gray-700 hover:text-violet-600 font-medium transition-colors"
                >
                  Schedule
                </Link>
                <Link
                  to={profile?.role === 'instructor' || profile?.role === 'admin' 
                    ? '/dashboard/instructor' 
                    : '/dashboard/student'}
                  className="text-gray-700 hover:text-violet-600 font-medium transition-colors"
                >
                  Dashboard
                </Link>
              </>
            )}
          </div>

          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">
                  {profile?.full_name || user.email}
                </span>
                <button
                  onClick={() => signOut()}
                  className="btn-secondary text-sm"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <Link to="/login" className="btn-primary">
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}