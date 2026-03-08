# WikiGen - AI Agent Web Application

**Chat as workspace, website generation as artifact**

WikiGen is an AI agent web application where chat serves as the core workspace and website generation becomes a tangible artifact of each conversational run. It transforms natural language discussions into functional websites through collaborative AI interaction.

## Overview

WikiGen reimagines website creation by making chat the primary interface for collaboration with AI. Instead of traditional design tools, users engage in conversations with AI agents to describe, refine, and generate websites. Each conversation becomes a creative session that produces a working website as its output.

## ✨ Core Features

### 💬 Chat-Centric Workspace
- **Conversational Interface**: Natural language chat as the main workspace for website creation
- **Context Preservation**: Full conversation history with AI, maintaining context across sessions
- **Progressive Refinement**: Iterative discussion and refinement of website requirements

### 🚀 AI-Powered Website Generation
- **DeepSeek Integration**: Powered by DeepSeek AI models for intelligent website generation
- **Real-time Generation**: Live HTML, CSS, and JavaScript generation based on conversation context
- **Responsive Output**: Automatically generates mobile-friendly, responsive websites

### 👁️ Live Preview & Visualization
- **Integrated Preview**: Built-in website viewer with real-time preview updates
- **Multi-Device Simulation**: Preview websites at desktop, tablet, and mobile screen sizes
- **Instant Feedback**: See changes immediately as you discuss with AI

### 📁 Project Management
- **Organized Projects**: Save conversations and generated websites as projects
- **Visual Dashboard**: Browse projects with preview thumbnails and metadata
- **Easy Access**: Quickly resume conversations or preview generated sites

### 🎨 Modern User Experience
- **Responsive Design**: Fully responsive interface that works on all devices
- **Dark/Light Themes**: Built-in theme switching with stone color palette
- **Icon-Based UI**: Clean interface using Phosphor icons via UnoCSS
- **Streaming Responses**: Real-time AI response streaming for natural interaction

## 🏗️ Technology Stack

### Frontend Framework
- **Vue 3.5** with Composition API and `<script setup>` syntax
- **TypeScript** for type safety and enhanced developer experience
- **Vue Router 4** for client-side navigation

### Styling & UI
- **UnoCSS** with Wind4 preset for utility-first CSS
- **Preset Attributify** & **Transformer Variant Group** for concise styling
- **Phosphor Icons** integrated via UnoCSS icon system

### Build & Development
- **Vite 8** for fast development and optimized production builds
- **ESLint** with `@antfu/eslint-config` for code quality
- **PNPM** for efficient package management

### AI Integration
- **DeepSeek API** for AI-powered generation
- **Structured Prompts** in dedicated TypeScript files
- **MarkStream Vue** for markdown rendering and streaming support

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and PNPM installed
- DeepSeek API key (for AI functionality)

### Installation
```bash
# Clone the repository
git clone https://github.com/liangmiQwQ/WikiGen.git
cd WikiGen

# Install dependencies
pnpm install

# Configure environment
cp .env.example .env
# Add your DeepSeek API key to .env

# Start development server
pnpm dev
```

### Development Commands
```bash
# Start development server
pnpm dev

# Build for production
pnpm build

# Type checking
pnpm typecheck

# Lint and fix
pnpm lint:fix

# Preview production build
pnpm preview
```

## 📖 Usage Guide

### 1. Start a Conversation
Begin by chatting with the AI about the website you want to create. Describe your vision, requirements, and preferences.

### 2. Collaborate with AI
Engage in back-and-forth discussion to refine your ideas. The AI will ask clarifying questions and make suggestions.

### 3. Generate Website
Once requirements are clear, the AI generates HTML, CSS, and JavaScript code for your website.

### 4. Preview & Iterate
View the generated website in the integrated previewer. Provide feedback to the AI for further refinements.

### 5. Save as Project
Save successful websites as projects for future reference or additional modifications.

## 🏗️ Architecture

### Core Components
- **Chat Interface**: Real-time chat with message streaming and history
- **Website Viewer**: Iframe-based preview with responsive scaling
- **Project Dashboard**: Visual management of all created websites
- **AI Integration Layer**: Handles communication with DeepSeek API

### State Management
- **Composition Functions**: Vue composables for chat, projects, and AI state
- **Local Storage**: Persistent storage for conversations and projects
- **Reactive Updates**: Real-time UI updates using Vue's reactivity system

### Prompt Management
- **Dedicated Prompt Files**: AI prompts stored in `src/prompts/` directory
- **Type-Safe Prompts**: TypeScript-based prompt definitions
- **Structured Output**: Consistent AI response formatting

## 🎯 Design Philosophy

### Chat as Primary Interface
We believe the most natural way to create with AI is through conversation. Chat provides:
- **Contextual Understanding**: AI maintains conversation context
- **Iterative Refinement**: Natural back-and-forth for perfecting details
- **Creative Collaboration**: Human and AI working together as partners

### Progressive Disclosure
Features are revealed as needed:
1. **Start Simple**: Basic chat interface
2. **Generate Progressively**: Website emerges through conversation
3. **Add Complexity**: Advanced features as requirements grow

### User Empowerment
- **No Coding Required**: Create websites through conversation alone
- **Full Control**: Users guide the creative process
- **Transparent Process**: See exactly how conversation leads to output

## 🔧 Configuration

### Environment Variables
```env
VITE_DEEPSEEK_API_KEY=your_api_key_here
VITE_DEEPSEEK_BASE_URL=https://api.deepseek.com
```

### AI Model Settings
- Model: DeepSeek latest models
- Temperature: Configurable for creativity vs. consistency
- Max Tokens: Adjustable for response length

## 📱 Responsive Design

WikiGen is built with mobile-first responsive design:
- **Mobile-Optimized**: Touch-friendly interfaces on small screens
- **Adaptive Layouts**: UI elements rearrange based on screen size
- **Consistent Experience**: Same functionality across all devices

## 🚧 Development Guidelines

### Code Style
- Use Vue 3 Composition API with `<script setup>`
- Follow TypeScript best practices
- Use UnoCSS utility classes with attributify syntax
- Store AI prompts in dedicated TypeScript files

### UI/UX Standards
- Use Phosphor icons via `i-ph-*` classes
- Implement responsive design for all components
- Follow stone color palette guidelines
- Avoid emojis; use icons instead

### Quality Assurance
- Run `pnpm run lint:fix` after changes
- Ensure `pnpm run typecheck` passes
- Test responsive behavior across breakpoints

## 📈 Future Roadmap

### Planned Features
- **Multi-Agent Collaboration**: Different AI specialists (designer, developer, content writer)
- **Export Functionality**: Download websites as ZIP files with all assets
- **Template Library**: Pre-designed starting points for common website types
- **Version History**: Track changes and revert to previous versions
- **Collaboration Features**: Multiple users working on same project

### Technical Enhancements
- **Server-Side Rendering**: Improved SEO and performance
- **Real-time Collaboration**: Live collaboration between users
- **Plugin System**: Extend AI capabilities with custom plugins
- **Advanced Analytics**: Usage insights and generation metrics

## 🤝 Contributing

Contributions are welcome! Please see the README.zh.md file for Chinese version. For detailed project information, see the documentation.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👤 Author

**Liang Mi**  
- GitHub: [@liangmiQwQ](https://github.com/liangmiQwQ)
- Project: [WikiGen](https://github.com/liangmiQwQ/WikiGen)


## 🌐 Language Navigation

- [中文版本 (Chinese Version)](README.zh.md)
