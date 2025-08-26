#!/bin/bash

/**
 * Script de Deploy
 *
 * Script para deploy automatizado do sistema de chat
 */

set -e  # Exit on any error

# ============================================================================
# CONFIGURATION
# ============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BUILD_DIR="$PROJECT_ROOT/dist"
BACKUP_DIR="$PROJECT_ROOT/backups"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
ENVIRONMENT="staging"
SKIP_TESTS=false
SKIP_BUILD=false
DRY_RUN=false
VERBOSE=false

# ============================================================================
# FUNCTIONS
# ============================================================================

log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

usage() {
    cat << EOF
Usage: $0 [OPTIONS]

Deploy script for chat system

OPTIONS:
    -e, --environment ENV    Target environment (staging|production) [default: staging]
    -s, --skip-tests        Skip running tests
    -b, --skip-build        Skip build process
    -d, --dry-run           Show what would be done without executing
    -v, --verbose           Enable verbose output
    -h, --help              Show this help message

EXAMPLES:
    $0                                  # Deploy to staging
    $0 -e production                    # Deploy to production
    $0 -e staging --skip-tests          # Deploy to staging without tests
    $0 --dry-run                        # Show deployment plan

ENVIRONMENT VARIABLES:
    DEPLOY_KEY              SSH key for deployment
    STAGING_SERVER          Staging server address
    PRODUCTION_SERVER       Production server address
    BACKUP_RETENTION_DAYS   Days to keep backups [default: 30]

EOF
}

check_prerequisites() {
    log "Checking prerequisites..."

    # Check Node.js
    if ! command -v node &> /dev/null; then
        error "Node.js is not installed"
    fi

    # Check npm
    if ! command -v npm &> /dev/null; then
        error "npm is not installed"
    fi

    # Check git
    if ! command -v git &> /dev/null; then
        error "git is not installed"
    fi

    # Check if we're in a git repository
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        error "Not in a git repository"
    fi

    # Check for uncommitted changes
    if [[ -n $(git status --porcelain) ]]; then
        warning "There are uncommitted changes in the repository"
        read -p "Continue anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            error "Deployment cancelled"
        fi
    fi

    success "Prerequisites check passed"
}

load_environment() {
    log "Loading environment configuration for: $ENVIRONMENT"

    local env_file="$PROJECT_ROOT/.env.$ENVIRONMENT"

    if [[ -f "$env_file" ]]; then
        set -a  # automatically export all variables
        source "$env_file"
        set +a
        success "Environment configuration loaded"
    else
        warning "Environment file not found: $env_file"
    fi

    # Validate required environment variables
    case "$ENVIRONMENT" in
        "staging")
            if [[ -z "$STAGING_SERVER" ]]; then
                error "STAGING_SERVER environment variable is required"
            fi
            ;;
        "production")
            if [[ -z "$PRODUCTION_SERVER" ]]; then
                error "PRODUCTION_SERVER environment variable is required"
            fi
            ;;
    esac
}

run_tests() {
    if [[ "$SKIP_TESTS" == true ]]; then
        warning "Skipping tests as requested"
        return 0
    fi

    log "Running tests..."

    cd "$PROJECT_ROOT"

    # Type checking
    log "Running type check..."
    npm run type-check || error "Type check failed"

    # Linting
    log "Running linter..."
    npm run lint || error "Linting failed"

    # Unit tests
    log "Running unit tests..."
    npm run test:run || error "Unit tests failed"

    # Chat-specific tests
    log "Running chat system tests..."
    npm run test:integration -- src/test/integration/chat/ || error "Chat integration tests failed"

    # Accessibility tests
    log "Running accessibility tests..."
    npm run test:a11y || error "Accessibility tests failed"

    success "All tests passed"
}

