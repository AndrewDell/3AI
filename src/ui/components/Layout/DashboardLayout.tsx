/**
 * @component DashboardLayout
 * @description Main layout wrapper for the dashboard application. Provides consistent structure
 * and navigation across all dashboard pages.
 * 
 * Key features:
 * - Responsive layout with mobile-first approach
 * - Accessibility-first design with skip links
 * - Consistent header and footer components
 * - Flexible content area with proper spacing
 */
import { type ReactNode } from 'react'
import Header from '../Navigation/Header'
import Footer from '../Navigation/Footer'

interface DashboardLayoutProps {
  children: ReactNode
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  return (
    // Main container with full height and background
    <div className="min-h-screen bg-surface">
      {/* Accessibility skip link - hidden by default, visible on focus */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-white focus:rounded"
      >
        Skip to main content
      </a>
      
      <Header />
      
      {/* Main content area with proper spacing and container width */}
      <main id="main-content" className="container mx-auto px-4 py-6">
        {children}
      </main>
      
      <Footer />
    </div>
  )
}

export default DashboardLayout 