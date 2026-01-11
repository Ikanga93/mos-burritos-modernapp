# Mo's Burrito App - Complete Order Management System

A full-stack restaurant and food truck application with multi-location support, Stripe payment processing, and customer order tracking.

## Features

### Customer Features
- 🌮 Browse menu with real-time availability
- 🛒 Shopping cart with location selection
- 💳 Secure Stripe payment processing
- 📱 Order tracking
- 📍 Multiple pickup locations support

### Restaurant Admin Features
- 📊 Order dashboard with analytics
- ⏱️ Order status management
- 📋 Menu management per location
- 📍 Multi-location management
- 👥 User and staff management
- ⚙️ Role-based access control

### Technical Features
- 💾 SQLite/PostgreSQL database support
- 🔐 Secure JWT authentication
- 📱 Responsive design
- 🎨 Modern UI with animations
- 🏢 Multi-location architecture

## Tech Stack

### Frontend
- React 18
- React Router
- Stripe Elements
- Lucide React Icons
- CSS3 with custom properties

### Backend
- Python 3.12
- FastAPI
- SQLAlchemy ORM
- Pydantic for validation
- JWT authentication
- Stripe API
- Uvicorn ASGI server

## Setup Instructions

### 1. Frontend Setup

```bash
# Install dependencies
npm install

# Create .env file (copy from .env.example)
cp .env.example .env

# Update .env with your configuration
VITE_API_URL=http://localhost:8000
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here

# Start frontend
npm run dev
```

The frontend will be available at http://localhost:5173

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
# venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file in backend directory
# See backend/.env.example for required variables

# Start backend server
uvicorn app.main:app --reload
```

The backend API will be available at http://localhost:8000

### 3. Database Setup

The SQLite database will be created automatically when you start the backend server. No additional setup required.

For production, configure PostgreSQL connection in backend/.env

### 4. Default Admin Account

The backend creates a default admin account on first run:
- Email: `admin@mosburrito.com`
- Password: `admin123`

**Important**: Change this password in production!

## Usage

### For Customers

1. **Browse Menu**: Visit the homepage to see available items
2. **Add to Cart**: Click "Add to Cart" on menu items
3. **Checkout**:
   - Click the cart icon to open cart
   - Select pickup location
   - Enter customer information
   - Click "Continue to Payment"
4. **Payment**: Enter card details (use Stripe test cards)
5. **Track Order**: Automatically redirected to order tracking page

### For Restaurant Staff

1. **Login**: Visit `/admin-login` or click "Staff" in footer
   - Email: `admin@mosburrito.com`
   - Password: `admin123`
2. **Dashboard**: View and manage orders
3. **Order Management**:
   - View pending orders
   - Update order status
   - Complete orders when picked up

## Stripe Test Cards

Use these test card numbers for development:

- **Successful payment**: 4242 4242 4242 4242
- **Declined payment**: 4000 0000 0000 0002
- **Requires authentication**: 4000 0025 0000 3155

Use any future expiry date, any 3-digit CVC, and any postal code.

## API Endpoints

### Authentication (`/api/auth`)
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - Customer registration
- `GET /api/auth/me` - Get current user
- `POST /api/auth/refresh` - Refresh access token

### Users (`/api/users`)
- `GET /api/users` - List all users (owner only)
- `GET /api/users/{user_id}` - Get user details
- `POST /api/users` - Create new user (owner only)
- `PUT /api/users/{user_id}` - Update user

### Locations (`/api/locations`)
- `GET /api/locations` - List all locations (public)
- `GET /api/locations/{location_id}` - Get location details
- `POST /api/locations` - Create location (owner only)
- `PUT /api/locations/{location_id}` - Update location

### Menu (`/api/menu`)
- `GET /api/menu/location/{location_id}` - Get full menu (public)
- `POST /api/menu/categories` - Create category
- `POST /api/menu/items` - Create menu item
- `PUT /api/menu/items/{item_id}` - Update menu item

### Orders (`/api/orders`)
- `POST /api/orders` - Create order (public)
- `GET /api/orders` - List orders (filtered by user access)
- `GET /api/orders/{order_id}` - Get order details
- `PATCH /api/orders/{order_id}/status` - Update order status
- `GET /api/orders/dashboard/{location_id}` - Get dashboard stats

## Database Schema

### Users Table
- User accounts with role-based access (owner/manager/staff/customer)
- Email authentication with bcrypt-hashed passwords
- Profile information and location assignments

### Locations Table
- Restaurant or food truck locations
- Physical address details and coordinates
- JSON-based schedule/hours

### Menu Tables
- Categories per location
- Items within categories
- Pricing, descriptions, availability

### Orders Table
- Customer orders linked to locations
- Order items (JSON array)
- Financial totals and tax
- Status tracking and payment info

## Customization

The application is built with a flexible business configuration system. You can customize:

- Business name and branding
- Menu items and pricing (per location)
- Locations and schedules
- Contact information
- User roles and permissions

See `src/config/businessConfig.js` for frontend configuration options.

## Deployment

### Frontend
1. Build the frontend: `npm run build`
2. Deploy the `dist` folder to Vercel, Netlify, or any static hosting
3. Set environment variables in your hosting platform

### Backend
1. Choose a Python hosting platform (Railway, Heroku, AWS, etc.)
2. Set environment variables (see backend/.env.example)
3. Configure PostgreSQL database for production
4. Deploy the backend folder
5. Configure Stripe webhooks to point to your deployed backend

**Note**: Deployment guides for Railway have been removed. Choose a hosting solution that best fits your needs.

## Troubleshooting

### Common Issues

1. **Frontend not connecting to backend**:
   - Check that backend is running on port 8000
   - Verify VITE_API_URL in .env points to correct backend URL

2. **Payment failing**:
   - Verify Stripe keys are correctly set
   - Check backend logs for Stripe errors

3. **401 Unauthorized errors**:
   - Check JWT token validity
   - Ensure you're logged in with correct credentials

4. **Database errors**:
   - Ensure write permissions in backend directory
   - Check database connection string in backend/.env

### Development Tips

- Check browser console for frontend errors
- Check backend terminal for API errors
- Use Stripe Dashboard to monitor test payments
- Access API documentation at http://localhost:8000/docs (Swagger UI)

## API Documentation

The backend provides interactive API documentation:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support or questions, please create an issue in the repository.
