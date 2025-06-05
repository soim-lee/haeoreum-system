# TechCorp Landing Page Application

## Overview

This is a modern, full-stack corporate landing page application built with React, TypeScript, Express.js, and PostgreSQL. The application features a responsive design using shadcn/ui components and Tailwind CSS, with a Node.js backend providing API endpoints for contact forms and authentication.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript using Vite as the build tool
- **Routing**: Wouter for client-side routing
- **UI Components**: shadcn/ui component library with Radix UI primitives
- **Styling**: Tailwind CSS with CSS custom properties for theming
- **State Management**: React Query (TanStack Query) for server state management
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Development**: tsx for development server with hot reloading
- **Production**: esbuild for server bundling

### Database Strategy
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Database**: PostgreSQL (configured for Neon Database)
- **Schema Management**: Drizzle Kit for migrations
- **Development Storage**: In-memory storage implementation for rapid prototyping

## Key Components

### Frontend Components
- **Navigation**: Responsive navigation with smooth scrolling and active section detection
- **Hero Section**: Main landing area with call-to-action buttons
- **Company Section**: About us with vision/mission statements
- **Business Section**: Service offerings with icon-based cards
- **Welfare Section**: Employee benefits and company culture
- **Customers Section**: Client testimonials and company logos
- **Contact Section**: Visit scheduling form with location details
- **Groupware Section**: Employee login portal with feature highlights
- **Footer**: Company information and quick links

### Backend Endpoints
- **POST /api/contact**: Contact form submission handling
- **POST /api/groupware/login**: Groupware authentication (placeholder)

### UI System
- **Design System**: shadcn/ui "new-york" style with neutral base color
- **Theme Support**: Light/dark mode support via CSS custom properties
- **Responsive Design**: Mobile-first approach with breakpoint-based layouts
- **Icons**: Lucide React for consistent iconography

## Data Flow

1. **Client Requests**: Frontend makes API calls using React Query
2. **Form Submissions**: Contact forms submit data to Express endpoints
3. **Data Validation**: Backend validates incoming requests
4. **Storage Layer**: Currently uses in-memory storage (ready for database integration)
5. **Response Handling**: Frontend displays success/error states via toast notifications

## External Dependencies

### Core Dependencies
- **@tanstack/react-query**: Server state management and caching
- **@radix-ui/react-***: Headless UI primitives for accessibility
- **drizzle-orm**: Type-safe database ORM
- **@neondatabase/serverless**: Neon PostgreSQL adapter
- **class-variance-authority**: Utility for component variants
- **clsx & tailwind-merge**: Conditional styling utilities

### Development Tools
- **Vite**: Frontend build tool with HMR
- **TypeScript**: Type safety across the entire stack
- **Tailwind CSS**: Utility-first CSS framework
- **PostCSS**: CSS processing with autoprefixer

## Deployment Strategy

### Build Process
- **Frontend**: Vite builds optimized React application to `dist/public`
- **Backend**: esbuild bundles server code to `dist/index.js`
- **Assets**: Static assets served from built frontend

### Environment Configuration
- **Development**: tsx server with Vite middleware for HMR
- **Production**: Node.js serves bundled application
- **Database**: Environment variable `DATABASE_URL` for PostgreSQL connection

### Replit Integration
- **Runtime**: Node.js 20 with PostgreSQL 16 module
- **Auto-deployment**: Configured for autoscale deployment target
- **Port Configuration**: Local port 5000 mapped to external port 80

### Database Setup
- **Schema Location**: `shared/schema.ts` with user table definition
- **Migration Command**: `npm run db:push` applies schema changes
- **Connection**: Uses Drizzle config pointing to `DATABASE_URL`

## Architectural Decisions

### Monorepo Structure
**Problem**: Managing frontend and backend code in a single repository
**Solution**: Organized with `client/`, `server/`, and `shared/` directories
**Rationale**: Enables code sharing (schemas, types) while maintaining separation of concerns

### Type-Safe Database Layer
**Problem**: Runtime database errors and type mismatches
**Solution**: Drizzle ORM with TypeScript integration and Zod validation
**Rationale**: Provides compile-time type safety and runtime validation

### Component-Based UI
**Problem**: Consistent, accessible, and maintainable user interface
**Solution**: shadcn/ui component system with Radix UI primitives
**Rationale**: Ensures accessibility compliance while providing customizable, reusable components

### Hybrid Storage Strategy
**Problem**: Development speed vs. production requirements
**Solution**: In-memory storage for development, PostgreSQL interface ready
**Rationale**: Allows rapid prototyping while maintaining production-ready architecture