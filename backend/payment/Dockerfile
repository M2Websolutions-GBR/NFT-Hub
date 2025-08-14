FROM node:alpine

# Puppeteer dependencies
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    nodejs \
    yarn \
    udev \
    bash \
    curl

ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
ENV PUPPETEER_SKIP_DOWNLOAD=true

# Create app dir
WORKDIR /app

# Copy package files and install
COPY package*.json ./
RUN npm install

# Copy source
COPY . .

# Expose app port
EXPOSE 3003

CMD ["npm", "run", "dev"]
