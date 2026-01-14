import React from 'react'
import { Truck } from 'lucide-react'
import './ComingSoonPage.css'

const AdminDeliveryPage = () => {
    return (
        <div className="coming-soon-page">
            <div className="coming-soon-content">
                <div className="coming-soon-icon">
                    <Truck size={80} />
                </div>
                <h1>Delivery Management</h1>
                <p>Delivery management, driver tracking, zones</p>
                <span className="coming-soon-badge">Coming Soon</span>
            </div>
        </div>
    )
}

export default AdminDeliveryPage
