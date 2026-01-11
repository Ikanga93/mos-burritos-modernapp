import React from 'react'
import Navbar from '../customer/Navbar'
import Footer from '../customer/Footer'
import './CustomerLayout.css'

const CustomerLayout = ({ children, className = '' }) => {
  return (
    <div className="customer-layout">
      <Navbar />
      <main className={`customer-main ${className}`}>
        {children}
      </main>
      <Footer />
    </div>
  )
}

export default CustomerLayout
