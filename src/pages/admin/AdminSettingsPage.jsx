import React from 'react'
import { Settings } from 'lucide-react'
import './ComingSoonPage.css'

const AdminSettingsPage = () => {
    return (
        <div className="coming-soon-page">
            <div className="coming-soon-content">
                <div className="coming-soon-icon">
                    <Settings size={80} />
                </div>
                <h1>Settings</h1>
                <p>System configuration, business hours, tax settings</p>
                <span className="coming-soon-badge">Coming Soon</span>
            </div>
        </div>
    )
}

export default AdminSettingsPage
