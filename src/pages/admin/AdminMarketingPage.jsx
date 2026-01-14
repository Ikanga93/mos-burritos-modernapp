import React from 'react'
import { Megaphone } from 'lucide-react'
import './ComingSoonPage.css'

const AdminMarketingPage = () => {
    return (
        <div className="coming-soon-page">
            <div className="coming-soon-content">
                <div className="coming-soon-icon">
                    <Megaphone size={80} />
                </div>
                <h1>Marketing</h1>
                <p>Email campaigns, SMS notifications, loyalty programs</p>
                <span className="coming-soon-badge">Coming Soon</span>
            </div>
        </div>
    )
}

export default AdminMarketingPage
