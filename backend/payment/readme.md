# 💳 Payment Service (Stripe) – NFT Hub

This is the standalone microservice handling payments in the NFT Hub project.
It processes Stripe payments, handles subscriptions, stores orders, and notifies the NFT/auth services after successful purchases.

---

## 🔧 Tech Stack

- Node.js + Express
- MongoDB (via Docker)
- Stripe (Checkout + Subscriptions + Webhooks)
- Axios (Inter-service communication)
- Ngrok (local webhook forwarding)
- Docker & Compose

---

## 📂 Structure Overview

```plaintext
/payment-service
├── controllers/
│   ├── payment.controller.js        # Create Stripe checkout or subscription sessions
│   ├── webhook.controller.js        # Handle Stripe webhooks (orders & subscriptions)
├── models/
│   └── order.model.js               # MongoDB order model
├── routes/
│   ├── payment.routes.js            # Routes: /create-checkout-session, /create-subscription-session
│   ├── webhook.routes.js            # Route: /webhook/stripe
├── config/
│   └── db.js                        # MongoDB connection helper
├── server.js                        # Express server entry
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

Start everything:

```bash
docker-compose up --build
```

---

## 🧪 Test a Payment Locally

### 1. NFT Purchase (One-time)

POST to `http://localhost:3003/api/payment/create-checkout-session`

```json
{
  "title": "My NFT",
  "price": 49.99,
  "nftId": "1234567890",
  "buyerId": "0987654321"
}
```

Returns a Stripe Checkout URL → Complete payment in browser.

---

### 2. Creator Subscription

POST to `http://localhost:3003/api/payment/create-subscription-session`

```json
{
  "userId": "abc123456789"
}
```

Returns a Stripe URL → Choose payment method and subscribe.

---

## 🌐 Webhooks with Ngrok + Stripe

### 1. Install & Authenticate Ngrok

```bash
ngrok config add-authtoken <your-token>
```

### 2. Start Ngrok Tunnel

```bash
ngrok http 3003
```

Note your HTTPS tunnel (e.g. `https://abc123.ngrok.io`)

---

### 3. Add Webhook in Stripe

Go to [Stripe Dashboard → Developers → Webhooks](https://dashboard.stripe.com/test/webhooks)

Set endpoint:

```bash
https://abc123.ngrok.io/api/payment/webhook/stripe
```

**Listen to these events:**

- `checkout.session.completed`

---

## 🔁 Webhook Flow

### For NFT Purchases:

1. Stripe → `/api/payment/webhook/stripe`
2. Marks order as `paid`
3. Sends PATCH to `nft-service/api/nft/sold/:nftId`
4. NFT `soldCount` increases and may be marked as `soldOut`

---

### For Subscriptions:

1. Stripe triggers webhook
2. User's `isSubscribed` is set to `true`
3. `subscriptionExpires` set to 30 days from now
4. PATCH to `auth-service/api/auth/renew-subscription/:userId`

---

## ✅ What’s Done?

- [x] Stripe Checkout for NFT purchases
- [x] Creator Subscription with Stripe Subscriptions
- [x] Webhook logic for payment + subscription
- [x] Order saving in MongoDB
- [x] Update NFT sold count via NFT service
- [x] Update user subscription state via Auth service
- [x] Dockerized payment service
- [x] Stripe Webhooks via Ngrok

---

## 🔄 Services Involved

| Service       | Role                              | Docker Name       |
|---------------|-----------------------------------|-------------------|
| Payment       | Handles Stripe payments           | `payment-service` |
| NFT Service   | Marks sold NFTs, manages content  | `nft-service`     |
| Auth Service  | Tracks users & subscriptions      | `server-auth`     |

---

## ℹ️ Notes

- Local payment service port: `3003`
- Ngrok must be running for local webhook tests
- Stripe products must be pre-configured in your dashboard for subscriptions

---

Happy Building 🛠️