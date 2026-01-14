import React from 'react'
import { CalendarCheck } from 'lucide-react'
import './ComingSoonPage.css'

const AdminReservationsPage = () => {
    return (
        <div className="coming-soon-page">
            <div className="coming-soon-content">
                <div className="coming-soon-icon">
                    <CalendarCheck size={80} />
                </div>
                <h1>Reservations</h1>
                <p>Table booking and reservation management</p>
                <span className="coming-soon-badge">Coming Soon</span>
            </div>
        </div>
    )
}

export default AdminReservationsPage
