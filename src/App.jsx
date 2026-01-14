import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'

// Context Providers
import { ToastProvider } from './contexts/ToastContext'
import { LocationProvider } from './contexts/LocationContext'
import { CustomerAuthProvider } from './contexts/CustomerAuthContext'
import { AdminAuthProvider } from './contexts/AdminAuthContext'
import { CartProvider } from './contexts/CartContext'

// Route Guards
import ProtectedRoute from './components/shared/ProtectedRoute'
import AdminProtectedRoute from './components/shared/AdminProtectedRoute'

// Layout
import CustomerLayout from './components/layout/CustomerLayout'
import AdminLayout from './components/layout/AdminLayout'

// Existing Pages
import HomePage from './pages/HomePage'
import AboutPage from './pages/AboutPage'
import CateringPage from './pages/CateringPage'
import LocationPage from './pages/LocationPage'
import NotFound from './pages/NotFound'

// Customer Pages
import LoginPage from './pages/customer/LoginPage'
import RegisterPage from './pages/customer/RegisterPage'
import AuthCallbackPage from './pages/customer/AuthCallbackPage'
import MenuPage from './pages/customer/MenuPage'
import OrderSuccessPage from './pages/customer/OrderSuccessPage'
import OrderTrackingPage from './pages/customer/OrderTrackingPage'
import MyOrdersPage from './pages/customer/MyOrdersPage'
import ProfilePage from './pages/customer/ProfilePage'

// Admin Pages
import AdminLoginPage from './pages/admin/AdminLoginPage'
import AdminRegisterPage from './pages/admin/AdminRegisterPage'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminAnalyticsPage from './pages/admin/AdminAnalyticsPage'
import AdminOrdersPage from './pages/admin/AdminOrdersPage'
import AdminMenuPage from './pages/admin/AdminMenuPage'
import AdminLocationsPage from './pages/admin/AdminLocationsPage'
import AdminStaffPage from './pages/admin/AdminStaffPage'
import AdminCustomersPage from './pages/admin/AdminCustomersPage'
import AdminProfilePage from './pages/admin/AdminProfilePage'
import AdminKitchenPage from './pages/admin/AdminKitchenPage'
import AdminDeliveryPage from './pages/admin/AdminDeliveryPage'
import AdminReservationsPage from './pages/admin/AdminReservationsPage'
import AdminPaymentsPage from './pages/admin/AdminPaymentsPage'
import AdminSettingsPage from './pages/admin/AdminSettingsPage'
import AdminMarketingPage from './pages/admin/AdminMarketingPage'
import AdminCateringPage from './pages/admin/AdminCateringPage'
import AdminLoyaltyPage from './pages/admin/AdminLoyaltyPage'

