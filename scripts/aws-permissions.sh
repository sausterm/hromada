#!/usr/bin/env bash
set -euo pipefail

# Hromada IAM Permission Manager
# Manages modular IAM policies for the Hromada project.
# Account: 582500931967
#
# Usage:
#   ./scripts/aws-permissions.sh list
#   ./scripts/aws-permissions.sh status <iam-username>
#   ./scripts/aws-permissions.sh grant <iam-username> <module>
#   ./scripts/aws-permissions.sh revoke <iam-username> <module>
#   ./scripts/aws-permissions.sh request <module> [reason]
#   ./scripts/aws-permissions.sh migrate <iam-username>
#
# Prerequisites: aws-cli v2, jq

ACCOUNT_ID="582500931967"
REGION="us-east-1"
POLICY_PREFIX="Hromada-"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
AUDIT_LOG="$PROJECT_ROOT/Vault/iam-audit.txt"

# All modules in display order
MODULES="self-service amplify ses lambda apigateway s3 cloudwatch cloudformation dynamodb route53 cloudfront cognito secretsmanager sns sqs"

# Modules included in the migration from HromadaProjectAdmin
MIGRATION_MODULES="self-service amplify ses lambda apigateway s3 cloudwatch cloudformation"

# --- Dependency check ---

check_deps() {
  for cmd in aws jq; do
    if ! command -v "$cmd" &>/dev/null; then
      echo "Error: '$cmd' is required but not installed." >&2
      exit 1
    fi
  done
}

# --- Audit logging ---

audit() {
  local action="$1"
  local details="$2"
  local timestamp
  timestamp="$(date -u '+%Y-%m-%dT%H:%M:%SZ')"
  local who
  who="$(aws sts get-caller-identity --query 'Arn' --output text 2>/dev/null || echo 'unknown')"

  mkdir -p "$(dirname "$AUDIT_LOG")"
  echo "[$timestamp] [$who] $action: $details" >> "$AUDIT_LOG"
}

# --- Module descriptions ---

get_module_desc() {
  case "$1" in
    self-service)    echo "Manage own password, access keys, and MFA devices" ;;
    amplify)         echo "Manage Amplify apps — deploy, configure branches, build logs" ;;
    ses)             echo "Send emails and manage verified identities in SES" ;;
    lambda)          echo "Create and manage Lambda functions (Hromada-* prefix)" ;;
    apigateway)      echo "Manage API Gateway resources (REST and HTTP APIs)" ;;
    s3)              echo "Manage S3 buckets (hromada-* and amplify-* prefixes)" ;;
    cloudwatch)      echo "View metrics/logs, manage alarms (Hromada-* prefix)" ;;
    cloudformation)  echo "View CloudFormation stacks (read-only)" ;;
    dynamodb)        echo "Manage DynamoDB tables (Hromada-* prefix)" ;;
    route53)         echo "Manage DNS records in Route 53 hosted zones" ;;
    cloudfront)      echo "Manage CloudFront distributions and cache invalidations" ;;
    cognito)         echo "Manage Cognito user pools and users" ;;
    secretsmanager)  echo "Manage secrets (Hromada-* prefix) in Secrets Manager" ;;
    sns)             echo "Manage SNS topics (Hromada-* prefix)" ;;
    sqs)             echo "Manage SQS queues (Hromada-* prefix)" ;;
    *)               echo "" ;;
  esac
}

# --- Module active status (currently used by the platform) ---

is_active_module() {
  case "$1" in
    self-service|amplify|ses|lambda|apigateway|s3|cloudwatch|cloudformation) return 0 ;;
    *) return 1 ;;
  esac
}

# --- Policy JSON documents ---

