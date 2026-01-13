# Mo's Burritos FastAPI Backend

A Python FastAPI backend for multi-location restaurant management.

## Features

- **Multi-Location Support**: Manage multiple restaurant locations and food trucks
- **Role-Based Access Control**: Owner, Manager, Staff, and Customer roles
- **Separate Menus per Location**: Each location has its own menu categories and items
- **Order Management**: Create, track, and manage orders per location
- **Dashboard Stats**: Per-location analytics and order statistics

## Quick Start

### 1. Install Dependencies

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your settings
```

### 3. Run Development Server

```bash
uvicorn app.main:app --reload --port 8000
```

### 4. Access API Docs

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## Initial Setup

On first deployment, no default accounts are created for security.

To create the first owner account, use the registration endpoint:
```bash
POST /api/users/register-owner
```

This endpoint only works when no owner account exists in the system.

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `POST /api/auth/login` | Login |
| `POST /api/auth/register` | Register customer |
| `GET /api/locations` | List locations |
| `GET /api/menu/location/{id}` | Get location menu |
| `POST /api/orders` | Create order |
| `GET /api/orders/dashboard/{id}` | Dashboard stats |

See `/docs` for complete API documentation.

## Project Structure

```
backend/
├── app/
│   ├── main.py           # FastAPI entry point
│   ├── config.py         # Environment configuration
│   ├── database.py       # Database connection
│   ├── models/           # SQLAlchemy models
│   ├── schemas/          # Pydantic schemas
│   ├── routers/          # API endpoints
│   ├── services/         # Business logic
│   └── middleware/       # Auth middleware
├── requirements.txt
└── .env.example
```
