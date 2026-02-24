# ADR-004: Modular IAM Permission Management

**Status:** Accepted
**Date:** 2026-02-23
**Authors:** Tom

## Context

Sloan's AWS access is managed via a single monolithic IAM policy (`HromadaProjectAdmin`) covering Amplify, SES, Lambda, API Gateway, S3, CloudWatch, CloudFormation, and IAM self-service. When Sloan needs access to a new service, Tom has to manually craft IAM policy JSON and run multiple CLI commands. There is no self-service discovery, no request workflow, and no audit trail.

## Decision

Replace the monolithic policy with per-service modular policies (`Hromada-<ModuleName>`), managed by a self-contained bash script at `scripts/aws-permissions.sh`. The script handles the full permission lifecycle: listing available modules, requesting access, granting/revoking, and audit logging.

Sloan runs `request` to log what he needs. Tom runs `grant` to approve. Every action is timestamped in `Vault/iam-audit.txt`.

## Alternatives Considered

| Alternative | Pros | Cons |
|------------|------|------|
| AWS IAM Identity Center (SSO) | Centralized, scalable | Overkill for 2 people, requires AWS Organizations |
| Terraform / CDK | Infrastructure-as-code, declarative | Heavy dependency, overkill for current scale |
| Manual AWS Console management | No tooling needed | No audit trail, error-prone, not reproducible |

## Consequences

- Individual service permissions can be granted/revoked independently
- Audit trail provides accountability for all permission changes
- New team members get only what they need (principle of least privilege)
- AWS IAM allows max 10 managed policies per user by default; may need a limit increase if granting 10+ modules
- Script is bash 3.2 compatible (works on stock macOS)
