# 🤖 Onboarding Chat Assistant

An AI-powered chat interface designed to help new employees navigate their onboarding process with company policies, benefits, procedures, and getting started information.

## ✨ Features

- **Smart Chat Interface** - Dynamic input with mic/send/stop button states
- **Real-time Typing Animation** - Fast character-by-character display
- **Message Management** - Edit, react to, and regenerate responses
- **Conversation History** - Organized by date with favorites and archive
- **File Upload Support** - Upload and reference documents in chat
- **Dark/Light Theme** - Toggle between themes with persistence
- **Mobile Responsive** - Works seamlessly on desktop and mobile
- **User Authentication** - Mock auth system for demonstration

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## 🏗️ Project Structure

```
src/
├── App.js                 # Main application component
├── index.js              # React entry point
├── index.css             # Global styles import
└── styles/               # Modular CSS files
    ├── variables.css     # CSS custom properties
    ├── base.css          # Base styles and resets
    ├── layout.css        # Layout components
    ├── sidebar.css       # Sidebar styles
    ├── chat.css          # Chat interface
    ├── input.css         # Input components
    ├── modals.css        # Modal dialogs
    ├── components.css    # UI components
    ├── animations.css    # Animations and transitions
    └── responsive.css    # Mobile responsive styles
```

## 🎨 CSS Architecture

The project uses a modular CSS approach with:
- **CSS Custom Properties** for theming
- **Component-based organization** for maintainability
- **Mobile-first responsive design**
- **Dark/light theme support**

## 🛠️ Built With

- **React 19** - UI framework
- **Lucide React** - Icon library
- **CSS Modules** - Styling approach
- **Local Storage** - Data persistence

## 📱 Key Components

- **AuthModal** - User authentication interface
- **QuickTemplates** - Predefined conversation starters
- **FileUpload** - Drag & drop file upload
- **MessageActions** - Copy, edit, react, regenerate
- **ConversationDropdown** - Conversation management
- **ArchivedConversationsModal** - Archive management

## 🔧 Configuration

The app includes sample conversations and can be easily configured for different:
- Company policies
- Onboarding procedures
- Response templates
- UI themes and styling

## 🚀 Deployment

```bash
# Create production build
npm run build

# Deploy to your hosting platform
# (Vercel, Netlify, AWS, etc.)
```

## 📄 License

This project is created for demonstration purposes.
