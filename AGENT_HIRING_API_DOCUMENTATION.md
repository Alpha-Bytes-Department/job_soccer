# Agent Hiring API Documentation

## Overview
The Agent Hiring API allows candidates and employers to hire agents for job assistance, manage hiring requests, and track hiring status throughout the lifecycle.

## Base URL
```
/api/v1/agent-hiring
```

## Authentication
All endpoints require authentication using Bearer token.
- **Header**: `Authorization: Bearer <token>`

## User Access Levels
- **Candidate**: Can hire agents and manage their hirings
- **Employer**: Can hire agents and manage their hirings
- **Agent (Employer with Agent role)**: Can receive and manage hiring requests

---

## Endpoints

### 1. Create Agent Hiring Request

**Endpoint**: `POST /api/v1/agent-hiring`

**Description**: Create a new hiring request to hire an agent.

**Access**: Private (Candidate & Employer)

**Request Body**:
```json
{
  "agentUserId": "507f1f77bcf86cd799439011"
}
```

**Request Body Schema**:
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| agentUserId | string | Yes | MongoDB ObjectId of the agent to hire (24 character hex string) |

**Success Response** (201 Created):
```json
{
  "statusCode": 201,
  "success": true,
  "message": "Agent hiring request created successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439012",
    "agentUserId": "507f1f77bcf86cd799439011",
    "hiredByUserId": "507f1f77bcf86cd799439013",
    "hiredByUserType": "candidate",
    "hiredByUserRole": "candidate",
    "status": "pending",
    "hiredAt": "2025-12-23T10:30:00.000Z",
    "createdAt": "2025-12-23T10:30:00.000Z",
    "updatedAt": "2025-12-23T10:30:00.000Z"
  }
}
```

**Validation Rules**:
- `agentUserId` must be a valid 24-character MongoDB ObjectId hex string
- User cannot hire the same agent if an active hiring already exists
- Agent must exist and have an agent role

**Error Responses**:
- `400 Bad Request`: Invalid agentUserId format
- `401 Unauthorized`: No authentication token provided
- `403 Forbidden`: User is not authorized
- `404 Not Found`: Agent user not found or is not an agent
- `409 Conflict`: Active hiring with this agent already exists

---

### 2. Get My Hirings

**Endpoint**: `GET /api/v1/agent-hiring/my-hirings`

**Description**: Get all hiring requests created by the authenticated user (agents they have hired).

**Access**: Private (Candidate & Employer)

**Query Parameters**:
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| page | number | No | 1 | Page number for pagination |
| limit | number | No | 10 | Number of items per page |
| status | string | No | all | Filter by status: `pending`, `accepted`, `rejected`, `completed`, or `all` |

**Success Response** (200 OK):
```json
{
  "statusCode": 200,
  "success": true,
  "message": "Your hirings retrieved successfully",
  "data": [
    {
      "_id": "507f1f77bcf86cd799439012",
      "agentUserId": {
        "_id": "507f1f77bcf86cd799439011",
        "firstName": "John",
        "lastName": "Doe",
        "profilePicture": "https://example.com/avatar.jpg",
        "role": "agent"
      },
      "hiredByUserId": "507f1f77bcf86cd799439013",
      "hiredByUserType": "candidate",
      "hiredByUserRole": "candidate",
      "status": "accepted",
      "hiredAt": "2025-12-23T10:30:00.000Z",
      "acceptedAt": "2025-12-23T11:00:00.000Z",
      "createdAt": "2025-12-23T10:30:00.000Z",
      "updatedAt": "2025-12-23T11:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 15,
    "totalPage": 2
  }
}
```

**Status Values**:
- `pending`: Hiring request sent, awaiting agent response
- `accepted`: Agent accepted the hiring request
- `rejected`: Agent rejected the hiring request
- `completed`: Hiring service completed by user

---

### 3. Get Agent Requests

**Endpoint**: `GET /api/v1/agent-hiring/agent-requests`

**Description**: Get all hiring requests received by the authenticated agent.

**Access**: Private (Employer with Agent role)

**Query Parameters**:
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| page | number | No | 1 | Page number for pagination |
| limit | number | No | 10 | Number of items per page |
| status | string | No | all | Filter by status: `pending`, `accepted`, `rejected`, `completed`, or `all` |

