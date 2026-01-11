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
import MenuPage from './pages/customer/MenuPage'
import OrderConfirmationPage from './pages/customer/OrderConfirmationPage'
import CheckoutPage from './pages/customer/CheckoutPage'
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

                            {/* Customer Menu & Ordering Routes */}
                            <Route path="/menu" element={<MenuPage />} />

                            {/* Protected Customer Routes */}
                            <Route
                                path="/order-confirmation"
                                element={
                                    <ProtectedRoute>
                                        <OrderConfirmationPage />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/checkout"
                                element={
                                    <ProtectedRoute>
                                        <CheckoutPage />
                                    </ProtectedRoute>
                                }
                            />

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

                            {/* Order Success (after Stripe checkout) */}
                            <Route
                                path="/order-success"
                                element={
                                    <ProtectedRoute>
                                        <OrderSuccessPage />
                                    </ProtectedRoute>
                                }
                            />

                            {/* Order Tracking (Public) */}
                            <Route path="/order-tracking/:orderId" element={<OrderTrackingPage />} />

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
