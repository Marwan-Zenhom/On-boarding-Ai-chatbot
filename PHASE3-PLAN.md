# 📊 Phase 3: Admin Dashboard & Knowledge Base Management

## Overview
Build an admin dashboard for managing the knowledge base, monitoring usage, and configuring the chatbot system.

---

## 🎯 Goals

### Core Features
1. **Admin Dashboard**
   - System analytics and metrics
   - User activity monitoring
   - Knowledge base statistics
   - Chat conversation insights

2. **Knowledge Base Management**
   - Web UI for uploading/editing CSV files
   - CRUD operations for employees, FAQs, and tasks
   - Bulk import/export functionality
   - Real-time vector embedding updates

3. **Content Moderation**
   - View and manage conversations
   - Flag inappropriate content
   - Export conversation logs
   - Delete user data (GDPR compliance)

4. **System Configuration**
   - Update AI model settings
   - Configure semantic search parameters
   - Manage API rate limits
   - Toggle features on/off

---

## 📋 Implementation Plan

### 1. Admin Authentication & Authorization
- [ ] Create admin role in database
- [ ] Add admin middleware for protected routes
- [ ] Create admin login page
- [ ] Implement role-based access control (RBAC)

### 2. Admin Dashboard UI
- [ ] Create admin layout with sidebar navigation
- [ ] Build dashboard home page with metrics
- [ ] Add charts for usage analytics (Chart.js or Recharts)
- [ ] Create responsive admin interface

### 3. Knowledge Base Management
- [ ] **Employees Management**
  - [ ] List all employees with search/filter
  - [ ] Add new employee form
  - [ ] Edit employee details
  - [ ] Delete employee
  - [ ] Bulk upload CSV
  - [ ] Export to CSV
  
- [ ] **FAQs Management**
  - [ ] List all FAQs with categories
  - [ ] Add new FAQ
  - [ ] Edit FAQ
  - [ ] Delete FAQ
  - [ ] Reorder FAQs
  
- [ ] **Onboarding Tasks Management**
  - [ ] List tasks by department
  - [ ] Add new task
  - [ ] Edit task
  - [ ] Delete task
  - [ ] Assign tasks to departments

### 4. Analytics & Monitoring
- [ ] Total conversations count
- [ ] Active users count
- [ ] Most asked questions
- [ ] Average response time
- [ ] Knowledge base hit rate
- [ ] User engagement metrics
- [ ] Conversation ratings/feedback

### 5. User Management (Admin)
- [ ] View all registered users
- [ ] User activity logs
- [ ] Suspend/activate users
- [ ] Delete user accounts
- [ ] Export user data

### 6. Conversation Management
- [ ] View all conversations (with privacy filters)
- [ ] Search conversations by keyword
- [ ] Export conversation logs
- [ ] Delete conversations
- [ ] Flag problematic content

---

## 🗂️ New Files to Create

### Backend
```
backend/
├── middleware/
│   └── adminMiddleware.js         # Admin role verification
├── controllers/
│   ├── adminController.js         # Admin dashboard endpoints
│   ├── knowledgeBaseController.js # KB CRUD operations
│   └── analyticsController.js     # Usage metrics
├── routes/
│   ├── adminRoutes.js            # Admin-only routes
│   ├── knowledgeBaseRoutes.js    # KB management routes
│   └── analyticsRoutes.js        # Analytics endpoints
└── services/
    ├── analyticsService.js       # Calculate metrics
    └── csvService.js             # CSV import/export
```

### Frontend
```
frontend/src/
├── pages/
│   └── admin/
│       ├── Dashboard.js          # Admin home page
│       ├── EmployeeManager.js    # Manage employees
│       ├── FAQManager.js         # Manage FAQs
│       ├── TaskManager.js        # Manage tasks
│       ├── UserManager.js        # Manage users
│       ├── Analytics.js          # View analytics
│       └── Settings.js           # System settings
├── components/
│   └── admin/
│       ├── AdminLayout.js        # Admin page wrapper
│       ├── StatCard.js           # Metric display card
│       ├── DataTable.js          # Reusable table component
│       ├── CSVUploader.js        # File upload component
│       └── ChartWidget.js        # Chart components
└── hooks/
    └── useAdmin.js               # Admin-specific hooks
```

---

## 🔄 Modified Files

### Backend
- `backend/server.js` - Add admin routes
- `backend/database/phase3-admin-schema.sql` - Admin tables

### Frontend
- `frontend/src/routes/AppRouter.js` - Add admin routes
- `frontend/src/App.js` - Add admin link in user menu

---

## 🎨 Admin Dashboard Features

### 1. Dashboard Home
```
┌─────────────────────────────────────┐
│  Admin Dashboard                    │
├─────────────────────────────────────┤
│  [Total Users: 245] [Active: 89]   │
│  [Conversations: 1,234]             │
│  [KB Items: 150] [Avg Rating: 4.5] │
├─────────────────────────────────────┤
│  Usage Chart (Last 7 Days)         │
│  ▁▃▅▇▇▅▃                           │
├─────────────────────────────────────┤
│  Top Questions:                     │
│  1. "How many vacation days?"       │
│  2. "Who is my supervisor?"         │
│  3. "What's the dress code?"        │
└─────────────────────────────────────┘
```

