# Data Model Overview

**Org:** NRI ANZ  
**Retrieved:** 2026-06-24  
**Total Queryable Objects:** 45 (10 standard with data relevance, 6 org-specific custom, 9 managed package)

---

## Org-Specific Custom Objects

The custom data model implements a **CMS-style page/navigation framework** — pages are composed of sections positioned in layout regions, sections contain ordered content blocks, and dynamic links provide configurable navigation targets.

### Page__c

Represents a top-level page definition.

| Field | API Name | Type | Notes |
|-------|----------|------|-------|
| Page Name | `Name` | Text(80) | Auto-number or manual |
| Type | `Type__c` | Picklist | **Required.** `Home`, `Detail` |
| Active | `Active__c` | Checkbox | |

**Children:** `Section__c` (via `Page__c` lookup), `DynamicLink__c` (via `Page__c` lookup)

---

### Section__c

Represents a layout region within a page. Record types control where the section appears in the UI.

| Field | API Name | Type | Notes |
|-------|----------|------|-------|
| Section Name | `Name` | Text(80) | |
| Header | `Header__c` | Text(255) | |
| Sub Header | `Sub_Header__c` | Long Text Area | |
| Icon | `Icon__c` | Lookup(Icon__c) | |
| Page | `Page__c` | Lookup(Page__c) | Parent page |
| Video Link | `Video_Link__c` | URL | |
| Active | `Active__c` | Checkbox | |

**Record Types:**

| Record Type | Developer Name | Purpose |
|-------------|---------------|---------|
| Home Welcome | `Top` | Top/welcome area of home page |
| Left Container Top | `Left_Top` | Upper left layout region |
| Left Container Bottom | `Left_Bottom` | Lower left layout region |
| Right Container | `Right` | Right layout region |
| Popup | `Detail` | Popup/modal content |

**Children:** `SectionBlock__c` (via `Section__c` lookup), `DynamicLink__c` (via `Section__c` lookup)

---

### Block__c

A reusable content block that can be placed into sections.

| Field | API Name | Type | Notes |
|-------|----------|------|-------|
| Block Name | `Name` | Text(80) | |
| Header | `Header__c` | Text(255) | |
| Sub Header | `Sub_Header__c` | Text(255) | |
| Description | `Description__c` | Long Text Area | |
| Action | `Action__c` | Lookup(DynamicLink__c) | Navigation action |
| ActionText | `ActionText__c` | Text(255) | Button label text |
| Note | `Note__c` | Text(255) | Button trigger display text |
| Icon | `Icon__c` | Lookup(Icon__c) | |
| Active | `Active__c` | Checkbox | |

**Children:** `SectionBlock__c` (via `Block__c` lookup)

---

### SectionBlock__c

Junction object linking Sections to Blocks with display ordering.

| Field | API Name | Type | Notes |
|-------|----------|------|-------|
| SectionBlock Name | `Name` | Text(80) | |
| Section | `Section__c` | Lookup(Section__c) | |
| Block | `Block__c` | Lookup(Block__c) | |
| Order Sequence | `Order_Sequence__c` | Number | Controls display order |

---

### Icon__c

Stores Lightning Design System icon references.

| Field | API Name | Type | Notes |
|-------|----------|------|-------|
| Icon Name | `Name` | Text(80) | |
| Type | `Type__c` | Text(255) | Lightning icon name (e.g. `standard:account`) |
| Size | `Size__c` | Picklist | `x-small`, `xx-small`, `small` (default), `medium`, `large` |

**Referenced by:** `Block__c.Icon__c`, `Section__c.Icon__c`

---

### DynamicLink__c

Configurable navigation link that can target many different Salesforce page types. Record types determine which fields are relevant.

| Field | API Name | Type | Notes |
|-------|----------|------|-------|
| DynamicLink Name | `Name` | Text(80) | |
| Identity | `Identity__c` | Text(255) | Unique identifier, must include `DYN_LINK` |
| Link | `Link__c` | URL | External URL (https/http prefix) |
| Relative Url | `Relative_Url__c` | Text(255) | Relative path after domain (e.g. `/login`) |
| Page | `Page__c` | Lookup(Page__c) | |
| Section | `Section__c` | Lookup(Section__c) | |
| Page Name | `Page_Name__c` | Text(255) | |
| App API Name | `App_API_Name__c` | Text(255) | |
| Object | `Object__c` | Text(255) | SObject API name for list/record pages |
| Filter Name | `Filter_Name__c` | Text(200) | |
| Relationship API Name | `Relationship_API_Name__c` | Text(255) | |
| Where Condition | `Where_Condition__c` | Text(255) | |
| Text Value | `Text_Value__c` | Text(255) | |
| Site Name | `Site_Name__c` | Text(255) | Community/Experience site name |
| Setup Page | `Setup_Page__c` | Picklist | `User`, `Profile`, `PermissionSet` |

