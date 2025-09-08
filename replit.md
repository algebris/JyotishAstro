# Overview

This is a full-stack astrology chart management application built with React, TypeScript, Express.js, and PostgreSQL. The application allows users to create, organize, and manage astrological charts for their clients through a modern web interface. It features authentication via Replit Auth, a component-based UI built with shadcn/ui, and a RESTful API for data management.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The client uses React with TypeScript and is built around a component-based architecture using shadcn/ui components. Key architectural decisions include:

- **Routing**: Uses wouter for client-side routing with authenticated route protection
- **State Management**: Combines React Query (@tanstack/react-query) for server state management with local component state for UI state
- **UI Framework**: Built on shadcn/ui components with Radix UI primitives and Tailwind CSS for styling
- **Form Handling**: Uses React Hook Form with Zod validation for type-safe form management
- **Build System**: Vite for fast development and optimized production builds

### Backend Architecture
The server follows a RESTful API design pattern with Express.js:

- **API Routes**: Organized in `/server/routes.ts` with proper middleware chain for authentication and error handling
- **Storage Layer**: Abstracted through an `IStorage` interface with memory storage implementation for development
- **Authentication**: Integrated Replit Auth with OpenID Connect and session management
- **Data Validation**: Zod schemas shared between client and server for consistent validation

### Data Storage
The application uses a PostgreSQL database with Drizzle ORM:

- **Schema Design**: Three main entities - users, folders, and charts with proper foreign key relationships
- **Database Migrations**: Managed through Drizzle Kit with migration files in `/migrations`
- **Connection**: Uses Neon Database serverless driver for PostgreSQL connectivity
- **Session Storage**: PostgreSQL-backed session store for authentication persistence

### Authentication & Authorization
Built around Replit's authentication system:

- **OpenID Connect**: Uses Replit's OIDC provider for secure authentication
- **Session Management**: Express sessions with PostgreSQL storage using connect-pg-simple
- **Route Protection**: Middleware-based authentication checks on all protected endpoints
- **User Management**: Automatic user creation/update on first login with profile information sync

## External Dependencies

### Database Services
- **Neon Database**: Serverless PostgreSQL database hosting
- **Drizzle ORM**: Type-safe database ORM with migration support

### Authentication
- **Replit Auth**: OpenID Connect authentication provider
- **Passport.js**: Authentication middleware for Express

### UI & Styling
- **shadcn/ui**: Component library built on Radix UI primitives
- **Tailwind CSS**: Utility-first CSS framework
- **Radix UI**: Headless UI components for accessibility

### Development Tools
- **Vite**: Frontend build tool and development server
- **TypeScript**: Type safety across the entire application
- **React Query**: Server state management and caching
- **Zod**: Runtime type validation and schema definition

### Hosting & Deployment
- **Replit**: Development and hosting platform with integrated authentication
- **Express.js**: Node.js web application framework for the backend API