build_application() {
    if [[ "$SKIP_BUILD" == true ]]; then
        warning "Skipping build as requested"
        return 0
    fi

    log "Building application for $ENVIRONMENT..."

    cd "$PROJECT_ROOT"

    # Clean previous build
    if [[ -d "$BUILD_DIR" ]]; then
        rm -rf "$BUILD_DIR"
    fi

    # Install dependencies
    log "Installing dependencies..."
    npm ci --production=false

    # Build application
    case "$ENVIRONMENT" in
        "production")
            npm run build
            ;;
        *)
            npm run build:dev
            ;;
    esac

    # Verify build
    if [[ ! -d "$BUILD_DIR" ]]; then
        error "Build directory not found after build"
    fi

    if [[ ! -f "$BUILD_DIR/index.html" ]]; then
        error "Build appears to be incomplete - index.html not found"
    fi

    success "Application built successfully"
}

create_backup() {
    log "Creating backup..."

    local timestamp=$(date +"%Y%m%d_%H%M%S")
    local backup_name="${ENVIRONMENT}_backup_${timestamp}"
    local backup_path="$BACKUP_DIR/$backup_name"

    mkdir -p "$BACKUP_DIR"

    case "$ENVIRONMENT" in
        "staging")
            if [[ -n "$STAGING_SERVER" ]]; then
                ssh "$STAGING_SERVER" "tar -czf /tmp/$backup_name.tar.gz -C /var/www/staging ." || warning "Failed to create remote backup"
                scp "$STAGING_SERVER:/tmp/$backup_name.tar.gz" "$backup_path.tar.gz" || warning "Failed to download backup"
                ssh "$STAGING_SERVER" "rm -f /tmp/$backup_name.tar.gz" || true
            fi
            ;;
        "production")
            if [[ -n "$PRODUCTION_SERVER" ]]; then
                ssh "$PRODUCTION_SERVER" "tar -czf /tmp/$backup_name.tar.gz -C /var/www/production ." || warning "Failed to create remote backup"
                scp "$PRODUCTION_SERVER:/tmp/$backup_name.tar.gz" "$backup_path.tar.gz" || warning "Failed to download backup"
                ssh "$PRODUCTION_SERVER" "rm -f /tmp/$backup_name.tar.gz" || true
            fi
            ;;
    esac

    # Clean old backups
    local retention_days=${BACKUP_RETENTION_DAYS:-30}
    find "$BACKUP_DIR" -name "*.tar.gz" -mtime +$retention_days -delete 2>/dev/null || true

    success "Backup created: $backup_name"
}

deploy_to_server() {
    log "Deploying to $ENVIRONMENT server..."

    if [[ "$DRY_RUN" == true ]]; then
        log "DRY RUN: Would deploy to $ENVIRONMENT"
        return 0
    fi

    local server_var="${ENVIRONMENT^^}_SERVER"
    local server="${!server_var}"

    if [[ -z "$server" ]]; then
        error "Server configuration not found for environment: $ENVIRONMENT"
    fi

    # Create deployment package
    local deploy_package="/tmp/chat_deploy_$(date +%s).tar.gz"
    tar -czf "$deploy_package" -C "$BUILD_DIR" .

    # Upload and extract
    case "$ENVIRONMENT" in
        "staging")
            scp "$deploy_package" "$server:/tmp/"
            ssh "$server" "
                sudo mkdir -p /var/www/staging &&
                sudo tar -xzf /tmp/$(basename $deploy_package) -C /var/www/staging &&
                sudo chown -R www-data:www-data /var/www/staging &&
                sudo systemctl reload nginx &&
                rm -f /tmp/$(basename $deploy_package)
            "
            ;;
        "production")
            scp "$deploy_package" "$server:/tmp/"
            ssh "$server" "
                sudo mkdir -p /var/www/production &&
                sudo tar -xzf /tmp/$(basename $deploy_package) -C /var/www/production &&
                sudo chown -R www-data:www-data /var/www/production &&
                sudo systemctl reload nginx &&
                rm -f /tmp/$(basename $deploy_package)
            "
            ;;
    esac

    # Clean local package
    rm -f "$deploy_package"

    success "Deployment completed"
}

