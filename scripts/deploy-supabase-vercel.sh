#!/bin/bash

# MeetingMind Platform Deployment Script (Supabase + Vercel)
set -e

echo "🚀 Starting MeetingMind Platform Deployment (Supabase + Vercel)"

# Configuration
ENVIRONMENT=${1:-development}
PROJECT_NAME="meetingmind-platform"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check if Node.js is installed
    if ! command -v node &> /dev/null; then
        log_error "Node.js is not installed"
        exit 1
    fi
    
    # Check if npm is installed
    if ! command -v npm &> /dev/null; then
        log_error "npm is not installed"
        exit 1
    fi
    
    # Check if Supabase CLI is installed
    if ! command -v supabase &> /dev/null; then
        log_warning "Supabase CLI not found, installing..."
        npm install -g supabase
    fi
    
    # Check if Vercel CLI is installed
    if ! command -v vercel &> /dev/null; then
        log_warning "Vercel CLI not found, installing..."
        npm install -g vercel
    fi
    
    log_success "Prerequisites check passed"
}

# Setup Supabase project
setup_supabase() {
    log_info "Setting up Supabase project..."
    
    # Initialize Supabase project if not already done
    if [ ! -f "supabase/config.toml" ]; then
        log_info "Initializing Supabase project..."
        supabase init
        
        # Copy our configuration
        cp deployment/supabase/config.toml supabase/config.toml
    fi
    
    # Start local Supabase (for development)
    if [ "$ENVIRONMENT" = "development" ]; then
        log_info "Starting local Supabase..."
        supabase start
        
        # Run migrations
        log_info "Running database migrations..."
        supabase db reset
        
        # Apply our custom migrations
        cp database/migrations/*.sql supabase/migrations/
        supabase db push
    else
        # Link to production project
        log_info "Linking to production Supabase project..."
        supabase link --project-ref $SUPABASE_PROJECT_REF
        
        # Push migrations to production
        log_info "Pushing migrations to production..."
        supabase db push
        
        # Deploy edge functions
        log_info "Deploying edge functions..."
        supabase functions deploy
    fi
    
    log_success "Supabase setup completed"
}

# Setup Vercel project
setup_vercel() {
    log_info "Setting up Vercel project..."
    
    # Navigate to frontend directory
    cd frontend/web-app
    
    # Install dependencies
    log_info "Installing frontend dependencies..."
    npm install
    
    # Build the application
    log_info "Building frontend application..."
    npm run build
    
    # Deploy to Vercel
    if [ "$ENVIRONMENT" = "development" ]; then
        log_info "Deploying to Vercel (preview)..."
        vercel --yes
    else
        log_info "Deploying to Vercel (production)..."
        vercel --prod --yes
    fi
    
    # Go back to root directory
    cd ../..
    
    log_success "Vercel deployment completed"
}

# Setup environment variables
setup_environment() {
    log_info "Setting up environment variables..."
    
    # Create .env.local file for Next.js
    cat > frontend/web-app/.env.local << EOF
NEXT_PUBLIC_SUPABASE_URL=$SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY
OPENAI_API_KEY=$OPENAI_API_KEY
ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY
GOOGLE_API_KEY=$GOOGLE_API_KEY
GOOGLE_VISION_API_KEY=$GOOGLE_VISION_API_KEY
STRIPE_SECRET_KEY=$STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET=$STRIPE_WEBHOOK_SECRET
EOF
    
    # Set Vercel environment variables
    if [ "$ENVIRONMENT" = "production" ]; then
        log_info "Setting Vercel environment variables..."
        vercel env add NEXT_PUBLIC_SUPABASE_URL production
        vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
        vercel env add SUPABASE_SERVICE_ROLE_KEY production
        vercel env add OPENAI_API_KEY production
        vercel env add ANTHROPIC_API_KEY production
        vercel env add GOOGLE_API_KEY production
        vercel env add GOOGLE_VISION_API_KEY production
        vercel env add STRIPE_SECRET_KEY production
        vercel env add STRIPE_WEBHOOK_SECRET production
    fi
    
    log_success "Environment variables configured"
}

# Deploy desktop application
deploy_desktop() {
    log_info "Building desktop application..."
    
    cd desktop-app
    
    # Install dependencies
    npm install
    
    # Build for all platforms
    if [ "$ENVIRONMENT" = "production" ]; then
        log_info "Building desktop app for all platforms..."
        npm run build:all
    else
        log_info "Building desktop app for current platform..."
        npm run build
    fi
    
    cd ..
    
    log_success "Desktop application built"
}

# Setup monitoring and analytics
setup_monitoring() {
    log_info "Setting up monitoring and analytics..."
    
    # Vercel Analytics is automatically enabled
    # Supabase Analytics can be enabled in the dashboard
    
    log_success "Monitoring setup completed"
}

# Verify deployment
verify_deployment() {
    log_info "Verifying deployment..."
    
    # Check Supabase connection
    if [ "$ENVIRONMENT" = "development" ]; then
        SUPABASE_URL="http://localhost:54321"
    fi
    
    # Test database connection
    log_info "Testing database connection..."
    curl -s "$SUPABASE_URL/rest/v1/users?select=count" \
         -H "apikey: $SUPABASE_ANON_KEY" \
         -H "Authorization: Bearer $SUPABASE_ANON_KEY" > /dev/null
    
    if [ $? -eq 0 ]; then
        log_success "Database connection verified"
    else
        log_error "Database connection failed"
        exit 1
    fi
    
    # Check Vercel deployment
    if [ "$ENVIRONMENT" = "production" ]; then
        log_info "Checking Vercel deployment..."
        VERCEL_URL=$(vercel ls | grep $PROJECT_NAME | awk '{print $2}' | head -1)
        curl -s "https://$VERCEL_URL" > /dev/null
        
        if [ $? -eq 0 ]; then
            log_success "Vercel deployment verified"
        else
            log_error "Vercel deployment check failed"
        fi
    fi
    
    log_success "Deployment verification completed"
}

# Main deployment flow
main() {
    log_info "Starting deployment for environment: ${ENVIRONMENT}"
    
    check_prerequisites
    setup_environment
    setup_supabase
    setup_vercel
    deploy_desktop
    setup_monitoring
    verify_deployment
    
    log_success "🎉 MeetingMind Platform deployed successfully!"
    
    if [ "$ENVIRONMENT" = "development" ]; then
        log_info "Local development URLs:"
        log_info "Frontend: http://localhost:3000"
        log_info "Supabase Studio: http://localhost:54323"
        log_info "Supabase API: http://localhost:54321"
    else
        log_info "Production URLs:"
        log_info "Frontend: https://meetingmind.com"
        log_info "API: https://api.meetingmind.com"
        log_info "Supabase Dashboard: https://app.supabase.com"
    fi
    
    log_info "Next steps:"
    log_info "1. Configure OAuth providers in Supabase Auth settings"
    log_info "2. Set up Stripe webhooks for subscription management"
    log_info "3. Configure custom domain in Vercel dashboard"
    log_info "4. Set up monitoring alerts and notifications"
}

# Run main function
main "$@"
