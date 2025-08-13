# Design do Sistema - Projeto Enxergar Sem Fronteira

## Overview

O sistema será desenvolvido como uma aplicação web full-stack com frontend React/TypeScript e backend Node.js, utilizando Supabase como banco de dados e plataforma de autenticação. A arquitetura seguirá padrões modernos de desenvolvimento com separação clara entre camadas.

## Architecture

### Frontend Architecture
- **Framework**: React 18 com TypeScript
- **Build Tool**: Vite
- **UI Library**: shadcn/ui + Tailwind CSS
- **State Management**: React Query + Zustand
- **Routing**: React Router v6
- **Forms**: React Hook Form + Zod validation

### Backend Architecture
- **Runtime**: Node.js com TypeScript
- **Framework**: Express.js
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **File Storage**: Supabase Storage
- **Email**: Resend ou SendGrid
- **WhatsApp**: Twilio API
- **PDF Generation**: Puppeteer

### External Integrations
- **Payment Gateway**: Asaas API
- **Maps**: Google Maps API
- **Instituto Coração Valente**: Custom REST API
- **AI Agent**: Renum AI API

## Components and Interfaces

### Database Schema

#### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  role VARCHAR(50) DEFAULT 'user',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### User Profiles Table
```sql
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  full_name VARCHAR(255) NOT NULL,
  cpf VARCHAR(14) UNIQUE NOT NULL,
  phone VARCHAR(20) NOT NULL,
  birth_date DATE,
  address JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Events Table
```sql
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  location VARCHAR(255) NOT NULL,
  address TEXT NOT NULL,
  coordinates POINT,
  total_slots INTEGER NOT NULL,
  available_slots INTEGER NOT NULL,
  status VARCHAR(50) DEFAULT 'active',
  organizer_id UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Registrations Table
```sql
CREATE TABLE registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  user_profile_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  registration_date TIMESTAMP DEFAULT NOW(),
  status VARCHAR(50) DEFAULT 'confirmed',
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(event_id, user_profile_id)
);
```

#### Organizations Table
```sql
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(100) NOT NULL,
  contact_email VARCHAR(255),
  contact_phone VARCHAR(20),
  address TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### Donations Table
```sql
CREATE TABLE donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  amount DECIMAL(10,2) NOT NULL,
  donor_email VARCHAR(255),
  donor_name VARCHAR(255),
  affiliate_id UUID REFERENCES users(id),
  payment_id VARCHAR(255) UNIQUE,
  payment_status VARCHAR(50),
  split_data JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### API Endpoints

#### Authentication Endpoints
```typescript
POST /api/auth/login
POST /api/auth/register
POST /api/auth/logout
POST /api/auth/refresh
POST /api/auth/forgot-password
POST /api/auth/reset-password
```

#### Events Endpoints
```typescript
GET /api/events - List all active events
GET /api/events/:id - Get event details
POST /api/events - Create new event (organizer only)
PUT /api/events/:id - Update event (organizer only)
DELETE /api/events/:id - Delete event (organizer only)
GET /api/events/:id/registrations - Get event registrations
```

#### Registration Endpoints
```typescript
POST /api/registrations - Register for event
GET /api/registrations/user/:userId - Get user registrations
DELETE /api/registrations/:id - Cancel registration
```

#### Admin Endpoints
```typescript
GET /api/admin/dashboard - Get dashboard metrics
GET /api/admin/events - Get all events with details
GET /api/admin/users - Get all users
GET /api/admin/reports/:eventId - Generate event report
```

### Frontend Pages Structure

#### Public Pages
1. **Home Page** (`/`) - Already implemented
2. **Event Details Page** (`/events/:id`) - New
3. **Registration Page** (`/events/:id/register`) - New
4. **Login Page** (`/login`) - New
5. **Register Page** (`/register`) - New

