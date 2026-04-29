# EndorseMe
To standardize the endorsement process and make sure no important patient data is missed when shifting. It aims to solve the problem of messy or incomplete verbal reports that happen when the ward is too busy.

## Updated App Flow
- Open EndorseMe Software
- Create Account / Log In
  - Create Account (Nurse Registration: Name, License No., Email, Password)
  - Log In as Nurse
- Nurse Dashboard
  - Add Patient (input patient data)
  - Select Patient
- Patient's Profile
- Patient's Module
  - IV Fluid
  - Labs
  - Diet
  - VS
  - I & O
  - Meds
  - SO
- Smart SBAR
  - Print Patient SBAR
  - Print SBAR Summary of All Patients

## Flowchart (Mermaid)
```mermaid
flowchart TD
    A[Open EndorseMe Software] --> B[Create Account / Log In]
    B --> C[Create Account]
    B --> D[Log In as Nurse]

    C --> C1[Nurse Registration]
    C1 --> C2[Name]
    C1 --> C3[License No.]
    C1 --> C4[Email / Password]

    C --> E[Nurse Dashboard]
    D --> E

    E --> F[Add Patient<br/>input patient's data]
    E --> G[Select Patient]

    F --> H[Patient's Profile]
    G --> H

    H --> I[Patient's Module]
    I --> I1[IV Fluid]
    I --> I2[Labs]
    I --> I3[Diet]
    I --> I4[VS]
    I --> I5[I & O]
    I --> I6[Meds]
    I --> I7[SO]

    I --> J[Smart SBAR]
    J --> K[Print Patient's SBAR]
    J --> L[Print SBAR Summary of all patient]
```
