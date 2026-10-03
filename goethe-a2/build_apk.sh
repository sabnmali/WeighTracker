#!/usr/bin/env bash
# Goethe A2 Trainer — APK derleme betiği (Gradle/Android Studio gerektirmez).
# Gereksinimler (Ubuntu): android-sdk-platform-23 aapt apksigner dalvik-exchange, JDK 17+, Node 20+
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
SDK="${ANDROID_JAR:-/usr/lib/android-sdk/platforms/android-23/android.jar}"
OUT="$ROOT/build"
APP_NAME="GoetheA2Trainer"
KEYSTORE="$ROOT/android/keystore/release.jks"
KS_PASS="${KS_PASS:-goethe-a2-trainer}"

rm -rf "$OUT" && mkdir -p "$OUT"/{gen,classes,compiled,apk/assets/www}

if [ "${SKIP_WEB:-0}" != "1" ]; then
  echo "==> Web uygulaması derleniyor"
  (cd "$ROOT/web" && npm run build)
fi
cp "$ROOT/web/dist/index.html" "$OUT/apk/assets/www/index.html"

echo "==> Kaynaklar (aapt2)"
aapt2 compile --dir "$ROOT/android/res" -o "$OUT/compiled/res.zip"
aapt2 link -o "$OUT/base.apk" \
  -I "$SDK" \
  --manifest "$ROOT/android/AndroidManifest.xml" \
  --java "$OUT/gen" \
  -A "$OUT/apk/assets" \
  --auto-add-overlay \
  "$OUT/compiled/res.zip"

echo "==> Java derleniyor"
find "$ROOT/android/src" "$OUT/gen" -name '*.java' > "$OUT/sources.txt"
javac -nowarn -Xlint:-options -source 8 -target 8 -encoding UTF-8 \
  -bootclasspath "$SDK" -classpath "$SDK" \
  -d "$OUT/classes" @"$OUT/sources.txt"

echo "==> DEX"
"${DX:-/usr/lib/android-sdk/build-tools/debian/dx}" --dex --min-sdk-version=23 --output="$OUT/classes.dex" "$OUT/classes"

echo "==> Paketleniyor"
cp "$OUT/base.apk" "$OUT/unaligned.apk"
(cd "$OUT" && zip -q -j unaligned.apk classes.dex)
zipalign -f -p 4 "$OUT/unaligned.apk" "$OUT/aligned.apk"

if [ ! -f "$KEYSTORE" ]; then
  echo "==> İmza anahtarı oluşturuluyor"
  mkdir -p "$(dirname "$KEYSTORE")"
  keytool -genkeypair -v -keystore "$KEYSTORE" -alias goethe -keyalg RSA -keysize 2048 \
    -validity 10000 -storepass "$KS_PASS" -keypass "$KS_PASS" \
    -dname "CN=Goethe A2 Trainer, O=Personal, C=TR" >/dev/null 2>&1
fi

echo "==> İmzalanıyor"
apksigner sign --ks "$KEYSTORE" --ks-key-alias goethe --ks-pass "pass:$KS_PASS" --key-pass "pass:$KS_PASS" \
  --min-sdk-version 23 --out "$OUT/$APP_NAME.apk" "$OUT/aligned.apk"
apksigner verify --verbose "$OUT/$APP_NAME.apk" | head -5

mkdir -p "$ROOT/release"
cp "$OUT/$APP_NAME.apk" "$ROOT/release/$APP_NAME.apk"
echo "==> Hazır: $ROOT/release/$APP_NAME.apk ($(du -h "$ROOT/release/$APP_NAME.apk" | cut -f1))"