#### Organizer Pages
6. **Organizer Dashboard** (`/organizer/dashboard`) - New
7. **Create Event** (`/organizer/events/new`) - New
8. **Edit Event** (`/organizer/events/:id/edit`) - New
9. **Event Registrations** (`/organizer/events/:id/registrations`) - New

#### Admin Pages
10. **Admin Dashboard** (`/admin/dashboard`) - New
11. **All Events Management** (`/admin/events`) - New
12. **Users Management** (`/admin/users`) - New
13. **Reports** (`/admin/reports`) - New

#### User Pages
14. **User Profile** (`/profile`) - New
15. **My Registrations** (`/my-registrations`) - New

### Component Architecture

#### Shared Components
```typescript
// Form Components
<EventForm />
<RegistrationForm />
<UserProfileForm />

// Display Components
<EventCard />
<EventDetails />
<RegistrationList />
<UserTable />

// Layout Components
<DashboardLayout />
<PublicLayout />
<AdminLayout />

// UI Components (already implemented via shadcn/ui)
<Button />
<Card />
<Form />
<Table />
<Dialog />
```

## Data Models

### Event Model
```typescript
interface Event {
  id: string;
  title: string;
  description?: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  location: string;
  address: string;
  coordinates?: { lat: number; lng: number };
  totalSlots: number;
  availableSlots: number;
  status: 'active' | 'cancelled' | 'completed';
  organizerId: string;
  createdAt: string;
  updatedAt: string;
}
```

### Registration Model
```typescript
interface Registration {
  id: string;
  eventId: string;
  userProfileId: string;
  registrationDate: string;
  status: 'confirmed' | 'cancelled' | 'attended';
  notes?: string;
  event?: Event;
  userProfile?: UserProfile;
}
```

### User Profile Model
```typescript
interface UserProfile {
  id: string;
  userId: string;
  fullName: string;
  cpf: string;
  phone: string;
  birthDate?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
}
```

## Error Handling

### Frontend Error Handling
- Global error boundary for React components
- API error interceptors with user-friendly messages
- Form validation with real-time feedback
- Loading states and error states for all async operations

### Backend Error Handling
- Centralized error handling middleware
- Structured error responses with error codes
- Logging with different levels (error, warn, info, debug)
- Rate limiting and security measures

## Testing Strategy

### Frontend Testing
- Unit tests for utility functions and hooks
- Component testing with React Testing Library
- Integration tests for critical user flows
- E2E tests with Playwright for main scenarios

### Backend Testing
- Unit tests for business logic and utilities
- Integration tests for API endpoints
- Database tests with test database
- Load testing for critical endpoints

### Test Coverage Goals
- Minimum 80% code coverage
- 100% coverage for critical business logic
- All API endpoints tested
- All user registration flows tested

## Security Considerations

### Authentication & Authorization
- JWT tokens with refresh mechanism
- Role-based access control (RBAC)
- Password hashing with bcrypt
- Rate limiting on auth endpoints

### Data Protection
- Input validation and sanitization
- SQL injection prevention
- XSS protection
- CORS configuration
- HTTPS enforcement

### Privacy Compliance
- LGPD compliance for Brazilian users
- Data encryption at rest and in transit
- User consent management
- Right to data deletion

## Performance Optimization

### Frontend Performance
- Code splitting and lazy loading
- Image optimization and lazy loading
- Caching strategies with React Query
- Bundle size optimization

### Backend Performance
- Database indexing strategy
- Connection pooling
- Caching with Redis (if needed)
- API response optimization

### Monitoring
- Application performance monitoring
- Error tracking with Sentry
- Database performance monitoring
- User analytics (privacy-compliant)

## Deployment Strategy

### Environment Setup
- Development: Local with Supabase local development
- Staging: Vercel + Supabase staging
- Production: Vercel + Supabase production

### CI/CD Pipeline
- Automated testing on pull requests
- Automated deployment to staging
- Manual approval for production deployment
- Database migration automation

### Monitoring & Alerting
- Uptime monitoring
- Error rate alerts
- Performance degradation alerts
- Database health monitoring