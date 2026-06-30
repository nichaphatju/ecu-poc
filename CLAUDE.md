# Project Memory

## Project Overview

This is a Salesforce DX project using the standard Salesforce source format.

Primary source directory:

```bash
force-app/main/default
```

The project includes:

* Apex classes and triggers
* Lightning Web Components
* Aura components
* Flows
* Custom objects
* Custom fields
* Custom metadata
* Other declarative Salesforce metadata

This project currently uses manual deployment and retrieval processes. GitHub and Gearset may be introduced in the future, but no formal branching or CI/CD process is currently in place.

---

## Core Working Rules

Claude must follow these rules at all times:

1. Always retrieve the latest metadata before suggesting or preparing changes.
2. Do not assume the local source is up to date.
3. Do not deploy changes unless the user explicitly asks for deployment.
4. Suggest deployment steps only after explaining what changed.
5. Ask before making changes to sensitive metadata.
6. Do not modify Profiles or Permission Sets unless explicitly instructed.
7. Follow the existing project patterns where they exist.
8. Prefer safe, minimal, reviewable changes.
9. Do not introduce unnecessary frameworks, abstractions, or new dependencies.
10. Explain any assumptions before applying them.

---

## Salesforce Org and CLI Context

Use the default Salesforce org unless the user specifies another org.

Common commands:

```bash
sf org display
sf project retrieve start
sf project deploy start
sf apex run test
npx prettier --write .
```

Before working on metadata, retrieve first:

```bash
sf project retrieve start
```

For specific metadata retrieval, prefer targeted retrieval where possible, for example:

```bash
sf project retrieve start --metadata ApexClass:MyClass
sf project retrieve start --metadata LightningComponentBundle:myLwc
sf project retrieve start --metadata CustomObject:MyObject__c
```

Do not run deployment commands unless the user confirms they want to deploy.

Deployment commands must be suggested, not executed, unless explicitly approved:

```bash
sf project deploy start
```

---

## Repository Structure

Expected structure:

```bash
force-app/
  main/
    default/
      applications/
      aura/
      classes/
      customMetadata/
      flows/
      flexipages/
      layouts/
      lwc/
      objects/
      permissionsets/
      profiles/
      tabs/
      triggers/
```

Important files:

```bash
sfdx-project.json
package.json
.prettierrc
.gitignore
```

Do not reorganise the project structure unless the user explicitly asks.

---

## Development Workflow

When asked to change functionality:

1. Understand the request.
2. Identify impacted metadata.
3. Retrieve the latest metadata first.
4. Review the existing implementation and patterns.
5. Suggest the proposed approach.
6. Make only the necessary changes.
7. Run formatting.
8. Suggest relevant Apex tests.
9. Summarise changed files.
10. Ask the user whether they want to deploy.

Expected flow:

```bash
sf project retrieve start
# review existing files
# make changes
npx prettier --write .
sf apex run test
# suggest deployment only after user review
```

---

## Apex Standards

### General Apex Rules

Apex must be:

* Bulk-safe
* Secure
* Testable
* Readable
* Maintainable
* Consistent with existing project patterns

Avoid:

* SOQL inside loops
* DML inside loops
* Hardcoded record IDs
* Hardcoded profile names
* Hardcoded permission set names
* Unnecessary static state
* Overly complex logic in triggers or controllers
* Business logic directly inside LWC/Aura controllers

Use constants where appropriate.

Use custom metadata for configurable behaviour where reasonable.

---

## Trigger Standards

Every trigger must have a handler.

Do not place business logic directly in triggers.

Trigger example pattern:

```apex
trigger AccountTrigger on Account (
    before insert,
    before update,
    after insert,
    after update
) {
    AccountTriggerHandler handler = new AccountTriggerHandler();

    if (Trigger.isBefore) {
        if (Trigger.isInsert) {
            handler.beforeInsert(Trigger.new);
        }

        if (Trigger.isUpdate) {
            handler.beforeUpdate(Trigger.new, Trigger.oldMap);
        }
    }

    if (Trigger.isAfter) {
        if (Trigger.isInsert) {
            handler.afterInsert(Trigger.new);
        }

        if (Trigger.isUpdate) {
            handler.afterUpdate(Trigger.new, Trigger.oldMap);
        }
    }
}
```

Handler example pattern:

```apex
public with sharing class AccountTriggerHandler {
    public void beforeInsert(List<Account> newRecords) {
        AccountService.applyDefaults(newRecords);
    }

    public void beforeUpdate(
        List<Account> newRecords,
        Map<Id, Account> oldRecordMap
    ) {
        AccountService.validateChanges(newRecords, oldRecordMap);
    }

    public void afterInsert(List<Account> newRecords) {
        AccountService.processAfterInsert(newRecords);
    }

    public void afterUpdate(
        List<Account> newRecords,
        Map<Id, Account> oldRecordMap
    ) {
        AccountService.processAfterUpdate(newRecords, oldRecordMap);
    }
}
```

---

## Service Layer Pattern

Business logic should live in service classes, not triggers, controllers, or UI components.

Preferred layering:

```text
Trigger
  -> Trigger Handler
    -> Service Class
      -> Selector / Query Helper where useful
```

For LWC and Aura:

```text
LWC / Aura
  -> Apex Controller
    -> Service Class
      -> Selector / Query Helper where useful
```

Controller classes should be thin.

Service classes should contain business rules, orchestration, validations, and reusable operations.

Selector/query helper classes may be used when query logic is reused or complex.

---

## Apex Security

Use `with sharing`, `without sharing`, or `inherited sharing` intentionally.

Default preference:

```apex
public with sharing class MyClass {
}
```

Use `inherited sharing` where the class is reused across different execution contexts and sharing should follow the caller.

Use `without sharing` only when required and document why.

When exposing Apex to LWC or Aura:

* Validate inputs.
* Avoid returning sensitive fields.
* Use sharing intentionally.
* Apply CRUD/FLS checks where required.
* Avoid exposing broad update/delete methods.
* Do not trust client-side validation only.

For user-facing data access, consider:

```apex
WITH SECURITY_ENFORCED
```

or explicit field/object access checks where more control is required.

---

## SOQL and DML Standards

SOQL must be bulk-safe.

Good pattern:

```apex
Set<Id> accountIds = new Map<Id, Account>(accounts).keySet();

List<Contact> contacts = [
    SELECT Id, AccountId, Email
    FROM Contact
    WHERE AccountId IN :accountIds
];
```

Avoid:

```apex
for (Account accountRecord : accounts) {
    List<Contact> contacts = [
        SELECT Id
        FROM Contact
        WHERE AccountId = :accountRecord.Id
    ];
}
```

DML must be performed outside loops.

Use partial success where appropriate:

```apex
Database.SaveResult[] results = Database.update(recordsToUpdate, false);
```

Handle errors clearly and avoid swallowing exceptions.

---

## LWC Standards

LWC should be preferred for new UI work unless the existing feature is Aura-based and consistency requires Aura.

LWC rules:

* Keep components focused and small.
* Move business logic to Apex where appropriate.
* Avoid duplicating server-side validation.
* Use reactive properties correctly.
* Use clear naming.
* Avoid excessive imperative Apex calls.
* Use `@wire` where it improves readability and data refresh behaviour.
* Use `refreshApex` when needed.
* Use Lightning Data Service where suitable.

Do not hardcode labels or messages where Custom Labels would be better.

Prefer readable JavaScript over clever code.

---

## Aura Standards

Aura may exist for legacy functionality.

When modifying Aura:

* Keep changes minimal.
* Follow the existing component structure.
* Avoid converting Aura to LWC unless requested.
* Do not mix large architectural changes with bug fixes.
* Use Apex service classes for business logic.

---

## Flow and Declarative Metadata Standards

Flows are part of the project and must be treated as production logic.

When working with Flows:

* Retrieve before editing.
* Avoid unnecessary changes to generated XML.
* Be careful with active flow versions.
* Document any behaviour changes clearly.
* Prefer small, controlled updates.
* Consider Apex only when Flow becomes too complex, hard to test, or hard to maintain.

For declarative metadata:

* Keep naming clear and consistent with the existing org.
* Avoid changing API names unless explicitly required.
* Be careful with dependencies across layouts, record pages, validation rules, flows, and Apex.

---

## Custom Metadata Standards

Use Custom Metadata Types for configurable business rules where appropriate.

Do not hardcode values that are likely to vary by environment or business process.

Examples of good Custom Metadata usage:

* Feature flags
* Mapping rules
* Integration endpoints or keys, excluding secrets
* Business thresholds
* Routing rules
* Display configuration

Never store secrets in Custom Metadata.

---

## Custom Objects and Fields

When creating or modifying objects and fields:

* Use clear API names.
* Use descriptions where helpful.
* Consider field-level security impact.
* Consider page layout and Lightning page impact.
* Consider reports, flows, validation rules, Apex, and integrations.
* Do not modify Profiles or Permission Sets unless explicitly instructed.