get_policy_json() {
  case "$1" in
    self-service) cat <<'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowManageOwnCredentials",
      "Effect": "Allow",
      "Action": [
        "iam:ChangePassword",
        "iam:CreateAccessKey",
        "iam:DeleteAccessKey",
        "iam:GetAccessKeyLastUsed",
        "iam:ListAccessKeys",
        "iam:UpdateAccessKey",
        "iam:GetUser",
        "iam:ListMFADevices",
        "iam:CreateVirtualMFADevice",
        "iam:EnableMFADevice",
        "iam:DeactivateMFADevice",
        "iam:DeleteVirtualMFADevice",
        "iam:ListUserTags",
        "iam:GetLoginProfile"
      ],
      "Resource": "arn:aws:iam::582500931967:user/${aws:username}"
    },
    {
      "Sid": "AllowViewAccountInfo",
      "Effect": "Allow",
      "Action": [
        "iam:GetAccountPasswordPolicy",
        "iam:ListVirtualMFADevices"
      ],
      "Resource": "*"
    }
  ]
}
EOF
    ;;
    amplify) cat <<'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AmplifyFullAccess",
      "Effect": "Allow",
      "Action": "amplify:*",
      "Resource": "arn:aws:amplify:us-east-1:582500931967:apps/*"
    },
    {
      "Sid": "AmplifyListApps",
      "Effect": "Allow",
      "Action": "amplify:ListApps",
      "Resource": "*"
    }
  ]
}
EOF
    ;;
    ses) cat <<'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "SESSendAndIdentity",
      "Effect": "Allow",
      "Action": [
        "ses:SendEmail",
        "ses:SendRawEmail",
        "ses:GetSendQuota",
        "ses:GetSendStatistics",
        "ses:GetAccount",
        "ses:ListIdentities",
        "ses:GetIdentityVerificationAttributes",
        "ses:VerifyDomainIdentity",
        "ses:VerifyEmailIdentity"
      ],
      "Resource": "*"
    },
    {
      "Sid": "SESTemplateManagement",
      "Effect": "Allow",
      "Action": [
        "ses:CreateTemplate",
        "ses:UpdateTemplate",
        "ses:GetTemplate",
        "ses:ListTemplates",
        "ses:DeleteTemplate"
      ],
      "Resource": "*"
    }
  ]
}
EOF
    ;;
    lambda) cat <<'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "LambdaAccess",
      "Effect": "Allow",
      "Action": [
        "lambda:GetFunction",
        "lambda:ListFunctions",
        "lambda:CreateFunction",
        "lambda:UpdateFunctionCode",
        "lambda:UpdateFunctionConfiguration",
        "lambda:DeleteFunction",
        "lambda:InvokeFunction",
        "lambda:GetFunctionConfiguration",
        "lambda:ListVersionsByFunction",
        "lambda:ListAliases",
        "lambda:GetPolicy",
        "lambda:AddPermission",
        "lambda:RemovePermission"
      ],
      "Resource": "arn:aws:lambda:us-east-1:582500931967:function:Hromada-*"
    },
    {
      "Sid": "LambdaListAll",
      "Effect": "Allow",
      "Action": "lambda:ListFunctions",
      "Resource": "*"
    },
    {
      "Sid": "PassRoleToLambda",
      "Effect": "Allow",
      "Action": "iam:PassRole",
      "Resource": "arn:aws:iam::582500931967:role/Hromada-*",
      "Condition": {
        "StringEquals": {
          "iam:PassedToService": "lambda.amazonaws.com"
        }
      }
    }
  ]
}
EOF
    ;;
    apigateway) cat <<'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "APIGatewayAccess",
      "Effect": "Allow",
      "Action": [
        "apigateway:GET",
        "apigateway:POST",
        "apigateway:PUT",
        "apigateway:DELETE",
        "apigateway:PATCH"
      ],
      "Resource": "arn:aws:apigateway:us-east-1::/*"
    }
  ]
}
EOF
    ;;
    s3) cat <<'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "S3HromadaBuckets",
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:ListBucket",
        "s3:GetBucketLocation",
        "s3:GetBucketPolicy",
        "s3:PutBucketPolicy",
        "s3:GetBucketCORS",
        "s3:PutBucketCORS",
        "s3:CreateBucket",
        "s3:PutBucketTagging"
      ],
      "Resource": [
        "arn:aws:s3:::hromada-*",
        "arn:aws:s3:::hromada-*/*",
        "arn:aws:s3:::amplify-*",
        "arn:aws:s3:::amplify-*/*"
      ]
    },
    {
      "Sid": "S3ListBuckets",
      "Effect": "Allow",
      "Action": "s3:ListAllMyBuckets",
      "Resource": "*"
    }
  ]
}
EOF
    ;;
    cloudwatch) cat <<'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "CloudWatchReadAccess",
      "Effect": "Allow",
      "Action": [
        "cloudwatch:GetMetricData",
        "cloudwatch:GetMetricStatistics",
        "cloudwatch:ListMetrics",
        "cloudwatch:DescribeAlarms",
        "cloudwatch:GetDashboard",
        "cloudwatch:ListDashboards",
        "logs:GetLogEvents",
        "logs:DescribeLogGroups",
        "logs:DescribeLogStreams",
        "logs:FilterLogEvents",
        "logs:GetLogRecord",
        "logs:StartQuery",
        "logs:StopQuery",
        "logs:GetQueryResults"
      ],
      "Resource": "*"
    },
    {
      "Sid": "CloudWatchAlarms",
      "Effect": "Allow",
      "Action": [
        "cloudwatch:PutMetricAlarm",
        "cloudwatch:DeleteAlarms",
        "cloudwatch:EnableAlarmActions",
        "cloudwatch:DisableAlarmActions"
      ],
      "Resource": "arn:aws:cloudwatch:us-east-1:582500931967:alarm:Hromada-*"
    }
  ]
}
EOF
    ;;
    cloudformation) cat <<'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "CloudFormationReadAccess",
      "Effect": "Allow",
      "Action": [
        "cloudformation:DescribeStacks",
        "cloudformation:DescribeStackEvents",
        "cloudformation:DescribeStackResources",
        "cloudformation:GetTemplate",
        "cloudformation:ListStacks",
        "cloudformation:ListStackResources"
      ],
      "Resource": "*"
    }
  ]
}
EOF
    ;;
    dynamodb) cat <<'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "DynamoDBAccess",
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:DeleteItem",
        "dynamodb:Query",
        "dynamodb:Scan",
        "dynamodb:CreateTable",
        "dynamodb:DeleteTable",
        "dynamodb:DescribeTable",
        "dynamodb:ListTables",
        "dynamodb:UpdateTable"
      ],
      "Resource": "arn:aws:dynamodb:us-east-1:582500931967:table/Hromada-*"
    },
    {
      "Sid": "DynamoDBListTables",
      "Effect": "Allow",
      "Action": "dynamodb:ListTables",
      "Resource": "*"
    }
  ]
}
EOF
    ;;
    route53) cat <<'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "Route53Access",
      "Effect": "Allow",
      "Action": [
        "route53:GetHostedZone",
        "route53:ListHostedZones",
        "route53:ListResourceRecordSets",
        "route53:ChangeResourceRecordSets",
        "route53:GetChange"
      ],
      "Resource": "*"
    }
  ]
}
EOF
    ;;
    cloudfront) cat <<'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "CloudFrontAccess",
      "Effect": "Allow",
      "Action": [
        "cloudfront:GetDistribution",
        "cloudfront:ListDistributions",
        "cloudfront:CreateInvalidation",
        "cloudfront:GetInvalidation",
        "cloudfront:ListInvalidations",
        "cloudfront:UpdateDistribution"
      ],
      "Resource": "*"
    }
  ]
}
EOF
    ;;
    cognito) cat <<'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "CognitoAccess",
      "Effect": "Allow",
      "Action": [
        "cognito-idp:AdminCreateUser",
        "cognito-idp:AdminDeleteUser",
        "cognito-idp:AdminGetUser",
        "cognito-idp:AdminListGroupsForUser",
        "cognito-idp:AdminUpdateUserAttributes",
        "cognito-idp:ListUserPools",
        "cognito-idp:ListUsers",
        "cognito-idp:DescribeUserPool"
      ],
      "Resource": "arn:aws:cognito-idp:us-east-1:582500931967:userpool/*"
    }
  ]
}
EOF
    ;;
    secretsmanager) cat <<'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "SecretsManagerAccess",
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue",
        "secretsmanager:DescribeSecret",
        "secretsmanager:ListSecrets",
        "secretsmanager:CreateSecret",
        "secretsmanager:UpdateSecret",
        "secretsmanager:PutSecretValue"
      ],
      "Resource": "arn:aws:secretsmanager:us-east-1:582500931967:secret:Hromada-*"
    },
    {
      "Sid": "SecretsManagerList",
      "Effect": "Allow",
      "Action": "secretsmanager:ListSecrets",
      "Resource": "*"
    }
  ]
}
EOF
    ;;
    sns) cat <<'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "SNSAccess",
      "Effect": "Allow",
      "Action": [
        "sns:Publish",
        "sns:Subscribe",
        "sns:CreateTopic",
        "sns:DeleteTopic",
        "sns:ListTopics",
        "sns:ListSubscriptionsByTopic",
        "sns:GetTopicAttributes"
      ],
      "Resource": "arn:aws:sns:us-east-1:582500931967:Hromada-*"
    },
    {
      "Sid": "SNSListTopics",
      "Effect": "Allow",
      "Action": "sns:ListTopics",
      "Resource": "*"
    }
  ]
}
EOF
    ;;
    sqs) cat <<'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "SQSAccess",
      "Effect": "Allow",
      "Action": [
        "sqs:SendMessage",
        "sqs:ReceiveMessage",
        "sqs:DeleteMessage",
        "sqs:GetQueueAttributes",
        "sqs:CreateQueue",
        "sqs:DeleteQueue",
        "sqs:ListQueues"
      ],
      "Resource": "arn:aws:sqs:us-east-1:582500931967:Hromada-*"
    },
    {
      "Sid": "SQSListQueues",
      "Effect": "Allow",
      "Action": "sqs:ListQueues",
      "Resource": "*"
    }
  ]
}
EOF
    ;;
    *)
      echo "Error: No policy defined for module '$1'" >&2
      return 1
      ;;
  esac
}

