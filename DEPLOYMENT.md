# 🚀 Deployment Guide

## Docker Deployment

### Prerequisites

- Docker and Docker Compose installed
- Sufficient system resources (2GB+ RAM recommended)
- API keys for LLM services configured

### Quick Start

1. **Clone and configure the repository**
   ```bash
   git clone <repository-url>
   cd werewolf_arena

   # Configure environment variables
   cp backend/.env.example backend/.env
   # Edit backend/.env with your API keys
   ```

2. **Build and start services**
   ```bash
   docker-compose up --build -d
   ```

3. **Verify deployment**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

### Environment Variables

#### Backend (.env)
```env
# API Keys (required for LLM functionality)
OPENAI_API_KEY=your_openai_api_key_here
GLM_API_KEY=your_glm_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Optional: OpenRouter API key
OPENROUTER_API_KEY=your_openrouter_api_key_here

# Application Settings
ENVIRONMENT=production
DEBUG=false
PORT=8000
```

#### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000
```

### Service Management

**Start services:**
```bash
docker-compose up -d
```

**Stop services:**
```bash
docker-compose down
```

**View logs:**
```bash
# Both services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
```

**Rebuild services:**
```bash
docker-compose up --build -d
```

### Production Considerations

1. **Resource Limits**: Adjust memory and CPU limits in docker-compose.yml
2. **Environment Security**: Use secrets management for API keys in production
3. **SSL/TLS**: Configure reverse proxy (nginx/traefik) for HTTPS
4. **Monitoring**: Add health checks and monitoring
5. **Backup**: Configure volume backups for logs

### Monitoring

Health checks are configured for both services:

- Backend: `/health` endpoint
- Frontend: HTTP response check

Monitor with:
```bash
docker-compose ps
```

### Troubleshooting

**Common Issues:**

1. **Port conflicts**: Ensure ports 3000 and 8000 are available
2. **API key errors**: Verify all required API keys are set
3. **Memory issues**: Increase Docker memory limits
4. **Build failures**: Check logs for specific error messages

**Debug Mode:**
```bash
# Run with more verbose logging
docker-compose up --build

# Access container shell
docker-compose exec backend sh
docker-compose exec frontend sh
```

## Development Deployment

For development with hot reloading:

```bash
# Backend (from backend directory)
cd backend
pip install -r requirements.txt
uvicorn src.api.app:app --reload --host 0.0.0.0 --port 8000

# Frontend (from frontend directory)
cd frontend
npm install
npm run dev
```

## Scaling

To scale the backend service:

```bash
docker-compose up --scale backend=3 -d
```

Note: WebSocket connections require sticky sessions in load balancers.

## Backup Strategy

Important data to backup:
- Configuration files (.env)
- Application logs
- Game session logs (if persistent storage is configured)

Example backup command:
```bash
docker run --rm -v werewolf_arena_logs:/data -v $(pwd):/backup alpine tar czf /backup/logs-backup-$(date +%Y%m%d).tar.gz -C /data .
```