For new fields, ask whether access should be granted later through Permission Sets.

---

## Profiles and Permission Sets

Profiles and Permission Sets are sensitive metadata.

Do not modify:

```bash
force-app/main/default/profiles
force-app/main/default/permissionsets
```

unless the user explicitly asks.

If access changes are required, explain what access may be needed and ask the user before modifying permission metadata.

---

## Testing Standards

Run Apex tests when Apex changes are made.

Default command:

```bash
sf apex run test
```

For targeted tests:

```bash
sf apex run test --tests MyClassTest
```

Apex tests should:

* Use clear test data setup.
* Avoid relying on existing org data.
* Cover positive and negative scenarios.
* Cover bulk scenarios where relevant.
* Assert expected outcomes.
* Avoid excessive `SeeAllData=true`.
* Test security-sensitive behaviour where practical.

When adding or changing Apex, add or update tests unless the user says not to.

---

## Formatting

Run Prettier after changes:

```bash
npx prettier --write .
```

Do not reformat unrelated files unnecessarily if it creates noisy diffs.

---

## Manual Deployment Process

Current deployment process is manual.

Before suggesting deployment:

1. Confirm retrieved metadata is current.
2. Summarise changed files.
3. Summarise test results or recommended tests.
4. Highlight risks.
5. Ask the user whether they want to deploy.

Suggested deployment command:

```bash
sf project deploy start
```

For targeted deployment:

```bash
sf project deploy start --source-dir force-app/main/default/classes/MyClass.cls
```

Do not deploy automatically.

---

## Future GitHub and Gearset Process

GitHub and Gearset may be introduced later.

When GitHub/Gearset is introduced, prefer this future workflow:

1. Create a feature branch.
2. Retrieve latest metadata from the source org.
3. Make changes locally.
4. Run Prettier.
5. Run Apex tests.
6. Commit clear, focused changes.
7. Open a pull request.
8. Validate deployment through Gearset.
9. Deploy through Gearset after approval.

Do not assume this workflow is active yet.

---

## Change Review Checklist

Before finalising any change, check:

* Was metadata retrieved first?
* Are changes minimal and relevant?
* Are Profiles and Permission Sets untouched unless approved?
* Is Apex bulk-safe?
* Is trigger logic delegated to a handler?
* Is business logic in a service layer?
* Are SOQL and DML outside loops?
* Are security considerations addressed?
* Are tests added or updated where needed?
* Was Prettier run?
* Is deployment only suggested, not performed?

---

## Response Style for Claude

When responding to the user:

* Be concise but detailed enough for technical review.
* Explain what files are impacted.
* Explain why the approach is recommended.
* Mention risks or assumptions.
* Ask before deployment.
* Do not over-engineer the solution.
* Do not make unsupported assumptions.
* Prefer Salesforce best practices over shortcuts.

For change summaries, use this format:

```text
Changed:
- path/to/file.cls — summary of change
- path/to/file.js — summary of change

Validation:
- Prettier: passed / not run
- Apex tests: passed / not run / recommended

Notes:
- Any assumptions, risks, or follow-up actions

Deployment:
- Not deployed. Please confirm if you want to deploy.
```

---

## Things Claude Must Not Do Without Confirmation

Claude must not do the following without explicit user confirmation:

* Deploy metadata
* Modify Profiles
* Modify Permission Sets
* Delete metadata
* Rename API names
* Change active Flow behaviour
* Change sharing model
* Change security-related logic
* Introduce a new framework or package
* Make broad refactoring changes
* Modify unrelated files

---

## Preferred Design Principles

Use these principles when proposing solutions:

* Configuration over hardcoding
* Service layer for business logic
* Thin controllers
* Handler-based triggers
* Bulk-safe Apex
* Secure Apex
* Small, focused changes
* Clear test coverage
* Minimal deployment risk
* Consistency with existing project patterns

---

## Default Assumptions to Avoid

Do not assume:

* The local metadata is current
* GitHub is already active
* Gearset is already active
* Any org alias other than the default org
* Profiles or Permission Sets can be safely changed
* Deployment is approved
* Existing naming patterns are wrong
* A refactor is acceptable without approval

When unsure, ask the user.

---

## Documentation

The system data model is maintained in:

docs/data-model.md

Before creating or modifying:
- Custom Objects
- Custom Fields
- Relationships
- Data Migration
- Integrations
- Reporting

Review the data model document first.

After creating or modifying objects or fields:

- Always update docs/data-model.md
- Keep object definitions current
- Keep relationship diagrams current