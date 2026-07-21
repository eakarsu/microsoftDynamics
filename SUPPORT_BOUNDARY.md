# Support boundary

## Supported version

The implemented application boundary is `2026.07.20-sales-core.1`. A deployer must pin an immutable Git revision or image digest alongside this version; the version string alone is not a supply-chain identity.

## Acceptance contract

The release is acceptable only when all of these checks pass against the intended revision:

- both exact-lock installs complete;
- backend syntax, unit, and PostgreSQL integration tests pass;
- frontend production build passes;
- migration apply, repeat apply, pending check, and checksum drift behavior pass;
- full dependency audits contain no findings at the low-severity threshold;
- current-tree and full-history secret scans are reviewed;
- a backup restores into a guarded empty test database and all audit chains verify;
- live and ready probes succeed through the deployed network boundary;
- tenant, security, data, release, and recovery owners are named in the deployment record.

## Explicit exclusions

The following are not supported and are not represented as implemented:

- Microsoft Dynamics 365 parity, import compatibility, branding rights, or affiliation;
- generic CRUD for unrelated finance, HR, service, marketing, inventory, or project entities;
- AI scoring, content generation, copilots, external connectors, webhooks, Outlook, Teams, SAP, Power BI, or Power Automate;
- unreviewed public network exposure, multi-region availability, offline operation, mobile apps, SSO, SCIM, or field-level customization;
- deletion of audit events, hard deletion of leads/opportunities, or automated regulatory retention decisions;
- public release or redistribution without an owner-approved license.

## Ownership gate

Repository history does not identify accountable product, security, privacy, data, release, or recovery owners. Do not call a deployment production-supported until named people accept those roles in an external deployment record, define an incident channel and SLO, choose retention rules, and approve the legal/name/license posture.

## Data semantics

Qualification is deterministic, not predictive: budget, authority, and need contribute 25 points each; a timeline of at most 90 days contributes 25, at most 180 days contributes 15, and a longer timeline contributes zero. A score of 75 qualifies the lead. The application does not infer facts or make autonomous sales decisions.
