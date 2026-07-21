# Security policy

## Reporting

Do not place vulnerabilities, credentials, customer data, or exploit details in a public issue. Use the repository host’s private security-advisory channel or the private incident contact recorded by the deployer. No public response SLA is promised until a security owner accepts the role described in `SUPPORT_BOUNDARY.md`.

## Enforced controls

- JWTs use HS256 with an explicitly validated 32-byte-or-longer secret, issuer, audience, subject, and 15-minute expiry.
- Each authenticated request reloads the active user and current role from PostgreSQL; deactivation takes effect immediately.
- Tenant identity comes only from the verified token and database membership, never from request input.
- Sales representatives are owner-scoped; manager/administrator reads remain tenant-scoped.
- CORS is an exact origin allowlist, bodies are capped at 64 KiB, SQL values are parameterized, and sort/table names are not user-controlled.
- Mutations validate type, length, range, optimistic version, and state transition. Create/convert requests have persisted idempotency receipts.
- Audit rows are append-only by trigger and hash-linked per tenant. This detects ordinary tampering; a database superuser remains inside the trust boundary.
- No AI provider, webhook, connector, payment, email, or cloud credential is accepted by the supported runtime.
- Production containers run without root, capabilities, or a writable root filesystem. PostgreSQL is not published by Compose.

## Secret handling

Never commit `.env`, database URLs, JWT secrets, bootstrap passwords, dumps, or service credentials. Use the platform secret store and rotate on suspected disclosure. JWT secret rotation invalidates all outstanding tokens within their otherwise 15-minute lifetime. Remove bootstrap variables immediately after initial provisioning.

The ignored `.env` files in a local checkout are operator-owned and are not proof of safe values. Scan the Git history before deployment and rotate any value that has ever been committed or shared.

## Threat-model limits

This boundary does not provide SSO/MFA, row-level security enforced inside PostgreSQL, encrypted application fields, a managed WAF, DDoS protection, cross-region disaster recovery, or regulatory certification. TLS termination, disk encryption, database least privilege, log access, rate limiting beyond login, monitoring, and network policy are deployment responsibilities.
