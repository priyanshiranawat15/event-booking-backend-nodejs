#!/bin/bash

# Deployment Script for Combined Frontend + Backend on App Engine
# This script builds the frontend and deploys it with the backend

set -e  # Exit on any error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR"
FRONTEND_DIR="$(dirname "$SCRIPT_DIR")/assignment-3-web"

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_section() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE} $1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

# Check if directories exist
check_directories() {
    print_section "Checking Directories"
    
    if [ ! -d "$BACKEND_DIR" ]; then
        print_error "Backend directory not found: $BACKEND_DIR"
        exit 1
    fi
    print_success "Backend directory found"
    
    if [ ! -d "$FRONTEND_DIR" ]; then
        print_error "Frontend directory not found: $FRONTEND_DIR"
        exit 1
    fi
    print_success "Frontend directory found"
}

# Build frontend
build_frontend() {
    print_section "Building Frontend"
    
    cd "$FRONTEND_DIR"
    print_info "Current directory: $(pwd)"
    
    # Check if node_modules exists, if not install dependencies
    if [ ! -d "node_modules" ]; then
        print_info "Installing frontend dependencies..."
        npm install
    fi
    
    # Build the frontend
    print_info "Building frontend with Vite..."
    npm run build
    
    if [ ! -d "dist" ]; then
        print_error "Frontend build failed - dist directory not created"
        exit 1
    fi
    
    print_success "Frontend built successfully"
    print_info "Build size: $(du -sh dist | cut -f1)"
}

# Copy frontend build to backend public directory
copy_frontend_to_backend() {
    print_section "Copying Frontend to Backend"
    
    # Create public directory if it doesn't exist
    mkdir -p "$BACKEND_DIR/public"
    
    # Remove old files
    print_info "Cleaning old frontend files..."
    rm -rf "$BACKEND_DIR/public"/*
    
    # Copy new build
    print_info "Copying new frontend build..."
    cp -r "$FRONTEND_DIR/dist"/* "$BACKEND_DIR/public/"
    
    print_success "Frontend copied to backend/public"
    print_info "Files copied: $(ls -1 $BACKEND_DIR/public | wc -l | tr -d ' ')"
}

# Update .gcloudignore to not exclude public directory
update_gcloudignore() {
    print_section "Updating .gcloudignore"
    
    cd "$BACKEND_DIR"
    
    # Ensure public directory is NOT ignored
    if grep -q "^public/" .gcloudignore 2>/dev/null; then
        print_info "Removing 'public/' from .gcloudignore..."
        sed -i.bak '/^public\//d' .gcloudignore
        rm -f .gcloudignore.bak
    fi
    
    print_success ".gcloudignore updated"
}

# Deploy to App Engine
deploy_to_app_engine() {
    print_section "Deploying to Google App Engine"
    
    cd "$BACKEND_DIR"
    print_info "Current directory: $(pwd)"
    
    # Check if gcloud is installed
    if ! command -v gcloud &> /dev/null; then
        print_error "gcloud CLI not found. Please install Google Cloud SDK"
        exit 1
    fi
    
    # Deploy
    print_info "Starting deployment..."
    gcloud app deploy --quiet
    
    print_success "Deployment completed!"
}

# Show deployment info
show_deployment_info() {
    print_section "Deployment Summary"
    
    APP_URL=$(gcloud app describe --format="value(defaultHostname)" 2>/dev/null || echo "unknown")
    
    echo "🎉 Deployment completed successfully!"
    echo ""
    echo "📱 Your application is available at:"
    echo "   https://$APP_URL"
    echo ""
    echo "🔗 Useful URLs:"
    echo "   Frontend:      https://$APP_URL"
    echo "   Health Check:  https://$APP_URL/health"
    echo "   API Info:      https://$APP_URL/api/info"
    echo "   API Docs:      https://$APP_URL/api-docs"
    echo ""
    echo "📊 View logs:"
    echo "   gcloud app logs tail -s default"
    echo ""
    echo "🌐 Open in browser:"
    echo "   gcloud app browse"
}

# Main execution
main() {
    print_section "Combined Frontend + Backend Deployment"
    print_info "Backend: $BACKEND_DIR"
    print_info "Frontend: $FRONTEND_DIR"
    
    # Run all steps
    check_directories
    build_frontend
    copy_frontend_to_backend
    update_gcloudignore
    deploy_to_app_engine
    show_deployment_info
}

# Run main function
main "$@"
