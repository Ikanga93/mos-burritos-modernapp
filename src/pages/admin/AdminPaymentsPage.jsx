import React from 'react'
import { CreditCard } from 'lucide-react'
import './ComingSoonPage.css'

const AdminPaymentsPage = () => {
    return (
        <div className="coming-soon-page">
            <div className="coming-soon-content">
                <div className="coming-soon-icon">
                    <CreditCard size={80} />
                </div>
                <h1>Payments</h1>
                <p>Payment processing, refunds, transaction history</p>
                <span className="coming-soon-badge">Coming Soon</span>
            </div>
        </div>
    )
}

export default AdminPaymentsPage
