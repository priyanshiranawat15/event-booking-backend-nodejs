#!/bin/bash

# Google Cloud Deployment Script for Event Manager Backend
# This script handles deployment to both Google App Engine and Cloud Run

set -e  # Exit on any error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ID=""
REGION="us-central1"
SERVICE_NAME="eventmanager-backend"
IMAGE_NAME="gcr.io/${PROJECT_ID}/${SERVICE_NAME}"

# Functions
print_section() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE} $1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if gcloud is installed
check_gcloud() {
    if ! command -v gcloud &> /dev/null; then
        print_error "Google Cloud SDK is not installed. Please install it first."
        exit 1
    fi
    print_success "Google Cloud SDK is installed"
}

# Check if user is authenticated
check_auth() {
    if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
        print_warning "Not authenticated with Google Cloud"
        echo "Please run: gcloud auth login"
        exit 1
    fi
    print_success "Authenticated with Google Cloud"
}

# Set project ID if not provided
set_project() {
    if [ -z "$PROJECT_ID" ]; then
        print_warning "PROJECT_ID not set in script"
        echo "Please enter your Google Cloud Project ID:"
        read -r PROJECT_ID

        if [ -z "$PROJECT_ID" ]; then
            print_error "PROJECT_ID is required"
            exit 1
        fi
    fi

    gcloud config set project "$PROJECT_ID"
    print_success "Project set to: $PROJECT_ID"
}

# Enable required APIs
enable_apis() {
    print_section "Enabling Required APIs"

    apis=(
        "cloudbuild.googleapis.com"
        "run.googleapis.com"
        "appengine.googleapis.com"
        "compute.googleapis.com"
    )

    for api in "${apis[@]}"; do
        print_info "Enabling $api..."
        gcloud services enable "$api" --quiet
    done

    print_success "All required APIs enabled"
}

