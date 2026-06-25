# Use Case Diagram

This use case diagram details the interactions between the system actors (Customer/Exporter, Documentation Executive/Employee, Operations Administrator) and the platform functionalities.

```mermaid
graph LR
    Customer((Customer / Exporter))
    Employee((Documentation Executive))
    Admin((Operations Administrator))

    subgraph Platform [AWB & Document Tracker Boundary]
        UC1(Track AWB Status)
        UC2(Intake New Shipment)
        UC3(Upload Compliance Documents)
        UC4(View Uploaded PDFs)
        UC5(Approve Document checklist)
        UC6(Reject Document with Reason)
        UC7(Override Shipment Parameters)
        UC8(View Dispatch Alerts Logs)
        UC9(Mark Shipment Completed / Cancelled)
        UC10(View Global Audit Logs)
        UC11(Register New Operator Account)
    end

    Customer --> UC1
    Customer --> UC3

    Employee --> UC2
    Employee --> UC3
    Employee --> UC4
    Employee --> UC5
    Employee --> UC6
    Employee --> UC8
    Employee --> UC11

    Admin --> UC2
    Admin --> UC3
    Admin --> UC4
    Admin --> UC5
    Admin --> UC6
    Admin --> UC7
    Admin --> UC8
    Admin --> UC9
    Admin --> UC10
    Admin --> UC11
```