// Error Boundary
import ErrorBoundary from './components/ErrorBoundary'

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <ToastProvider>
          <LocationProvider>
            <CustomerAuthProvider>
              <AdminAuthProvider>
                <CartProvider>
                  <Routes>
                    {/* Admin Auth Routes (no layout) */}
                    <Route path="/admin/login" element={<AdminLoginPage />} />
                    <Route path="/admin/register" element={<AdminRegisterPage />} />

                    {/* Admin Routes (with AdminLayout) */}
                    <Route
                      path="/admin/dashboard"
                      element={
                        <AdminProtectedRoute>
                          <AdminLayout>
                            <AdminDashboard />
                          </AdminLayout>
                        </AdminProtectedRoute>
                      }
                    />
                    <Route
                      path="/admin/analytics"
                      element={
                        <AdminProtectedRoute>
                          <AdminLayout>
                            <AdminAnalyticsPage />
                          </AdminLayout>
                        </AdminProtectedRoute>
                      }
                    />
                    <Route
                      path="/admin/orders"
                      element={
                        <AdminProtectedRoute>
                          <AdminLayout>
                            <AdminOrdersPage />
                          </AdminLayout>
                        </AdminProtectedRoute>
                      }
                    />
                    <Route
                      path="/admin/menu"
                      element={
                        <AdminProtectedRoute>
                          <AdminLayout>
                            <AdminMenuPage />
                          </AdminLayout>
                        </AdminProtectedRoute>
                      }
                    />
                    <Route
                      path="/admin/locations"
                      element={
                        <AdminProtectedRoute>
                          <AdminLayout>
                            <AdminLocationsPage />
                          </AdminLayout>
                        </AdminProtectedRoute>
                      }
                    />
                    <Route
                      path="/admin/staff"
                      element={
                        <AdminProtectedRoute>
                          <AdminLayout>
                            <AdminStaffPage />
                          </AdminLayout>
                        </AdminProtectedRoute>
                      }
                    />
                    <Route
                      path="/admin/customers"
                      element={
                        <AdminProtectedRoute>
                          <AdminLayout>
                            <AdminCustomersPage />
                          </AdminLayout>
                        </AdminProtectedRoute>
                      }
                    />
                    <Route
                      path="/admin/profile"
                      element={
                        <AdminProtectedRoute>
                          <AdminLayout>
                            <AdminProfilePage />
                          </AdminLayout>
                        </AdminProtectedRoute>
                      }
                    />
                    <Route
                      path="/admin/kitchen"
                      element={
                        <AdminProtectedRoute>
                          <AdminLayout>
                            <AdminKitchenPage />
                          </AdminLayout>
                        </AdminProtectedRoute>
                      }
                    />
                    <Route
                      path="/admin/delivery"
                      element={
                        <AdminProtectedRoute>
                          <AdminLayout>
                            <AdminDeliveryPage />
                          </AdminLayout>
                        </AdminProtectedRoute>
                      }
                    />
                    <Route
                      path="/admin/reservations"
                      element={
                        <AdminProtectedRoute>
                          <AdminLayout>
                            <AdminReservationsPage />
                          </AdminLayout>
                        </AdminProtectedRoute>
                      }
                    />
                    <Route
                      path="/admin/payments"
                      element={
                        <AdminProtectedRoute>
                          <AdminLayout>
                            <AdminPaymentsPage />
                          </AdminLayout>
                        </AdminProtectedRoute>
                      }
                    />
                    <Route
                      path="/admin/settings"
                      element={
                        <AdminProtectedRoute>
                          <AdminLayout>
                            <AdminSettingsPage />
                          </AdminLayout>
                        </AdminProtectedRoute>
                      }
                    />
                    <Route
                      path="/admin/marketing"
                      element={
                        <AdminProtectedRoute>
                          <AdminLayout>
                            <AdminMarketingPage />
                          </AdminLayout>
                        </AdminProtectedRoute>
                      }
                    />
                    <Route
                      path="/admin/catering"
                      element={
                        <AdminProtectedRoute>
                          <AdminLayout>
                            <AdminCateringPage />
                          </AdminLayout>
                        </AdminProtectedRoute>
                      }
                    />
                    <Route
                      path="/admin/loyalty"
                      element={
                        <AdminProtectedRoute>
                          <AdminLayout>
                            <AdminLoyaltyPage />
                          </AdminLayout>
                        </AdminProtectedRoute>
                      }
                    />

                    {/* Customer Routes (with CustomerLayout) */}
                    <Route
                      path="/*"
                      element={
                        <CustomerLayout>
                          <Routes>
                            {/* Public Routes */}
                            <Route path="/" element={<HomePage />} />
                            <Route path="/about" element={<AboutPage />} />
                            <Route path="/catering" element={<CateringPage />} />
                            <Route path="/location" element={<LocationPage />} />

                            {/* Customer Auth Routes */}
                            <Route path="/login" element={<LoginPage />} />
                            <Route path="/register" element={<RegisterPage />} />
                            <Route path="/auth/callback" element={<AuthCallbackPage />} />

                            {/* Customer Menu & Ordering Routes */}
                            <Route path="/menu" element={<MenuPage />} />

                            {/* Order Success (Public - supports guest checkout) */}
                            <Route path="/order-success" element={<OrderSuccessPage />} />

                            {/* Order Tracking (Public) */}
                            <Route path="/order-tracking/:orderId" element={<OrderTrackingPage />} />

                            {/* Protected Customer Routes */}
                            <Route
                              path="/my-orders"
                              element={
                                <ProtectedRoute>
                                  <MyOrdersPage />
                                </ProtectedRoute>
                              }
                            />

                            <Route
                              path="/profile"
                              element={
                                <ProtectedRoute>
                                  <ProfilePage />
                                </ProtectedRoute>
                              }
                            />

                            {/* 404 Not Found */}
                            <Route path="*" element={<NotFound />} />
                          </Routes>
                        </CustomerLayout>
                      }
                    />
                  </Routes>
                </CartProvider>
              </AdminAuthProvider>
            </CustomerAuthProvider>
          </LocationProvider>
        </ToastProvider>
      </Router>
    </ErrorBoundary>
  )
}

export default App
