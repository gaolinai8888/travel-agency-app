
# 📌 Travel Agency App 🗺️ 
<p align="center">
<img width="947" height="499" alt="image" src="https://github.com/user-attachments/assets/66ffed3c-ccd6-4b82-96a0-037fe131e8b0" />
</p>

A modern, responsive web application for exploring and booking travel experiences.  
The app includes:
- **Public-facing website** for browsing destinations and generating trips
- **Admin dashboard** for managing trips (create & delete)
- **Authentication** to secure admin access
- **Google Gemini AI** integration for dynamic trip generation

---

## Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v16+ recommended)
- npm or yarn
- [Docker](https://www.docker.com/) (optional, for containerized deployment)
- API keys for:
  - Google Gemini API (trip generation)
  - Authentication provider (e.g., Appwrite, Firebase, Auth0)

---

### Installation

```bash
# Clone the repository
git clone https://github.com/gaolinai8888/travel-agency-app.git
cd travel-agency-app

# Install dependencies
npm install

# Create environment variables file
cp .env.example .env
# Fill in your API keys and config in .env

# Start the development server
npm run dev
```
### Build for Production
```bash
npm run build
# The optimized production-ready files will be in the `dist/` folder
```

---
## Tech Stack

| Category           | Tools / Technologies                                  |
| ------------------ | ----------------------------------------------------- |
| **Frontend**       | React, React Router, TypeScript, Vite, Tailwind CSS   |
| **AI Generation**  | Google Gemini API                                     |
| **Authentication** | Appwrite / Firebase / Auth0 (based on implementation) |
| **Dev Tooling**    | Vite (HMR, fast builds)                               |
| **Deployment**     | Docker (containerization)                             |
