import React from 'react'
import { UtensilsCrossed } from 'lucide-react'
import './ComingSoonPage.css'

const AdminCateringPage = () => {
    return (
        <div className="coming-soon-page">
            <div className="coming-soon-content">
                <div className="coming-soon-icon">
                    <UtensilsCrossed size={80} />
                </div>
                <h1>Catering Orders</h1>
                <p>Special management for catering requests</p>
                <span className="coming-soon-badge">Coming Soon</span>
            </div>
        </div>
    )
}

export default AdminCateringPage
