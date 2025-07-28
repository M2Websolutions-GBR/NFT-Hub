# NFT-Hub

<!-- Goal: MVP -->

A digital art marketplace built for project purposes, intentionally designed without blockchain dependency.

# Buyers: Can purchase artworks

# Creators: Can only upload and list artworks with an active subscription

# Platform: Manages purchases, certificates, and subscription payments via Stripe

<!-- Tech Stack -->

Frontend: React + Tailwind CSS

Backend: Node.js + Express

Database: MongoDB

Authentication: JWT

Payments: Stripe (One-time payments & Subscriptions)

File Handling: Multer / Cloudinary (for images)

PDF Certificates: pdfkit or Puppeteer



___________________________________________________________________________________________________________


 <!-- Was ihr bereits erfolgreich gebaut habt: -->

# Architektur & Setup
Microservice-Struktur mit getrenntem auth-service und nft-service

Beide Services laufen mit Docker, MongoDB, Docker Compose

JWT-basierte Authentifizierung

Rollenmodell: user, creator, admin

# Auth-Service
Registrierung & Login mit Password-Hashing

JWT-Token-Erstellung

Middleware: Token-Verifizierung + Rollenprüfung

Neue Route: GET /user/:id → für Profile (wird vom NFT-Service genutzt)

# NFT-Service
Upload-Route mit Auth-Middleware (nur creator)

Öffentliche Route GET /api/nft (alle NFTs)

Private Route GET /api/nft/mine (eigene NFTs für eingeloggte Creator)

Öffentliche Route GET /api/nft/creator/:creatorId
→ Liefert NFTs + Creator-Profil per axios aus dem auth-service