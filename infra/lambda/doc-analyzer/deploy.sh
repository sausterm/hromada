#!/bin/bash
# Build and deploy the doc-analyzer Lambda function as a zip package.
# Usage: ./deploy.sh [--create]
#   --create: create the function (first time only)
#   otherwise: update existing function code
set -euo pipefail

FUNCTION_NAME="hromada-doc-analyzer"
RUNTIME="python3.12"
REGION="us-east-1"
PROFILE="hromada"
ROLE_ARN="${LAMBDA_ROLE_ARN:-}"  # Set this or pass via env

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BUILD_DIR=$(mktemp -d)
ZIP_FILE="$SCRIPT_DIR/function.zip"

echo "Installing dependencies for Lambda (linux x86_64)..."
pip3 install \
  --platform manylinux2014_x86_64 \
  --target "$BUILD_DIR" \
  --implementation cp \
  --python-version 3.12 \
  --only-binary=:all: \
  -r "$SCRIPT_DIR/requirements.txt"

echo "Adding handler..."
cp "$SCRIPT_DIR/handler.py" "$BUILD_DIR/"

echo "Creating zip..."
cd "$BUILD_DIR"
zip -r "$ZIP_FILE" . -x '*.pyc' '__pycache__/*'

SIZE=$(du -h "$ZIP_FILE" | cut -f1)
echo "Package size: $SIZE"

if [[ "${1:-}" == "--create" ]]; then
  if [[ -z "$ROLE_ARN" ]]; then
    echo "ERROR: Set LAMBDA_ROLE_ARN env var for --create"
    exit 1
  fi
  echo "Creating Lambda function..."
  aws lambda create-function \
    --function-name "$FUNCTION_NAME" \
    --runtime "$RUNTIME" \
    --handler handler.handler \
    --zip-file "fileb://$ZIP_FILE" \
    --role "$ROLE_ARN" \
    --timeout 120 \
    --memory-size 512 \
    --environment "Variables={SOURCE_BUCKET=hromada-partner-docs,RESULTS_BUCKET=hromada-partner-docs,RESULTS_PREFIX=_analysis/}" \
    --region "$REGION" \
    --profile "$PROFILE"
else
  echo "Updating Lambda function code..."
  aws lambda update-function-code \
    --function-name "$FUNCTION_NAME" \
    --zip-file "fileb://$ZIP_FILE" \
    --region "$REGION" \
    --profile "$PROFILE"
fi

echo "Cleaning up..."
rm -rf "$BUILD_DIR"

echo "Done. Zip at: $ZIP_FILE"
