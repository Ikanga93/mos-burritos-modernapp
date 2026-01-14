import React, { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, X, Check, DollarSign, ToggleLeft, ToggleRight, Upload, Image as ImageIcon, Minus } from 'lucide-react'
import { useToast } from '../../contexts/ToastContext'
import { menuApi } from '../../services/api/menuApi'
import { locationApi } from '../../services/api/locationApi'
import LoadingSpinner from '../../components/shared/LoadingSpinner'
import './AdminMenuPage.css'

const AdminMenuPage = () => {
    const { showToast } = useToast()

    const [locations, setLocations] = useState([])
    const [selectedLocation, setSelectedLocation] = useState('')
    const [menuItems, setMenuItems] = useState([])
    const [categories, setCategories] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [editingItem, setEditingItem] = useState(null)
    const [formData, setFormData] = useState({
        name: '', description: '', price: '', category_id: '', is_available: true
    })

    // Category management state
    const [showCategoryModal, setShowCategoryModal] = useState(false)
    const [editingCategory, setEditingCategory] = useState(null)
    const [categoryFormData, setCategoryFormData] = useState({
        name: '', description: '', emoji: ''
    })

    // Image upload state
    const [imageFile, setImageFile] = useState(null)
    const [imagePreview, setImagePreview] = useState(null)
    const [isUploadingImage, setIsUploadingImage] = useState(false)

    // Options state
    const [optionGroups, setOptionGroups] = useState([])

    // Everyone has full access - no authentication required
    const isManager = true

    useEffect(() => {
        if (true) loadLocations()
    }, [])

    useEffect(() => {
        // Auto-select first location if none selected
        if (locations.length > 0 && !selectedLocation) {
            setSelectedLocation(locations[0].id)
        }
    }, [locations, selectedLocation])

    const loadLocations = async () => {
        try {
            const data = await locationApi.getAllLocations()
            const locs = Array.isArray(data) ? data : data.locations || []
            setLocations(locs)
        } catch (error) {
            console.error('Error loading locations:', error)
        }
    }

    useEffect(() => {
        if (selectedLocation) loadMenu()
    }, [selectedLocation])

    const loadMenu = async () => {
        setIsLoading(true)
        try {
            const [itemsData, categoriesData] = await Promise.all([
                menuApi.getMenuItems(selectedLocation, false),
                menuApi.getCategories(selectedLocation)
            ])
            setMenuItems(Array.isArray(itemsData) ? itemsData : itemsData.items || [])
            setCategories(Array.isArray(categoriesData) ? categoriesData : categoriesData.categories || [])
        } catch (error) {
            console.error('Error loading menu:', error)
            showToast('Failed to load menu', 'error')
        } finally {
            setIsLoading(false)
        }
    }

    const openAddModal = () => {
        if (categories.length === 0) {
            showToast('Please create a category first before adding menu items', 'error')
            setShowCategoryModal(true)
            return
        }
        setEditingItem(null)
        setFormData({ name: '', description: '', price: '', category_id: categories[0]?.id || '', is_available: true })
        setImageFile(null)
        setImagePreview(null)
        setOptionGroups([])
        setShowModal(true)
    }

    const openAddCategoryModal = () => {
        setEditingCategory(null)
        setCategoryFormData({ name: '', description: '', emoji: '' })
        setShowCategoryModal(true)
    }

    const openEditCategoryModal = (category) => {
        setEditingCategory(category)
        setCategoryFormData({
            name: category.name || '',
            description: category.description || '',
            emoji: category.emoji || ''
        })
        setShowCategoryModal(true)
    }

    const closeCategoryModal = () => {
        setShowCategoryModal(false)
        setEditingCategory(null)
        setCategoryFormData({ name: '', description: '', emoji: '' })
    }

    const handleCategorySubmit = async (e) => {
        e.preventDefault()
        if (!categoryFormData.name.trim()) {
            showToast('Category name is required', 'error')
            return
        }

        if (!selectedLocation) {
            showToast('Please select a location', 'error')
            return
        }

        try {
            const categoryData = {
                ...categoryFormData,
                location_id: selectedLocation,
                display_order: categories.length
            }

            if (editingCategory) {
                await menuApi.updateCategory(editingCategory.id, categoryData)
                showToast('Category updated successfully', 'success')
            } else {
                await menuApi.createCategory(categoryData)
                showToast('Category created successfully', 'success')
            }

            closeCategoryModal()
            loadMenu()
        } catch (error) {
            console.error('Error saving category:', error)
            const errorMessage = error.response?.data?.detail || error.response?.data?.message || error.message || 'Failed to save category'
            showToast(errorMessage, 'error')
        }
    }

    const handleDeleteCategory = async (categoryId) => {
        if (!confirm('Are you sure you want to delete this category? All items in this category will also be deleted.')) return
        try {
            await menuApi.deleteCategory(categoryId)
            showToast('Category deleted', 'success')
            loadMenu()
        } catch (error) {
            const errorMessage = error.response?.data?.detail || error.response?.data?.message || error.message || 'Failed to delete category'
            showToast(errorMessage, 'error')
        }
    }

    const openEditModal = async (item) => {
        setEditingItem(item)
        setFormData({
            name: item.name || '',
            description: item.description || '',
            price: item.price?.toString() || '',
            category_id: item.category_id || '',
            is_available: item.is_available !== false
        })
        setImageFile(null)
        setImagePreview(item.image_url || null)

        // Load existing option groups
        try {
            const groups = await menuApi.getItemOptionGroups(item.id)
            setOptionGroups(groups || [])
        } catch (error) {
            console.error('Error loading option groups:', error)
            setOptionGroups([])
        }

        setShowModal(true)
    }

    const closeModal = () => {
        setShowModal(false)
        setEditingItem(null)
        setImageFile(null)
        setImagePreview(null)
        setOptionGroups([])
    }

    const handleImageSelect = (e) => {
        const file = e.target.files[0]
        if (file) {
            if (!file.type.startsWith('image/')) {
                showToast('Please select an image file', 'error')
                return
            }
            if (file.size > 5 * 1024 * 1024) {
                showToast('Image must be less than 5MB', 'error')
                return
            }
            setImageFile(file)
            const reader = new FileReader()
            reader.onloadend = () => {
                setImagePreview(reader.result)
            }
            reader.readAsDataURL(file)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!formData.name.trim() || !formData.price) {
            showToast('Name and price are required', 'error')
            return
        }

        if (!formData.category_id) {
            showToast('Please select a category', 'error')
            return
        }

        if (!selectedLocation) {
            showToast('Please select a location', 'error')
            return
        }

        try {
            const itemData = { ...formData, price: parseFloat(formData.price), location_id: selectedLocation }
            let itemId

            if (editingItem) {
                await menuApi.updateMenuItem(editingItem.id, itemData)
                itemId = editingItem.id
                showToast('Item updated successfully', 'success')
            } else {
                const result = await menuApi.createMenuItem(itemData)
                itemId = result.id
                showToast('Item created successfully', 'success')
            }

            // Upload image if selected
            if (imageFile && itemId) {
                setIsUploadingImage(true)
                try {
                    await menuApi.uploadMenuImage(itemId, imageFile)
                } catch (error) {
                    console.error('Error uploading image:', error)
                    showToast('Item saved but image upload failed', 'warning')
                } finally {
                    setIsUploadingImage(false)
                }
            }

            // Save option groups
            if (itemId) {
                await saveOptionGroups(itemId)
            }

            closeModal()
            loadMenu()
        } catch (error) {
            console.error('Error saving menu item:', error)
            const errorMessage = error.response?.data?.detail || error.response?.data?.message || error.message || 'Failed to save item'
            showToast(errorMessage, 'error')
        }
    }

    const saveOptionGroups = async (itemId) => {
        try {
            // For editing: delete old groups and create new ones (simple approach)
            if (editingItem) {
                // Note: In production, you'd want to update existing groups instead of delete/recreate
                // For now, we'll just save new groups for newly created items
            }

            // Create new option groups
            for (const group of optionGroups) {
                if (!group.id || !group.id.startsWith('new-')) continue // Only save unsaved groups

                await menuApi.createOptionGroup(itemId, {
                    name: group.name,
                    is_required: group.is_required,
                    allow_multiple: group.allow_multiple,
                    min_selections: group.min_selections,
                    max_selections: group.max_selections,
                    display_order: group.display_order,
                    options: group.options
                })
            }
        } catch (error) {
            console.error('Error saving option groups:', error)
            showToast('Item saved but options may not have saved', 'warning')
        }
    }

    const addOptionGroup = () => {
        setOptionGroups([...optionGroups, {
            id: 'new-' + Date.now(),
            name: '',
            is_required: false,
            allow_multiple: false,
            min_selections: 0,
            max_selections: null,
            display_order: optionGroups.length,
            options: []
        }])
    }

    const updateOptionGroup = (index, field, value) => {
        const updated = [...optionGroups]
        updated[index] = { ...updated[index], [field]: value }
        setOptionGroups(updated)
    }

    const removeOptionGroup = (index) => {
        setOptionGroups(optionGroups.filter((_, i) => i !== index))
    }

    const addOption = (groupIndex) => {
        const updated = [...optionGroups]
        updated[groupIndex].options.push({
            id: 'opt-new-' + Date.now(),
            name: '',
            price_modifier: 0,
            is_default: false,
            display_order: updated[groupIndex].options.length
        })
        setOptionGroups(updated)
    }

    const updateOption = (groupIndex, optionIndex, field, value) => {
        const updated = [...optionGroups]
        updated[groupIndex].options[optionIndex][field] = value
        setOptionGroups(updated)
    }

    const removeOption = (groupIndex, optionIndex) => {
        const updated = [...optionGroups]
        updated[groupIndex].options = updated[groupIndex].options.filter((_, i) => i !== optionIndex)
        setOptionGroups(updated)
    }

    const handleDelete = async (itemId) => {
        if (!confirm('Are you sure you want to delete this item?')) return
        try {
            await menuApi.deleteMenuItem(itemId)
            showToast('Item deleted', 'success')
            loadMenu()
        } catch (error) {
            showToast('Failed to delete item', 'error')
        }
    }

    const toggleAvailability = async (item) => {
        try {
            await menuApi.toggleItemAvailability(item.id)
            const status = item.is_available ? 'disabled' : 'enabled'
            showToast('Item ' + status, 'success')
            loadMenu()
        } catch (error) {
            showToast('Failed to update item', 'error')
        }
    }

    const groupedItems = categories.map(cat => ({
        category: cat,
        items: menuItems.filter(item => item.category_id === cat.id)
    }))

    if ((isLoading && !menuItems.length)) {
        return <div className="admin-menu-page"><LoadingSpinner size="large" message="Loading menu..." /></div>
    }

    return (
        <div className="admin-menu-page">
            <header className="page-header">
                <div className="header-left">
                    <h1>Menu</h1>
                    {true && (
                        <select value={selectedLocation} onChange={e => setSelectedLocation(e.target.value)} className="location-select">
                            {locations.map(loc => <option key={loc.id} value={loc.id}>{loc.name}</option>)}
                        </select>
                    )}
                </div>
                <div className="header-right">
                    {true && (
                        <>
                            <button className="add-btn secondary" onClick={openAddCategoryModal}>
                                <Plus size={18} /> Add Category
                            </button>
                            <button className="add-btn" onClick={openAddModal}>
                                <Plus size={18} /> Add Item
                            </button>
                        </>
                    )}
                </div>
            </header>

            {groupedItems.length === 0 || menuItems.length === 0 ? (
                <div className="empty-state">
                    <DollarSign size={48} />
                    <p>No menu items yet</p>
                    {true && <button className="add-btn" onClick={openAddModal}>Add Your First Item</button>}
                </div>
            ) : (
                <div className="menu-sections">
                    {groupedItems.map(({ category, items }) => items.length > 0 && (
                        <section key={category.id} className="menu-section">
                            <h2>{category.name}</h2>
                            <div className="items-grid">
                                {items.map(item => {
                                    const cardClass = 'menu-item-card' + (!item.is_available ? ' unavailable' : '')
                                    return (
                                        <div key={item.id} className={cardClass}>
                                            {item.image_url && <div className="item-image"><img src={item.image_url} alt={item.name} /></div>}
                                            <div className="item-content">
                                                <div className="item-header">
                                                    <h3>{item.name}</h3>
                                                    <span className="item-price">{'$' + parseFloat(item.price).toFixed(2)}</span>
                                                </div>
                                                {item.description && <p className="item-desc">{item.description}</p>}
                                                {true && (
                                                    <div className="item-actions">
                                                        <button className={'toggle-btn ' + (item.is_available ? 'on' : 'off')} onClick={() => toggleAvailability(item)}>
                                                            {item.is_available ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                                                        </button>
                                                        <button className="edit-btn" onClick={() => openEditModal(item)}><Edit2 size={16} /></button>
                                                        <button className="delete-btn" onClick={() => handleDelete(item.id)}><Trash2 size={16} /></button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </section>
                    ))}
                </div>
            )}

            {showModal && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal-content large" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editingItem ? 'Edit Item' : 'Add Item'}</h2>
                            <button className="close-btn" onClick={closeModal}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            {/* Basic Info */}
                            <div className="form-section">
                                <h3>Basic Information</h3>
                                <div className="form-group">
                                    <label>Name *</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Description</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        rows={3}
                                    />
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Price *</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={formData.price}
                                            onChange={e => setFormData({ ...formData, price: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Category</label>
                                        <select
                                            value={formData.category_id}
                                            onChange={e => setFormData({ ...formData, category_id: e.target.value })}
                                        >
                                            {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="form-group checkbox-group">
                                    <label>
                                        <input
                                            type="checkbox"
                                            checked={formData.is_available}
                                            onChange={e => setFormData({ ...formData, is_available: e.target.checked })}
                                        />
                                        Available
                                    </label>
                                </div>
                            </div>

                            {/* Image Upload */}
                            <div className="form-section">
                                <h3>Image</h3>
                                <div className="image-upload-area">
                                    {imagePreview ? (
                                        <div className="image-preview">
                                            <img src={imagePreview} alt="Preview" />
                                            <button
                                                type="button"
                                                className="remove-image-btn"
                                                onClick={() => { setImageFile(null); setImagePreview(null); }}
                                            >
                                                <X size={16} /> Remove
                                            </button>
                                        </div>
                                    ) : (
                                        <label className="image-upload-label">
                                            <input
                                                type="file"
                                                accept="image/jpeg,image/jpg,image/png,image/webp,image/avif"
                                                onChange={handleImageSelect}
                                                style={{ display: 'none' }}
                                            />
                                            <div className="upload-placeholder">
                                                <ImageIcon size={48} />
                                                <p>Click to upload image</p>
                                                <span>PNG, JPG, WebP, AVIF (max 5MB)</span>
                                            </div>
                                        </label>
                                    )}
                                </div>
                            </div>

                            {/* Customization Options */}
                            <div className="form-section">
                                <div className="section-header-with-btn">
                                    <h3>Customization Options</h3>
                                    <button type="button" className="add-option-group-btn" onClick={addOptionGroup}>
                                        <Plus size={16} /> Add Option Group
                                    </button>
                                </div>

                                {optionGroups.length === 0 && (
                                    <p className="empty-options-text">
                                        No customization options yet. Add option groups like "Size", "Toppings", or "Sides" to let customers customize their order.
                                    </p>
                                )}

                                {optionGroups.map((group, groupIndex) => (
                                    <div key={group.id} className="option-group-card">
                                        <div className="option-group-header">
                                            <input
                                                type="text"
                                                placeholder="Option Group Name (e.g., Size, Toppings)"
                                                value={group.name}
                                                onChange={e => updateOptionGroup(groupIndex, 'name', e.target.value)}
                                                className="group-name-input"
                                            />
                                            <button
                                                type="button"
                                                className="remove-group-btn"
                                                onClick={() => removeOptionGroup(groupIndex)}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>

                                        <div className="option-group-settings">
                                            <label className="checkbox-label">
                                                <input
                                                    type="checkbox"
                                                    checked={group.is_required}
                                                    onChange={e => updateOptionGroup(groupIndex, 'is_required', e.target.checked)}
                                                />
                                                Required
                                            </label>
                                            <label className="checkbox-label">
                                                <input
                                                    type="checkbox"
                                                    checked={group.allow_multiple}
                                                    onChange={e => updateOptionGroup(groupIndex, 'allow_multiple', e.target.checked)}
                                                />
                                                Allow Multiple
                                            </label>
                                            {group.allow_multiple && (
                                                <>
                                                    <div className="mini-input-group">
                                                        <label>Min:</label>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            value={group.min_selections}
                                                            onChange={e => updateOptionGroup(groupIndex, 'min_selections', parseInt(e.target.value) || 0)}
                                                        />
                                                    </div>
                                                    <div className="mini-input-group">
                                                        <label>Max:</label>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            value={group.max_selections || ''}
                                                            onChange={e => updateOptionGroup(groupIndex, 'max_selections', parseInt(e.target.value) || null)}
                                                        />
                                                    </div>
                                                </>
                                            )}
                                        </div>

                                        <div className="options-list">
                                            {group.options.map((option, optionIndex) => (
                                                <div key={option.id} className="option-item">
                                                    <input
                                                        type="text"
                                                        placeholder="Option name"
                                                        value={option.name}
                                                        onChange={e => updateOption(groupIndex, optionIndex, 'name', e.target.value)}
                                                        className="option-name-input"
                                                    />
                                                    <div className="price-modifier-input">
                                                        <span>$</span>
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            placeholder="0.00"
                                                            value={option.price_modifier}
                                                            onChange={e => updateOption(groupIndex, optionIndex, 'price_modifier', parseFloat(e.target.value) || 0)}
                                                        />
                                                    </div>
                                                    <label className="default-checkbox">
                                                        <input
                                                            type="checkbox"
                                                            checked={option.is_default}
                                                            onChange={e => updateOption(groupIndex, optionIndex, 'is_default', e.target.checked)}
                                                        />
                                                        Default
                                                    </label>
                                                    <button
                                                        type="button"
                                                        className="remove-option-btn"
                                                        onClick={() => removeOption(groupIndex, optionIndex)}
                                                    >
                                                        <Minus size={14} />
                                                    </button>
                                                </div>
                                            ))}
                                            <button
                                                type="button"
                                                className="add-option-btn"
                                                onClick={() => addOption(groupIndex)}
                                            >
                                                <Plus size={14} /> Add Option
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="modal-actions">
                                <button type="button" className="cancel-btn" onClick={closeModal}>Cancel</button>
                                <button type="submit" className="save-btn" disabled={isUploadingImage}>
                                    <Check size={18} /> {editingItem ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Category Modal */}
            {showCategoryModal && (
                <div className="modal-overlay" onClick={closeCategoryModal}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editingCategory ? 'Edit Category' : 'Add Category'}</h2>
                            <button className="close-btn" onClick={closeCategoryModal}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleCategorySubmit}>
                            <div className="form-group">
                                <label>Category Name *</label>
                                <input
                                    type="text"
                                    value={categoryFormData.name}
                                    onChange={e => setCategoryFormData({ ...categoryFormData, name: e.target.value })}
                                    placeholder="e.g., Burritos, Tacos, Sides"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Description (Optional)</label>
                                <textarea
                                    value={categoryFormData.description}
                                    onChange={e => setCategoryFormData({ ...categoryFormData, description: e.target.value })}
                                    rows={3}
                                    placeholder="Brief description of this category"
                                />
                            </div>
                            <div className="form-group">
                                <label>Emoji (Optional)</label>
                                <input
                                    type="text"
                                    value={categoryFormData.emoji}
                                    onChange={e => setCategoryFormData({ ...categoryFormData, emoji: e.target.value })}
                                    placeholder="🌯"
                                    maxLength={10}
                                />
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="cancel-btn" onClick={closeCategoryModal}>Cancel</button>
                                <button type="submit" className="save-btn">
                                    <Check size={18} /> {editingCategory ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

export default AdminMenuPage
