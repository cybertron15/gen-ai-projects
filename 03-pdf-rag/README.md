# PDF Chat

A lightweight, developer-friendly PDF-based chatbot system powered by OpenAI, LangChain, Vercel Blob, Qdrant, and BullMQ.

> **Made by [cybertron15](https://github.com/cybertron15)**

## Features

* Upload one or more PDF files
* Select a file and chat over its contents
* Uses RAG (Retrieval Augmented Generation) with LangChain
* File storage via Vercel Blob
* Vector store powered by Qdrant
* Queue management using BullMQ with Valkey
* Supports Docker-based local setup

## Folder Structure

This project lives inside the folder: `03-pdf-rag` of the [gen-ai-projects](https://github.com/cybertron15/gen-ai-projects) repository.

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/cybertron15/gen-ai-projects.git
cd gen-ai-projects/03-pdf-rag
```

### 2. Docker Setup

This project uses Docker for running Valkey and Qdrant services locally. Below is the Docker Compose configuration:

```yaml
docker-compose.yml

services:
  valkey:
    image: valkey/valkey
    container_name: valkey
    ports:
      - "6379:6379"

  qdrantDB:
    image: qdrant/qdrant
    container_name: qdrant
    ports:
      - "6333:6333"
```

#### Run Docker

```bash
docker compose up -d
```

Ensure Docker Desktop (or engine) is running before executing the command.

### 3. Install Dependencies

```bash
pnpm install
```

### 4. Set Environment Variables

Create a `.env` file in the root directory with the following:

```env
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_...
OPENAI_API_KEY=sk-proj-...
QDRANT_URL=http://localhost:6333
```

### 5. Setup Vercel Blob Store (From Dashboard)

1. Go to [Vercel Blob Dashboard](https://vercel.com/storage/blob)
2. If you don’t already have a Blob store, click **“Create”** to generate one
3. Once the store is created, click on it to open the details
4. Navigate to **Settings → Tokens**
5. Click **“Generate Token”**
6. Choose **Read & Write** access
7. Copy the token and add it to your `.env` file:

```env
BLOB_READ_WRITE_TOKEN=your_generated_token
```

### 6. Start Services

#### Start the file upload worker:

```bash
pnpm run dev:worker
```

#### Start the app:

```bash
pnpm run dev
```

## Deployment on Vercel

1. Push your code to GitHub
2. Go to [Vercel](https://vercel.com/)
3. Import the repository
4. Set up environment variables:
   * `BLOB_READ_WRITE_TOKEN`
   * `OPENAI_API_KEY`
   * `QDRANT_URL` (use a remote instance for production)

## Disclaimer

Currently, chat sessions are stored **in-memory** using a simple JavaScript `Map`. This approach is not suitable for production use. Please replace it with a persistent database like PostgreSQL, Supabase, or Redis for storing chat history securely and reliably.

---

For questions, suggestions, or contributions — feel free to open an issue or PR on [cybertron15/gen-ai-projects](https://github.com/cybertron15/gen-ai-projects).
