# Waternity ERD (Entity Relationship Diagram)

## Overview
ERD untuk sistem Waternity yang terintegrasi dengan Hedera Hashgraph services (HTS, HCS, HFS).

## Core Entities

### 1. User Management

```mermaid
erDiagram
    USER {
        string wallet_account_id PK
        string role
        string name
        string email
        timestamp created_at
        timestamp updated_at
        boolean is_active
    }
    
    ROLE {
        string role_id PK
        string role_name
        string description
        json permissions
    }
    
    USER ||--|| ROLE : has
```

### 2. Water Infrastructure

```mermaid
erDiagram
    WELL {
        string well_id PK
        string name
        string location
        decimal latitude
        decimal longitude
        string status
        decimal depth_meters
        decimal capacity_liters_per_hour
        string operator_account_id FK
        string hts_token_id
        timestamp created_at
        timestamp updated_at
    }
    
    KIOSK {
        string kiosk_id PK
        string well_id FK
        string name
        string location
        decimal latitude
        decimal longitude
        string status
        string valve_controller_id
        timestamp created_at
        timestamp updated_at
    }
    
    WELL ||--o{ KIOSK : serves
```

### 3. Project Management

```mermaid
erDiagram
    PROJECT {
        string project_id PK
        string name
        string description
        string operator_account_id FK
        decimal funding_target
        decimal funding_raised
        string status
        string hts_token_id
        timestamp start_date
        timestamp target_completion
        timestamp created_at
        timestamp updated_at
    }
    
    MILESTONE {
        string milestone_id PK
        string project_id FK
        string name
        string description
        decimal percentage
        string status
        string verification_method
        string qr_code_data
        string agent_account_id FK
        timestamp target_date
        timestamp completed_at
        timestamp created_at
        timestamp updated_at
    }
    
    PROJECT ||--o{ MILESTONE : contains
    PROJECT ||--|| WELL : creates
```

### 4. Investment & Tokenization

```mermaid
erDiagram
    INVESTMENT {
        string investment_id PK
        string investor_account_id FK
        string project_id FK
        decimal amount_hbar
        decimal token_amount
        string hts_transaction_id
        string status
        timestamp invested_at
        timestamp created_at
    }
    
    TOKEN {
        string hts_token_id PK
        string project_id FK
        string token_name
        string token_symbol
        decimal total_supply
        decimal circulating_supply
        string token_type
        timestamp created_at
    }
    
    REVENUE_DISTRIBUTION {
        string distribution_id PK
        string project_id FK
        decimal total_revenue_hbar
        decimal distribution_per_token
        string hts_transaction_id
        string status
        timestamp distribution_date
        timestamp created_at
    }
    
    INVESTMENT }|--|| PROJECT : funds
    TOKEN ||--|| PROJECT : represents
    REVENUE_DISTRIBUTION }|--|| PROJECT : distributes_from
```

### 5. Operations & Monitoring

```mermaid
erDiagram
    WATER_USAGE {
        string usage_id PK
        string kiosk_id FK
        string customer_account_id
        decimal liters_dispensed
        decimal amount_paid_hbar
        string payment_transaction_id
        timestamp usage_timestamp
        timestamp created_at
    }
    
    VALVE_CONTROL {
        string control_id PK
        string kiosk_id FK
        string agent_account_id FK
        string action
        string reason
        boolean is_active
        timestamp action_timestamp
        timestamp created_at
    }
    
    METER_READING {
        string reading_id PK
        string kiosk_id FK
        decimal total_liters
        decimal flow_rate
        string status
        timestamp reading_timestamp
        timestamp created_at
    }
    
    KIOSK ||--o{ WATER_USAGE : records
    KIOSK ||--o{ VALVE_CONTROL : controlled_by
    KIOSK ||--o{ METER_READING : monitored_by
```

### 6. Hedera Integration

```mermaid
erDiagram
    HCS_EVENT {
        string event_id PK
        string message_id
        string topic_id
        string event_type
        json event_data
        string entity_id
        string entity_type
        string triggered_by_account_id
        string hcs_transaction_id
        string hcs_consensus_timestamp
        timestamp created_at
    }
    
    HFS_DOCUMENT {
        string document_id PK
        string hfs_file_id
        string document_type
        string title
        string description
        string entity_id
        string entity_type
        string uploaded_by_account_id
        decimal file_size_bytes
        string content_hash
        timestamp uploaded_at
        timestamp created_at
    }
    
    SETTLEMENT {
        string settlement_id PK
        string well_id FK
        decimal period_start_timestamp
        decimal period_end_timestamp
        decimal total_revenue_hbar
        decimal operator_share_hbar
        decimal investor_share_hbar
        string status
        string hcs_event_id FK
        string hts_distribution_tx_id
        timestamp calculated_at
        timestamp processed_at
        timestamp created_at
    }
    
    HCS_EVENT ||--o{ PROJECT : audits
    HCS_EVENT ||--o{ MILESTONE : audits
    HCS_EVENT ||--o{ INVESTMENT : audits
    HCS_EVENT ||--o{ WATER_USAGE : audits
    HCS_EVENT ||--o{ SETTLEMENT : audits
    
    HFS_DOCUMENT ||--o{ PROJECT : documents
    HFS_DOCUMENT ||--o{ MILESTONE : documents
    
    SETTLEMENT ||--|| WELL : settles_for
    SETTLEMENT ||--|| HCS_EVENT : recorded_in
```

## Key Relationships Summary

1. **Users & Roles**: Wallet-based authentication with role-based access control
2. **Infrastructure**: Wells serve multiple Kiosks for water distribution
3. **Projects**: Operators create projects with milestones, funded by investors
4. **Tokenization**: Each project can have HTS tokens representing ownership shares
5. **Operations**: Kiosks record usage, controlled by agents, monitored continuously
6. **Audit Trail**: All critical actions recorded as HCS events with immutable timestamps
7. **Document Storage**: Project documents and reports stored on HFS
8. **Revenue Sharing**: Automated settlements distribute revenue to token holders

## Hedera Services Integration

### HTS (Hedera Token Service)
- **Project Tokens**: Fungible tokens representing project ownership
- **Revenue Distribution**: Automated token-based revenue sharing
- **Investment Tracking**: Token transfers for investment records

### HCS (Hedera Consensus Service)
- **Audit Events**: All critical system actions logged immutably
- **Milestone Verification**: QR-based milestone completion proofs
- **Settlement Records**: Revenue distribution transparency
- **Valve Control**: Water access control audit trail

### HFS (Hedera File Service)
- **Project Documents**: Construction plans, permits, reports
- **Milestone Evidence**: Photos, certificates, compliance docs
- **Periodic Bundles**: Aggregated operational data archives

## Idempotency Implementation

- All write operations include `message_id` (UUID v4)
- Duplicate operations with same `message_id` are safely ignored
- Critical for retry scenarios and network reliability
- Implemented at both application and Hedera service levels

## Data Flow Architecture

1. **Write Operations** → Generate HCS Event → Update Local DB
2. **Document Uploads** → Store in HFS → Record metadata locally
3. **Token Operations** → Execute HTS transaction → Log in HCS
4. **Settlements** → Calculate locally → Distribute via HTS → Record in HCS
5. **Audit Queries** → Mirror Node API → Real-time verification

This ERD provides the foundation for a fully auditable, tokenized water infrastructure management system built on Hedera Hashgraph.