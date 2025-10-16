🖼️ NFT-Hub

NFT-Hub ist ein digitales Kunst-Marktplatz-Projekt, das bewusst ohne Blockchain-Abhängigkeit entwickelt wurde.
Es dient zu Demonstrations- und Lernzwecken im Bereich moderner Webentwicklung mit Microservice-Architektur, Authentifizierung, Zahlungsabwicklung und Medienverwaltung.

⚙️ Ziel: Ein funktionaler Marktplatz, auf dem Creators ihre Kunstwerke hochladen können und Buyers diese mit einer simulierten Stripe-Zahlung (Sandbox) erwerben können – inklusive digitalem Zertifikat.

🌐 Plattform-Überblick
Rolle	Berechtigung
Buyer	Kann verfügbare Kunstwerke ansehen und mit einer Test-Zahlung kaufen
Creator	Kann nur mit aktivem Abo (Stripe-Subscription) neue Werke hochladen
Admin	Hat Zugriff auf Verwaltungsfunktionen (nicht öffentlich zugänglich, nur Demonstration)
💡 Funktionsübersicht

Registrierung, Login & Rollenverwaltung

Upload und Verwaltung digitaler Kunstwerke

Stripe-Zahlungen (One-time & Subscription im Sandbox-Modus)

Cloudinary-Integration für Medien

Automatische PDF-Zertifikatserstellung (pdfkit / Puppeteer)

JWT-basierte Authentifizierung

RESTful API mit Microservices

Docker-basiertes Deployment mit Nginx Reverse Proxy

Sichere Kommunikation über HTTPS (SSL)

🧩 Architektur & Setup

NFT-Hub folgt einem Microservice-Ansatz, um Skalierbarkeit und Wartbarkeit zu fördern.

Services
1️⃣ Auth-Service

Verantwortlich für Registrierung, Login, Token-Erstellung und Nutzerverwaltung.

Technologien & Bibliotheken:

Node.js + Express

MongoDB + Mongoose

bcrypt (Password Hashing)

JSON Web Token (JWT)

dotenv

axios (zur Kommunikation mit anderen Services)

Hauptfunktionen:

POST /register → Nutzerregistrierung

POST /login → JWT-Authentifizierung

GET /user/:id → Nutzerprofil (wird vom NFT-Service verwendet)

Token-Middleware: prüft Gültigkeit & Rolle des Users

Rollenmodell: user, creator, admin

2️⃣ NFT-Service

Zuständig für das Hochladen, Verwalten und Abrufen der Kunstwerke.

Technologien & Bibliotheken:

Node.js + Express

MongoDB + Mongoose

multer (Dateiupload)

cloudinary (Bildspeicherung)

axios (Kommunikation mit Auth-Service)

JWT-Middleware für Authentifizierung

pdfkit / Puppeteer für Zertifikatserstellung

Routenübersicht:

Public Routes

GET /api/nft → Alle NFTs

GET /api/nft/creator/:creatorId → NFTs eines bestimmten Creators + Creator-Profil

Private Routes

GET /api/nft/mine → Eigene NFTs eines Creators

POST /api/nft/upload → Nur für eingeloggte Creator mit aktivem Abo

3️⃣ Payment-Service

Zuständig für die komplette Zahlungs- und Aboverwaltung.

Technologien & Bibliotheken:

Node.js + Express

Stripe SDK (Sandbox)

MongoDB + Mongoose

dotenv

axios (zur Kommunikation mit Auth- & NFT-Service)

Webhook-Handling für Stripe-Ereignisse

cron / node-cron (für automatische Abo-Prüfungen & -Verlängerungen)

Hauptfunktionen:

Test-Checkout mit Kreditkarte (Visa 4242 4242 4242 4242, CVC 424)

Subscription-Handling (Start, Verlängerung, Ablauf)

Automatische Statusprüfung von Abos

Zertifikats-Trigger nach erfolgreichem Kauf

4️⃣ BFF-Service (Backend For Frontend)

