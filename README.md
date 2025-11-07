# 🏙️ Welcome to Stadssurr
*A modern platform for citizen-driven urban planning.*

Here is the link for the live application: https://stadssurr.onrender.com fastAPI server and frontend is hosted on Render.com free tier. This may cause up to 1 min startup time when a user first access parts of the website that requires api-calls, since the API server coolsdown after inactivitity.

## 📘 Project info
This project transforms how citizens engage with urban planning. Instead of navigating bureaucratic websites and static PDF documents, our platform offers an interactive, user-friendly space for participation in city development. Inspired by the Stockholm Växer experience, we’re building a modern digital tool where people can explore projects, share opinions, and visualize ideas — all in one place. The goal: make civic engagement accessible, intuitive, and collaborative.

## 🚀 Features

- 📍 Interactive Map – Explore ongoing, completed and planned city projects.
- 🗂️ Find the projects that interest you in an easy way.
- 💬 Citizen Feedback – Submit and discuss ideas directly within the platform.
- 🧭 Project Summaries – Get concise, visual overviews instead of PDF reports.
- 🔔 Personalized page where you easily can follow the projects that interest you.
- 🗳️ Open Participation – A transparent space for public dialogue.
- 💡 Send your feedback and ideas directly to Stockholm Stad via our platform.


## 🛠️ Tech Stack
**Frontend**
- ⚛️ React + TypeScript – Modern component-based UI.
- 🎨 Tailwind CSS – Custom civic-tech inspired design system.
- 🌐 Vite – Fast development and optimized builds.

**Backend**
- 🐍 FastAPI (Python) – Lightweight and performant API layer.
- 🧱 SQLAlchemy – Lets us work with databases in a pythonic way.
- 🗃️ SQLite – Relational database - easy to use and setting up.

## 🧩 Architecture Overview
The project is divided into two main parts:
1. Frontend/client side - built with React and TypeScript for an interactive user interface.
2. Backend(server) - a FastAPI service that handle authentication, project data and user engagement. Backend exposes endpoints that the client side communicates with such as:
- /api/projects - list and filter city projects.
- /api/projects/{id} – get detailed project info

## 📥 Project data scraped from [Stockholm Växer](https://vaxer.stockholm/)
```
/backend/scraping/scrape.py
```
Scrape.py is a python script that scrapes projects from Stockholm Växer, extracting coordinates, information and pictures about the projects. The coordinates is also converted from SWEREF to WGS84 for compatability with Leafleat for interactive maps.
 
## 🧑‍💻 Getting Started (Locally)
1. Clone REPO
2. Create conda env with environment.yml to download required dependencies:
   ```bash
   conda env create -f environment.yml
   ```
3. Activate cond env:
   ```bash
   conda activate stadssurr_env
   ```
4. Start FastAPI server on port 8000:
   ```bash
   cd backend
   uvicorn app.main:app --reload --port 8000
   ```
5. Start Vite Server on port 8080:
   ```bash
   #Inside stadsurround-dialog/ dir
   npm run dev
   ```
6. Access application from prefered browser on `localhost:8080`