# --- Helpers ---

ensure_policy() {
  local module="$1"
  local policy_name="${POLICY_PREFIX}${module}"
  local policy_arn="arn:aws:iam::${ACCOUNT_ID}:policy/${policy_name}"

  # Check if policy already exists
  if aws iam get-policy --policy-arn "$policy_arn" &>/dev/null; then
    echo "$policy_arn"
    return 0
  fi

  # Get the policy document
  local policy_doc
  policy_doc="$(get_policy_json "$module")"

  # Create the policy
  local created_arn
  created_arn="$(aws iam create-policy \
    --policy-name "$policy_name" \
    --policy-document "$policy_doc" \
    --description "$(get_module_desc "$module")" \
    --query 'Policy.Arn' \
    --output text)"

  audit "POLICY_CREATED" "Created policy $policy_name"
  echo "$created_arn"
}

is_valid_module() {
  local module="$1"
  local desc
  desc="$(get_module_desc "$module")"
  [ -n "$desc" ]
}

# --- Commands ---

cmd_list() {
  echo "Available permission modules:"
  echo ""
  printf "  %-18s  %-6s  %s\n" "MODULE" "STATUS" "DESCRIPTION"
  printf "  %-18s  %-6s  %s\n" "------" "------" "-----------"
  for module in $MODULES; do
    local marker="      "
    if is_active_module "$module"; then
      marker="active"
    fi
    printf "  %-18s  %-6s  %s\n" "$module" "$marker" "$(get_module_desc "$module")"
  done
  echo ""
  echo "active = currently used by the Hromada platform"
  echo ""
  echo "To request access:  $0 request <module> \"reason\""
}