Optionaler Gateway-Service für das Frontend – bündelt API-Aufrufe aus Auth-, NFT- und Payment-Service.

Technologien & Bibliotheken:

Node.js + Express

axios für Microservice-Kommunikation

JWT-Validierung

vereinfachte API-Endpunkte für das React-Frontend

5️⃣ Frontend

Benutzeroberfläche für Buyers und Creators.

Technologien & Tools:

React + Vite

TypeScript (optional je nach Branch)

Tailwind CSS

Axios (API-Kommunikation)

Zustand oder Context API für State Management

React Router DOM für Routing

Stripe Elements / Checkout für Zahlungen

Animierte UI mit Glassmorphism und modernem Layout

🧱 Infrastruktur
Docker Setup

Jeder Service läuft in einem separaten Container:

auth-service/
nft-service/
payment-service/
frontend/
nginx/

Docker Compose

Verknüpft alle Services inkl. MongoDB-Instanzen:

services:
  server-auth:
    build: ./auth-service
    depends_on:
      - mongo-auth
  server-nft:
    build: ./nft-service
    depends_on:
      - mongo-nft
  server-payment:
    build: ./payment-service
    depends_on:
      - mongo-payment
  frontend:
    build: ./frontend
    depends_on:
      - server-auth
      - server-nft
      - server-payment
  nginx:
    build: ./nginx
    ports:
      - "80:80"
      - "443:443"


SSL-Zertifikate werden über Certbot oder Let's Encrypt eingebunden.

🔒 Authentifizierung & Sicherheit

JWT-basierte Authentifizierung über Middleware in jedem Service

Zugriffskontrolle nach Rollen (user, creator, admin)

Tokens werden clientseitig im Secure Storage gehalten

Passwort-Hashing mit bcrypt

CSRF-vermeidende API-Aufrufe durch getrennte Subdomains

🧾 Zertifikate & Medien

Uploads:

Multer verarbeitet lokale Uploads

Cloudinary übernimmt das Hosten der Bilder

Dateigrößenlimit & Formatprüfung integriert

Zertifikate:

Nach erfolgreichem Kauf wird ein PDF erstellt (pdfkit oder Puppeteer)

Zertifikate enthalten Käufername, NFT-ID, Creator, Datum und Stripe-Transaktions-ID

💳 Stripe Sandbox Testdaten

Testkarte (Visa):

Card Number: 4242 4242 4242 4242
CVC: 424
Expiry: beliebig in der Zukunft
ZIP: 42424


Kein echtes Geld, reine Sandbox-Testumgebung.

🖥️ Lokale Entwicklung
Starten
docker-compose up --build

Zugriff

Frontend: https://localhost

Auth-Service: http://localhost:5000

NFT-Service: http://localhost:5001

Payment-Service: http://localhost:5002

MongoDB: je nach Service-Port

📚 Technologien im Überblick
Kategorie	Technologien
Frontend	React, Tailwind CSS, Axios, Vite
Backend	Node.js, Express, Mongoose
Auth & Security	JWT, bcrypt
Datenbanken	MongoDB
File Handling	Multer, Cloudinary
Zahlungen	Stripe (Sandbox, Webhooks, Subscriptions)
PDF-Generierung	pdfkit, Puppeteer
Containerisierung	Docker, Docker Compose
Reverse Proxy / SSL	Nginx, Certbot
Sonstiges	axios, dotenv, node-cron
📸 Admin-Demo

Der Adminbereich wird nicht öffentlich bereitgestellt, sondern nur als Screenshot-Vorschau gezeigt, um die Sicherheitsstruktur zu verdeutlichen.
Er dient zur Demonstration von Nutzerverwaltung, Zahlungsverläufen und Systemlogs.

🧠 Fazit

NFT-Hub ist ein lernorientiertes Showcase-Projekt mit Fokus auf:

Microservice-Kommunikation

Authentifizierung & Autorisierung

Cloud-basierte Dateiverwaltung

Stripe-Integration

Deployment mit Docker
