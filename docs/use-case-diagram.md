# Use Case Diagram

This use case diagram models the operational actions of each user role in the ORBEM Solutions Airway Bill & Document Tracker.

```mermaid
graph LR
    %% Actors
    Customer[Customer / Exporter]
    DocExecutive[Documentation Executive]
    OpsAdmin[Operations Administrator]

    %% Use Cases
    subgraph Use Cases
        UC1(Track AWB Compliance Status)
        UC2(Intake New Airway Bill)
        UC3(Upload Compliance Documents)
        UC4(Approve / Reject Documents)
        UC5(Dispatch Operational Status Alerts)
        UC6(Mark Shipment Completed / Cancelled)
        UC7(Assign Shipment to Operators)
    end

    %% Relations
    Customer --> UC1
    Customer --> UC3

    DocExecutive --> UC2
    DocExecutive --> UC3
    DocExecutive --> UC4
    DocExecutive --> UC5

    OpsAdmin --> UC2
    OpsAdmin --> UC4
    OpsAdmin --> UC6
    OpsAdmin --> UC7
    OpsAdmin --> UC5
```

## Actor Definitions

### 1. Customer / Walk-in Exporter
- **Track Status**: Enters AWB number to check document checklist and audit completion rate in real-time.
- **Upload Documents**: Uploads missing ID proof, packing lists, invoices, and declarations if requested by the documentation team.

### 2. Documentation Executive (Employee)
- **Shipment Intake**: Enters dimensions, weights, pickup locations, and client contact email details.
- **Auditing**: Performs document checklist reviews, approving matching paperwork or rejecting incorrect files with a required explanation.
- **Alerting**: Dispatches manual alerts or reviews automated logs.

### 3. Operations Administrator (Admin)
- **System Control**: Has administrative override control to change status transitions, assign tasks to executives, cancel shipments, or mark consignments as completed.
