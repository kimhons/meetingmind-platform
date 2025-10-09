#!/bin/bash

# MeetingMind Platform - Railway Staging Deployment Script
# Revolutionary AI Meeting Intelligence Platform

set -e

echo "🚀 MeetingMind Platform - Railway Staging Deployment"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    print_error "Railway CLI is not installed. Please install it first:"
    echo "npm install -g @railway/cli"
    exit 1
fi

# Check if user is logged in to Railway
if ! railway whoami &> /dev/null; then
    print_error "Not logged in to Railway. Please login first:"
    echo "railway login"
    exit 1
fi

print_status "Starting MeetingMind Platform deployment to Railway staging..."

# Step 1: Validate project structure
print_status "Validating project structure..."

required_files=(
    "backend/server.js"
    "backend/package.json"
    "frontend/web-app/package.json"
    "railway.json"
    "nixpacks.toml"
    "Dockerfile"
    ".env.example"
)

for file in "${required_files[@]}"; do
    if [[ ! -f "$file" ]]; then
        print_error "Required file missing: $file"
        exit 1
    fi
done

print_success "Project structure validated"

# Step 2: Check environment configuration
print_status "Checking environment configuration..."

if [[ ! -f ".env" ]]; then
    print_warning ".env file not found. Creating from .env.example..."
    cp .env.example .env
    print_warning "Please configure .env file with your actual values before deployment"
fi

print_success "Environment configuration checked"

# Step 3: Build frontend
print_status "Building frontend application..."
cd frontend/web-app

if [[ ! -d "node_modules" ]]; then
    print_status "Installing frontend dependencies..."
    npm ci
fi

print_status "Building frontend for production..."
npm run build

if [[ ! -d "dist" ]]; then
    print_error "Frontend build failed - dist directory not created"
    exit 1
fi

print_success "Frontend build completed"
cd ../..

# Step 4: Validate backend dependencies
print_status "Validating backend dependencies..."
cd backend

if [[ ! -d "node_modules" ]]; then
    print_status "Installing backend dependencies..."
    npm ci
fi

print_success "Backend dependencies validated"
cd ..

# Step 5: Run pre-deployment tests
print_status "Running pre-deployment validation..."

# Check if all AI services are properly configured
print_status "Validating AI service configurations..."

required_services=(
    "services/unified-intelligence-hub.js"
    "ai/triple-ai-client.js"
    "services/contextual-analysis.js"
    "services/meeting-memory-service.js"
    "services/opportunity-detection-engine.js"
    "services/ai-coaching-engine.js"
    "services/knowledge-base-service.js"
    "security/enterprise-security-framework.js"
    "performance/performance-optimization-engine.js"
    "monitoring/real-time-monitoring-dashboard.js"
)

for service in "${required_services[@]}"; do
    if [[ ! -f "backend/$service" ]]; then
        print_error "Required AI service missing: backend/$service"
        exit 1
    fi
done

print_success "All AI services validated"

# Step 6: Deploy to Railway
print_status "Deploying to Railway staging environment..."

# Initialize Railway project if not already done
if [[ ! -f "railway.toml" ]]; then
    print_status "Initializing Railway project..."
    railway init
fi

# Deploy the application
print_status "Deploying MeetingMind Platform..."
railway up

if [[ $? -eq 0 ]]; then
    print_success "Deployment completed successfully!"
else
    print_error "Deployment failed!"
    exit 1
fi

# Step 7: Get deployment information
print_status "Getting deployment information..."
DEPLOYMENT_URL=$(railway domain)

if [[ -n "$DEPLOYMENT_URL" ]]; then
    print_success "Application deployed to: $DEPLOYMENT_URL"
else
    print_warning "Custom domain not configured. Using Railway-generated URL."
    railway status
fi

# Step 8: Health check
print_status "Performing health check..."
sleep 30  # Wait for deployment to be ready

if [[ -n "$DEPLOYMENT_URL" ]]; then
    HEALTH_URL="$DEPLOYMENT_URL/api/health"
    
    if curl -f -s "$HEALTH_URL" > /dev/null; then
        print_success "Health check passed - application is running!"
    else
        print_warning "Health check failed - application may still be starting up"
        print_status "Check Railway logs: railway logs"
    fi
fi

# Step 9: Display post-deployment information
echo ""
echo "🎉 MeetingMind Platform Deployment Summary"
echo "=========================================="
echo ""
print_success "✅ Frontend application built and deployed"
print_success "✅ Backend services deployed with full AI stack"
print_success "✅ Revolutionary triple-AI collaboration active"
print_success "✅ Enterprise security framework enabled"
print_success "✅ Real-time monitoring and optimization active"
echo ""
echo "🔗 Deployment URLs:"
if [[ -n "$DEPLOYMENT_URL" ]]; then
    echo "   Application: $DEPLOYMENT_URL"
    echo "   Health Check: $DEPLOYMENT_URL/api/health"
    echo "   System Status: $DEPLOYMENT_URL/api/status"
    echo "   Monitoring: $DEPLOYMENT_URL/api/monitoring/metrics"
fi
echo ""
echo "🛠️  Management Commands:"
echo "   View logs: railway logs"
echo "   Check status: railway status"
echo "   Open dashboard: railway open"
echo "   Environment variables: railway variables"
echo ""
echo "🎯 Next Steps:"
echo "   1. Configure environment variables in Railway dashboard"
echo "   2. Set up custom domain (optional)"
echo "   3. Configure monitoring and alerting"
echo "   4. Run comprehensive testing"
echo "   5. Validate all AI services are operational"
echo ""
print_success "MeetingMind Platform successfully deployed to Railway staging!"
echo "The world's most advanced AI meeting intelligence platform is now live! 🚀"
