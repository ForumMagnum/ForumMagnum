#!/bin/bash
#
# PostgreSQL MCP Setup Script for Cursor IDE
# 
# This script sets up PostgreSQL Model Context Protocol (MCP) servers for Cursor IDE,
# allowing you to query databases directly from the AI assistant.
#
# Usage: ./setup-postgres-mcp.sh [--force]
#   --force: Overwrite existing configuration files
#
# After running this script, you MUST edit:
#   ~/.config/cursor/credentials.json
# to add your actual database credentials.
#

set -euo pipefail

# ============================================================================
# Configuration
# ============================================================================

CURSOR_DIR="$HOME/.cursor"
CONFIG_DIR="$HOME/.config/cursor"
CREDENTIALS_FILE="$CONFIG_DIR/credentials.json"
RUNNER_SCRIPT="$CURSOR_DIR/run-postgres-mcp.sh"
MCP_CONFIG="$CURSOR_DIR/mcp.json"
USERNAME="$USER"

# ============================================================================
# Output Helpers
# ============================================================================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m' # No Color

info()    { echo -e "${GREEN}[INFO]${NC} $1"; }
warn()    { echo -e "${YELLOW}[WARN]${NC} $1"; }
error()   { echo -e "${RED}[ERROR]${NC} $1" >&2; }
header()  { echo -e "\n${BLUE}${BOLD}==> $1${NC}"; }
success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }

# ============================================================================
# Argument Parsing
# ============================================================================

FORCE_OVERWRITE=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --force)
            FORCE_OVERWRITE=true
            shift
            ;;
        --help|-h)
            echo "Usage: $0 [--force]"
            echo ""
            echo "Options:"
            echo "  --force    Overwrite existing configuration files"
            echo "  --help     Show this help message"
            exit 0
            ;;
        *)
            error "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# ============================================================================
# Prerequisite Checks
# ============================================================================

check_macos() {
    header "Checking operating system"
    if [[ "$(uname)" != "Darwin" ]]; then
        warn "This script is designed for macOS. Some commands may need adjustment for other systems."
        read -p "Continue anyway? (y/N) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            error "Aborted by user"
            exit 1
        fi
    else
        info "Running on macOS ✓"
    fi
}

check_homebrew() {
    header "Checking for Homebrew"
    if ! command -v brew &> /dev/null; then
        error "Homebrew is not installed."
        echo ""
        echo "Please install Homebrew first:"
        echo "  /bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
        echo ""
        echo "Then run this script again."
        exit 1
    fi
    info "Homebrew is installed ✓"
}

check_cursor_version() {
    header "Checking Cursor IDE"
    if [[ -d "/Applications/Cursor.app" ]]; then
        info "Cursor IDE is installed ✓"
    else
        warn "Cursor.app not found in /Applications. Make sure Cursor IDE v0.50+ is installed."
    fi
}

# ============================================================================
# Installation Functions
# ============================================================================

install_uv() {
    header "Installing uv (Python package manager)"
    if command -v uv &> /dev/null; then
        info "uv is already installed ✓"
        info "  Version: $(uv --version)"
    else
        info "Installing uv via Homebrew..."
        if brew install uv; then
            success "uv installed successfully"
        else
            error "Failed to install uv"
            echo "Try running manually: brew install uv"
            exit 1
        fi
    fi
}

install_jq() {
    header "Installing jq (JSON processor)"
    if command -v jq &> /dev/null; then
        info "jq is already installed ✓"
        info "  Version: $(jq --version)"
    else
        info "Installing jq via Homebrew..."
        if brew install jq; then
            success "jq installed successfully"
        else
            error "Failed to install jq"
            echo "Try running manually: brew install jq"
            exit 1
        fi
    fi
}

# ============================================================================
# Directory & File Creation
# ============================================================================

create_directories() {
    header "Creating directory structure"
    
    if [[ ! -d "$CONFIG_DIR" ]]; then
        info "Creating $CONFIG_DIR"
        mkdir -p "$CONFIG_DIR"
    else
        info "$CONFIG_DIR already exists ✓"
    fi
    
    if [[ ! -d "$CURSOR_DIR" ]]; then
        info "Creating $CURSOR_DIR"
        mkdir -p "$CURSOR_DIR"
    else
        info "$CURSOR_DIR already exists ✓"
    fi
}

