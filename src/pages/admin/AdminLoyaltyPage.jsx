import React from 'react'
import { Award } from 'lucide-react'
import './ComingSoonPage.css'

const AdminLoyaltyPage = () => {
    return (
        <div className="coming-soon-page">
            <div className="coming-soon-content">
                <div className="coming-soon-icon">
                    <Award size={80} />
                </div>
                <h1>Loyalty Program</h1>
                <p>Points, rewards, member tiers</p>
                <span className="coming-soon-badge">Coming Soon</span>
            </div>
        </div>
    )
}

export default AdminLoyaltyPage