### 2. Employee Manager
```
┌─────────────────────────────────────┐
│  Employees                [+ Add]    │
├─────────────────────────────────────┤
│  Search: [________]  Filter: [All]  │
├─────────────────────────────────────┤
│  Name        Dept        Email       │
│  ─────────────────────────────────  │
│  John Doe    IT         john@...    │
│  Jane Smith  HR         jane@...    │
│  ...                                │
└─────────────────────────────────────┘
```

### 3. Analytics Page
```
┌─────────────────────────────────────┐
│  Analytics & Insights               │
├─────────────────────────────────────┤
│  Conversations Over Time            │
│  [Line Chart]                       │
├─────────────────────────────────────┤
│  Most Active Users                  │
│  [Bar Chart]                        │
├─────────────────────────────────────┤
│  Knowledge Base Effectiveness       │
│  Hit Rate: 87% | Miss Rate: 13%    │
└─────────────────────────────────────┘
```

---

## 🔐 Security Considerations

### Admin Access Control
```javascript
// Admin middleware
const requireAdmin = async (req, res, next) => {
  const user = req.user;
  
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  next();
};
```

### Database Schema
```sql
-- Add role column to users
ALTER TABLE auth.users 
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';

-- Create admin_logs table
CREATE TABLE admin_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  resource TEXT,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 📊 API Endpoints

### Admin Analytics
- `GET /api/admin/stats` - Overall system statistics
- `GET /api/admin/users` - List all users with filters
- `GET /api/admin/conversations` - All conversations
- `GET /api/admin/analytics/usage` - Usage over time
- `GET /api/admin/analytics/questions` - Top questions

### Knowledge Base Management
- `GET /api/admin/knowledge-base/employees` - List employees
- `POST /api/admin/knowledge-base/employees` - Add employee
- `PUT /api/admin/knowledge-base/employees/:id` - Update employee
- `DELETE /api/admin/knowledge-base/employees/:id` - Delete employee
- `POST /api/admin/knowledge-base/import/csv` - Bulk import
- `GET /api/admin/knowledge-base/export/csv` - Export CSV

### User Management
- `GET /api/admin/users/:id` - User details
- `PUT /api/admin/users/:id/status` - Activate/suspend
- `DELETE /api/admin/users/:id` - Delete user

---

## 🎯 Success Metrics

Phase 3 will be complete when:
- ✅ Admin can view system analytics
- ✅ Admin can manage knowledge base via UI
- ✅ Admin can view and manage users
- ✅ Admin can export data (CSV)
- ✅ Admin can monitor conversations
- ✅ System logs admin actions
- ✅ Analytics charts are functional
- ✅ CSV import/export works

---

## 🚀 Implementation Order

### Week 1: Foundation
1. Add admin role to database
2. Create admin middleware
3. Build admin dashboard layout
4. Add basic stats display

### Week 2: Knowledge Base Management
1. Employee CRUD operations
2. FAQ management
3. Task management
4. CSV import/export

### Week 3: Analytics & Monitoring
1. Usage analytics
2. Charts and graphs
3. User activity tracking
4. Conversation insights

### Week 4: Polish & Testing
1. UI/UX improvements
2. Error handling
3. Testing all features
4. Documentation

---

## 💡 Optional Enhancements

### Phase 3.5 - Advanced Features
- [ ] Real-time dashboard updates (WebSockets)
- [ ] Email notifications for admin alerts
- [ ] Scheduled reports (daily/weekly summaries)
- [ ] API usage monitoring
- [ ] Rate limiting configuration UI
- [ ] Backup and restore functionality
- [ ] A/B testing for AI prompts
- [ ] Custom knowledge base categories
- [ ] Multi-language content management
- [ ] Version control for knowledge base changes

---

## 🔧 Technology Stack

### Additional Dependencies
```json
{
  "frontend": {
    "recharts": "^2.10.0",          // Charts
    "react-table": "^7.8.0",        // Data tables
    "papaparse": "^5.4.1",          // CSV parsing
    "date-fns": "^3.0.0"            // Date formatting
  },
  "backend": {
    "csv-parser": "^3.0.0",         // CSV parsing
    "csv-writer": "^1.6.0",         // CSV generation
    "multer": "^1.4.5-lts.1"        // File uploads
  }
}
```

---

## 📝 Notes

- Admin dashboard should be separate from user chat interface
- Implement proper audit logging for all admin actions
- Ensure GDPR compliance for data exports/deletions
- Add confirmation dialogs for destructive actions
- Implement pagination for large datasets
- Cache analytics data for better performance

---

## 🎓 Learning Objectives

Through Phase 3, you'll learn:
1. Building admin dashboards with React
2. Data visualization with charts
3. CSV import/export handling
4. Role-based access control
5. Analytics and metrics calculation
6. Audit logging and compliance
7. Bulk data operations
8. Advanced database queries

---

**Phase 3 focuses on empowering administrators to manage and monitor the chatbot system effectively!** 📊🔧

