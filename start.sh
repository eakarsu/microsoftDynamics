#!/bin/bash

# ============================================
# Microsoft Dynamics 365 - Start Script
# ============================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_PORT=4001
FRONTEND_PORT=3000

echo -e "${BLUE}"
echo "╔══════════════════════════════════════════════╗"
echo "║                                              ║"
echo "║      Microsoft Dynamics 365 Clone            ║"
echo "║      Enterprise Business Applications        ║"
echo "║                                              ║"
echo "╚══════════════════════════════════════════════╝"
echo -e "${NC}"

# ============ CLEAN USED PORTS ============
echo -e "${YELLOW}[1/6] Cleaning used ports...${NC}"
cleanup_port() {
  local port=$1
  local pids=$(lsof -ti :$port 2>/dev/null || true)
  if [ -n "$pids" ]; then
    echo -e "  ${RED}Killing processes on port $port: $pids${NC}"
    echo "$pids" | xargs kill -9 2>/dev/null || true
    sleep 1
  else
    echo -e "  ${GREEN}Port $port is free${NC}"
  fi
}

cleanup_port $BACKEND_PORT
cleanup_port $FRONTEND_PORT

# ============ CHECK PREREQUISITES ============
echo -e "\n${YELLOW}[2/6] Checking prerequisites...${NC}"

if ! command -v node &> /dev/null; then
  echo -e "  ${RED}Node.js is not installed. Please install Node.js first.${NC}"
  exit 1
fi
echo -e "  ${GREEN}✓ Node.js $(node -v)${NC}"

if ! command -v psql &> /dev/null; then
  echo -e "  ${RED}PostgreSQL is not installed. Please install PostgreSQL first.${NC}"
  exit 1
fi
echo -e "  ${GREEN}✓ PostgreSQL found${NC}"

# Check if PostgreSQL is running
if ! pg_isready -q 2>/dev/null; then
  echo -e "  ${YELLOW}Starting PostgreSQL...${NC}"
  if [[ "$OSTYPE" == "darwin"* ]]; then
    brew services start postgresql@14 2>/dev/null || brew services start postgresql 2>/dev/null || true
  else
    sudo service postgresql start 2>/dev/null || true
  fi
  sleep 2
fi
echo -e "  ${GREEN}✓ PostgreSQL is running${NC}"

# ============ CREATE DATABASE ============
echo -e "\n${YELLOW}[3/6] Setting up database...${NC}"

# Create database if not exists
psql -U postgres -tc "SELECT 1 FROM pg_database WHERE datname = 'dynamics365'" 2>/dev/null | grep -q 1 || \
  psql -U postgres -c "CREATE DATABASE dynamics365" 2>/dev/null || \
  createdb dynamics365 2>/dev/null || \
  echo -e "  ${CYAN}Database may already exist, continuing...${NC}"

echo -e "  ${GREEN}✓ Database 'dynamics365' ready${NC}"

# ============ INSTALL DEPENDENCIES ============
echo -e "\n${YELLOW}[4/6] Installing dependencies...${NC}"

echo -e "  ${CYAN}Installing backend dependencies...${NC}"
cd "$PROJECT_DIR/backend"
npm install --silent 2>&1 | tail -1

echo -e "  ${CYAN}Installing frontend dependencies...${NC}"
cd "$PROJECT_DIR/frontend"
npm install --silent 2>&1 | tail -1

echo -e "  ${GREEN}✓ All dependencies installed${NC}"

# ============ SEED DATABASE ============
echo -e "\n${YELLOW}[5/6] Seeding database...${NC}"
cd "$PROJECT_DIR/backend"
node seed.js
echo -e "  ${GREEN}✓ Database seeded successfully${NC}"

# ============ START SERVERS ============
echo -e "\n${YELLOW}[6/6] Starting servers with hot reload...${NC}"

# Start backend with nodemon (hot reload)
cd "$PROJECT_DIR/backend"
npx nodemon server.js &
BACKEND_PID=$!
echo -e "  ${GREEN}✓ Backend server starting on port $BACKEND_PORT (PID: $BACKEND_PID)${NC}"

# Start frontend with Vite (hot reload built-in)
cd "$PROJECT_DIR/frontend"
npx vite --port $FRONTEND_PORT &
FRONTEND_PID=$!
echo -e "  ${GREEN}✓ Frontend server starting on port $FRONTEND_PORT (PID: $FRONTEND_PID)${NC}"

# Wait for servers
sleep 3

echo -e "\n${GREEN}"
echo "╔══════════════════════════════════════════════╗"
echo "║                                              ║"
echo "║   🚀 Dynamics 365 is running!                ║"
echo "║                                              ║"
echo "║   Frontend:  http://localhost:$FRONTEND_PORT       ║"
echo "║   Backend:   http://localhost:$BACKEND_PORT       ║"
echo "║                                              ║"
echo "║   Login: admin@dynamics365.com / password123  ║"
echo "║                                              ║"
echo "║   Hot reload enabled for both servers         ║"
echo "║   Press Ctrl+C to stop all servers            ║"
echo "║                                              ║"
echo "╚══════════════════════════════════════════════╝"
echo -e "${NC}"

# Cleanup on exit
cleanup() {
  echo -e "\n${YELLOW}Shutting down servers...${NC}"
  kill $BACKEND_PID 2>/dev/null || true
  kill $FRONTEND_PID 2>/dev/null || true
  cleanup_port $BACKEND_PORT
  cleanup_port $FRONTEND_PORT
  echo -e "${GREEN}All servers stopped.${NC}"
  exit 0
}

trap cleanup SIGINT SIGTERM

# Wait for any background process to exit
wait