create_credentials_template() {
    header "Creating credentials file"
    
    if [[ -f "$CREDENTIALS_FILE" ]] && [[ "$FORCE_OVERWRITE" != "true" ]]; then
        info "Credentials file already exists at $CREDENTIALS_FILE"
        info "Use --force to overwrite"
        return 0
    fi
    
    info "Creating credentials template at $CREDENTIALS_FILE"
    
    cat > "$CREDENTIALS_FILE" << 'CREDENTIALS_EOF'
{
  "databases": {
    "analytics": {
      "host": "REPLACE_WITH_ANALYTICS_HOST",
      "port": 5432,
      "database": "REPLACE_WITH_DATABASE_NAME",
      "username": "REPLACE_WITH_USERNAME",
      "password": "REPLACE_WITH_PASSWORD"
    },
    "prod-read-replica": {
      "host": "REPLACE_WITH_PROD_HOST",
      "port": 5432,
      "database": "REPLACE_WITH_DATABASE_NAME",
      "username": "REPLACE_WITH_USERNAME",
      "password": "REPLACE_WITH_PASSWORD"
    }
  }
}
CREDENTIALS_EOF
    
    # Set restrictive permissions
    chmod 600 "$CREDENTIALS_FILE"
    
    success "Credentials template created"
    warn "⚠️  YOU MUST EDIT THIS FILE with your real database credentials:"
    echo "     $CREDENTIALS_FILE"
}

