# Client Project & Billing Tracker

A full-stack MERN SaaS application for agencies and freelancers to manage clients, projects, work logs, invoices, and payments with automated billing and financial tracking.

## 🎯 Features

### UI/UX Enhancements
- **Adaptive Sidebar**: Collapsible sidebar with smooth animations
  - Expand: Full width (296px) showing labels and icons
  - Collapse: Compact width (136px) showing only icons
  - Main content area and navbar automatically extend when sidebar collapses
- **Navigation Icons**: Intuitive SVG icons for each menu item
  - Clients: Multiple people icon (group management)
  - Users: Single person with team indicator (user administration)
  - Projects, Invoices, Payments, Work Logs, and Expenses with relevant visual indicators
- **Page Headers**: Colored emoji indicators paired with gradient text
  - Emojis display in natural colors
  - Page titles have animated gradient effect

### Core Modules
- **Client Management**: Add, edit, delete clients with billing rates, contact information, and outstanding balance tracking
- **Project Management**: Organize projects linked to clients with configurable hourly rates, budgets, and tracking
- **Work/Time Logging**: Track billable and non-billable work hours with automatic billable amount calculation
- **Invoicing System**: Auto-generate invoices from work logs with status management and PDF download capability
- **Payment Tracking**: Record and track payments with multiple payment methods and transaction IDs
- **Expense Management**: Track project expenses with categories, status workflow, vendor information, and attachments
- **User Management**: RBAC with admin, staff, viewer, and client roles; user creation and role management
- **Client Portal**: Dedicated portal for clients to view their invoices and project information
- **Dashboard**: Real-time metrics including revenue trends, project profitability, expense analytics, and outstanding balances

### Business Logic
- Automatic billable amount calculation (hours × hourly rate)
- Smart invoice generation from billable work logs with tax support
- Monthly and project-wise revenue aggregation and trend analysis
- Client outstanding balance tracking and status management
- Invoice status pipeline (Draft → Sent → Paid → Partially Paid → Overdue)
- Project profitability calculations with and without expenses
- Expense categorization and analytics (by category, by month)
- Partial payment tracking with automatic due amount calculation
- User role-based access control with strict permission enforcement

## 🧱 Tech Stack

- **Frontend**: React 18 + React Router v6 + Axios + Vite + Tailwind CSS
- **Backend**: Node.js + Express 5 + MongoDB with Mongoose
- **Database**: MongoDB Atlas (Cloud)
- **Authentication**: JWT (JSON Web Tokens) with bcryptjs password hashing
- **Additional Libraries**: 
  - Frontend: Recharts (charts), Zod (validation)
  - Backend: Multer (file uploads), PDFKit (PDF generation), Cloudinary (image hosting), Dotenv (environment variables)
- **Styling**: Tailwind CSS + Custom CSS with responsive design
- **Build Tool**: Vite (frontend), Node.js (backend)

## 📁 Project Structure

