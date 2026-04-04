# Medication Management Web Application

## Project Overview

The Medication Management Web Application is a full-stack system designed to help doctors and patients manage prescriptions, reminders, and medical records efficiently.

This system is being developed as part of the NJIT Spring 2026 Capstone Project in collaboration with RDE Systems Support Group.

The application allows:
- Doctors to search patients and manage prescriptions
- Patients to input personal and medical information
- Users to receive medication reminders
- Admins to manage user accounts and system data

---

##  Project Structure

This repository follows a monorepo structure:
medication-management-app/
│
├── frontend/ # React (Vite) frontend application
├── backend/ # ColdFusion backend + database scripts
├── docs/ # Diagrams, wireframes, meeting notes
│
├── README.md
├── LICENSE
└── .gitignore

---

##  Tech Stack

### Frontend
- React (Vite)
- React Router (for navigation)
- Axios or Fetch API (for backend communication)
- UI Library (Material UI or Tailwind – team decision)

### Backend
- Adobe ColdFusion (CFML)
- Microsoft SQL Server

### Hosting / Deployment
- AWS (Service to be finalized)
- Git-based version control

---

##  How to Run the Frontend (Development)

1. Navigate to the frontend folder:
    cd frontend
2. Install dependencies:
    npm install
3. Start development server:
    npm run dev

4. Open the local development URL shown in the terminal.
---
##  Backend Setup
The backend is built using ColdFusion.

Backend code will be located in:
    backend/cfml/
Database schema and SQL scripts will be located in:
    backend/sql/

Backend setup instructions will be updated once the ColdFusion environment is fully configured.

---

## Branching Strategy

We follow a structured workflow:

- `main` → Production-ready code
- `dev` → Active development branch
- `feature/*` → Individual feature branches

Example:feature/patient-intake
feature/doctor-search
feature/user-authentication

All changes should be made through Pull Requests.

---

## Documentation

Project documentation is located inside:
docs/


This includes:
- ER Diagrams
- Wireframes
- Meeting Notes
- Architecture Design
- System Documentation

---

## Security & Configuration

Environment variables and sensitive configuration files are not committed to the repository.

Never commit:
- Database credentials
- AWS keys
- API secrets

---

##  Team

Yassin Shater  
Piper Phair
Emily Medina
Zaid Hasan
Sponsor: RDE Systems Support Group  
Course: NJIT Capstone – Spring 2026  

---

##  Project Status

 Currently in active development phase.
