import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, ShoppingCart, Plus, Minus, Trash2, ArrowRight, Loader } from 'lucide-react'
import { useCart } from '../../contexts/CartContext'
import { useCustomerAuth } from '../../contexts/CustomerAuthContext'
import { useToast } from '../../contexts/ToastContext'
import { paymentApi } from '../../services/api/paymentApi'
import './CartDrawer.css'

const CartDrawer = ({ isOpen, onClose }) => {
  const navigate = useNavigate()
  const { items, itemCount, subtotal, tax, total, locationId, updateQuantity, removeItem, clearCart, calculateItemPrice, triggerCheckout, isCheckoutLoading } = useCart()
  const { isAuthenticated, customer } = useCustomerAuth()
  const { showToast } = useToast()
  
  const handleCheckout = async () => {
    if (!isAuthenticated) {
      showToast('Please login to complete your order', 'info')
      onClose()
      navigate('/login', { 
        state: { 
          from: { 
            pathname: window.location.pathname,
            openCart: true,
            triggerCheckout: true
          } 
        } 
      })
      return
    }

    const result = await triggerCheckout(customer);
    if (result.success) {
      onClose();
    } else {
      showToast(result.error, 'error');
    }
  }

  const handleQuantityChange = (cartId, newQuantity) => {
    if (newQuantity <= 0) {
      removeItem(cartId)
    } else {
      updateQuantity(cartId, newQuantity)
    }
  }

  const formatPrice = (price) => {
    return `$${parseFloat(price).toFixed(2)}`
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div className="cart-drawer-backdrop" onClick={onClose}></div>

      {/* Drawer */}
      <div className="cart-drawer">
        {/* Header */}
        <div className="cart-drawer-header">
          <div className="cart-drawer-title">
            <ShoppingCart size={24} />
            <h2>Your Cart</h2>
            {itemCount > 0 && (
              <span className="cart-count-badge">{itemCount}</span>
            )}
          </div>
          <button className="cart-drawer-close" onClick={onClose} aria-label="Close cart">
            <X size={24} />
          </button>
        </div>

        {/* Cart Content */}
        <div className="cart-drawer-content">
          {items.length === 0 ? (
            <div className="cart-empty">
              <ShoppingCart size={64} className="empty-cart-icon" />
              <h3>Your cart is empty</h3>
              <p>Add some delicious items to get started!</p>
              <button className="continue-shopping-btn" onClick={onClose}>
                Continue Shopping
              </button>
            </div>
          ) : (
            <>
              {/* Clear Cart Button */}
              {items.length > 0 && (
                <button className="clear-cart-btn" onClick={clearCart}>
                  <Trash2 size={16} />
                  Clear Cart
                </button>
              )}

              {/* Cart Items */}
              <div className="cart-items">
                {items.map((item) => {
                  const itemPrice = calculateItemPrice(item)
                  return (
                    <div key={item.cart_id} className="cart-item">
                      <div className="cart-item-info">
                        {item.image_url ? (
                          <img src={item.image_url} alt={item.name} className="cart-item-image" />
                        ) : item.emoji ? (
                          <span className="cart-item-emoji">{item.emoji}</span>
                        ) : null}
                        <div className="cart-item-details">
                          <h4>{item.name}</h4>

                          {/* Display selected options */}
                          {item.options && Object.keys(item.options).length > 0 && (
                            <div className="cart-item-options">
                              {Object.entries(item.options).map(([groupName, options]) => (
                                <div key={groupName} className="option-line">
                                  <span className="option-group-name">{groupName}:</span>
                                  <span className="option-values">
                                    {options.map(opt => {
                                      const modifier = parseFloat(opt.price_modifier || 0)
                                      return modifier !== 0
                                        ? `${opt.name} (+$${modifier.toFixed(2)})`
                                        : opt.name
                                    }).join(', ')}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}

                          <p className="cart-item-price">{formatPrice(itemPrice)}</p>
                        </div>
                      </div>

                      <div className="cart-item-actions">
                        <div className="cart-item-quantity">
                          <button
                            className="quantity-btn"
                            onClick={() => handleQuantityChange(item.cart_id, item.quantity - 1)}
                            aria-label="Decrease quantity"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="quantity-value">{item.quantity}</span>
                          <button
                            className="quantity-btn"
                            onClick={() => handleQuantityChange(item.cart_id, item.quantity + 1)}
                            aria-label="Increase quantity"
                          >
                            <Plus size={14} />
                          </button>
                        </div>

                        <button
                          className="remove-item-btn"
                          onClick={() => removeItem(item.cart_id)}
                          aria-label="Remove item"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>

                      <div className="cart-item-total">
                        {formatPrice(itemPrice * item.quantity)}
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>

        {/* Cart Footer (only show if cart has items) */}
        {items.length > 0 && (
          <div className="cart-drawer-footer">
            <div className="cart-summary">
              <div className="summary-row">
                <span>Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="summary-row">
                <span>Tax</span>
                <span>{formatPrice(tax)}</span>
              </div>
              <div className="summary-row total">
                <span>Total</span>
                <span>{formatPrice(total)}</span>
              </div>
            </div>

            <button 
              className="checkout-btn" 
              onClick={handleCheckout}
              disabled={isCheckoutLoading}
            >
              {isCheckoutLoading ? (
                <>
                  <Loader size={20} className="spin" />
                  Processing...
                </>
              ) : (
                <>
                  Proceed to Checkout
                  <ArrowRight size={20} />
                </>
              )}
            </button>

            <button className="continue-shopping-link" onClick={onClose}>
              Continue Shopping
            </button>
          </div>
        )}
      </div>
    </>
  )
}

export default CartDrawer
