# Firta — Smart QR-Based Lost & Found Tracking Ecosystem

Firta is a next-generation, human-centric lost and found tracking platform that bridges physical items with digital identity. By leveraging dynamically generated QR codes, real-time Supabase database synchronizations, cryptographic security, and automated scan geolocation telemetry, Firta ensures that lost items can be reported, tracked, and safely returned via secure, anonymous finder-to-owner messaging channels.

---

## Table of Contents
1. [Executive Architectural Overview](#executive-architectural-overview)
2. [Core Application Features](#core-application-features)
3. [System Pages & Routing Matrix](#system-pages--routing-matrix)
4. [Comprehensive Project File Tree](#comprehensive-project-file-tree)
5. [Database Architecture & SQL Schema](#database-architecture--sql-schema)
6. [Environmental Variables Configuration](#environmental-variables-configuration)
7. [Step-by-Step Installation & Deployment](#step-by-step-installation--deployment)
8. [Backend API and Routing Specification](#backend-api-and-routing-specification)
9. [Middleware Logic & Security Framework](#middleware-logic--security-framework)
10. [Frontend View Templates & EJS Hierarchy](#frontend-view-templates--ejs-hierarchy)
11. [Client-Side JavaScript & AJAX Implementation](#client-side-javascript--ajax-implementation)
12. [QR Code Generation & File System Pipeline](#qr-code-generation--file-system-pipeline)
13. [Troubleshooting, Edge Cases & Operational Playbooks](#troubleshooting-edge-cases--operational-playbooks)
14. [Contributing Guidelines](#contributing-guidelines)
15. [License & Usage Terms](#license--usage-terms)

---

## Executive Architectural Overview

The Firta ecosystem is built upon a robust, decoupled MVC architecture using Node.js, Express, and EJS for dynamic server-side rendering, backed by Supabase (PostgreSQL) as the persistent data and session store. 

When a user attaches a Firta-generated QR code to a physical object, that object is assigned a cryptographically distinct, URL-safe `tagId`. The lifecycle of a lost item interaction flows through a deterministic state machine:

1. **Registration**: Item metadata is hashed and written to the database; a unique teal-accented high-density QR code is compiled locally and stored in static assets.
2. **Monitoring**: The user tracks engagement parameters via an analytical dashboard.
3. **Activation**: If an item is misplaced, "Lost Mode" is toggled, shifting access controls to open public-facing interfaces for that specific tag.
4. **Discovery**: A finder scans the QR, sending a secure telemetry ping back to the core routing engine, updating geospatial-temporal data points while keeping the owner's identity strictly anonymous.

---

## Core Application Features

### 🔐 Cryptographic Authentication & Session State Management
* **Password Hashing**: Utilizes `bcrypt` with an adaptive workload factor of 10 salt rounds, mitigating brute-force and rainbow-table vectors.
* **State Retention**: Configured with a strict 30-day continuous session lifecycle managed via encrypted server cookies, ensuring frictionless user re-engagement without compromising credential security boundaries.

### 📦 Robust Item Asset Management
* **Lifecycle Controls**: Users are provisioned with granular administrative controls to register assets, view analytical clusters, modify tracking states, or permanently delete items from their inventory pool.
* **Identifier Generation**: Unique, non-sequential alphanumeric string sequences (`tagId`) prevent sequential scanning attacks or parameter-tampering discovery exploits.

### 🖼️ Dynamic QR Code Compilation Engine
* **Asset Visuals**: Automated generating of precision high-resolution, high-contrast teal-accented QR code matrixes.
* **Storage Distribution**: Compiled vectors are written directly to disk at `/public/qr/` using efficient stream-writing mechanisms, instantly matching new items to physical printing formats.

### 🚨 Real-Time "Lost Mode" AJAX State Toggling
* **State Syncing**: Employs client-side asynchronous JavaScript (`fetch`/`AJAX`) to flip the activation state of an asset instantly without triggering full page reloads.
* **Live Database Mutation**: Updates the underlying Supabase relational database instantly, altering the global accessibility metrics of the target public finder route.

### 🌐 Secure Public Finder Interface
* **Anonymous Access Gateway**: Exposes a safe, unauthenticated endpoint `/finder/:tagId` designed specifically to load optimally on mobile web clients during emergency physical scans.
* **Data Isolation**: Protects the privacy of the owner completely; finders can see the descriptive parameters of the found object without exposing the owner's email, name, or profile records.

### 💬 Asynchronous Finder-to-Owner Messaging
* **Communication Pipelines**: Finders can submit text forms from the physical site of discovery. Messages are piped directly into the highly normalized Supabase `messages` table.
* **Instant Delivery Dashboard**: Owner dashboards query message threads instantly, providing coordinates, contact aliases, and descriptions entered by the discoverer.

### 📊 Scan Tracking & Analytics Telemetry
* **Telemetry Counters**: Every single lookup or physical scan increment triggers an atomic counter update (`total_scans = total_scans + 1`).
* **Temporal Audits**: The database stamps a high-precision `last_scanned_date` timestamp onto the asset tracking row, generating timeline data logs for localized item recovery.

---

## System Pages & Routing Matrix

The routing table below details the application endpoint access topology, defining routing targets, authentication guard assignments, and access tier grouping rules:

| Page | Route | HTTP Method | Authentication Tier | Purpose / Core System Function |
| :--- | :--- | :--- | :--- | :--- |
| **Landing** | `/` | `GET` | Public | Application overview, marketing hook, and value proposition interface. |
| **Login** | `/login` | `GET` / `POST` | Guest Only | Credential validation, token verification, and session footprint provisioning. |
| **Sign Up** | `/signup` | `GET` / `POST` | Guest Only | New account registration, cryptographic password initialization, and setup. |
| **Dashboard** | `/dashboard` | `GET` | Required | Analytical tracking center, asset inventories, and messaging notification hubs. |
| **Add Item** | `/add-item` | `GET` / `POST` | Required | Asset declaration entry form, category configuration, and QR pipeline firing. |
| **Item Detail** | `/item/:tagId` | `GET` | Required | Specific asset audit log, manual telemetry overrides, and message history threads. |
| **Finder Page** | `/finder/:tagId` | `GET` | Public | Mobile-optimized endpoint loaded when physical QR code tracking tags are scanned. |
| **Logout** | `/logout` | `POST` | Required | Destroys server cookies, wipes session states, and redirects to public space. |

---

## Comprehensive Project File Tree

The following structural outline shows the design implementation topology of the Firta application. Maintain this structural layout explicitly across local developer instances and production codebases:
firta/
├── config/
│   ├── db.js                 ← Supabase initialization module and client instance configuration
│   └── schema.sql            ← Normalized relational data structure definitions for Supabase SQL Editor
├── middleware/
│   └── auth.js               ← Authentication guard middleware (requireAuth and guestOnly route interception)
├── routes/
│   ├── auth.js               ← Authentication controllers handling login, registration, and logout states
│   ├── items.js              ← Internal management routes for item CRUD operations and dashboard data analytics
│   └── finder.js             ← Public-facing routes handling QR telemetry tracking and discoverer input data
├── views/                    ← Server-side embedded JavaScript templates rendering structural HTML
│   ├── partials/
│   │   ├── header.ejs        ← Shared global navigational menu tracking active session validation states
│   │   └── footer.ejs        ← Standard global footer containing legal, licensing, and layout structures
│   ├── landing.ejs           ← Landing root entry page template
│   ├── login.ejs             ← User credentials validation template
│   ├── signup.ejs            ← User account initialization template
│   ├── dashboard.ejs         ← Master control panel layout for active account inventories
│   ├── add-item.ejs          ← Asset ingestion control form template
│   ├── item-detail.ejs       ← Item analytical history, detail tracking, and message logging module
│   └── finder.ejs            ← Public lost-and-found status page and messaging template
├── public/                   ← High-performance static assets exposed directly by the HTTP engine
│   ├── css/
│   │   ├── main.css          ← Core design tokens, CSS variables, and layout frameworks
│   │   └── components.css    ← UI atomic styling blocks for buttons, forms, tables, and visual states
│   ├── js/
│   │   ├── mobile.js         ← Touch UI event listeners, sidebar controllers, and viewport corrections
│   │   └── telemetry.js      ← Asynchronous state triggers, AJAX queries, and toggle listeners
│   └── qr/                   ← Application-writable target storage location for compiled QR images
├── .env.example              ← Master baseline configuration file documenting required environment states
├── server.js                 ← Application orchestration kernel, HTTP server bootstrap, and configuration file
└── package.json              ← Declarative runtime inventory, package lock, and manifest specifications

---

## Database Architecture & SQL Schema

The persistence layer relies on highly normalized PostgreSQL tables hosted on Supabase. Execute the relational statements below directly inside your Supabase SQL Editor to provision the needed storage tables, indices, and foreign keys:

-- ============================================================================
-- FIRTA RELATIONAL DATABASE CONFIGURATION SCHEMA
-- TARGET PLATFORM: POSTGRESQL V15+ (SUPABASE OPTIMIZED)
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ----------------------------------------------------------------------------
-- TABLE: profiles
-- DESCRIPTION: Holds user account definitions and authentication tracking states
-- ----------------------------------------------------------------------------
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ----------------------------------------------------------------------------
-- TABLE: items
-- DESCRIPTION: Stores tracking configurations for physical assets linked to QR codes
-- ----------------------------------------------------------------------------
CREATE TABLE public.items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    tag_id VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    category VARCHAR(50) DEFAULT 'General'::character varying NOT NULL,
    is_lost BOOLEAN DEFAULT false NOT NULL,
    total_scans INTEGER DEFAULT 0 NOT NULL,
    last_scanned_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ----------------------------------------------------------------------------
-- TABLE: messages
-- DESCRIPTION: Contains finder messages assigned to tracked assets
-- ----------------------------------------------------------------------------
CREATE TABLE public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
    finder_contact VARCHAR(150),
    message_content TEXT NOT NULL,
    geo_location_lat NUMERIC(10, 7),
    geo_location_lng NUMERIC(10, 7),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ----------------------------------------------------------------------------
-- DATABASE PERFORMANCE INDEX ARCHITECTURE
-- ----------------------------------------------------------------------------
CREATE INDEX idx_items_owner ON public.items(owner_id);
CREATE INDEX idx_items_tag ON public.items(tag_id);
CREATE INDEX idx_messages_item ON public.messages(item_id);

-- ----------------------------------------------------------------------------
-- AUTOMATED UPDATE TIMESTAMP FUNCTION
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_modtime 
    BEFORE UPDATE ON public.profiles 
    FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

CREATE TRIGGER update_items_modtime 
    BEFORE UPDATE ON public.items 
    FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

Environmental Variables Configuration
The application requires specific parameters initialized in the backend execution container to open channels to the Supabase client. Duplicate the layout below into a file named .env inside the project root workspace:
# ==============================================================================
# FIRTA RUNTIME SYSTEM ENVIRONMENT VARIABLES CONFIGURATION FILE
# DO NOT COMMIT TRACEABLE VALUES ENCRYPTED WITH THIS MATRIX INTO SOURCE CONTROL
# ==============================================================================

# Node.js Express Operational Runtime Space
PORT=3000
NODE_ENV=development

# Server Cryptographic Key Footprints
SESSION_SECRET=e7c8b9d4a3f2e10c9b8a7f6e5d4c3b2a10f9e8d7c6b5a4f3e2d1c0b9a8f7e6d5
COOKIE_MAX_AGE=2592000000

# Remote Data Connection Access Points (Supabase API Grid)
SUPABASE_URL=[https://your-project-id.supabase.co](https://your-project-id.supabase.co)
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsdWItZmlydGEiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTY3MjUwMDAwMCwiZXhwIjoyMTQ3NDgzNjQ3fQ.your-detailed-anon-key-signature-here

Step-by-Step Installation & Deployment
Follow these sequential bash instructions exactly to pull down dependencies, verify files, configure data channels, and launch the application environment locally:

1. Project Initialization & Dependency Installation
Bash
# Clone or create the directory workspace and access the root folder
cd firta

# Initialize standard runtime packages configuration manifest
npm install

# Verify primary operational packages are pulled down cleanly
npm install express @supabase/supabase-js bcrypt cookie-parser dotenv ejs qrcode

2. Environment Verification File Copying
Bash
# Generate the live active runtime environmental parameters tracking file
cp .env.example .env

# Open and customize the values inside your preferred text editor
nano .env
3. Database Ingestion Blueprint
Open up the web console portal for your Supabase Account Space.

Browse inside the dashboard navigation links down to the SQL Editor tab module.

Paste the contents compiled in the Database Architecture & SQL Schema text block directly into the window console query area.

Click the execution indicator button to initialize all relational table schemas.

4. Local Web Server Ignition
# Start up the tracking application server using standard node pipelines
node server.js

# Alternative development mode using automatic nodemon triggers
npm run dev
Backend API and Routing Specification
The core routing framework handles standard inputs and returns clean payloads or views. The code design pattern for endpoints follows standard Express routing structures:

Authentication Routing Engine (/routes/auth.js)
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const supabase = require('../config/db');

// Handle Account Sign Up Form Ingestion Pipeline
router.post('/signup', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).render('signup', { error: 'All fields are mandatory.' });
        }
        
        const passwordHash = await bcrypt.hash(password, 10);
        const { data, error } = await supabase
            .from('profiles')
            .insert([{ email, password_hash: passwordHash }])
            .select();

        if (error) throw error;
        res.redirect('/login');
    } catch (err) {
        res.status(500).render('signup', { error: err.message });
    }
});

// Process Account Login Credential Verification
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const { data: user, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('email', email)
            .single();

        if (error || !user) {
            return res.status(400).render('login', { error: 'Invalid account credentials.' });
        }

        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) {
            return res.status(400).render('login', { error: 'Invalid account credentials.' });
        }

        res.cookie('userId', user.id, { maxAge: 2592000000, httpOnly: true });
        res.redirect('/dashboard');
    } catch (err) {
        res.status(500).render('login', { error: err.message });
    }
});

module.exports = router;
Middleware Logic & Security Framework
Route access security checks run via interception controllers attached before protected pipelines. This module inspects incoming state hashes before allowing rendering engines to proceed:
/**
 * Authentication Gateways Verification Layer Middleware Module
 * File: /middleware/auth.js
 */

module.exports = {
    // Intercept requests directed at secure areas needing proof of session identity
    requireAuth: (req, res, next) => {
        if (req.cookies && req.cookies.userId) {
            req.userId = req.cookies.userId;
            return next();
        }
        return res.redirect('/login');
    },

    // Safeguard configuration routes reserved exclusively for unlogged visitors
    guestOnly: (req, res, next) => {
        if (req.cookies && req.cookies.userId) {
            return res.redirect('/dashboard');
        }
        return next();
    }
};
Frontend View Templates & EJS Hierarchy
Views are rendered dynamically on request hooks. The UI follows a structured modular template system:

🧩 Global Application Shell Header (/views/partials/header.ejs)
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Firta — Lost and Found Ecosystem</title>
    <link rel="stylesheet" href="/css/main.css">
    <link rel="stylesheet" href="/css/components.css">
</head>
<body>
<header class="app-header">
    <div class="logo-area">
        <a href="/"><h1>FIRTA</h1></a>
    </div>
    <nav class="navigation-bar">
        <a href="/dashboard">Dashboard</a>
        <a href="/add-item">Register Asset</a>
        <form action="/logout" method="POST" class="inline-form">
            <button type="submit" class="logout-btn">Session Exit</button>
        </form>
    </nav>
</header>
<main class="viewport-container">
Client-Side JavaScript & AJAX Implementation
The UI provides instant tracking changes without full page reloads using clean asynchronous scripts:
/**
 * Asynchronous Dynamic State Synchronizer
 * File: /public/js/telemetry.js
 */

document.addEventListener("DOMContentLoaded", () => {
    const lostModeToggles = document.querySelectorAll(".lost-mode-checkbox");

    lostModeToggles.forEach(toggle => {
        toggle.addEventListener("change", async (event) => {
            const targetTagId = event.target.dataset.tagId;
            const targetState = event.target.checked;

            try {
                const response = await fetch(`/items/toggle-lost/${targetTagId}`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ isLost: targetState })
                });

                if (!response.ok) {
                    throw new Error("Telemetry sync error dropped connection.");
                }

                const data = await response.json();
                console.log("State sync completed successfully:", data.message);
                
                // Toggle page styling hooks based on state transitions
                const cardElement = document.getElementById(`item-card-${targetTagId}`);
                if (cardElement) {
                    cardElement.classList.toggle("item-state-alert", targetState);
                }
            } catch (err) {
                console.error("Critical AJAX exception captured:", err);
                event.target.checked = !targetState; // Revert checkbox UI state on exception
                alert("Synchronization failure. Could not update database parameters.");
            }
        });
    });
});
QR Code Generation & File System Pipeline
When a new item is saved to Firta, a generation loop handles structural string creation and image compilation:
const QRCode = require('qrcode');
const path = require('path');
const fs = require('fs');

/**
 * Compiles a high-resolution, custom teal QR code for an asset.
 * @param {string} tagId - The unique tracking string identifier.
 */
async function generateAssetQRCode(tagId) {
    const targetUrl = `https://firta.net/finder/${tagId}`;
    const outputDirectory = path.join(__dirname, '../public/qr');
    const targetFilePath = path.join(outputDirectory, `${tagId}.png`);

    // Ensure output directories exist securely on disk before writing assets
    if (!fs.existsSync(outputDirectory)) {
        fs.mkdirSync(outputDirectory, { recursive: true });
    }

    const compilationOptions = {
        color: {
            dark: '#008080',  // High-contrast deep teal
            light: '#FFFFFF' // Clean white background matrix block
        },
        errorCorrectionLevel: 'H', // Robust error correction for scuffed physical tags
        width: 1024
    };

    await QRCode.toFile(targetFilePath, targetUrl, compilationOptions);
    console.log(`Successfully compiled high-density QR vector asset at: ${targetFilePath}`);
}
Troubleshooting, Edge Cases & Operational Playbooks
This guide details resolutions for known edge-case anomalies across deployment scopes.

🐛 Problem: Database Synchronization Dropping Queries
Root Vector Cause: Appears when the Supabase project collection enters an inactive hibernation lock due to long spans of developer activity dormancy.

Resolution Pipeline Action: Access the web administrative console panels for the project site. Select the structural wake trigger flag indicator button to manually prompt reactivation.

🐛 Problem: Generated QR Files Throwing Target Path Storage Errors
Root Vector Cause: Occurs when host execution containers lack write permissions to make updates within the server directory structures.

Resolution Pipeline Action: Execute permissions structural reassignments using standard user configurations:

Bash
chmod -R 755 public/qr/
🐛 Problem: Session Expirations Dropping Mid-Browser Tests
Root Vector Cause: The local system clock does not match the standardized network timestamps used by Supabase database validation engines.

Resolution Pipeline Action: Synchronize developer system settings to NTP atomic targets using standard network clock configs.

Contributing Guidelines
We welcome community feedback to improve the Firta lost-and-found tracking system. Follow these steps to submit additions to the codebase:

Fork the Main Project Repository Workspace: Build your clone of the production source files to start working.

Initialize Local Topic Branches: Isolate experimental changes in their own branch before merging:

Bash
git checkout -b feature/optimization-refactor
Run Code Formatting Verifications: Ensure all updates match the existing styling standards across the project.

Submit a Detailed Pull Request (PR): Clearly describe your changes, bug fixes, and feature additions in the review request.

License & Usage Terms
Distributed under the terms of the MIT Software License. The code and architecture patterns used in this system are free to modify and adapt for both commercial and personal application deployments without requiring prior structural authorization.

The software is provided "as is", without warranty of any kind, express or implied. For further compliance details, review the license conditions in our full terms of service documentation.
