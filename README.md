# 🖼️ NFT-Hub

**NFT-Hub** ist ein digitales Kunst-Marktplatz-Projekt, das bewusst **ohne Blockchain-Abhängigkeit** entwickelt wurde.  
Es dient zu Demonstrations- und Lernzwecken im Bereich moderner **Webentwicklung mit Microservice-Architektur**, Authentifizierung, Zahlungsabwicklung und Medienverwaltung.

> ⚙️ **Ziel:** Ein funktionaler Marktplatz, auf dem **Creators** ihre Kunstwerke hochladen können und **Buyers** diese mit einer simulierten Stripe-Zahlung (Sandbox) erwerben können – inklusive digitalem Zertifikat.

---

## 🌐 Plattform-Überblick

| **Rolle** | **Berechtigung** |
|------------|------------------|
| **Buyer** | Kann verfügbare Kunstwerke ansehen und mit einer Test-Zahlung kaufen |
| **Creator** | Kann nur mit aktivem Abo (Stripe-Subscription) neue Werke hochladen |
| **Admin** | Zugriff auf Verwaltungsfunktionen (nur Demonstration) |

### 💡 Funktionsübersicht

- Registrierung, Login & Rollenverwaltung  
- Upload und Verwaltung digitaler Kunstwerke  
- Stripe-Zahlungen (One-Time & Subscription im Sandbox-Modus)  
- Cloudinary-Integration für Medien  
- Automatische PDF-Zertifikatserstellung (pdfkit / Puppeteer)  
- JWT-basierte Authentifizierung  
- RESTful API mit Microservices  
- Docker-basiertes Deployment mit Nginx-Reverse-Proxy  
- Sichere Kommunikation über HTTPS (SSL)

---

## 🧩 Architektur & Setup

NFT-Hub folgt einem **Microservice-Ansatz**, um Skalierbarkeit und Wartbarkeit zu fördern.

---

### 🧱 Microservices

#### 1️⃣ Auth-Service

Verantwortlich für Registrierung, Login, Token-Erstellung und Nutzerverwaltung.

**Technologien & Bibliotheken**
- Node.js + Express  
- MongoDB + Mongoose  
- bcrypt (Password-Hashing)  
- JSON Web Token (JWT)  
- dotenv  
- axios (Inter-Service Kommunikation)

**Hauptfunktionen**
- `POST /register` → Nutzerregistrierung  
- `POST /login` → JWT-Authentifizierung  
- `GET /user/:id` → Profil (vom NFT-Service genutzt)  
- Token-Middleware: prüft Gültigkeit & Rolle  
- Rollenmodell: `user`, `creator`, `admin`

---

#### 2️⃣ NFT-Service

Zuständig für Upload, Verwaltung und Anzeige von Kunstwerken.

**Technologien & Bibliotheken**
- Node.js + Express  
- MongoDB + Mongoose  
- multer (Dateiupload)  
- cloudinary (Bildspeicherung)  
- axios (Kommunikation mit Auth-Service)  
- JWT-Middleware  
- pdfkit / Puppeteer (Zertifikate)

**Routenübersicht**
- **Public Routes**
  - `GET /api/nft` → Alle NFTs  
  - `GET /api/nft/creator/:creatorId` → NFTs eines Creators + Profil  
- **Private Routes**
  - `GET /api/nft/mine` → Eigene NFTs  
  - `POST /api/nft/upload` → Nur Creator mit aktivem Abo

---

#### 3️⃣ Payment-Service

Verwaltet Stripe-Zahlungen und Abonnements.

**Technologien & Bibliotheken**
- Node.js + Express  
- Stripe SDK (Sandbox)  
- MongoDB + Mongoose  
- dotenv  
- axios  
- Webhook-Handling für Stripe-Events  
- node-cron (Automatische Abo-Prüfungen)

**Hauptfunktionen**
- Test-Checkout mit Visa-Karte  
- Subscription-Handling (Start, Verlängerung, Ablauf)  
- Automatische Abo-Statusprüfung  
- Zertifikats-Trigger nach Kauf

---

#### 4️⃣ BFF-Service (Backend-for-Frontend)

Gateway-Layer für das Frontend – bündelt API-Aufrufe von Auth-, NFT- und Payment-Service.

**Technologien**
- Node.js + Express  
- axios  
- JWT-Validierung  
- Vereinfachte Endpoints für das Frontend

---

#### 5️⃣ Frontend

Benutzeroberfläche für Buyers und Creators.

**Technologien**
- React + Vite  
- Tailwind CSS  
- Axios  
- Zustand oder Context API  
- React Router DOM  
- Stripe Elements / Checkout  
- Modernes UI-Design mit Glassmorphism

---

## 🧱 Infrastruktur

### ⚙️ Docker Setup

Jeder Service läuft in einem eigenen Container:

auth-service/
nft-service/
payment-service/
frontend/
nginx/

SSL-Zertifikate werden mit **Certbot / Let's Encrypt** erstellt.

---

## 🔒 Authentifizierung & Sicherheit

- JWT-basierte Auth über Middleware  
- Zugriffskontrolle nach Rollen (`user`, `creator`, `admin`)  
- Tokens im Secure Storage  
- Passwort-Hashing mit bcrypt  
- CSRF-sichere API-Aufrufe durch Subdomains

---

## 🧾 Zertifikate & Medien

### 📤 Uploads
- Multer verarbeitet lokale Uploads  
- Cloudinary hostet die Bilder  
- Dateigrößen- und Formatvalidierung integriert  

### 📄 Zertifikate
- PDF-Generierung über **pdfkit** oder **Puppeteer**  
- Zertifikate enthalten Käufername, NFT-ID, Creator, Datum & Transaktions-ID  

---

## 💳 Stripe Sandbox Testdaten

**Testkarte (Visa):**

- 4242 4242 4242 4242
- CVC: 424
- Expiry: beliebig in Zukunft

→ Reine Testumgebung, keine echten Zahlungen.

---

### 📚 Technologien im Überblick

# Frontend	
- React, Tailwind CSS, Axios, Vite
# Backend
- Node.js, Express, Mongoose
# Auth & Security
- JWT, bcrypt
# Datenbanken
- MongoDB
# File Handling
- Multer, Cloudinary
# Zahlungen	
- Stripe (Sandbox, Webhooks, Subscriptions)
# PDF-Generierung
- pdfkit, Puppeteer
# Containerisierung
- Docker
# Reverse Proxy / SSL	
- Nginx, Certbot
# Sonstiges
- axios, dotenv, node-cron

📸 Admin-Demo
Der Admin-Bereich wird nicht öffentlich bereitgestellt.
Ein Screenshot dient nur zur Demonstration von:

Nutzerverwaltung

Zahlungsverläufen

Systemlogs

🧠 Fazit
- NFT-Hub ist ein lernorientiertes Showcase-Projekt mit Fokus auf:

Microservice-Kommunikation

Authentifizierung & Autorisierung

Cloud-basierte Dateiverwaltung

Stripe-Integration

Docker-Deployment