create_runner_script() {
    header "Creating PostgreSQL MCP runner script"
    
    if [[ -f "$RUNNER_SCRIPT" ]] && [[ "$FORCE_OVERWRITE" != "true" ]]; then
        info "Runner script already exists at $RUNNER_SCRIPT"
        info "Use --force to overwrite"
        return 0
    fi
    
    info "Creating runner script at $RUNNER_SCRIPT"
    
    cat > "$RUNNER_SCRIPT" << 'RUNNER_EOF'
#!/bin/bash
#
# PostgreSQL MCP Runner Script
# This script is called by Cursor to start a PostgreSQL MCP server
#

set -euo pipefail

# Check if database name is provided
if [ $# -eq 0 ]; then
    echo "Usage: $0 <database-name>" >&2
    echo "Available databases: Run 'jq -r \".databases | keys[]\" ~/.config/cursor/credentials.json'" >&2
    exit 1
fi

DB_NAME="$1"
CREDS_FILE="$HOME/.config/cursor/credentials.json"

# Check if credentials file exists
if [ ! -f "$CREDS_FILE" ]; then
    echo "Error: Credentials file not found at $CREDS_FILE" >&2
    echo "" >&2
    echo "Please create this file with your database credentials." >&2
    echo "See the setup script for the expected format." >&2
    exit 1
fi

# Validate JSON syntax
if ! jq empty "$CREDS_FILE" 2>/dev/null; then
    echo "Error: Invalid JSON in credentials file $CREDS_FILE" >&2
    echo "" >&2
    echo "Common issues:" >&2
    echo "  - Missing commas between fields" >&2
    echo "  - Trailing commas after last field" >&2
    echo "  - Unescaped special characters in passwords" >&2
    echo "" >&2
    echo "Validate with: jq . '$CREDS_FILE'" >&2
    exit 1
fi

# Check if the database exists in the credentials file
if ! jq -e ".databases.\"$DB_NAME\"" "$CREDS_FILE" > /dev/null 2>&1; then
    echo "Error: Database '$DB_NAME' not found in credentials file" >&2
    echo "" >&2
    echo "Available databases:" >&2
    jq -r '.databases | keys[]' "$CREDS_FILE" 2>/dev/null | sed 's/^/  - /' >&2
    exit 1
fi

# Extract database credentials using jq
HOST=$(jq -r ".databases.\"$DB_NAME\".host" "$CREDS_FILE")
PORT=$(jq -r ".databases.\"$DB_NAME\".port" "$CREDS_FILE")
DATABASE=$(jq -r ".databases.\"$DB_NAME\".database" "$CREDS_FILE")
USERNAME=$(jq -r ".databases.\"$DB_NAME\".username" "$CREDS_FILE")
PASSWORD=$(jq -r ".databases.\"$DB_NAME\".password" "$CREDS_FILE")

# Validate that we got actual values (not placeholder text)
if [[ "$HOST" == "REPLACE_WITH_"* ]] || [[ "$HOST" == "null" ]]; then
    echo "Error: Database '$DB_NAME' has placeholder credentials" >&2
    echo "Please edit $CREDS_FILE with your actual database credentials" >&2
    exit 1
fi

# URL-encode the password to handle special characters
URL_ENCODED_PASSWORD=$(python3 -c "import urllib.parse; print(urllib.parse.quote('$PASSWORD', safe=''))" 2>/dev/null || echo "$PASSWORD")

# Construct the connection string
CONNECTION_STRING="postgresql://$USERNAME:$URL_ENCODED_PASSWORD@$HOST:$PORT/$DATABASE"

echo "Connecting to $DB_NAME database..." >&2

# Check if uvx is available
if ! command -v uvx &> /dev/null; then
    echo "Error: uvx command not found" >&2
    echo "Please install uv: brew install uv" >&2
    exit 1
fi

# Run postgres-mcp with the connection string
exec uvx postgres-mcp "$CONNECTION_STRING" --access-mode restricted
RUNNER_EOF
    
    chmod +x "$RUNNER_SCRIPT"
    success "Runner script created and made executable"
}

create_mcp_config() {
    header "Creating MCP configuration"
    
    if [[ -f "$MCP_CONFIG" ]]; then
        info "MCP config already exists at $MCP_CONFIG"
        
        # Check if our servers are already configured
        if jq -e '.mcpServers["postgres-analytics"]' "$MCP_CONFIG" > /dev/null 2>&1; then
            info "PostgreSQL MCP servers already configured"
            if [[ "$FORCE_OVERWRITE" != "true" ]]; then
                info "Use --force to overwrite"
                return 0
            fi
        fi
        
        if [[ "$FORCE_OVERWRITE" == "true" ]]; then
            info "Overwriting existing MCP config (--force specified)"
        else
            # Merge our config with existing
            info "Merging PostgreSQL servers into existing MCP config"
            
            # Create temporary file with merged config
            TEMP_CONFIG=$(mktemp)
            jq --arg runner "$RUNNER_SCRIPT" '.mcpServers["postgres-analytics"] = {
                "command": $runner,
                "args": ["analytics"]
            } | .mcpServers["postgres-prod-replica"] = {
                "command": $runner,
                "args": ["prod-read-replica"]
            }' "$MCP_CONFIG" > "$TEMP_CONFIG"
            
            mv "$TEMP_CONFIG" "$MCP_CONFIG"
            success "PostgreSQL servers added to existing MCP config"
            return 0
        fi
    fi
    
    info "Creating MCP config at $MCP_CONFIG"
    
    cat > "$MCP_CONFIG" << MCP_EOF
{
  "mcpServers": {
    "postgres-analytics": {
      "command": "$RUNNER_SCRIPT",
      "args": ["analytics"]
    },
    "postgres-prod-replica": {
      "command": "$RUNNER_SCRIPT",
      "args": ["prod-read-replica"]
    }
  }
}
MCP_EOF
    
    success "MCP config created"
}

# ============================================================================
# Verification
# ============================================================================

