#!/bin/bash
# Builds the Android APK and copies it to ./apk/Super_Assist_App_V<version>.apk
# The version is read from config.xml (<widget version="...">).
#
# Usage:
#   ./build-apk.sh            -> debug APK (installable, no signing needed)
#   ./build-apk.sh release    -> signed release APK (needs keystore env vars below)
#
# Release signing env vars:
#   KEYSTORE_PASSWORD, KEY_ALIAS, KEY_PASSWORD   (keystore: ./super-assist-app.keystore)

set -euo pipefail
cd "$(dirname "$0")"

MODE="${1:-debug}"

# Angular CLI needs Node >= 20.19
if [ -s "$HOME/.nvm/versions/node/v22.18.0/bin/node" ]; then
  export PATH="$HOME/.nvm/versions/node/v22.18.0/bin:$PATH"
fi

VERSION=$(sed -n 's/.*<widget[^>]* version="\([^"]*\)".*/\1/p' config.xml | head -1)
if [ -z "$VERSION" ]; then
  echo "Could not read version from config.xml" >&2
  exit 1
fi
OUT_NAME="Super_Assist_App_V${VERSION}.apk"
echo "==> Building Super Assist App v${VERSION} (${MODE})"

# The old splash plugin was removed from config.xml/package.json; drop it from the native project too.
if [ -d plugins/cordova-plugin-splashscreen ] || grep -q "cordova-plugin-splashscreen" platforms/android/android.json 2>/dev/null; then
  echo "==> Removing deprecated cordova-plugin-splashscreen from the Android project"
  rm -rf platforms/android plugins/cordova-plugin-splashscreen
fi

# 1. Web build -> www
npx ng build --configuration production

# 2. Native project
if [ ! -d platforms/android ]; then
  cordova platform add android
fi
cordova prepare android

# 3. APK
mkdir -p apk
if [ "$MODE" = "release" ]; then
  : "${KEYSTORE_PASSWORD:?Set KEYSTORE_PASSWORD}" "${KEY_ALIAS:?Set KEY_ALIAS}" "${KEY_PASSWORD:?Set KEY_PASSWORD}"
  cordova build android --release -- \
    --packageType=apk \
    --keystore="$(pwd)/super-assist-app.keystore" \
    --storePassword="$KEYSTORE_PASSWORD" \
    --alias="$KEY_ALIAS" \
    --password="$KEY_PASSWORD"
  SRC=$(ls -t platforms/android/app/build/outputs/apk/release/*.apk | head -1)
else
  cordova build android --debug
  SRC=$(ls -t platforms/android/app/build/outputs/apk/debug/*.apk | head -1)
fi

cp "$SRC" "apk/${OUT_NAME}"
echo "==> APK ready: apk/${OUT_NAME}"
