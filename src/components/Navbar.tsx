import { Link } from 'react-router-dom'
import { useAuth } from '@/lib/AuthContext'
import { useState } from 'react'

export default function Navbar() {
  const { user, profile, signOut } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const closeMobileMenu = () => setMobileMenuOpen(false)

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2" onClick={closeMobileMenu}>
              <span className="text-xl md:text-2xl font-display font-bold text-violet-600">
                Violet Violin Studio
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
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

          {/* Desktop Auth */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <>
                <span className="text-sm text-gray-600">
                  {profile?.full_name || user.email}
                </span>
                <button
                  onClick={() => signOut()}
                  className="btn-secondary text-sm"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <Link to="/login" className="btn-primary">
                Sign In
              </Link>
            )}
          </div>

          {/* Mobile Hamburger Button */}
          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-gray-700 hover:text-violet-600 p-2"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4">
            <div className="flex flex-col space-y-4">
              <Link
                to="/"
                onClick={closeMobileMenu}
                className="text-gray-700 hover:text-violet-600 font-medium transition-colors px-4 py-2"
              >
                Home
              </Link>
              <Link
                to="/instructors"
                onClick={closeMobileMenu}
                className="text-gray-700 hover:text-violet-600 font-medium transition-colors px-4 py-2"
              >
                Instructors
              </Link>
              {user ? (
                <>
                  <Link
                    to="/schedule"
                    onClick={closeMobileMenu}
                    className="text-gray-700 hover:text-violet-600 font-medium transition-colors px-4 py-2"
                  >
                    Schedule
                  </Link>
                  <Link
                    to={profile?.role === 'instructor' || profile?.role === 'admin' 
                      ? '/dashboard/instructor' 
                      : '/dashboard/student'}
                    onClick={closeMobileMenu}
                    className="text-gray-700 hover:text-violet-600 font-medium transition-colors px-4 py-2"
                  >
                    Dashboard
                  </Link>
                  <div className="border-t border-gray-200 pt-4 px-4">
                    <p className="text-sm text-gray-600 mb-2">
                      {profile?.full_name || user.email}
                    </p>
                    <button
                      onClick={() => {
                        signOut()
                        closeMobileMenu()
                      }}
                      className="btn-secondary text-sm w-full"
                    >
                      Sign Out
                    </button>
                  </div>
                </>
              ) : (
                <div className="px-4">
                  <Link 
                    to="/login" 
                    onClick={closeMobileMenu}
                    className="btn-primary block text-center"
                  >
                    Sign In
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}