verify_setup() {
    header "Verifying setup"
    
    local all_good=true
    
    # Check files exist
    if [[ -f "$CREDENTIALS_FILE" ]]; then
        info "✓ Credentials file exists"
        
        # Check permissions
        local perms=$(stat -f "%Lp" "$CREDENTIALS_FILE" 2>/dev/null || stat -c "%a" "$CREDENTIALS_FILE" 2>/dev/null)
        if [[ "$perms" == "600" ]]; then
            info "✓ Credentials file has secure permissions (600)"
        else
            warn "Credentials file permissions are $perms (should be 600)"
            warn "  Run: chmod 600 $CREDENTIALS_FILE"
        fi
        
        # Check if still has placeholder values
        if grep -q "REPLACE_WITH" "$CREDENTIALS_FILE" 2>/dev/null; then
            warn "⚠️  Credentials file still contains placeholder values"
            all_good=false
        fi
    else
        error "✗ Credentials file not found"
        all_good=false
    fi
    
    if [[ -f "$RUNNER_SCRIPT" ]]; then
        info "✓ Runner script exists"
        if [[ -x "$RUNNER_SCRIPT" ]]; then
            info "✓ Runner script is executable"
        else
            error "✗ Runner script is not executable"
            all_good=false
        fi
    else
        error "✗ Runner script not found"
        all_good=false
    fi
    
    if [[ -f "$MCP_CONFIG" ]]; then
        info "✓ MCP config exists"
        if jq empty "$MCP_CONFIG" 2>/dev/null; then
            info "✓ MCP config is valid JSON"
        else
            error "✗ MCP config has invalid JSON"
            all_good=false
        fi
    else
        error "✗ MCP config not found"
        all_good=false
    fi
    
    # Check tools
    if command -v uvx &> /dev/null; then
        info "✓ uvx is available"
    else
        error "✗ uvx is not available"
        all_good=false
    fi
    
    if command -v jq &> /dev/null; then
        info "✓ jq is available"
    else
        error "✗ jq is not available"
        all_good=false
    fi
    
    echo ""
    if [[ "$all_good" == "true" ]]; then
        success "Setup verification complete - all checks passed!"
    else
        warn "Setup verification found issues that need attention"
    fi
}

# ============================================================================
# Summary
# ============================================================================

print_summary() {
    header "Setup Complete!"
    
    echo ""
    echo "Files created:"
    echo "  📁 $CONFIG_DIR/"
    echo "  📄 $CREDENTIALS_FILE"
    echo "  📁 $CURSOR_DIR/"
    echo "  📄 $RUNNER_SCRIPT"
    echo "  📄 $MCP_CONFIG"
    echo ""
    
    echo -e "${YELLOW}${BOLD}⚠️  IMPORTANT: Next Steps${NC}"
    echo ""
    echo "1. Edit the credentials file with your REAL database credentials:"
    echo -e "   ${BOLD}$CREDENTIALS_FILE${NC}"
    echo ""
    echo "   Replace these placeholders:"
    echo "   - REPLACE_WITH_ANALYTICS_HOST    → your-analytics-host.amazonaws.com"
    echo "   - REPLACE_WITH_PROD_HOST         → your-prod-replica.amazonaws.com"
    echo "   - REPLACE_WITH_DATABASE_NAME     → your actual database name"
    echo "   - REPLACE_WITH_USERNAME          → your database username"
    echo "   - REPLACE_WITH_PASSWORD          → your database password"
    echo ""
    echo "2. Reload Cursor IDE:"
    echo "   - Press Cmd+Shift+P"
    echo "   - Type 'Developer: Reload Window' and press Enter"
    echo ""
    echo "3. Verify MCP servers are available:"
    echo "   - Open Cursor Settings (Shift + Cmd + J > 'Tools & MCP' > 'Installed MCP Servers')"
    echo "   - There should be two servers listed: 'postgres-analytics' and 'postgres-prod-replica'"
    echo "   - They may indicate setup errors in red; toggle them off and then on again to reinitialize with correct credentials."
    echo ""
    echo "4. Test connectivity (after adding credentials):"
    echo "   $RUNNER_SCRIPT analytics"
    echo ""
    echo -e "${YELLOW}Known Issue:${NC} Only enable ONE PostgreSQL MCP server at a time."
    echo "Multiple enabled servers may route all queries to the same database."
    echo ""
}

# ============================================================================
# Main
# ============================================================================

main() {
    echo ""
    echo -e "${BOLD}PostgreSQL MCP Setup for Cursor IDE${NC}"
    echo "======================================"
    
    # Prerequisites
    check_macos
    check_homebrew
    check_cursor_version
    
    # Installations
    install_uv
    install_jq
    
    # Setup
    create_directories
    create_credentials_template
    create_runner_script
    create_mcp_config
    
    # Verify
    verify_setup
    
    # Summary
    print_summary
}

main "$@"