cmd_status() {
  local user="$1"

  # Verify user exists
  if ! aws iam get-user --user-name "$user" &>/dev/null; then
    echo "Error: IAM user '$user' not found." >&2
    exit 1
  fi

  echo "Permissions for IAM user '$user':"
  echo ""

  # Get all attached policy names
  local attached
  attached="$(aws iam list-attached-user-policies --user-name "$user" \
    --query 'AttachedPolicies[].PolicyName' --output json)"

  for module in $MODULES; do
    local policy_name="${POLICY_PREFIX}${module}"
    local check=" "
    if echo "$attached" | jq -e ".[] | select(. == \"$policy_name\")" &>/dev/null; then
      check="x"
    fi
    printf "  [%s] %-18s  %s\n" "$check" "$module" "$(get_module_desc "$module")"
  done

  # Show non-Hromada policies
  echo ""
  echo "Other attached policies:"
  local other
  other="$(echo "$attached" | jq -r '.[]' | grep -v "^${POLICY_PREFIX}" || true)"
  if [ -n "$other" ]; then
    echo "$other" | while IFS= read -r p; do
      echo "  - $p"
    done
  else
    echo "  (none)"
  fi
}

cmd_grant() {
  local user="$1"
  local module="$2"

  if ! is_valid_module "$module"; then
    echo "Error: Unknown module '$module'. Run '$0 list' to see available modules." >&2
    exit 1
  fi

  # Verify user exists
  if ! aws iam get-user --user-name "$user" &>/dev/null; then
    echo "Error: IAM user '$user' not found." >&2
    exit 1
  fi

  # Check if already attached
  local policy_name="${POLICY_PREFIX}${module}"
  local already
  already="$(aws iam list-attached-user-policies --user-name "$user" \
    --query "AttachedPolicies[?PolicyName=='${policy_name}'].PolicyArn" --output text)"
  if [ -n "$already" ]; then
    echo "Module '$module' is already attached to user '$user'."
    return 0
  fi

  # Ensure policy exists and attach
  local policy_arn
  policy_arn="$(ensure_policy "$module")"
  aws iam attach-user-policy --user-name "$user" --policy-arn "$policy_arn"

  audit "GRANT" "Granted '$module' to user '$user'"
  echo "Granted '$module' to user '$user'."
}