run_smoke_tests() {
    log "Running smoke tests..."

    local base_url
    case "$ENVIRONMENT" in
        "staging")
            base_url="${STAGING_URL:-https://staging.example.com}"
            ;;
        "production")
            base_url="${PRODUCTION_URL:-https://example.com}"
            ;;
    esac

    # Basic health check
    if curl -f "$base_url/health" > /dev/null 2>&1; then
        success "Health check passed"
    else
        error "Health check failed"
    fi

    # Chat system check
    if curl -f "$base_url/" | grep -q "chat" > /dev/null 2>&1; then
        success "Chat system appears to be loaded"
    else
        warning "Chat system may not be properly loaded"
    fi

    success "Smoke tests completed"
}

send_notification() {
    local status="$1"
    local message="$2"

    log "Sending deployment notification..."

    # Slack notification (if configured)
    if [[ -n "$SLACK_WEBHOOK_URL" ]]; then
        local color="good"
        if [[ "$status" != "success" ]]; then
            color="danger"
        fi

        curl -X POST -H 'Content-type: application/json' \
            --data "{
                \"attachments\": [{
                    \"color\": \"$color\",
                    \"title\": \"Chat System Deployment\",
                    \"fields\": [
                        {\"title\": \"Environment\", \"value\": \"$ENVIRONMENT\", \"short\": true},
                        {\"title\": \"Status\", \"value\": \"$status\", \"short\": true},
                        {\"title\": \"Message\", \"value\": \"$message\", \"short\": false}
                    ],
                    \"footer\": \"Deployment Script\",
                    \"ts\": $(date +%s)
                }]
            }" \
            "$SLACK_WEBHOOK_URL" > /dev/null 2>&1 || warning "Failed to send Slack notification"
    fi

    # Email notification (if configured)
    if [[ -n "$NOTIFICATION_EMAIL" ]] && command -v mail &> /dev/null; then
        echo "$message" | mail -s "Chat System Deployment - $ENVIRONMENT - $status" "$NOTIFICATION_EMAIL" || warning "Failed to send email notification"
    fi
}

cleanup() {
    log "Cleaning up..."

    # Remove temporary files
    rm -f /tmp/chat_deploy_*.tar.gz 2>/dev/null || true

    success "Cleanup completed"
}

# ============================================================================
# MAIN EXECUTION
# ============================================================================

main() {
    log "Starting deployment process..."
    log "Environment: $ENVIRONMENT"
    log "Skip tests: $SKIP_TESTS"
    log "Skip build: $SKIP_BUILD"
    log "Dry run: $DRY_RUN"

    # Trap for cleanup on exit
    trap cleanup EXIT

    # Execute deployment steps
    check_prerequisites
    load_environment
    run_tests
    build_application
    create_backup
    deploy_to_server
    run_smoke_tests

    local deployment_message="Chat system successfully deployed to $ENVIRONMENT"
    success "$deployment_message"
    send_notification "success" "$deployment_message"
}

# ============================================================================
# ARGUMENT PARSING
# ============================================================================

while [[ $# -gt 0 ]]; do
    case $1 in
        -e|--environment)
            ENVIRONMENT="$2"
            shift 2
            ;;
        -s|--skip-tests)
            SKIP_TESTS=true
            shift
            ;;
        -b|--skip-build)
            SKIP_BUILD=true
            shift
            ;;
        -d|--dry-run)
            DRY_RUN=true
            shift
            ;;
        -v|--verbose)
            VERBOSE=true
            set -x
            shift
            ;;
        -h|--help)
            usage
            exit 0
            ;;
        *)
            error "Unknown option: $1"
            ;;
    esac
done

# Validate environment
if [[ "$ENVIRONMENT" != "staging" && "$ENVIRONMENT" != "production" ]]; then
    error "Invalid environment: $ENVIRONMENT. Must be 'staging' or 'production'"
fi

# Execute main function
main "$@"
