#!/bin/bash

# Supabase Migration Deployment Script using Management API
# This script deploys database migrations when CLI is not available due to network issues

set -e  # Exit on any error

# Configuration
SUPABASE_ACCESS_TOKEN="${SUPABASE_ACCESS_TOKEN:-sbp_ee787264c52929f5200549ab77a8e324ddbcf826}"
PROJECT_REF="${PROJECT_REF:-ajwskzlxlvhkhlbedtrg}"
MIGRATION_DIR="supabase/migrations"
LOG_FILE="deployment_$(date +%Y%m%d_%H%M%S).log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${1}" | tee -a "${LOG_FILE}"
}

# Error handling function
error_exit() {
    log "${RED}ERROR: ${1}${NC}"
    exit 1
}

# Success message function
success() {
    log "${GREEN}SUCCESS: ${1}${NC}"
}

# Warning message function  
warn() {
    log "${YELLOW}WARNING: ${1}${NC}"
}

# Info message function
info() {
    log "${BLUE}INFO: ${1}${NC}"
}

# Function to check prerequisites
check_prerequisites() {
    info "Checking prerequisites..."
    
    # Check if curl is available
    if ! command -v curl &> /dev/null; then
        error_exit "curl is required but not installed"
    fi
    
    # Check if jq is available (optional but helpful)
    if ! command -v jq &> /dev/null; then
        warn "jq not found - JSON output will not be formatted"
        JQ_AVAILABLE=false
    else
        JQ_AVAILABLE=true
    fi
    
    # Check if migration directory exists
    if [ ! -d "$MIGRATION_DIR" ]; then
        error_exit "Migration directory not found: $MIGRATION_DIR"
    fi
    
    # Check if there are migration files
    if [ -z "$(ls -A $MIGRATION_DIR/*.sql 2>/dev/null)" ]; then
        error_exit "No migration files found in $MIGRATION_DIR"
    fi
    
    # Check environment variables
    if [ -z "$SUPABASE_ACCESS_TOKEN" ]; then
        error_exit "SUPABASE_ACCESS_TOKEN is not set"
    fi
    
    if [ -z "$PROJECT_REF" ]; then
        error_exit "PROJECT_REF is not set"
    fi
    
    success "Prerequisites check passed"
}

# Function to test API connectivity
test_api_connectivity() {
    info "Testing API connectivity..."
    
    local response=$(curl -s -w "\n%{http_code}" \
        "https://api.supabase.com/v1/projects/${PROJECT_REF}" \
        -H "Authorization: Bearer ${SUPABASE_ACCESS_TOKEN}")
    
    local http_code=$(echo "$response" | tail -n1)
    local body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" -eq 200 ]; then
        success "API connectivity test passed"
        if [ "$JQ_AVAILABLE" = true ]; then
            info "Project name: $(echo "$body" | jq -r '.name')"
            info "Project status: $(echo "$body" | jq -r '.status')"
        fi
    else
        error_exit "API connectivity test failed. HTTP code: $http_code, Response: $body"
    fi
}

# Function to execute SQL via Management API
execute_sql() {
    local sql_content="$1"
    local migration_name="$2"
    
    info "Executing migration: $migration_name"
    
    # Escape SQL content for JSON
    local escaped_sql=$(echo "$sql_content" | sed 's/"/\\"/g' | tr '\n' ' ')
    
    # Make API request
    local response=$(curl -s -w "\n%{http_code}" \
        -X POST \
        "https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query" \
        -H "Authorization: Bearer ${SUPABASE_ACCESS_TOKEN}" \
        -H "Content-Type: application/json" \
        -d "{\"query\": \"${escaped_sql}\"}")
    
    local http_code=$(echo "$response" | tail -n1)
    local body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" -eq 200 ]; then
        success "Migration executed successfully: $migration_name"
        if [ "$JQ_AVAILABLE" = true ] && [ "$body" != "null" ]; then
            echo "$body" | jq '.' >> "${LOG_FILE}"
        fi
        return 0
    else
        error_exit "Migration failed: $migration_name. HTTP code: $http_code, Response: $body"
    fi
}

# Function to validate migration file
validate_migration_file() {
    local file_path="$1"
    
    # Check if file exists and is readable
    if [ ! -r "$file_path" ]; then
        error_exit "Cannot read migration file: $file_path"
    fi
    
    # Check if file is not empty
    if [ ! -s "$file_path" ]; then
        warn "Migration file is empty: $file_path"
        return 1
    fi
    
    # Basic SQL validation (check for dangerous commands in wrong context)
    local content=$(cat "$file_path")
    if echo "$content" | grep -qi "drop database"; then
        error_exit "Dangerous command detected in migration: DROP DATABASE"
    fi
    
    return 0
}

# Function to get migration files in order
get_migration_files() {
    find "$MIGRATION_DIR" -name "*.sql" -type f | sort
}

# Function to create backup point (placeholder for future implementation)
create_backup() {
    info "Creating backup checkpoint (this would be implemented with pg_dump in production)"
    # In a production environment, you would create a database backup here
    # pg_dump postgresql://user:pass@host:port/db > backup_$(date +%Y%m%d_%H%M%S).sql
}