# Validate environment variables
validate_env() {
    print_section "Validating Environment Variables"

    if [ ! -f ".env" ]; then
        print_warning ".env file not found"
        echo "Creating .env template..."
        cp .env.example .env
        print_error "Please fill in the .env file with your actual values and run this script again"
        exit 1
    fi

    # Check required environment variables
    required_vars=(
        "MONGODB_URI"
        "TICKETMASTER_API_KEY"
        "SPOTIFY_CLIENT_ID"
        "SPOTIFY_CLIENT_SECRET"
    )

    missing_vars=()
    while IFS= read -r line; do
        if [[ $line =~ ^([^=]+)=(.*)$ ]]; then
            var_name="${BASH_REMATCH[1]}"
            var_value="${BASH_REMATCH[2]}"

            if [[ " ${required_vars[*]} " =~ " ${var_name} " ]] && [[ -z "$var_value" || "$var_value" == *"your_"* ]]; then
                missing_vars+=("$var_name")
            fi
        fi
    done < .env

    if [ ${#missing_vars[@]} -ne 0 ]; then
        print_error "Missing or invalid environment variables:"
        printf '%s\n' "${missing_vars[@]}"
        echo "Please update your .env file with actual values"
        exit 1
    fi

    print_success "Environment variables validated"
}

# Install dependencies
install_deps() {
    print_section "Installing Dependencies"

    if [ ! -f "package.json" ]; then
        print_error "package.json not found"
        exit 1
    fi

    npm install
    print_success "Dependencies installed"
}

# Run tests (if available)
run_tests() {
    print_section "Running Tests"

    if npm run test --if-present 2>/dev/null; then
        print_success "Tests passed"
    else
        print_warning "No tests found or tests failed"
    fi
}

# Build for production
build_app() {
    print_section "Building Application"

    # Clean previous builds
    rm -rf dist/ build/ || true

    # Set production environment
    export NODE_ENV=production

    print_success "Application ready for deployment"
}

# Deploy to App Engine
deploy_app_engine() {
    print_section "Deploying to Google App Engine"

    # Update app.yaml with project ID
    sed -i.bak "s/YOUR_PROJECT_ID/$PROJECT_ID/g" app.yaml

    # Deploy
    gcloud app deploy app.yaml --quiet --promote

    # Get the deployed URL
    APP_URL=$(gcloud app describe --format="value(defaultHostname)")

    print_success "Deployed to App Engine"
    print_info "URL: https://$APP_URL"

    # Test the deployment
    if curl -f "https://$APP_URL/health" > /dev/null 2>&1; then
        print_success "Health check passed"
    else
        print_warning "Health check failed - check logs"
    fi
}

# Deploy to Cloud Run
deploy_cloud_run() {
    print_section "Deploying to Google Cloud Run"

    # Build container image
    print_info "Building container image..."
    gcloud builds submit --tag "$IMAGE_NAME" .

    # Deploy to Cloud Run
    print_info "Deploying to Cloud Run..."
    gcloud run deploy "$SERVICE_NAME" \
        --image "$IMAGE_NAME" \
        --platform managed \
        --region "$REGION" \
        --allow-unauthenticated \
        --port 8080 \
        --memory 1Gi \
        --cpu 1 \
        --max-instances 10 \
        --timeout 300s \
        --set-env-vars NODE_ENV=production \
        --quiet

    # Get the deployed URL
    SERVICE_URL=$(gcloud run services describe "$SERVICE_NAME" --region="$REGION" --format="value(status.url)")

    print_success "Deployed to Cloud Run"
    print_info "URL: $SERVICE_URL"

    # Test the deployment
    if curl -f "$SERVICE_URL/health" > /dev/null 2>&1; then
        print_success "Health check passed"
    else
        print_warning "Health check failed - check logs"
    fi
}

# Create environment file for Cloud Run
create_env_file() {
    print_section "Creating Environment Configuration"

    # Read .env file and create environment variables for Cloud Run
    ENV_VARS=""
    while IFS= read -r line; do
        if [[ $line =~ ^([^=]+)=(.*)$ ]] && [[ ! $line =~ ^# ]]; then
            var_name="${BASH_REMATCH[1]}"
            var_value="${BASH_REMATCH[2]}"

            # Skip PORT as it's set by Cloud Run
            if [ "$var_name" != "PORT" ]; then
                ENV_VARS+="$var_name=$var_value,"
            fi
        fi
    done < .env

    # Remove trailing comma
    ENV_VARS=${ENV_VARS%,}

    # Update Cloud Run service with environment variables
    if [ ! -z "$ENV_VARS" ]; then
        gcloud run services update "$SERVICE_NAME" \
            --region "$REGION" \
            --update-env-vars "$ENV_VARS" \
            --quiet
        print_success "Environment variables updated"
    fi
}

# Show deployment summary
show_summary() {
    print_section "Deployment Summary"

    echo "Project ID: $PROJECT_ID"
    echo "Region: $REGION"
    echo "Service Name: $SERVICE_NAME"

    if [ "$DEPLOYMENT_TYPE" = "appengine" ]; then
        APP_URL=$(gcloud app describe --format="value(defaultHostname)" 2>/dev/null || echo "Not deployed")
        echo "App Engine URL: https://$APP_URL"
    elif [ "$DEPLOYMENT_TYPE" = "cloudrun" ]; then
        SERVICE_URL=$(gcloud run services describe "$SERVICE_NAME" --region="$REGION" --format="value(status.url)" 2>/dev/null || echo "Not deployed")
        echo "Cloud Run URL: $SERVICE_URL"
    fi

    print_success "Deployment completed successfully!"

    echo -e "\n${YELLOW}Sample URLs for testing:${NC}"
    echo "Health Check: $SERVICE_URL/health"
    echo "API Info: $SERVICE_URL/api/info"
    echo "Sample URLs: $SERVICE_URL/api/sample-urls"
}

# Main deployment function
main() {
    print_section "Event Manager Backend Deployment"

    # Parse command line arguments
    DEPLOYMENT_TYPE="cloudrun"  # default

    while [[ $# -gt 0 ]]; do
        case $1 in
            --app-engine)
                DEPLOYMENT_TYPE="appengine"
                shift
                ;;
            --cloud-run)
                DEPLOYMENT_TYPE="cloudrun"
                shift
                ;;
            --project)
                PROJECT_ID="$2"
                shift 2
                ;;
            --region)
                REGION="$2"
                shift 2
                ;;
            --help)
                echo "Usage: $0 [--app-engine|--cloud-run] [--project PROJECT_ID] [--region REGION]"
                echo ""
                echo "Options:"
                echo "  --app-engine    Deploy to Google App Engine"
                echo "  --cloud-run     Deploy to Google Cloud Run (default)"
                echo "  --project       Google Cloud Project ID"
                echo "  --region        Deployment region (default: us-central1)"
                echo "  --help          Show this help message"
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                echo "Use --help for usage information"
                exit 1
                ;;
        esac
    done

    print_info "Deployment type: $DEPLOYMENT_TYPE"

    # Run deployment steps
    check_gcloud
    check_auth
    set_project
    enable_apis
    validate_env
    install_deps
    run_tests
    build_app

    if [ "$DEPLOYMENT_TYPE" = "appengine" ]; then
        deploy_app_engine
    elif [ "$DEPLOYMENT_TYPE" = "cloudrun" ]; then
        deploy_cloud_run
        create_env_file
    fi

    show_summary
}

# Run main function with all arguments
main "$@"