cmd_revoke() {
  local user="$1"
  local module="$2"

  if [ "$module" = "self-service" ]; then
    echo "Error: Cannot revoke 'self-service' — it is a base module." >&2
    exit 1
  fi

  if ! is_valid_module "$module"; then
    echo "Error: Unknown module '$module'. Run '$0 list' to see available modules." >&2
    exit 1
  fi

  local policy_arn="arn:aws:iam::${ACCOUNT_ID}:policy/${POLICY_PREFIX}${module}"

  aws iam detach-user-policy --user-name "$user" --policy-arn "$policy_arn" 2>/dev/null || {
    echo "Error: Module '$module' is not attached to user '$user'." >&2
    exit 1
  }

  audit "REVOKE" "Revoked '$module' from user '$user'"
  echo "Revoked '$module' from user '$user'."
}

cmd_request() {
  local module="$1"
  local reason="${2:-no reason provided}"

  if ! is_valid_module "$module"; then
    echo "Error: Unknown module '$module'. Run '$0 list' to see available modules." >&2
    exit 1
  fi

  audit "REQUEST" "Requested '$module' — reason: $reason"

  echo "Request logged for module '$module'."
  echo "  Reason: $reason"
  echo "  Log:    Vault/iam-audit.txt"
  echo ""
  echo "Ask Tom to run:"
  echo "  ./scripts/aws-permissions.sh grant <your-iam-username> $module"
}

cmd_migrate() {
  local user="$1"

  echo "Migration: Replace monolithic HromadaProjectAdmin with modular policies"
  echo "User: $user"
  echo ""
  echo "Modules to attach:"
  for module in $MIGRATION_MODULES; do
    echo "  - $module: $(get_module_desc "$module")"
  done
  echo ""
  echo "Then detach: HromadaProjectAdmin"
  echo ""

  printf "Proceed? [y/N] "
  read -r confirm
  if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
    echo "Aborted."
    return 0
  fi

  echo ""

  # Attach all modular policies
  for module in $MIGRATION_MODULES; do
    echo "Attaching $module..."
    cmd_grant "$user" "$module"
  done

  # Detach old monolithic policy
  local old_policy="HromadaProjectAdmin"
  local old_arn
  old_arn="$(aws iam list-attached-user-policies --user-name "$user" \
    --query "AttachedPolicies[?PolicyName=='$old_policy'].PolicyArn" --output text || true)"

  if [ -n "$old_arn" ]; then
    echo ""
    echo "Detaching old monolithic policy '$old_policy'..."
    aws iam detach-user-policy --user-name "$user" --policy-arn "$old_arn"
    audit "MIGRATE" "Detached monolithic '$old_policy' from '$user'"
    echo "Detached '$old_policy'."
  else
    echo ""
    echo "Note: '$old_policy' was not attached to '$user' (already removed)."
  fi

  audit "MIGRATE" "Completed migration for '$user': $MIGRATION_MODULES"
  echo ""
  echo "Migration complete. Run '$0 status $user' to verify."
}

cmd_help() {
  cat <<HELP
Hromada IAM Permission Manager

Usage:
  $0 list                         Show available permission modules
  $0 status <user>                Show modules attached to a user
  $0 grant <user> <module>        Attach a module to a user
  $0 revoke <user> <module>       Detach a module from a user
  $0 request <module> [reason]    Log a permission request
  $0 migrate <user>               Replace HromadaProjectAdmin with modules

Examples:
  $0 list
  $0 status sloan
  $0 grant sloan dynamodb
  $0 request route53 "need DNS for custom domain"
  $0 revoke sloan dynamodb
HELP
}

# --- Main ---

main() {
  check_deps

  local cmd="${1:-help}"
  shift || true

  case "$cmd" in
    list)
      cmd_list
      ;;
    status)
      [ $# -lt 1 ] && { echo "Usage: $0 status <iam-username>" >&2; exit 1; }
      cmd_status "$1"
      ;;
    grant)
      [ $# -lt 2 ] && { echo "Usage: $0 grant <iam-username> <module>" >&2; exit 1; }
      cmd_grant "$1" "$2"
      ;;
    revoke)
      [ $# -lt 2 ] && { echo "Usage: $0 revoke <iam-username> <module>" >&2; exit 1; }
      cmd_revoke "$1" "$2"
      ;;
    request)
      [ $# -lt 1 ] && { echo "Usage: $0 request <module> [reason]" >&2; exit 1; }
      cmd_request "$1" "${2:-}"
      ;;
    migrate)
      [ $# -lt 1 ] && { echo "Usage: $0 migrate <iam-username>" >&2; exit 1; }
      cmd_migrate "$1"
      ;;
    help|--help|-h)
      cmd_help
      ;;
    *)
      echo "Unknown command: $cmd" >&2
      echo "Run '$0 help' for usage." >&2
      exit 1
      ;;
  esac
}

main "$@"