```
client-billing-tracker/
├── backend/                        # Express API server (Node.js)
│   ├── server.js                   # Express app entry point
│   ├── package.json                # Backend dependencies
│   ├── .env                        # Environment variables (not in Git)
│   ├── config/
│   │   └── db.js                   # MongoDB connection configuration
│   ├── models/                     # Mongoose schemas
│   │   ├── User.js                 # User/authentication model with roles
│   │   ├── Client.js               # Client information & billing
│   │   ├── Project.js              # Project management
│   │   ├── WorkLog.js              # Time tracking entries
│   │   ├── Invoice.js              # Invoice generation & tracking
│   │   ├── Payment.js              # Payment records
│   │   └── Expense.js              # Expense tracking with categories
│   ├── controllers/                # Request handlers for each module
│   │   ├── authController.js       # Auth logic (via routes)
│   │   ├── clientController.js     # Client CRUD operations
│   │   ├── projectController.js    # Project CRUD operations
│   │   ├── workLogController.js    # Work log CRUD operations
│   │   ├── invoiceController.js    # Invoice generation & payment
│   │   ├── paymentController.js    # Payment recording
│   │   ├── expenseController.js    # Expense CRUD & analytics
│   │   └── dashboardController.js  # Dashboard metrics & calculations
│   ├── routes/                     # API route definitions
│   │   ├── authRoutes.js           # Auth, user, portal user endpoints
│   │   ├── clientRoutes.js         # Client endpoints
│   │   ├── projectRoutes.js        # Project endpoints
│   │   ├── workLogRoutes.js        # Work log endpoints
│   │   ├── invoiceRoutes.js        # Invoice endpoints
│   │   ├── paymentRoutes.js        # Payment endpoints
│   │   ├── expenseRoutes.js        # Expense endpoints
│   │   └── dashboardRoutes.js      # Dashboard endpoints
│   ├── middlewares/
│   │   └── auth.js                 # JWT authentication & role-based access control
│   └── utils/
│       └── billingService.js       # Business logic: calculations, aggregations, profit analysis
│
└── frontend/                       # React SPA (Vite)
    ├── index.html                  # Entry HTML file
    ├── package.json                # Frontend dependencies
    ├── vite.config.js              # Vite configuration
    ├── tailwind.config.js          # Tailwind CSS configuration
    ├── postcss.config.js           # PostCSS configuration
    ├── src/
    │   ├── main.jsx                # React app entry point
    │   ├── App.jsx                 # Main app component with routing
    │   ├── App.css                 # App-level styles
    │   ├── index.css               # Global styles
    │   ├── components/             # Reusable UI components
    │   │   ├── Navbar.jsx          # Top navigation bar
    │   │   ├── Navbar.css
    │   │   ├── Sidebar.jsx         # Collapsible navigation sidebar
    │   │   ├── Sidebar.css
    │   │   ├── AnimatedNumber.jsx  # Number counter animation
    │   │   ├── auth/
    │   │   │   └── ProtectedRoute.jsx  # Route protection wrapper
    │   │   ├── layout/
    │   │   │   └── AppBackground.jsx   # Background decoration
    │   │   └── ui/                 # UI component library
    │   │       ├── DataTable.jsx   # Reusable data table
    │   │       ├── EmptyState.jsx  # Empty state placeholder
    │   │       ├── SkeletonLoader.jsx  # Loading placeholder
    │   │       ├── Toast.jsx       # Notification component
    │   │       ├── ThemeSwitcher.jsx   # Dark/light theme toggle
    │   │       ├── ThemeToggle.jsx
    │   │       ├── ToggleButton.jsx    # Reusable toggle button
    │   │       ├── Confetti.jsx    # Celebration animation
    │   │       ├── OnboardingTour.jsx  # First-time user guide
    │   │       ├── WelcomeBackModal.jsx  # Return user greeting
    │   │       ├── PasswordStrengthIndicator.jsx
    │   │       └── StateWrapper.jsx    # Loading/error state wrapper
    │   ├── pages/                  # Full page components
    │   │   ├── LoginPage.jsx       # Sign in
    │   │   ├── RegisterPage.jsx    # Account creation
    │   │   ├── DashboardPage.jsx   # Main dashboard
    │   │   ├── ClientsPage.jsx     # Client management
    │   │   ├── ProjectsPage.jsx    # Project management
    │   │   ├── WorkLogsPage.jsx    # Time tracking
    │   │   ├── InvoicesPage.jsx    # Invoice management
    │   │   ├── PaymentsPage.jsx    # Payment recording
    │   │   ├── ExpensesPage.jsx    # Expense tracking
    │   │   ├── UsersPage.jsx       # User management (admin)
    │   │   ├── ProfilePage.jsx     # User account settings
    │   │   ├── ClientPortalPage.jsx    # Client portal view
    │   │   ├── Auth.css            # Auth pages styles
    │   │   ├── DashboardPage.css   # Dashboard styles
    │   │   └── ListPage.css        # List pages styles
    │   ├── services/
    │   │   └── api.js              # Axios API client with all endpoints
    │   ├── styles/                 # CSS modules and global styles
    │   │   ├── animations.css      # Reusable animations
    │   │   ├── buttons.css         # Button styles
    │   │   ├── forms.css           # Form input styles
    │   │   ├── tables.css          # Table styles
    │   │   ├── toast.css           # Toast notification styles
    │   │   └── ui.css              # General UI styles
    │   ├── utils/                  # Helper functions
    │   │   ├── rbac.js             # Role-based access control logic
    │   │   ├── userPrefs.js        # User preference management
    │   │   ├── validation.js       # Form validation
    │   │   └── useAsyncAction.js   # Async action hook
    │   ├── hooks/                  # Custom React hooks
    │   │   └── useUnsavedChangesWarning.js  # Unsaved changes detection
    │   ├── context/                # React Context for state
    │   │   └── ThemeContext.jsx    # Dark/light theme state
    │   └── assets/                 # Static assets (images, icons)
    │
    └── README.md                   # Project documentation (this file)
```

