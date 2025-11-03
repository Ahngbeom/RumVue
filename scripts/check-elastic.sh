#!/bin/bash

# Elastic Stack 상태 확인 스크립트

echo "🔍 Checking Elastic Stack status..."
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed${NC}"
    exit 1
fi

# Check if Docker Compose services are running
if ! docker compose ps &> /dev/null; then
    echo -e "${YELLOW}⚠️  Docker Compose is not running${NC}"
    echo "Run: docker compose up -d"
    exit 1
fi

echo "📦 Docker Containers:"
docker compose ps
echo ""

# Check Elasticsearch
echo -n "🔍 Elasticsearch (http://localhost:9200): "
if curl -s http://localhost:9200/_cluster/health > /dev/null 2>&1; then
    HEALTH=$(curl -s http://localhost:9200/_cluster/health | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
    if [ "$HEALTH" = "green" ] || [ "$HEALTH" = "yellow" ]; then
        echo -e "${GREEN}✅ Healthy ($HEALTH)${NC}"
    else
        echo -e "${RED}❌ Unhealthy ($HEALTH)${NC}"
    fi
else
    echo -e "${RED}❌ Not responding${NC}"
fi

# Check Kibana
echo -n "🔍 Kibana (http://localhost:5601): "
if curl -s http://localhost:5601/api/status > /dev/null 2>&1; then
    STATUS=$(curl -s http://localhost:5601/api/status | grep -o '"level":"[^"]*"' | head -1 | cut -d'"' -f4)
    if [ "$STATUS" = "available" ]; then
        echo -e "${GREEN}✅ Available${NC}"
    else
        echo -e "${YELLOW}⚠️  Status: $STATUS${NC}"
    fi
else
    echo -e "${RED}❌ Not responding${NC}"
fi

# Check APM Server
echo -n "🔍 APM Server (http://localhost:8200): "
if curl -s http://localhost:8200 > /dev/null 2>&1; then
    VERSION=$(curl -s http://localhost:8200 | grep -o '"version":"[^"]*"' | cut -d'"' -f4)
    echo -e "${GREEN}✅ Running (v$VERSION)${NC}"
else
    echo -e "${RED}❌ Not responding${NC}"
fi

echo ""
echo "📊 Quick Links:"
echo "   Kibana Dashboard: http://localhost:5601"
echo "   APM UI: http://localhost:5601/app/apm"
echo "   Elasticsearch: http://localhost:9200"
echo "   APM Server: http://localhost:8200"
echo ""
echo "📝 Logs:"
echo "   View all logs: docker compose logs -f"
echo "   APM logs only: docker compose logs -f apm-server"