**Success Response** (200 OK):
```json
{
  "statusCode": 200,
  "success": true,
  "message": "Agent hiring requests retrieved successfully",
  "data": [
    {
      "_id": "507f1f77bcf86cd799439012",
      "agentUserId": "507f1f77bcf86cd799439011",
      "hiredByUserId": {
        "_id": "507f1f77bcf86cd799439013",
        "firstName": "Jane",
        "lastName": "Smith",
        "profilePicture": "https://example.com/avatar2.jpg",
        "userType": "candidate"
      },
      "hiredByUserType": "candidate",
      "hiredByUserRole": "candidate",
      "status": "pending",
      "hiredAt": "2025-12-23T10:30:00.000Z",
      "createdAt": "2025-12-23T10:30:00.000Z",
      "updatedAt": "2025-12-23T10:30:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 8,
    "totalPage": 1
  }
}
```

**Note**: Only users with employer type and agent role can access this endpoint.

---

### 4. Get Hiring by ID

**Endpoint**: `GET /api/v1/agent-hiring/:hiringId`

**Description**: Get detailed information about a specific hiring request.

**Access**: Private (Candidate & Employer)

**Path Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| hiringId | string | Yes | MongoDB ObjectId of the hiring (24 character hex string) |

**Success Response** (200 OK):
```json
{
  "statusCode": 200,
  "success": true,
  "message": "Hiring retrieved successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439012",
    "agentUserId": {
      "_id": "507f1f77bcf86cd799439011",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      "profilePicture": "https://example.com/avatar.jpg",
      "role": "agent",
      "phone": "+1234567890"
    },
    "hiredByUserId": {
      "_id": "507f1f77bcf86cd799439013",
      "firstName": "Jane",
      "lastName": "Smith",
      "email": "jane.smith@example.com",
      "profilePicture": "https://example.com/avatar2.jpg",
      "userType": "candidate"
    },
    "hiredByUserType": "candidate",
    "hiredByUserRole": "candidate",
    "status": "accepted",
    "hiredAt": "2025-12-23T10:30:00.000Z",
    "acceptedAt": "2025-12-23T11:00:00.000Z",
    "createdAt": "2025-12-23T10:30:00.000Z",
    "updatedAt": "2025-12-23T11:00:00.000Z"
  }
}
```

**Validation Rules**:
- User must be either the agent or the hiring user to access this hiring

**Error Responses**:
- `400 Bad Request`: Invalid hiringId format
- `401 Unauthorized`: No authentication token provided
- `403 Forbidden`: User not authorized to view this hiring
- `404 Not Found`: Hiring not found

---

### 5. Update Hiring Status

**Endpoint**: `PATCH /api/v1/agent-hiring/:hiringId/status`

**Description**: Update the status of a hiring request. Agents can accept/reject, and hiring users can mark as completed.

**Access**: Private (Candidate & Employer)

**Path Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| hiringId | string | Yes | MongoDB ObjectId of the hiring (24 character hex string) |

**Request Body**:
```json
{
  "status": "accepted"
}
```

**Request Body Schema**:
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| status | string | Yes | New status: `accepted`, `rejected`, or `completed` |

**Success Response** (200 OK):
```json
{
  "statusCode": 200,
  "success": true,
  "message": "Hiring accepted successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439012",
    "agentUserId": "507f1f77bcf86cd799439011",
    "hiredByUserId": "507f1f77bcf86cd799439013",
    "hiredByUserType": "candidate",
    "hiredByUserRole": "candidate",
    "status": "accepted",
    "hiredAt": "2025-12-23T10:30:00.000Z",
    "acceptedAt": "2025-12-23T11:00:00.000Z",
    "createdAt": "2025-12-23T10:30:00.000Z",
    "updatedAt": "2025-12-23T11:00:00.000Z"
  }
}
```

**Authorization Rules**:
- **Agent can**: 
  - Accept a pending hiring request (`pending` → `accepted`)
  - Reject a pending hiring request (`pending` → `rejected`)
- **Hiring User can**:
  - Mark an accepted hiring as completed (`accepted` → `completed`)

**Validation Rules**:
- Status can only be `accepted`, `rejected`, or `completed`
- Cannot change status from `rejected` or `completed`
- Only agent can accept/reject pending requests
- Only hiring user can mark as completed
- Can only mark as completed if currently accepted

