# Build Stage (Frontend)
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build

# Runtime Stage (Backend)
FROM python:3.10-slim

WORKDIR /app

# Install system dependencies for OpenCV and others
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy built frontend assets
COPY --from=builder /app/dist ./dist

# Copy backend code
COPY main.py .

# Environment variables
ENV PORT=8080
# Force standard output to be unbuffered (logs show up immediately)
ENV PYTHONUNBUFFERED=1

EXPOSE 8080

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]