## 🏗️ Code Organization

### Backend Architecture
- **MVC Pattern**: Models (database schema), Controllers (business logic), Routes (URL routing)
- **Middleware**: Authentication, error handling, CORS
- **Utils**: Reusable billing and calculation functions
- **Environment Variables**: Sensitive data stored in .env file

### Frontend Architecture
- **Pages**: Full-page components for each major feature
- **Components**: Reusable UI components and layout containers
- **Services**: Centralized API client for all backend communication
- **Context**: Global state management for theme
- **Utils**: Helper functions, validation, RBAC logic
- **Styles**: Modular CSS with Tailwind utilities

## 🚀 Quick Start

### Prerequisites
- Node.js v16 or higher
- npm (comes with Node.js)
- MongoDB Atlas account (free tier available at https://mongodb.com)

### Step 1: Backend Setup

```bash
cd backend
npm install

# .env is pre-configured with MongoDB Atlas credentials
# Start the development server
npm run dev

# Expected output:
# ✅ MongoDB Atlas Connected
# 🚀 Server running on port 5000
```

### Step 2: Frontend Setup (in a NEW terminal)

```bash
cd frontend
npm install
npm run dev

# Expected output:
# ➜  Local:   http://localhost:5173/
```

### Step 3: Access the Application

1. Open **http://localhost:5173** in your browser
2. Register a new account or log in
3. Start managing clients and projects

## 📋 Environment Configuration

### Backend (.env)
```env
PORT=5000                                          # Express server port
MONGO_URI=mongodb+srv://...                        # MongoDB Atlas connection string
JWT_SECRET=your_jwt_secret_key                     # Secret key for JWT token signing
CLOUDINARY_CLOUD_NAME=your_cloud_name              # Cloudinary cloud name (for image uploads)
CLOUDINARY_API_KEY=your_api_key                    # Cloudinary API key
CLOUDINARY_API_SECRET=your_api_secret              # Cloudinary API secret
```

### Frontend (.env / vite config)
```env
VITE_API_URL=http://localhost:5000/api             # Backend API base URL (development)
```

### MongoDB Setup Instructions
1. Sign up at [MongoDB Atlas](https://mongodb.com/cloud/atlas)
2. Create a new cluster (free tier available)
3. Click "Connect" → "Connect your application"
4. Copy the connection string and replace `<username>` and `<password>`
5. Update `MONGO_URI` in backend `.env`

### Cloudinary Setup (Optional - for file uploads)
1. Sign up at [Cloudinary](https://cloudinary.com)
2. Get your Cloud Name, API Key, and API Secret
3. Add to backend `.env`

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Create new user account
- `POST /api/auth/login` - User login with JWT token
- `GET /api/auth/profile` - Get current user profile
- `PUT /api/auth/profile` - Update current user profile
- `GET /api/auth/users` - List all users (admin only)
- `PUT /api/auth/users/:id/role` - Update user role (admin only)
- `DELETE /api/auth/users/:id` - Delete user (admin only)
- `POST /api/auth/portal-users` - Create client portal user (admin/staff only)

### Clients
- `GET /api/clients` - List all clients
- `POST /api/clients` - Create new client (admin/staff only)
- `GET /api/clients/:id` - Get client details
- `PUT /api/clients/:id` - Update client (admin/staff only)
- `DELETE /api/clients/:id` - Delete client (admin/staff only)

### Projects
- `GET /api/projects` - List all projects
- `POST /api/projects` - Create new project (admin/staff only)
- `GET /api/projects/:id` - Get project details
- `GET /api/projects/client/:clientId` - Get projects by client
- `PUT /api/projects/:id` - Update project (admin/staff only)
- `DELETE /api/projects/:id` - Delete project (admin/staff only)

### Work Logs
- `GET /api/work-logs` - List work logs (with filters: projectId, clientId, billable, date range)
- `POST /api/work-logs` - Create work log (admin/staff only)
- `GET /api/work-logs/:id` - Get work log details
- `PUT /api/work-logs/:id` - Update work log (admin/staff only)
- `DELETE /api/work-logs/:id` - Delete work log (admin/staff only)

### Invoices
- `GET /api/invoices` - List invoices (with status filters)
- `POST /api/invoices` - Generate invoice from work logs (admin/staff only)
- `GET /api/invoices/:id` - Get invoice details
- `GET /api/invoices/:id/pdf` - Download invoice as PDF
- `GET /api/invoices/client/:clientId/stats` - Get invoice statistics for client
- `PUT /api/invoices/:id` - Update invoice (admin/staff only)
- `POST /api/invoices/:id/payment` - Record payment on invoice (admin/staff only)
- `DELETE /api/invoices/:id` - Delete invoice (admin only)

### Payments
- `GET /api/payments` - List payments
- `POST /api/payments` - Record payment (admin/staff only)
- `GET /api/payments/:id` - Get payment details
- `GET /api/payments/client/:clientId` - Get payments by client
- `PUT /api/payments/:id` - Update payment (admin only)
- `DELETE /api/payments/:id` - Delete payment (admin only)

### Expenses
- `GET /api/expenses` - List expenses (with filters: projectId, status, date range)
- `POST /api/expenses` - Create expense
- `GET /api/expenses/:id` - Get expense details
- `PUT /api/expenses/:id` - Update expense
- `DELETE /api/expenses/:id` - Delete expense
- `GET /api/expenses/summary/all` - Get expense summary
- `GET /api/expenses/analytics/by-category` - Get expenses breakdown by category
- `GET /api/expenses/analytics/by-month` - Get expenses breakdown by month
- `POST /api/expenses/bulk/update-status` - Bulk update expense statuses

### Dashboard
- `GET /api/dashboard` - Get dashboard summary (total clients, projects, hours, revenue, etc.)
- `GET /api/dashboard/revenue/monthly` - Get monthly revenue breakdown
- `GET /api/dashboard/expenses/monthly` - Get monthly expenses breakdown
- `GET /api/dashboard/profit/:projectId` - Get project profit calculation
- `GET /api/dashboard/profit-with-expenses/:projectId` - Get project profit after deducting expenses
- `GET /api/dashboard/user/profit` - Get user total profit
- `GET /api/dashboard/charts/revenue-trend` - Get revenue trend data for charts
- `GET /api/dashboard/charts/expense-trend` - Get expense trend data for charts

## 🛠️ Development Commands

**Backend:**
```bash
cd backend
npm run dev      # Start with hot reload
npm start        # Start production server
```

**Frontend:**
```bash
cd frontend
npm run dev      # Start Vite dev server
npm run build    # Build for production
npm run preview  # Preview production build
```

## 📊 Database Schema

### Collections

#### Users
- `_id`: ObjectId (Primary)
- `name`: String (required)
- `email`: String (required, unique)
- `password`: String (hashed with bcryptjs)
- `role`: String (enum: admin, staff, viewer, client) - determines access permissions
- `clientId`: ObjectId (reference to Client) - null for internal users, set for client portal users
- `company`: String (optional)
- `phone`: String (optional)
- `profileImage`: String (URL, optional)
- `timestamps`: createdAt, updatedAt

#### Clients
- `_id`: ObjectId (Primary)
- `userId`: ObjectId (reference to User - creator/owner)
- `name`: String (required)
- `email`: String (required)
- `company`: String (optional)
- `phone`: String (optional)
- `billingRate`: Number (default: 50)
- `address`: String (optional)
- `status`: String (enum: active, inactive)
- `outstandingBalance`: Number (auto-calculated, total amount owed)
- `totalBilled`: Number (auto-calculated, total invoiced amount)
- `timestamps`: createdAt, updatedAt

#### Projects
- `_id`: ObjectId (Primary)
- `userId`: ObjectId (reference to User - creator)
- `clientId`: ObjectId (reference to Client)
- `name`: String (required)
- `description`: String (optional)
- `hourlyRate`: Number (required, default: 50)
- `status`: String (enum: active, completed, on-hold)
- `budget`: Number (optional, default: 0)
- `totalHours`: Number (auto-calculated)
- `totalEarnings`: Number (auto-calculated)
- `startDate`: Date (optional)
- `endDate`: Date (optional)
- `timestamps`: createdAt, updatedAt

#### WorkLogs
- `_id`: ObjectId (Primary)
- `userId`: ObjectId (reference to User)
- `projectId`: ObjectId (reference to Project, required)
- `clientId`: ObjectId (reference to Client, required)
- `date`: Date (required)
- `hours`: Number (required, min: 0.25)
- `description`: String (required)
- `billable`: Boolean (default: true)
- `billableAmount`: Number (auto-calculated: hours × hourly rate)
- `invoiceId`: ObjectId (reference to Invoice, null until invoiced)
- `timestamps`: createdAt, updatedAt

#### Invoices
- `_id`: ObjectId (Primary)
- `userId`: ObjectId (reference to User)
- `clientId`: ObjectId (reference to Client, required)
- `projectId`: ObjectId (reference to Project, optional)
- `invoiceNumber`: String (unique, required)
- `status`: String (enum: draft, sent, paid, partially-paid, overdue)
- `subtotal`: Number (sum of billable amounts)
- `tax`: Number (calculated amount)
- `taxPercentage`: Number (e.g., 10 for 10%)
- `taxEnabled`: Boolean (whether to apply tax)
- `total`: Number (subtotal + tax)
- `amountPaid`: Number (paid so far)
- `dueAmount`: Number (remaining balance)
- `issueDate`: Date (default: now)
- `dueDate`: Date (optional)
- `paidDate`: Date (when fully paid)
- `workLogIds`: Array of ObjectIds (work logs included in invoice)
- `notes`: String (optional)
- `timestamps`: createdAt, updatedAt

#### Payments
- `_id`: ObjectId (Primary)
- `userId`: ObjectId (reference to User)
- `invoiceId`: ObjectId (reference to Invoice, required)
- `clientId`: ObjectId (reference to Client, required)
- `amount`: Number (required)
- `paymentMethod`: String (enum: cash, bank-transfer, credit-card, check, other)
- `paymentDate`: Date (default: now)
- `transactionId`: String (unique, sparse - optional)
- `status`: String (enum: pending, completed, failed)
- `notes`: String (optional)
- `timestamps`: createdAt, updatedAt

#### Expenses
- `_id`: ObjectId (Primary)
- `userId`: ObjectId (reference to User, required)
- `projectId`: ObjectId (reference to Project, optional)
- `category`: String (enum: software, hardware, labor, utilities, office-supplies, travel, marketing, hosting, subscription, maintenance, other)
- `description`: String (required)
- `amount`: Number (required, min: 0)
- `vendor`: String (optional)
- `date`: Date (required, default: now)
- `status`: String (enum: pending, approved, rejected, paid)
- `paymentMethod`: String (enum: cash, credit-card, bank-transfer, check, other)
- `receipt`: String (URL or file path)
- `notes`: String (optional)
- `tags`: Array of Strings (optional)
- `currency`: String (default: USD)
- `taxDeductible`: Boolean (default: false)
- `attachments`: Array of Objects with filename, url, uploadedAt
- `timestamps`: createdAt, updatedAt

## 🔐 Authentication & Security

### Who Can Access What?
- **Admin**: Full system access - manage all users, clients, projects, invoices, payments, and expenses
- **Staff**: Can create and manage clients, projects, work logs, invoices, and payments; cannot manage users
- **Viewer**: Read-only access to all data; cannot create or modify anything
- **Client**: Limited access - can only view their own invoices and project information via client portal

### Security Features
- JWT tokens for stateless API authentication (expires in 7 days)
- Bcryptjs password hashing with salt rounds for secure storage
- Protected routes with middleware validation on all API endpoints
- Role-based access control (RBAC) - specific roles required for create/update/delete operations
- Admin user cannot be changed or deleted (system integrity protection)
- Tokens stored securely in browser localStorage
- Password validation requirements (minimum 6 characters)
- Email uniqueness validation and lowercase normalization

## 🎨 UI Features

- **Responsive Design**: Mobile-friendly interface with adaptive layouts for all screen sizes
- **Dark/Light Theme**: Theme switcher with persistent user preferences across sessions
- **Collapsible Sidebar**: 
  - Toggle sidebar to expand main content area for better focus
  - Smooth transition animation when collapsing
  - Navbar automatically extends to fill available space
  - Compact view shows only icons, full view shows icons + labels
- **Data Tables**: 
  - Sortable columns
  - Filterable data
  - Pagination support
  - Loading states with skeleton loaders
- **Forms**: 
  - Input validation with visual feedback
  - Error messages for invalid entries
  - Success/failure toast notifications
  - Password strength indicator during registration
- **Notifications**: Toast messages for user feedback
  - Success messages (create, update, delete operations)
  - Error messages with actionable information
  - Info messages for important updates
- **Loading States**: Skeleton loaders for better perceived performance
- **Page Headers**: 
  - Emoji indicators with natural colors
  - Gradient text effects for visual hierarchy
  - Descriptive page titles
- **Dashboard Widgets**: 
  - Animated number counters
  - Revenue and balance cards
  - Charts for revenue and expense trends
  - Real-time metric updates
- **OnboardingTour**: Interactive tour guide for new users navigating the application
- **WelcomeBackModal**: Greeting message for returning users with quick navigation
- **ConfettiAnimation**: Celebration animation on important milestones (invoice creation, payment recording)

## � Application Pages

### Authentication Pages
- **Login Page** (`/login`) - Sign in with email and password
- **Register Page** (`/register`) - Create new user account with role selection

### Main Application Pages
- **Dashboard** (`/`) - Overview with metrics, charts, and financial summaries
  - Revenue trends and monthly breakdown
  - Expense analytics and trends
  - Project profitability analysis
  - Outstanding balance tracking
- **Clients** (`/clients`) - Manage all clients with CRUD operations
  - Add new clients with billing rates
  - Edit client information
  - View client outstanding balances
  - Delete inactive clients
- **Projects** (`/projects`) - Organize projects linked to clients
  - Create projects with hourly rates and budgets
  - Track project status (active, completed, on-hold)
  - View project profitability
  - Manage project timelines
- **Work Logs** (`/work-logs`) - Time tracking and hour logging
  - Log billable and non-billable work
  - Filter by project, client, or date range
  - Edit or delete unpaid work logs
  - Automatic billable amount calculation
- **Invoices** (`/invoices`) - Invoice generation and management
  - Generate invoices from work logs
  - Track invoice status (Draft, Sent, Paid, Partially Paid, Overdue)
  - Apply taxes and discounts
  - Download invoices as PDF
  - Record payments against invoices
- **Payments** (`/payments`) - Payment tracking and recording
  - Record payments with transaction IDs
  - Track payment methods and dates
  - View payment history per client
  - Manage payment status (pending, completed, failed)
- **Expenses** (`/expenses`) - Expense tracking with analytics
  - Log project expenses by category
  - Track expense status (pending, approved, rejected, paid)
  - View analytics by category and month
  - Upload expense attachments
  - Mark expenses as tax-deductible
- **Users** (`/users`) - User management (admin only)
  - View all registered users
  - Manage user roles (staff, viewer, client)
  - Delete users (except admin)
  - Create client portal accounts
- **Profile** (`/profile`) - User account settings
  - Update profile information
  - Change password
  - View user role and permissions
  - Manage logged-in sessions

### Client Portal Pages
- **Client Portal** (`/portal`) - Limited access for client users
  - View own invoices
  - Download invoices as PDF
  - Track payment status
  - View project information

## �📝 Available NPM Scripts

**Backend (from backend/package.json):**
```bash
npm start        # Start production server
npm run dev      # Start development server with auto-reload (node --watch)
```

**Frontend (from frontend/package.json):**
```bash
npm run dev      # Start Vite development server (http://localhost:5173)
npm run build    # Build for production
npm run preview  # Preview production build locally
```

## 🐛 Troubleshooting

### Backend Issues

**MongoDB Connection Failed**
- Verify MongoDB Atlas credentials in `backend/.env`
- Check IP whitelist allows your current IP on MongoDB Atlas dashboard
- Ensure `MONGO_URI` has correct database name and syntax
- Test connection string in MongoDB Compass to debug further
- Check that cluster is not paused (MongoDB clouds pause inactive clusters)

**Port 5000 Already in Use**
```bash
# Change port in backend/.env
PORT=5001
# Or kill process using the port (Windows PowerShell)
Stop-Process -Id (Get-NetTCPConnection -LocalPort 5000).OwningProcess -Force
```

**Server Crashes on Startup**
- Check that all required environment variables are set in `.env`
- Verify Node.js version is v16 or higher: `node --version`
- Check for syntax errors in JavaScript files
- Review terminal output for specific error messages

**Missing Dependencies**
```bash
cd backend
npm install
```

### Frontend Issues

**API Connection Refused**
- Ensure backend is running on port 5000
- Check browser console (F12) for CORS errors
- Verify `VITE_API_URL` is set correctly in environment
- Check that backend `.env` has `CORS` properly configured
- Ensure both frontend and backend are running simultaneously

**Blank Page After Login**
- Clear browser localStorage: Run `localStorage.clear()` in console
- Delete all cookies for localhost
- Check browser DevTools Console (F12) for JavaScript errors
- Verify JWT token is being stored correctly in localStorage
- Check that user role is valid (admin, staff, viewer, or client)

**Build Errors (npm run build)**
- Delete `node_modules` and reinstall: `rm -r node_modules && npm install`
- Clear Vite cache: `rm -r frontend/.vite`
- Check for TypeScript/ESLint errors in source files
- Verify all imports use correct relative paths

**Styling Not Applied**
- Verify Tailwind CSS is installed: `npm list tailwindcss`
- Check that `index.css` is imported in `main.jsx`
- Clear browser cache (Ctrl+Shift+Delete or Cmd+Shift+Delete on Mac)
- Restart Vite dev server

### Authentication Issues

**"Invalid credentials" on Login**
- Verify email is exact match (case-insensitive but whitespace matters)
- Check password is correct
- Ensure user role matches selected role on login form
- Verify user account is not deleted

**JWT Token Expired**
- Tokens expire after 7 days
- User must log in again to get new token
- Clear localStorage and refresh page if stuck in logged-in state

**Cannot Update User Role**
- Admin user cannot be changed to other roles
- Admin user can only manage staff, viewer, and client roles
- Cannot assign admin role to other users (single admin per system)

### File Upload Issues

**Cloudinary Upload Failing**
- Verify Cloudinary credentials are set in `backend/.env`
- Check that expense attachments are properly configured
- Ensure file size is within Cloudinary limits (100MB default)
- Verify file format is supported

### Database Issues

**Indexes Not Created**
- Don't worry - MongoDB automatically creates indexes on first use
- If needed, manually create: `db.expenses.createIndex({ userId: 1, date: -1 })`

**Data Corruption**
- All financial calculations are performed in-memory and not stored redundantly
- Outstanding balance and totals are recalculated from source data
- If inconsistencies occur, recalculate by viewing dashboard metrics

## ✅ Health Checks

To verify everything is working:

1. **Backend Health** - Visit `http://localhost:5000` in browser
   - Should respond with: `{ "message": "Client Project and Billing Tracker API Running" }`

2. **Frontend Health** - Visit `http://localhost:5173` in browser
   - Should show login page without errors in console

3. **Database Health** - Check in backend logs
   - Should show: `✅ MongoDB Atlas Connected`

4. **API Connectivity** - After login, check Networks tab in DevTools
   - API requests should have status 200 (not 404 or CORS errors)

## 💼 Business Logic Features

### Automatic Calculations
- **Billable Amount**: Automatically calculated when work log is created (hours × hourly rate)
- **Invoice Totals**: Subtotal + tax automatically calculated and displayed
- **Outstanding Balance**: Automatically updated and tracked per client
- **Monthly Revenue**: Aggregated from all invoices issued in the month
- **Project Profitability**: Calculated with and without expense deductions
- **Due Amount**: Calculated as total - amount paid

### Work Log Management
- Create work logs with billable or non-billable status
- Only billable logs contribute to invoice amounts
- Cannot edit or delete work logs that are already included in invoices (data integrity)
- Filter work logs by project, client, date range, and billable status
- Track hours with minimum increment of 0.25 hours

### Invoice Management
- Generate invoices from multiple work logs at once
- Automatic status progression: Draft → Sent → Paid → Partially Paid → Overdue
- Tax calculation with configurable tax percentage per invoice
- Partial payment tracking with automatic due amount recalculation
- Issue date and due date management
- PDF invoice generation and download capability
- Invoice statistics per client (total, paid, outstanding amounts)

### Expense Management
- Categorize expenses (software, hardware, labor, utilities, office-supplies, travel, marketing, hosting, subscription, maintenance, other)
- Track expense status workflow (pending → approved/rejected → paid)
- Attach vendor information and payment method
- Support multiple attachments per expense
- Mark expenses as tax-deductible
- Group expenses by category and month for analytics
- Bulk update expense statuses

### Payment Tracking
- Record payments with transaction IDs for accountability
- Multiple payment methods (cash, bank-transfer, credit-card, check, other)
- Track payment status (pending, completed, failed)
- Link payments to specific invoices
- Client-specific payment history

### Dashboard Metrics
- Total number of clients (active status tracking)
- Total number of projects (status breakdown: active, completed, on-hold)
- Total hours logged (billable vs non-billable)
- Total amount invoiced
- Total amount paid
- Outstanding balances per client
- Monthly revenue breakdown
- Monthly expense breakdown
- Revenue trend charts over time
- Expense trend charts over time
- Project-specific profit analysis
- User total profit calculation

### Client Portal
- Clients can log in with their dedicated portal account
- View their invoices and payment history
- Access project-specific information
- Limited read-only access to sensitive business data

## 📚 Project Status

✅ **Complete** - All core features implemented and tested:
- Full CRUD operations for all modules
- Automated billing calculations
- Invoice generation and payment tracking
- JWT authentication with protected routes
- Responsive UI with modern design
- Production-ready error handling

## 🤝 Contributing

This is a solo project. Current status: **Production Ready**

## 📄 License

MIT License - Feel free to use this project as a template

---

## 👨‍💻 Author

**Uday Shankar Pandey**  
Built this project with a focus on real-world billing workflows, strong RBAC, and a polished UI.

- 📍 GitHub: https://github.com/UdayShankarPandey  
- 💼 LinkedIn: https://www.linkedin.com/in/uday-shankar-pandey/
