import React, { useState, useEffect } from 'react'
import { X, Plus, Minus, ShoppingCart } from 'lucide-react'
import { menuApi } from '../../services/api/menuApi'
import { useCart } from '../../contexts/CartContext'
import { useToast } from '../../contexts/ToastContext'
import LoadingSpinner from '../shared/LoadingSpinner'
import './MenuItemModal.css'

const MenuItemModal = ({ item, locationId, isOpen, onClose }) => {
  const [optionGroups, setOptionGroups] = useState([])
  const [selectedOptions, setSelectedOptions] = useState({})
  const [quantity, setQuantity] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)

  const { addItem } = useCart()
  const { showToast } = useToast()

  useEffect(() => {
    if (isOpen && item) {
      loadOptions()
    }
  }, [isOpen, item])

  const loadOptions = async () => {
    setIsLoading(true)
    try {
      const groups = await menuApi.getItemOptionGroups(item.id)
      setOptionGroups(groups || [])

      // Pre-select default options
      const defaults = {}
      groups?.forEach(group => {
        const defaultOption = group.options?.find(opt => opt.is_default)
        if (defaultOption && !group.allow_multiple) {
          defaults[group.id] = defaultOption.id
        } else if (group.allow_multiple) {
          const defaultOpts = group.options?.filter(opt => opt.is_default).map(opt => opt.id)
          if (defaultOpts?.length > 0) {
            defaults[group.id] = defaultOpts
          }
        }
      })
      setSelectedOptions(defaults)
    } catch (error) {
      console.error('Error loading options:', error)
      showToast('Failed to load customization options', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleOptionSelect = (groupId, optionId, allowMultiple) => {
    if (allowMultiple) {
      setSelectedOptions(prev => {
        const current = prev[groupId] || []
        if (current.includes(optionId)) {
          return { ...prev, [groupId]: current.filter(id => id !== optionId) }
        } else {
          return { ...prev, [groupId]: [...current, optionId] }
        }
      })
    } else {
      setSelectedOptions(prev => ({ ...prev, [groupId]: optionId }))
    }
  }

  const validateSelections = () => {
    for (const group of optionGroups) {
      if (group.is_required) {
        const selection = selectedOptions[group.id]
        if (!selection || (Array.isArray(selection) && selection.length === 0)) {
          showToast(`Please select ${group.name}`, 'error')
          return false
        }
      }

      if (group.allow_multiple && selectedOptions[group.id]) {
        const selections = selectedOptions[group.id]
        if (group.min_selections && selections.length < group.min_selections) {
          showToast(`Please select at least ${group.min_selections} ${group.name}`, 'error')
          return false
        }
        if (group.max_selections && selections.length > group.max_selections) {
          showToast(`Please select at most ${group.max_selections} ${group.name}`, 'error')
          return false
        }
      }
    }
    return true
  }

  const calculateTotalPrice = () => {
    let total = parseFloat(item.price)

    optionGroups.forEach(group => {
      const selection = selectedOptions[group.id]
      if (!selection) return

      if (Array.isArray(selection)) {
        selection.forEach(optId => {
          const option = group.options?.find(opt => opt.id === optId)
          if (option) total += parseFloat(option.price_modifier || 0)
        })
      } else {
        const option = group.options?.find(opt => opt.id === selection)
        if (option) total += parseFloat(option.price_modifier || 0)
      }
    })

    return total * quantity
  }

  const handleAddToCart = async () => {
    if (!validateSelections()) return

    setIsAdding(true)
    try {
      // Format selected options for cart
      const formattedOptions = {}
      optionGroups.forEach(group => {
        const selection = selectedOptions[group.id]
        if (!selection) return

        if (Array.isArray(selection)) {
          formattedOptions[group.name] = selection
            .map(optId => group.options?.find(opt => opt.id === optId))
            .filter(Boolean)
            .map(opt => ({ name: opt.name, price_modifier: opt.price_modifier }))
        } else {
          const option = group.options?.find(opt => opt.id === selection)
          if (option) {
            formattedOptions[group.name] = [{ name: option.name, price_modifier: option.price_modifier }]
          }
        }
      })

      const result = addItem({
        menu_item_id: item.id,
        id: item.id,
        name: item.name,
        price: item.price,
        emoji: item.emoji,
        image_url: item.image_url,
        location_id: locationId,
        options: formattedOptions
      }, quantity)

      if (result.success) {
        showToast(`Added ${quantity} ${item.name} to cart`, 'success')
        onClose()
        setQuantity(1)
      } else {
        showToast(result.error || 'Failed to add item to cart', 'error')
      }
    } catch (error) {
      showToast('Failed to add item to cart', 'error')
    } finally {
      setIsAdding(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="menu-item-modal" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header-custom">
          {item.image_url && (
            <div className="modal-item-image">
              <img src={item.image_url} alt={item.name} />
            </div>
          )}
          <button className="modal-close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="modal-body">
          <h2 className="modal-item-title">
            {item.emoji && <span className="modal-item-emoji">{item.emoji}</span>}
            {item.name}
          </h2>
          {item.description && (
            <p className="modal-item-description">{item.description}</p>
          )}
          <p className="modal-base-price">Base Price: ${parseFloat(item.price).toFixed(2)}</p>

          {isLoading ? (
            <LoadingSpinner size="medium" />
          ) : optionGroups.length === 0 ? (
            <div className="no-options-message">
              <p>No customization options available</p>
            </div>
          ) : (
            <div className="options-container">
              {optionGroups.map(group => (
                <div key={group.id} className="option-group">
                  <h3 className="option-group-title">
                    {group.name}
                    {group.is_required && <span className="required-badge">Required</span>}
                  </h3>
                  {group.allow_multiple && (
                    <p className="option-group-subtitle">
                      {group.min_selections > 0 && `Select at least ${group.min_selections}`}
                      {group.max_selections && ` • Max ${group.max_selections}`}
                    </p>
                  )}

                  <div className="options-list">
                    {group.options?.map(option => {
                      const isSelected = group.allow_multiple
                        ? selectedOptions[group.id]?.includes(option.id)
                        : selectedOptions[group.id] === option.id

                      return (
                        <label
                          key={option.id}
                          className={`option-item ${isSelected ? 'selected' : ''}`}
                        >
                          <input
                            type={group.allow_multiple ? 'checkbox' : 'radio'}
                            name={`group-${group.id}`}
                            checked={isSelected}
                            onChange={() => handleOptionSelect(group.id, option.id, group.allow_multiple)}
                          />
                          <span className="option-name">{option.name}</span>
                          {option.price_modifier !== 0 && (
                            <span className="option-price">
                              {option.price_modifier > 0 ? '+' : ''}
                              ${parseFloat(option.price_modifier).toFixed(2)}
                            </span>
                          )}
                        </label>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <div className="quantity-selector-modal">
            <button
              type="button"
              className="quantity-btn"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              disabled={quantity <= 1 || isAdding}
            >
              <Minus size={18} />
            </button>
            <span className="quantity-value">{quantity}</span>
            <button
              type="button"
              className="quantity-btn"
              onClick={() => setQuantity(Math.min(99, quantity + 1))}
              disabled={quantity >= 99 || isAdding}
            >
              <Plus size={18} />
            </button>
          </div>

          <button
            type="button"
            className="add-to-cart-modal-btn"
            onClick={handleAddToCart}
            disabled={isAdding || isLoading}
          >
            <ShoppingCart size={20} />
            <span>
              {isAdding ? 'Adding...' : `Add to Cart • $${calculateTotalPrice().toFixed(2)}`}
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default MenuItemModal
