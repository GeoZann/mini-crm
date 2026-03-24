# Mini CRM Project

A full-stack Customer Relationship Management (CRM) application built with modern web technologies.

## Project Overview

Mini CRM is a web-based application designed to manage customer relationships and tasks efficiently. It provides features for customer management, user authentication, and task tracking.

## Features

- **Customer Management**: Create, search, and manage customer information
- **User Authentication**: Secure login system for user access
- **User Management**: Administrative controls for managing users
- **Task Management**: Track and manage tasks related to customers
- **Notifications**: Real-time notifications for user actions
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## Tech Stack

### Frontend
- React (JSX)
- Vite (Build tool)
- Context API (State management)
- ESLint (Code quality)

### Backend
- Node.js
- Express.js

## Project Structure


MiniCRMProject/
├── client/                 # Frontend application
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── context/       # Context providers
│   │   └── assets/        # Static assets
│   ├── package.json
│   └── vite.config.js
└── server/                # Backend application
    ├── server.js
    └── package.json


## Components

- **CustomerForm**: Form for adding/editing customers
- **CustomerSearch**: Search functionality for customers
- **CustomerTable**: Display customers in table format
- **Login**: User authentication component
- **Navbar**: Navigation bar
- **Tasks**: Task management component
- **UserManagement**: User management component
- **NotificationContext**: Global notification state

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone https://github.com/GeoZann/mini-crm.git
cd MiniCRMProject
```

2. Install backend dependencies
```bash
cd server
npm install
```

3. Install frontend dependencies
```bash
cd ../client
npm install
```

### Running the Application

**Backend:**
```bash
cd server
npm start
```

**Frontend:**
```bash
cd client
npm run dev
```

## Usage

1. Start the backend server
2. Start the frontend development server
3. Navigate to the application in your browser
4. Log in with your credentials
5. Begin managing customers and tasks


## Author

GeoZann



```

Αυτό το README περιέχει όλες τις βασικές πληροφορίες για το έργο σας. Μπορείτε να το τροποποιήσετε ανάλογα με τις ανάγκες σας!
