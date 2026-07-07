# Smart Bharat - AI-Powered Civic Companion 🇮🇳

Smart Bharat is a high-fidelity, resilient civic technology platform designed to bridge the gap between citizens and municipal administrations. It empowers citizens to query public schemes, check document requirements via an AI Companion, and report local infrastructure issues with dynamic maps and multi-media evidence.

---

## 🌟 Key Features

### 1. Multilingual AI Companion (साथी)
* **Context-Aware Chat**: Simplifies complex government schemes (Aadhaar, Passport, Ration Cards, PM-KISAN) at an accessible reading level.
* **Auto Language Detection**: Automatically responds in the citizen's query style (Devanagari Hindi, Hinglish, or English) without requiring manual language toggles.
* **Fallback Design**: Gracefully falls back to local NLP heuristics if the external LLM quota is exceeded.

### 2. Multi-Media Grievance Reporter
* **Structured Evidence**: Allows citizens to attach up to **5 photos** (max 5MB each) and **2 videos** (max 50MB each).
* **Flexible Storage**: Uploads files directly to public Supabase Storage buckets, with automatic fallback to local backend uploads.
* **Leaflet GPS Marker**: Features an interactive map selection frame allowing citizens to drop or drag coordinates directly on the map.
* **Auto-Priority Assignment**: Urgency is automatically mapped based on selected categories (e.g., loose power lines are designated Critical, garbage standard).

### 3. Smart Bharat Civic Insights
* **Live Analytics Dashboard**: Visualizes municipal counts (total complaints, resolution rate, average response hours).
* **SVG/CSS Charts**: Renders category distribution and priority metrics dynamically using browser-native visual graphics.

### 4. Municipal Command Center (Admin Panel)
* **Coordination Desk**: Allows municipal officers to filter and search reports by status, urgency, or category.
* **Workflow Adjustments**: Officers can inspect attachments, view Leaflet pins, and update complaints' lifecycle stages (`Submitted` ➔ `In Review` ➔ `In Progress` ➔ `Resolved`).
* **Dynamic PDF Receipts**: Downloadable text reports containing detailed receipt tracking coordinates and status metrics.

---

## 🛠️ Technology Stack
* **Frontend**: React 18, Vite, Tailwind CSS, Leaflet Maps, Lucide Icons.
* **Backend**: Node.js, Express, Multer.
* **Database & Storage**: Supabase (Remote DB & Storage), SQLite3 (Local DB fallback).

---

## 🚀 Setup & Installation

### 1. Database & Storage Configuration
1. Open your **Supabase Dashboard** ➔ **SQL Editor**.
2. Run the DDL Domiciled in `supabase/migrations/20260707000000_schema.sql` to initialize tables.
3. Run `supabase/migrations/20260707000001_storage.sql` to configure the public `complaints` bucket and RLS anonymous upload policies.
4. Run `supabase/migrations/20260707000002_indexes.sql` to set up table indexes.

### 2. Run the Backend Server
```bash
cd backend
npm install
npm run dev
```
*Note: Make sure to rename `.env.example` to `.env` and fill in your Supabase DB connection properties and Gemini API Key.*

### 3. Run the Frontend Client
```bash
cd frontend
npm install
npm run dev
```

### 4. Run Automated API Tests
Execute the automated test suite in the backend directory:
```bash
cd backend
npm test
```
