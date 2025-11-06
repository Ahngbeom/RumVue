#!/bin/bash

###############################################################################
# upload-sourcemaps.sh
#
# Uploads source maps to Elastic APM Server for better error stack traces
# in production environments.
#
# Usage:
#   ./scripts/upload-sourcemaps.sh
#
# Environment Variables:
#   APM_SERVER_URL      - APM Server URL (default: http://localhost:8200)
#   APM_SERVICE_NAME    - Service name (default: rumvue-demo)
#   APM_SERVICE_VERSION - Service version (default: 1.0.0)
#   APM_SECRET_TOKEN    - APM Server secret token (optional)
#
# Prerequisites:
#   1. Run 'npm run build' first to generate source maps
#   2. Ensure .output/public/_nuxt/*.js.map files exist
#
###############################################################################

set -e  # Exit on error

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration from environment variables or defaults
APM_SERVER_URL="${APM_SERVER_URL:-http://localhost:8200}"
APM_SERVICE_NAME="${APM_SERVICE_NAME:-rumvue-demo}"
APM_SERVICE_VERSION="${APM_SERVICE_VERSION:-1.0.0}"
APM_SECRET_TOKEN="${APM_SECRET_TOKEN:-}"

# Build output directory
BUILD_DIR=".output/public/_nuxt"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Elastic APM Source Map Upload${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "APM Server:      ${GREEN}${APM_SERVER_URL}${NC}"
echo -e "Service Name:    ${GREEN}${APM_SERVICE_NAME}${NC}"
echo -e "Service Version: ${GREEN}${APM_SERVICE_VERSION}${NC}"
echo ""

# Check if build directory exists
if [ ! -d "$BUILD_DIR" ]; then
  echo -e "${RED}Error: Build directory not found: ${BUILD_DIR}${NC}"
  echo -e "${YELLOW}Please run 'npm run build' first${NC}"
  exit 1
fi

# Find all .js.map files
MAP_FILES=$(find "$BUILD_DIR" -name "*.js.map" 2>/dev/null)

if [ -z "$MAP_FILES" ]; then
  echo -e "${RED}Error: No source map files found in ${BUILD_DIR}${NC}"
  echo -e "${YELLOW}Ensure source maps are enabled in nuxt.config.ts${NC}"
  exit 1
fi

# Count files
MAP_COUNT=$(echo "$MAP_FILES" | wc -l | tr -d ' ')
echo -e "Found ${GREEN}${MAP_COUNT}${NC} source map file(s)"
echo ""

# Upload each source map
SUCCESS_COUNT=0
FAILED_COUNT=0

for MAP_FILE in $MAP_FILES; do
  # Get the corresponding .js file path
  BUNDLE_FILE="${MAP_FILE%.map}"

  # Extract relative path for bundle_filepath
  RELATIVE_PATH=$(echo "$BUNDLE_FILE" | sed "s|^$BUILD_DIR|/_nuxt|")

  # Get filename for display
  FILENAME=$(basename "$MAP_FILE")

  echo -e "${BLUE}Uploading:${NC} ${FILENAME}"
  echo -e "  Bundle path: ${RELATIVE_PATH}"

  # Prepare curl command
  CURL_CMD="curl -X POST \"${APM_SERVER_URL}/assets/v1/sourcemaps\" \
    -F service_name=\"${APM_SERVICE_NAME}\" \
    -F service_version=\"${APM_SERVICE_VERSION}\" \
    -F bundle_filepath=\"${RELATIVE_PATH}\" \
    -F sourcemap=@\"${MAP_FILE}\""

  # Add secret token if provided
  if [ -n "$APM_SECRET_TOKEN" ]; then
    CURL_CMD="$CURL_CMD -H \"Authorization: Bearer ${APM_SECRET_TOKEN}\""
  fi

  # Execute upload
  RESPONSE=$(eval "$CURL_CMD" -s -w "\n%{http_code}" 2>&1)
  HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
  BODY=$(echo "$RESPONSE" | head -n-1)

  if [ "$HTTP_CODE" = "202" ] || [ "$HTTP_CODE" = "200" ]; then
    echo -e "  ${GREEN}✓ Success${NC} (HTTP ${HTTP_CODE})"
    ((SUCCESS_COUNT++))
  else
    echo -e "  ${RED}✗ Failed${NC} (HTTP ${HTTP_CODE})"
    echo -e "  Response: ${BODY}"
    ((FAILED_COUNT++))
  fi

  echo ""
done

# Summary
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Upload Summary${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "Total:   ${MAP_COUNT}"
echo -e "Success: ${GREEN}${SUCCESS_COUNT}${NC}"
echo -e "Failed:  ${RED}${FAILED_COUNT}${NC}"
echo ""

if [ $FAILED_COUNT -eq 0 ]; then
  echo -e "${GREEN}✓ All source maps uploaded successfully!${NC}"
  echo ""
  echo -e "${YELLOW}Next steps:${NC}"
  echo -e "  1. Deploy your application with version: ${APM_SERVICE_VERSION}"
  echo -e "  2. Check Kibana APM for error stack traces"
  echo -e "  3. Errors will now show original file names and line numbers"
  exit 0
else
  echo -e "${RED}✗ Some uploads failed${NC}"
  echo -e "${YELLOW}Troubleshooting:${NC}"
  echo -e "  - Check APM Server URL: ${APM_SERVER_URL}"
  echo -e "  - Verify APM Server is running: curl ${APM_SERVER_URL}"
  echo -e "  - Check secret token if required"
  echo -e "  - Review APM Server logs for details"
  exit 1
fi