**Error Responses**:
- `400 Bad Request`: Invalid hiringId format or invalid status
- `401 Unauthorized`: No authentication token provided
- `403 Forbidden`: User not authorized to update this hiring status
- `404 Not Found`: Hiring not found
- `409 Conflict`: Invalid status transition

---

### 6. Check Active Hiring

**Endpoint**: `GET /api/v1/agent-hiring/check-active/:agentUserId`

**Description**: Check if the authenticated user has an active hiring with a specific agent.

**Access**: Private (Candidate & Employer)

**Path Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| agentUserId | string | Yes | MongoDB ObjectId of the agent (24 character hex string) |

**Success Response** (200 OK):
```json
{
  "statusCode": 200,
  "success": true,
  "message": "User has an active hiring with this agent",
  "data": {
    "hasActiveHiring": true,
    "hiring": {
      "_id": "507f1f77bcf86cd799439012",
      "agentUserId": "507f1f77bcf86cd799439011",
      "hiredByUserId": "507f1f77bcf86cd799439013",
      "status": "accepted",
      "hiredAt": "2025-12-23T10:30:00.000Z",
      "acceptedAt": "2025-12-23T11:00:00.000Z"
    }
  }
}
```

**Response (No Active Hiring)**:
```json
{
  "statusCode": 200,
  "success": true,
  "message": "User does not have an active hiring with this agent",
  "data": {
    "hasActiveHiring": false,
    "hiring": null
  }
}
```

**Notes**:
- Active hiring means status is `pending` or `accepted`
- Useful for preventing duplicate hiring requests
- Can be used to enable/disable "Hire Agent" button in UI

---

## Common Error Responses

### 401 Unauthorized
```json
{
  "statusCode": 401,
  "success": false,
  "message": "You are not authorized",
  "errorMessages": [
    {
      "path": "",
      "message": "You are not authorized"
    }
  ]
}
```

### 403 Forbidden
```json
{
  "statusCode": 403,
  "success": false,
  "message": "Forbidden",
  "errorMessages": [
    {
      "path": "",
      "message": "You do not have permission to perform this action"
    }
  ]
}
```

### 404 Not Found
```json
{
  "statusCode": 404,
  "success": false,
  "message": "Resource not found",
  "errorMessages": [
    {
      "path": "",
      "message": "The requested resource was not found"
    }
  ]
}
```

### 400 Bad Request
```json
{
  "statusCode": 400,
  "success": false,
  "message": "Validation Error",
  "errorMessages": [
    {
      "path": "body.agentUserId",
      "message": "Invalid agent user ID format"
    }
  ]
}
```

---

## Usage Examples

### Example 1: Hire an Agent

```javascript
// Request
fetch('https://api.example.com/api/v1/agent-hiring', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN_HERE',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    agentUserId: '507f1f77bcf86cd799439011'
  })
});
```

### Example 2: Get My Hirings with Filters

```javascript
// Request
fetch('https://api.example.com/api/v1/agent-hiring/my-hirings?status=accepted&page=1&limit=10', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN_HERE'
  }
});
```

### Example 3: Agent Accepts Hiring Request

```javascript
// Request
fetch('https://api.example.com/api/v1/agent-hiring/507f1f77bcf86cd799439012/status', {
  method: 'PATCH',
  headers: {
    'Authorization': 'Bearer AGENT_TOKEN_HERE',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    status: 'accepted'
  })
});
```

### Example 4: Check Active Hiring Before Hiring

```javascript
// Request
fetch('https://api.example.com/api/v1/agent-hiring/check-active/507f1f77bcf86cd799439011', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN_HERE'
  }
});
```

---

## Integration Notes

1. **Before hiring an agent**: Always check if an active hiring exists using the check-active endpoint to prevent duplicate requests.

2. **Status workflow**:
   - User creates hiring → `pending`
   - Agent accepts → `accepted`
   - Agent rejects → `rejected`
   - User marks complete → `completed`

3. **Pagination**: All list endpoints support pagination with `page` and `limit` query parameters.

4. **User roles**: Make sure to check user type and role before allowing certain actions:
   - Only agents can accept/reject requests
   - Only hiring users can mark as completed

5. **Real-time updates**: Consider implementing WebSocket connections for real-time status updates on hiring requests.

---

## Notes

- All timestamps are in ISO 8601 format (UTC)
- MongoDB ObjectIds are 24-character hexadecimal strings
- The agent hiring feature is designed to connect users with agents for job search assistance