# Function to verify deployment
verify_deployment() {
    info "Verifying deployment..."
    
    # Check if tables exist
    local check_tables_sql="SELECT COUNT(*) as table_count FROM information_schema.tables WHERE table_schema = 'public';"
    local response=$(curl -s \
        -X POST \
        "https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query" \
        -H "Authorization: Bearer ${SUPABASE_ACCESS_TOKEN}" \
        -H "Content-Type: application/json" \
        -d "{\"query\": \"${check_tables_sql}\"}")
    
    if [ "$JQ_AVAILABLE" = true ]; then
        local table_count=$(echo "$response" | jq -r '.[0].table_count // 0')
        if [ "$table_count" -gt 0 ]; then
            success "Deployment verification passed. Found $table_count tables."
        else
            warn "Deployment verification: No tables found"
        fi
    else
        info "Deployment verification response: $response"
    fi
}

# Main deployment function
deploy_migrations() {
    info "Starting migration deployment..."
    
    local migration_files=($(get_migration_files))
    local total_migrations=${#migration_files[@]}
    local current=0
    
    info "Found $total_migrations migration files"
    
    for migration_file in "${migration_files[@]}"; do
        ((current++))
        local migration_name=$(basename "$migration_file")
        
        info "Processing migration $current/$total_migrations: $migration_name"
        
        # Validate migration file
        if ! validate_migration_file "$migration_file"; then
            warn "Skipping invalid migration file: $migration_name"
            continue
        fi
        
        # Read migration content
        local sql_content=$(cat "$migration_file")
        
        # Execute migration
        execute_sql "$sql_content" "$migration_name"
        
        # Add small delay to avoid rate limiting
        sleep 1
    done
    
    success "All migrations completed successfully!"
}

# Function to display usage
usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -h, --help              Show this help message"
    echo "  -t, --test-only         Only test connectivity, don't deploy"
    echo "  -v, --verify-only       Only verify existing deployment"
    echo "  -f, --force             Skip confirmation prompts"
    echo "  --project-ref REF       Override project reference"
    echo "  --token TOKEN           Override access token"
    echo ""
    echo "Environment Variables:"
    echo "  SUPABASE_ACCESS_TOKEN   Supabase access token"
    echo "  PROJECT_REF             Supabase project reference"
    echo ""
    echo "Examples:"
    echo "  $0                      Deploy all migrations"
    echo "  $0 -t                   Test connectivity only"
    echo "  $0 -v                   Verify deployment only"
    echo "  $0 --force              Deploy without confirmation"
}

# Function to get user confirmation
confirm() {
    if [ "$FORCE_MODE" = true ]; then
        return 0
    fi
    
    read -p "$1 (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        return 0
    else
        return 1
    fi
}

# Parse command line arguments
TEST_ONLY=false
VERIFY_ONLY=false
FORCE_MODE=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            usage
            exit 0
            ;;
        -t|--test-only)
            TEST_ONLY=true
            shift
            ;;
        -v|--verify-only)
            VERIFY_ONLY=true
            shift
            ;;
        -f|--force)
            FORCE_MODE=true
            shift
            ;;
        --project-ref)
            PROJECT_REF="$2"
            shift 2
            ;;
        --token)
            SUPABASE_ACCESS_TOKEN="$2"
            shift 2
            ;;
        *)
            error_exit "Unknown option: $1. Use -h for help."
            ;;
    esac
done

# Main execution
main() {
    info "=== Supabase Migration Deployment Script ==="
    info "Project: $PROJECT_REF"
    info "Log file: $LOG_FILE"
    info "Timestamp: $(date)"
    echo ""
    
    # Check prerequisites
    check_prerequisites
    
    # Test API connectivity
    test_api_connectivity
    
    # Handle test-only mode
    if [ "$TEST_ONLY" = true ]; then
        success "Test completed successfully. API is accessible."
        exit 0
    fi
    
    # Handle verify-only mode
    if [ "$VERIFY_ONLY" = true ]; then
        verify_deployment
        exit 0
    fi
    
    # Get user confirmation for deployment
    echo "This will deploy all migration files to the Supabase project."
    echo "Project: $PROJECT_REF"
    echo "Migration files: $(get_migration_files | wc -l)"
    echo ""
    
    if ! confirm "Do you want to proceed with the deployment?"; then
        info "Deployment cancelled by user"
        exit 0
    fi
    
    # Create backup (placeholder)
    create_backup
    
    # Deploy migrations
    deploy_migrations
    
    # Verify deployment
    verify_deployment
    
    success "=== Deployment completed successfully! ==="
    info "Log file: $LOG_FILE"
    info "Remember to:"
    info "1. Generate and update TypeScript types"
    info "2. Test your application connectivity"
    info "3. Run security and performance checks"
}

# Trap to handle script interruption
trap 'error_exit "Script interrupted by user"' INT TERM

# Execute main function
main "$@"