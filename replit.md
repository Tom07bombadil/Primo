# Healthcare Management System

## Overview

This is a comprehensive healthcare management system designed for care coordinators and clinical liaisons to manage SNF (Skilled Nursing Facility) reports, patient appointments, and facility assignments. The system provides role-based dashboards with real-time data visualization and workflow management for healthcare operations.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript using Vite for development
- **UI Components**: Radix UI primitives with shadcn/ui component system
- **Styling**: Tailwind CSS with custom healthcare-focused design system
- **State Management**: TanStack Query for server state, React Context for authentication
- **Routing**: Wouter for lightweight client-side routing
- **Theme System**: Custom light/dark mode implementation with CSS variables

### Backend Architecture  
- **Server**: Express.js with TypeScript
- **API Design**: RESTful endpoints with standardized error handling
- **Data Layer**: Drizzle ORM for type-safe database operations
- **Storage**: In-memory storage implementation with interface for easy database migration
- **Session Management**: Express sessions with PostgreSQL session store ready

### Database Design
- **ORM**: Drizzle with PostgreSQL dialect
- **Schema Structure**:
  - Users table with role-based access (care_coordinator, clinical_liaison)  
  - Facilities table with cluster organization and liaison assignments
  - Patients table with medical data, risk levels, and discharge readiness
  - Appointments table linking patients, facilities, and providers
  - SNF Reports table for facility performance tracking
- **Relationships**: Foreign key constraints maintaining data integrity across entities

### Authentication & Authorization
- **Authentication**: Session-based with mock implementation for development
- **Authorization**: Role-based access control with two distinct user types
- **Session Storage**: PostgreSQL session store configuration ready for production

### Component Architecture
- **Layout System**: Sidebar navigation with responsive design
- **Role-Based UI**: Dynamic component rendering based on user role
- **Data Tables**: Sortable, filterable tables with search functionality
- **Modal System**: Assignment workflows and form dialogs
- **Dashboard Views**: Specialized interfaces for coordinators vs liaisons

### Design System
- **Color Palette**: Healthcare-focused with status indicators (green/amber/red)
- **Typography**: Inter font family optimized for medical data readability
- **Accessibility**: WCAG compliance for healthcare environments
- **Responsive Design**: Mobile-first approach with healthcare workflow optimization

## External Dependencies

### Core Framework Dependencies
- **React Ecosystem**: React 18, React DOM, TypeScript
- **Build Tools**: Vite with TypeScript and React plugins
- **Styling**: Tailwind CSS with PostCSS and Autoprefixer

### UI Component Libraries
- **Radix UI**: Complete set of accessible UI primitives
- **shadcn/ui**: Pre-built component system based on Radix
- **Lucide React**: Icon library for consistent iconography

### Backend Dependencies
- **Express.js**: Web application framework
- **Database**: Drizzle ORM with Neon serverless PostgreSQL driver
- **Session Management**: express-session with connect-pg-simple store

### State Management & Data Fetching
- **TanStack Query**: Server state management and caching
- **React Hook Form**: Form handling with Zod validation
- **Wouter**: Lightweight client-side routing

### Development & Build Tools
- **TypeScript**: Type safety across frontend and backend
- **ESBuild**: Fast bundling for production builds
- **TSX**: TypeScript execution for development server

### Date & Utility Libraries
- **date-fns**: Date manipulation and formatting
- **clsx & tailwind-merge**: Conditional CSS class handling
- **class-variance-authority**: Component variant management