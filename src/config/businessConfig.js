import API_BASE_URL from './api.js'

// Business Configuration System
// This allows the same codebase to be used for multiple locations and business types

export const BUSINESS_TYPES = {
  FOOD_TRUCK: 'food_truck',
  RESTAURANT: 'restaurant',
  BOTH: 'both'
}

export const LOCATION_TYPES = {
  MOBILE: 'mobile',        // Food truck - moves around
  FIXED: 'fixed',          // Restaurant - fixed location
  HYBRID: 'hybrid'         // Both food truck and restaurant
}

// Main business configuration
export const businessConfig = {
  // Basic Business Info
  businessName: "Mo's Burritos",
  tagline: "Authentic Mexican & Salvadorian Cuisine",
  description: "Mo's Burritos Restaurant offers a variety of Mexican and Salvadorian food!!! We also offer catering for any type of events.",

  // Operating Hours
  hours: {
    monday: "11:00 AM - 9:00 PM",
    tuesday: "11:00 AM - 9:00 PM",
    wednesday: "11:00 AM - 9:00 PM",
    thursday: "11:00 AM - 9:00 PM",
    friday: "11:00 AM - 10:00 PM",
    saturday: "11:00 AM - 10:00 PM",
    sunday: "12:00 PM - 8:00 PM"
  },

  // Contact Information
  contact: {
    phone: "(217) 607-8131",
    email: "mosrestaurant19@gmail.com",
    address: "705 N Neil St, Champaign, IL 61820",
    facebook: "https://www.facebook.com/profile.php?id=100066724737090",
    instagram: "Burritosmos"
  },

  // Delivery Platforms
  deliveryPlatforms: [
    "DoorDash",
    "Uber Eats",
    "Grubhub",
    "EzCater"
  ],

  // Locations
  locations: [
    {
      id: 1,
      name: "Mo's Burritos Restaurant",
      type: "restaurant",
      address: "705 N Neil St, Champaign, IL 61820",
      phone: "(217) 607-8131",
      coordinates: {
        lat: 40.1164,
        lng: -88.2434
      },
      hours: "Mon-Thu: 11AM-9PM, Fri-Sat: 11AM-10PM, Sun: 12PM-8PM",
      features: ["Dine-in", "Takeout", "In-store pickup", "Catering"],
      description: "Our main restaurant location offering authentic Mexican and Salvadorian cuisine with dine-in, takeout, and catering services.",
      image: "/images/popus-image/resto-neil-01.webp",
      status: "active",
      isPrimary: true,
      isActive: true
    },
    {
      id: 2,
      name: "Mo's Burritos - Urbana Location",
      type: "restaurant",
      address: "Downtown Urbana, IL",
      phone: "(217) 607-8131",
      coordinates: {
        lat: 40.1106,
        lng: -88.2073
      },
      hours: "Mon-Sun: 11AM-9PM",
      features: ["Dine-in", "Takeout", "Quick Service"],
      description: "Our second restaurant location in downtown Urbana serving the same great food.",
      status: "active",
      isActive: true
    },
    {
      id: 3,
      name: "Mo's Food Truck #1",
      type: "mobile",
      address: "University of Illinois Campus Area",
      phone: "(217) 607-8131",
      coordinates: {
        lat: 40.1092,
        lng: -88.2272
      },
      hours: "Daily: 11AM-8PM",
      features: ["Mobile Service", "Quick Pickup", "Campus Events"],
      description: "Food truck serving U of I campus and surrounding areas with authentic Mexican street food.",
      image: "/images/popus-image/mosburritosteam.webp",
      status: "active",
      isActive: true
    },
    {
      id: 4,
      name: "Mo's Food Truck #2",
      type: "mobile",
      address: "Market at the Square, Urbana",
      phone: "(217) 607-8131",
      coordinates: {
        lat: 40.1103,
        lng: -88.2042
      },
      hours: "Weekends: 9AM-2PM",
      features: ["Farmers Market", "Weekend Service"],
      description: "Find us at the Urbana Farmers Market on weekends for fresh breakfast burritos and lunch favorites.",
      image: "/images/popus-image/mosburritosteam.webp",
      status: "active",
      isActive: true
    },
    {
      id: 5,
      name: "Mo's Food Truck #3",
      type: "mobile",
      address: "Research Park, Champaign",
      phone: "(217) 607-8131",
      coordinates: {
        lat: 40.0950,
        lng: -88.2150
      },
      hours: "Weekdays: 11AM-2PM",
      features: ["Lunch Service", "Corporate Catering"],
      description: "Serving the Research Park area with delicious lunch options for professionals and researchers.",
      image: "/images/popus-image/mosburritosteam.webp",
      status: "active",
      isActive: true
    },
    {
      id: 6,
      name: "Mo's Burritos Rantoul",
      type: "restaurant",
      address: "900 Klein Ave, Rantoul, IL 61866",
      phone: "(217) 390-1634",
      coordinates: {
        lat: 40.3089,
        lng: -88.1559
      },
      hours: "Mon-Sun: 10AM-9PM",
      features: ["Dine-in", "Takeout", "Order Pickup", "Delivery"],
      description: "Tacos and burritos are made to order at this casual eatery. Rated 4.4★ (86 reviews). $10-20 per person.",
      status: "active",
      isActive: true
    },
    {
      id: 7,
      name: "Mo's Burritos Bar & Grill",
      type: "restaurant",
      address: "723 S Neil St Ste 101, Champaign, IL 61820",
      phone: "(217) 552-5002",
      coordinates: {
        lat: 40.1050,
        lng: -88.2434
      },
      hours: "Daily: 8AM-11PM",
      features: ["Dine-in", "Bar", "Sports Viewing", "Kids' Menu", "Reserve Table", "Order Online"],
      description: "Bar & Grill with sports viewing and family-friendly atmosphere. Rated 4.7★ (122 reviews). $10-20 per person.",
      image: "/images/popus-image/mosburritosheroimage.webp",
      status: "active",
      isActive: true
    },
    {
      id: 8,
      name: "Mo's Food Truck #4",
      type: "mobile",
      address: "Downtown Champaign Area",
      phone: "(217) 550-6016",
      coordinates: {
        lat: 40.126893,
        lng: -88.257295
      },
      hours: "Daily: 7AM-8PM",
      features: ["Quick Service", "Grubhub", "Mobile Ordering"],
      description: "Mobile food truck serving downtown Champaign. Order on Grubhub. $10-20 per person. (195 reviews)",
      image: "/images/popus-image/mosburritosteam.webp",
      status: "active",
      isActive: true
    }
  ],

  // Menu Categories
  menuCategories: [
    {
      id: 1,
      name: "Burritos",
      description: "Authentic Mexican and Salvadorian style burritos",
      icon: "🌯"
    },
    {
      id: 2,
      name: "Tacos",
      description: "Traditional tacos with fresh ingredients",
      icon: "🌮"
    },
    {
      id: 3,
      name: "Quesadillas",
      description: "Grilled flour tortillas with cheese and fillings",
      icon: "🧀"
    },
    {
      id: 4,
      name: "Salvadorian Specialties",
      description: "Authentic Salvadorian dishes and favorites",
      icon: "🫓"
    },
    {
      id: 5,
      name: "Sides & Appetizers",
      description: "Perfect additions to your meal",
      icon: "🥑"
    },
    {
      id: 6,
      name: "Beverages",
      description: "Refreshing drinks and traditional beverages",
      icon: "🥤"
    },
    {
      id: 7,
      name: "Desserts",
      description: "Sweet treats to finish your meal",
      icon: "🍮"
    }
  ],

  // Social Media & Marketing
  social: {
    facebook: "https://www.facebook.com/profile.php?id=100066724737090",
    instagram: "Burritosmos",
    email: "mosrestaurant19@gmail.com"
  },

  // SEO & Meta
  seo: {
    title: "Mo's Burritos - Authentic Mexican & Salvadorian Food",
    description: "Mo's Burritos Restaurant offers authentic Mexican and Salvadorian cuisine in Champaign, IL. Dine-in, takeout, delivery, and catering available.",
    keywords: "Mexican food, Salvadorian food, burritos, tacos, Champaign IL, restaurant, catering, delivery"
  },

  // Business Features
  features: {
    onlineOrdering: true,
    delivery: true,
    catering: true,
    mobilePayments: true,
    loyaltyProgram: false,
    giftCards: false
  }
}

// Location-specific configurations
export const getActiveLocations = () => {
  return businessConfig.locations.filter(location => location.isActive)
}

export const getPrimaryLocation = () => {
  return businessConfig.locations.find(location => location.isPrimary)
}

export const getLocationById = (id) => {
  return businessConfig.locations.find(location => location.id === id)
}

// Business type helpers
export const isFoodTruckBusiness = () => {
  return businessConfig.businessType === BUSINESS_TYPES.FOOD_TRUCK ||
    businessConfig.businessType === BUSINESS_TYPES.BOTH
}

export const isRestaurantBusiness = () => {
  return businessConfig.businessType === BUSINESS_TYPES.RESTAURANT ||
    businessConfig.businessType === BUSINESS_TYPES.BOTH
}

export const hasMultipleLocations = () => {
  return getActiveLocations().length > 1
}

// Environment-specific overrides
export const getEnvironmentConfig = () => {
  const env = import.meta.env.MODE || 'development'

  const envConfigs = {
    development: {
      apiUrl: 'http://localhost:3001',
      enableDebug: true
    },
    production: {
      apiUrl: API_BASE_URL,
      enableDebug: false
    }
  }

  return envConfigs[env] || envConfigs.development
} 