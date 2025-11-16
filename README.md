TEAM INFO:
K.SRI CHANDAN(24BDS034)
S.ABHINAV SAI CHANDRA(24BDS070)
S.VARUN (24BDS071)
SHAIK SAMEER(24BDS074)
K.JASWANTH REDDY(24BDS028)
--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
AI Semester Project – Full-Stack Web + Python AI Backend

This project is a full-stack AI-powered web application built as part of a semester course project.
It consists of:

A Python backend for AI/ML model processing

A TypeScript front-end built using Vite + React

TailwindCSS for UI styling

API-based communication between frontend and backend

🚀 Project Overview

The goal of this project is to build an interactive web application that uses AI/ML models in the backend to perform predictions or intelligent operations.
The frontend provides a clean UI for input, and the backend handles the ML logic and returns results.

This repository is organized into two core sections:

1. python_backend/

Contains all backend code

Written in Python

Handles:

AI/ML model scripts

Pre-processing

Prediction endpoints

API server (Flask/FastAPI expected)

2. src/

Contains the React + TypeScript frontend

Built using Vite for fast bundling

Uses TailwindCSS for styling

Responsible for:

UI components

User inputs

Fetching results from backend API

Displaying predictions

🧠 AI/ML Component

The backend Python scripts implement the AI logic.
Typical steps include:

Loading dataset

Training ML model

Saving model

Serving prediction via API

(You can add your model type here once finalized: e.g., Random Forest, Logistic Regression, CNN….)

📁 Folder Structure
AIsemproject/
│
├── python_backend/        # AI model + backend API
│
├── src/                   # Frontend UI (React + TypeScript)
│   ├── components/        # UI Components
│   ├── pages/             # Web pages/screens
│   └── utils/             # Helper functions
│
├── package.json           # Frontend dependencies
├── vite.config.ts         # Vite configuration
├── tailwind.config.js     # TailwindCSS config
└── tsconfig.json          # TypeScript config

🛠️ Tech Stack
Frontend

React + TypeScript

Vite

Tailwind CSS

Backend

Python

Flask / FastAPI (whichever you used)

Scikit-learn / TensorFlow / PyTorch (your ML library)

▶️ How to Run the Project
1. Start Python Backend
cd python_backend
python main.py

2. Start Frontend
npm install
npm run dev


The app will be available at:

http://localhost:5173
