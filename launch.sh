#!/bin/sh
# Cross-platform host IP detection for Docker Compose
HOST_IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || hostname -I | awk '{print $1}')
if [ -z "$HOST_IP" ]; then
  echo "Warning: Could not detect host IP. Backend URL may not be accessible from other devices."
else
  echo "Detected HOST_IP: $HOST_IP"
fi
export HOST_IP
exec docker-compose up
