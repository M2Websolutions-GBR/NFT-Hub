# 🖼️ NFT Service – NFT Hub

This service handles the creation, listing, management, and sale-tracking of NFTs within the NFT Hub project.

---

## 🔧 Tech Stack

- Node.js + Express
- MongoDB (via Docker)
- Multer + Cloudinary (for image upload)
- JWT (Authentication via Auth Service)
- Axios (Inter-service communication)

---

## 📂 Structure Overview

```plaintext
/nft-service
├── controllers/
│   ├── nft.controller.js         # All NFT-related logic
├── models/
│   └── nft.model.js              # MongoDB NFT schema
├── routes/
│   └── nft.routes.js             # API routes for NFTs
├── middleware/
│   └── auth.middleware.js        # Extract and verify JWT token
├── utils/
│   └── cloudinary.js             # Cloudinary configuration for image uploads
├── server.js                     # Express app entry
├── Dockerfile
├── .env
```

---

## ⚙️ .env Example

```env
PORT=3002
MONGO_URI=mongodb://mongoadmin:secret@mongodb:27017/NFT-DB?authSource=admin
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

---

## 🔐 Authentication (JWT)

All protected routes require a valid JWT in the `Authorization` header.

### ✅ Example Header:

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI...
```

This token is issued by the `auth-service` when logging in.

---

## 🧪 Ideal Test Flow

### Step 1: Register & Login via Auth Service

- POST to `/api/auth/register`
- Then login via `/api/auth/login`
- Copy the returned `token`

### Step 2: Upload an NFT

Make a POST request to:

```
POST http://localhost:3002/api/nft/upload
```

**Headers**:

- `Authorization: Bearer <your-token>`
- `Content-Type: multipart/form-data`

**Form Data**:

- `title`: My First NFT
- `description`: Unique digital art
- `price`: 49.99
- `editionLimit`: 1
- `image`: [choose an image file]

> Response contains the full NFT data with `imageUrl` & `publicId`

### Step 3: List NFTs

- GET `/api/nft` → Get all NFTs
- GET `/api/nft/:id` → Single NFT with creator details

### Step 4: Mark NFT as Sold (used internally by payment service)

- PATCH `/api/nft/sold/:id` (internal use only)
- Increases `soldCount`, marks as `soldOut` if limit reached

### Step 5: Delete NFT

- DELETE `/api/nft/:id`
- Only possible if the NFT hasn't been sold yet (soldCount = 0)

---


## 📌 Notes

- This service is microservice-only and does **not** handle authentication directly.
- Uses Axios to communicate with Auth Service for creator profile enrichment.
- Cloudinary stores images; deletion on NFT remove is supported.

---

## ✅ What’s Done?

- NFT upload (protected, creator-only)
- Image upload via Cloudinary
- NFT listing (public)
- Creator profile + NFTs
- Deletion (if not sold)
- Sold count tracking via Payment Webhook
- JWT verification middleware
- Docker integration

---

## 📦 Docker Compose Snippet

```yaml
services:
  nft-service:
    build: ./backend/nft
    container_name: nft-service
    ports:
      - "3002:3002"
    env_file:
      - ./backend/nft/.env
    depends_on:
      - mongodb
```
