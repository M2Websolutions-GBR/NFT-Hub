# 💳 Payment Service (Stripe) – NFT Hub

This is the standalone microservice handling payments in the NFT Hub project.
It processes Stripe payments, stores orders, and notifies the NFT service after successful purchases.

---

## 🔧 Tech Stack

- Node.js + Express
- MongoDB (via Docker)
- Stripe (Checkout + Webhooks)
- Axios (Inter-service communication)
- Ngrok (local webhook forwarding)

---

## 📂 Structure Overview

```plaintext
/payment-service
├── controllers/
│   ├── payment.controller.js      # Create Stripe checkout sessions
│   ├── webhook.controller.js      # Handle Stripe webhooks
├── models/
│   └── order.model.js             # MongoDB order model
├── routes/
│   ├── payment.routes.js          # POST /create-checkout-session
│   ├── webhook.routes.js          # POST /webhook/stripe
├── server.js                      # Express server entry
├── Dockerfile
├── .env
```

---

## ⚙️ .env Example

```env
PORT=3003
MONGO_URI=mongodb://mongoadmin:secret@mongodb:27017/Payment-DB?authSource=admin
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

---

## 🚀 Run via Docker

Ensure this service is defined in your `docker-compose.yml`:

```yaml
services:
  payment-service:
    build: ./backend/payment
    container_name: payment-service
    ports:
      - "3003:3003"
    env_file:
      - ./backend/payment/.env
    depends_on:
      - mongodb
```

Start everything with:

```bash
docker-compose up --build
```

---

## 🧪 Test a Payment Locally

1. Create an NFT → Save `nftId`, `price`, `creatorId`
2. Create an order via POST request:

Example (`http://localhost:3003/api/payment/create-checkout-session`):

```json
{
  "title": "My NFT",
  "price": 49.99,
  "nftId": "1234567890",
  "buyerId": "0987654321"
}
```

You will receive a Stripe Checkout URL. Open it and complete the payment.

---

## 🌐 Webhooks with Ngrok + Stripe Dashboard

### 1. Install & Authenticate Ngrok (only once)

```bash
ngrok config add-authtoken <your-ngrok-token>
```

### 2. Start Ngrok Tunnel

```bash
ngrok http 3003
```

Note the HTTPS URL like `https://abc123.ngrok.io`

### 3. Set up Webhook in Stripe Dashboard

- Go to [Stripe Dashboard → Developers → Webhooks](https://dashboard.stripe.com/test/webhooks)
- Add a new webhook endpoint:  
  `https://abc123.ngrok.io/api/webhook/stripe`
- Events to listen to:  
  `checkout.session.completed`

Now Stripe will forward test events to your local server.

---

## 🔁 How it Works (Backend Flow)

1. Stripe sends `checkout.session.completed`
2. Webhook marks the order as `paid`
3. NFT service is notified via `PATCH /api/nft/sold/:id`
4. `soldCount` increases in the NFT model

---

## ✅ What’s Done?

- Stripe Checkout Integration
- Order Model & Save Logic
- Webhook Listening with Stripe CLI
- Axios PATCH to NFT Service after purchase
- Docker & Compose Integration

---

## 📌 What’s Next?

- Add Creator Subscription System (Stripe Subscriptions)
- Frontend checkout integration
- NFT listing only for active subscribers

---

## ℹ️ Notes

- NFT service Docker name: `nft-service`
- Local payment service port: `3003`