**Record Types:**

| Record Type | Developer Name | Purpose |
|-------------|---------------|---------|
| App Home Page | `AppPage` | Navigate to an app's home page |
| App API Name Page | `APINamePage` | Navigate by app API name |
| App Named Page | `NamedPage` | Navigate to a named page within an app |
| Record Page | `RecordPage` | Navigate to a specific record |
| Record Relationship Page | `RecordRelationshipPage` | Navigate to a related list/record |
| Object List Page | `ObjectPage` | Navigate to an object list view |
| InApp Details Page | `InAppDetailsPage` | In-app detail content |
| InApp Popup | `InAppPopup` | Display content in a popup/modal |
| Flow Record Page | `FlowRecordPage` | Launch a Flow |
| DPE Record Page | `DPERecordPage` | Navigate to a DPE (Digital Process Engine) record |
| Survey Record Page | `SurveyRecordPage` | Navigate to a survey |
| Web Link Page | `WebPage` | Navigate to an external URL |
| Community Page | `CommunityPage` | Navigate to an Experience Cloud page |
| Setup Page | `SetupPage` | Navigate to a setup page (User/Profile/PermissionSet) |

**Referenced by:** `Block__c.Action__c`

---

## Custom Fields on Standard Objects

### Account

| Field | API Name | Type |
|-------|----------|------|
| External Id | `External_Id__c` | Text(255) |
| Gift Entry External Id | `Gift_Entry_External_Id__c` | Text(255) |

### Contact

| Field | API Name | Type |
|-------|----------|------|
| External Id | `External_Id__c` | Text(255) |

### Lead, Opportunity, Case, Campaign, Product2, Order, Contract, Asset

No custom fields.

---

## Managed Package Objects (OmniStudio)

The org has the **OmniStudio** (Vlocity) managed package installed. These objects support the OmniStudio runtime and are not part of the org-specific data model.

| Object | API Name |
|--------|----------|
| Data Mapper Bulk Data | `omnistudio__DRBulkData__c` |
| Vlocity Data Mapper Batch Queue | `omnistudio__DRBatchQueue__c` |
| Vlocity Data Mapper Object Interface | `omnistudio__Interface_DRGeneric__c` |
| Vlocity DataPack Object | `omnistudio__VlocityDataPack__c` |
| Vlocity DocuSign Template | `omnistudio__VlocityDocuSignTemplate__c` |
| Vlocity Error Log Entry | `omnistudio__VlocityErrorLogEntry__c` |
| Vlocity Scheduled Job | `omnistudio__VlocityScheduledJob__c` |
| Vlocity Tracking Entry | `omnistudio__VlocityTrackingEntry__c` |
| Test Result | `omnistudio__TestResult__c` |

---

## Relationship Diagram

```
Page__c (Home / Detail)
 ├── Section__c (layout regions via Page__c lookup)
 │    ├── [Record Type: Home Welcome / Left Top / Left Bottom / Right / Popup]
 │    ├── SectionBlock__c (junction, ordered via Order_Sequence__c)
 │    │    └── Block__c
 │    │         ├── Icon__c (lookup)
 │    │         └── DynamicLink__c (Action lookup)
 │    ├── Icon__c (lookup)
 │    └── DynamicLink__c (Section lookup)
 └── DynamicLink__c (Page lookup)
      └── [14 Record Types for different navigation targets]

Account ──── External_Id__c, Gift_Entry_External_Id__c
Contact ──── External_Id__c
```

---

## Key Observations

1. **CMS/Portal Framework:** The custom objects form a content management system for building dynamic pages with configurable sections, content blocks, and navigation links — likely powering an Experience Cloud site or custom Lightning app.

2. **Flexible Navigation:** `DynamicLink__c` with 14 record types supports navigation to virtually any Salesforce page type (records, lists, flows, surveys, external URLs, community pages, setup pages).

3. **Composable Layout:** Pages are built from sections (positioned via record types), which contain ordered blocks (via the `SectionBlock__c` junction), enabling reusable content composition.

4. **Minimal Standard Object Customisation:** Only `Account` and `Contact` have custom fields (`External_Id__c`), suggesting the org relies on standard Salesforce CRM features with integration touchpoints via external IDs.

5. **OmniStudio Installed:** The presence of OmniStudio managed package objects indicates the org may use Digital Process Automation capabilities (OmniScripts, Integration Procedures, Data Mappers).
