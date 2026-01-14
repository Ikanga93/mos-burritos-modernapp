import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useLocation } from './LocationContext'
import { paymentApi } from '../services/api/paymentApi'

const CartContext = createContext(null)

export const useCart = () => {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}

const TAX_RATE = 0.0825 // 8.25% tax rate

export const CartProvider = ({ children }) => {
  // Initialize state directly from localStorage to avoid race conditions
  const [items, setItems] = useState(() => {
    try {
      const storedItems = localStorage.getItem('cart_items')
      return storedItems ? JSON.parse(storedItems) : []
    } catch (error) {
      console.error('Error loading cart from localStorage:', error)
      return []
    }
  })

  const [locationId, setLocationId] = useState(() => {
    try {
      return localStorage.getItem('cart_location_id')
    } catch (error) {
      return null
    }
  })

  const [isCartOpen, setIsCartOpen] = useState(false)
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false)
  
  // Get location context for fallback
  const locationContext = useLocation()

  // Persist cart to localStorage whenever it changes
  useEffect(() => {
    console.log('[Cart] Persisting to localStorage - Items:', items.length, 'Location:', locationId);
    localStorage.setItem('cart_items', JSON.stringify(items))
    if (locationId) {
      localStorage.setItem('cart_location_id', locationId)
    } else {
      localStorage.removeItem('cart_location_id')
    }
  }, [items, locationId])

  // Calculate item price including options
  const calculateItemPrice = (item) => {
    let price = parseFloat(item.price)

    // Add option modifiers
    if (item.options) {
      Object.values(item.options).forEach(optionGroup => {
        if (Array.isArray(optionGroup)) {
          optionGroup.forEach(option => {
            price += parseFloat(option.price_modifier || 0)
          })
        }
      })
    }

    return price
  }

  // Calculate subtotal
  const subtotal = items.reduce((sum, item) => {
    const itemPrice = calculateItemPrice(item)
    return sum + (itemPrice * item.quantity)
  }, 0)

  // Calculate tax
  const tax = subtotal * TAX_RATE

  // Calculate total
  const total = subtotal + tax

  // Get item count
  const itemCount = items.reduce((count, item) => count + item.quantity, 0)

  // Validate location - can't mix items from different locations
  const validateLocation = useCallback((newLocationId) => {
    // If cart is empty, always allow any location
    if (items.length === 0) {
      return { valid: true }
    }

    if (!locationId) {
      // No location set yet, allow
      return { valid: true }
    }

    if (String(locationId) !== String(newLocationId)) {
      // Different location, not allowed
      return {
        valid: false,
        message: 'Your cart contains items from a different location. Please clear your cart or choose the same location.'
      }
    }

    return { valid: true }
  }, [locationId, items.length])

  // Compare options to check if two items have the same customizations
  const optionsMatch = (options1, options2) => {
    if (!options1 && !options2) return true
    if (!options1 || !options2) return false

    const keys1 = Object.keys(options1).sort()
    const keys2 = Object.keys(options2).sort()

    if (keys1.length !== keys2.length) return false
    if (keys1.join(',') !== keys2.join(',')) return false

    return keys1.every(key => {
      const opts1 = options1[key]
      const opts2 = options2[key]

      if (opts1.length !== opts2.length) return false

      const names1 = opts1.map(o => o.name).sort().join(',')
      const names2 = opts2.map(o => o.name).sort().join(',')

      return names1 === names2
    })
  }

  // Add item to cart
  const addItem = useCallback((item, quantity = 1) => {
    // Use item's location_id, or fallback to current selected location
    const itemLocationId = item.location_id || (locationContext?.selectedLocation?.id)
    
    console.log('[Cart] Adding item:', item.name, 'Location ID:', itemLocationId);
    console.log('[Cart] Current Cart Location ID:', locationId, 'Items count:', items.length);

    if (!itemLocationId) {
      return { success: false, error: 'No location selected. Please choose a location first.' }
    }

    const validation = validateLocation(itemLocationId)

    if (!validation.valid) {
      console.warn('[Cart] Location validation failed:', validation.message);
      return { success: false, error: validation.message }
    }

    setItems((prevItems) => {
      // For items with options, check if exact same item+options exists
      const existingItemIndex = prevItems.findIndex(i =>
        i.menu_item_id === (item.menu_item_id || item.id) && optionsMatch(i.options, item.options)
      )

      if (existingItemIndex !== -1) {
        // Update quantity of existing item with same options
        return prevItems.map((i, idx) =>
          idx === existingItemIndex
            ? { ...i, quantity: i.quantity + quantity }
            : i
        )
      } else {
        // Add new item (or same item with different options)
        return [...prevItems, {
          cart_id: `${item.menu_item_id || item.id}-${Date.now()}`, // Unique ID for cart entries
          menu_item_id: item.menu_item_id || item.id,
          name: item.name,
          price: item.price,
          quantity,
          location_id: itemLocationId,
          emoji: item.emoji,
          image_url: item.image_url,
          options: item.options || null
        }]
      }
    })

    // Set location if not already set or if cart is becoming non-empty
    if (!locationId || items.length === 0) {
      console.log('[Cart] Updating Cart Location ID to:', itemLocationId);
      setLocationId(itemLocationId)
    }

    return { success: true }
  }, [locationId, items.length, validateLocation, locationContext?.selectedLocation])

  // Remove item from cart (by cart_id or menu_item_id)
  const removeItem = useCallback((itemId) => {
    setItems((prevItems) => {
      const newItems = prevItems.filter(item =>
        item.cart_id !== itemId && item.menu_item_id !== itemId
      )

      // If cart is empty, clear location
      if (newItems.length === 0) {
        setLocationId(null)
      }

      return newItems
    })
  }, [])

  // Update item quantity (by cart_id)
  const updateQuantity = useCallback((cartId, quantity) => {
    if (quantity <= 0) {
      removeItem(cartId)
      return
    }

    setItems((prevItems) =>
      prevItems.map(item =>
        item.cart_id === cartId
          ? { ...item, quantity }
          : item
      )
    )
  }, [removeItem])

  // Clear entire cart
  const clearCart = useCallback(() => {
    setItems([])
    setLocationId(null)
    localStorage.removeItem('cart_items')
    localStorage.removeItem('cart_location_id')
  }, [])

  // Handle Checkout logic (Stripe redirect)
  const triggerCheckout = useCallback(async (user) => {
    if (!user) {
      console.error('[Cart] Cannot checkout without user information');
      return { success: false, error: 'User not authenticated' };
    }

    if (!locationId) {
      console.error('[Cart] Cannot checkout without location ID');
      return { success: false, error: 'No location selected' };
    }

    if (items.length === 0) {
      console.error('[Cart] Cannot checkout with empty cart');
      return { success: false, error: 'Cart is empty' };
    }

    setIsCheckoutLoading(true);
    try {
      const customerInfo = {
        name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email || 'Customer',
        email: user.email,
        phone: user.phone || 'Not provided'
      };

      const amountInCents = Math.round(total * 100);
      const checkoutSession = await paymentApi.createCheckoutSession(
        amountInCents,
        'usd',
        customerInfo,
        items.map(item => ({
          name: item.name,
          price: item.price,
          quantity: item.quantity
        })),
        locationId,
        ''
      );

      sessionStorage.setItem('stripeSessionId', checkoutSession.sessionId);
      sessionStorage.setItem('orderConfirmation', JSON.stringify({
        customerInfo,
        customerId: user.id,
        locationId,
        items,
        subtotal,
        tax,
        total,
        isGuest: false
      }));

      // Direct redirect to Stripe
      window.location.href = checkoutSession.url;
      return { success: true };
    } catch (error) {
      console.error('[Cart] Checkout redirect error:', error);
      setIsCheckoutLoading(false);
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Failed to initiate checkout. Please try again.' 
      };
    }
  }, [items, locationId, total, subtotal, tax]);

  // Get item by menu_item_id (returns first match)
  const getItem = useCallback((menuItemId) => {
    return items.find(item => item.menu_item_id === menuItemId)
  }, [items])

  // Get all cart items for a specific menu item
  const getCartItemsByMenuId = useCallback((menuItemId) => {
    return items.filter(item => item.menu_item_id === menuItemId)
  }, [items])

  const value = {
    items,
    locationId,
    itemCount,
    subtotal: parseFloat(subtotal.toFixed(2)),
    tax: parseFloat(tax.toFixed(2)),
    total: parseFloat(total.toFixed(2)),
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    getItem,
    getCartItemsByMenuId,
    calculateItemPrice,
    validateLocation,
    isCartOpen,
    setIsCartOpen,
    isCheckoutLoading,
    triggerCheckout
  }

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  )
}

export default CartProvider
