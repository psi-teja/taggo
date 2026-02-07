#!/bin/sh
# Use HOST_IP from environment if set, otherwise detect with ipconfig (macOS), else fallback to hostname -I (Linux)
if [ -n "$HOST_IP" ]; then
  DETECTED_IP="$HOST_IP"
elif command -v ipconfig >/dev/null 2>&1; then
  DETECTED_IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null)
elif command -v hostname >/dev/null 2>&1; then
  DETECTED_IP=$(hostname -I | awk '{print $1}')
else
  DETECTED_IP=""
fi

export NEXT_PUBLIC_API_BASE_URL="http://$DETECTED_IP:8000"
echo "NEXT_PUBLIC_API_BASE_URL set to $NEXT_PUBLIC_API_BASE_URL"
if [ -z "$DETECTED_IP" ]; then
  echo "Warning: Could not detect host IP. Backend URL may not be accessible from other devices."
fi
npm run dev -- --hostname 0.0.0.0