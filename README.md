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

License & Usage Terms
Distributed under the terms of the MIT Software License. The code and architecture patterns used in this system are free to modify and adapt for both commercial and personal application deployments without requiring prior structural authorization.

The software is provided "as is", without warranty of any kind, express or implied. For further compliance details, review the license conditions in our full terms of service documentation.
