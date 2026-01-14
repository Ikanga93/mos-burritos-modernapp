import React from 'react'
import { ChefHat } from 'lucide-react'
import './ComingSoonPage.css'

const AdminKitchenPage = () => {
    return (
        <div className="coming-soon-page">
            <div className="coming-soon-content">
                <div className="coming-soon-icon">
                    <ChefHat size={80} />
                </div>
                <h1>Kitchen Display System</h1>
                <p>Real-time kitchen order management system</p>
                <span className="coming-soon-badge">Coming Soon</span>
            </div>
        </div>
    )
}

export default AdminKitchenPage
