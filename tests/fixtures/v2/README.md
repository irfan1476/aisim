# V2 regression save fixtures

These are small, non-sensitive representatives of V2 (persistence version 5)
saves accepted by the application. They intentionally contain only values a
browser save can produce; omitted fields are filled by `normalizeGameState`.

The set covers Standard and each registered V1 scenario: `projectFactory`,
`bankNext`, `care360`, and `futureReady`. Each fixture is a one-resolved-
quarter checkpoint. Keep these version-5 inputs unchanged when adding V3
migrations; add separate expectations for any new versioned state contract.

Do not add customer data, credentials, browser storage dumps, or build output.
