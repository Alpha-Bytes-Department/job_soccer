# Agent Rating API Documentation

## Overview
The Agent Rating API allows candidates and employers to rate agents based on their experience, view agent ratings, check average ratings, and verify if they have already rated an agent.

## Base URL
```
/api/v1/agent-rating
```

## Authentication
Most endpoints require authentication using Bearer token.
- **Header**: `Authorization: Bearer <token>`

## User Access Levels
- **Candidate**: Can rate agents they have worked with
- **Employer**: Can rate agents they have hired
- **Public**: Can view agent ratings and average ratings (no authentication required)

---

## Endpoints

### 1. Create Agent Rating

**Endpoint**: `POST /api/v1/agent-rating`

**Description**: Create a new rating for an agent. Users can rate an agent from 1 to 5 stars.

**Access**: Private (Candidate & Employer)

**Request Body**:
```json
{
  "agentUserId": "507f1f77bcf86cd799439011",
  "rating": 5
}
```

**Request Body Schema**:
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| agentUserId | string | Yes | MongoDB ObjectId of the agent to rate (24 character hex string) |
| rating | number | Yes | Rating value between 1 and 5 (inclusive) |

**Success Response** (201 Created):
```json
{
  "statusCode": 201,
  "success": true,
  "message": "Agent rated successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439020",
    "agentUserId": "507f1f77bcf86cd799439011",
    "ratedByUserId": "507f1f77bcf86cd799439013",
    "ratedByUserType": "candidate",
    "ratedByUserRole": "candidate",
    "rating": 5,
    "createdAt": "2025-12-23T10:30:00.000Z",
    "updatedAt": "2025-12-23T10:30:00.000Z"
  }
}
```

**Validation Rules**:
- `agentUserId` must be a valid 24-character MongoDB ObjectId hex string
- `rating` must be a number between 1 and 5 (inclusive)
- User cannot rate the same agent more than once
- User must have an active or completed hiring with the agent to rate them

**Error Responses**:
- `400 Bad Request`: Invalid agentUserId format or rating value
- `401 Unauthorized`: No authentication token provided
- `403 Forbidden`: User has not hired this agent or not authorized
- `404 Not Found`: Agent user not found
- `409 Conflict`: User has already rated this agent

---

### 2. Get Agent Average Rating

**Endpoint**: `GET /api/v1/agent-rating/average/:agentUserId`

**Description**: Get the average rating for a specific agent without pagination.

**Access**: Public (No authentication required)

**Path Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| agentUserId | string | Yes | MongoDB ObjectId of the agent (24 character hex string) |

**Success Response** (200 OK):
```json
{
  "statusCode": 200,
  "success": true,
  "message": "Agent average rating retrieved successfully",
  "data": {
    "agentUserId": "507f1f77bcf86cd799439011",
    "averageRating": 4.5,
    "totalRatings": 25
  }
}
```

**Response (Agent with No Ratings)**:
```json
{
  "statusCode": 200,
  "success": true,
  "message": "Agent average rating retrieved successfully",
  "data": {
    "agentUserId": "507f1f77bcf86cd799439011",
    "averageRating": 0,
    "totalRatings": 0
  }
}
```

**Use Cases**:
- Display agent rating on profile cards
- Show rating in agent listings
- Quick rating check without fetching all reviews

**Error Responses**:
- `404 Not Found`: Agent user not found

---

### 3. Check User Rated Agent

**Endpoint**: `GET /api/v1/agent-rating/check/:agentUserId`

**Description**: Check if the authenticated user has already rated a specific agent.

**Access**: Private (Candidate & Employer)

**Path Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| agentUserId | string | Yes | MongoDB ObjectId of the agent (24 character hex string) |

**Success Response** (200 OK - User has rated):
```json
{
  "statusCode": 200,
  "success": true,
  "message": "User has rated this agent",
  "data": {
    "hasRated": true,
    "rating": {
      "_id": "507f1f77bcf86cd799439020",
      "agentUserId": "507f1f77bcf86cd799439011",
      "ratedByUserId": "507f1f77bcf86cd799439013",
      "rating": 5,
      "createdAt": "2025-12-23T10:30:00.000Z"
    }
  }
}
```

**Response (User has not rated)**:
```json
{
  "statusCode": 200,
  "success": true,
  "message": "User has not rated this agent",
  "data": {
    "hasRated": false,
    "rating": null
  }
}
```

**Use Cases**:
- Prevent duplicate ratings
- Show/hide rating button in UI
- Display user's existing rating for editing
- Enable/disable rating functionality

**Error Responses**:
- `401 Unauthorized`: No authentication token provided
- `404 Not Found`: Agent user not found

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
      "message": "You must hire this agent before rating"
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
      "message": "Agent not found"
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
      "path": "body.rating",
      "message": "Rating must be at least 1"
    },
    {
      "path": "body.rating",
      "message": "Rating must be at most 5"
    }
  ]
}
```

### 409 Conflict
```json
{
  "statusCode": 409,
  "success": false,
  "message": "Conflict",
  "errorMessages": [
    {
      "path": "",
      "message": "You have already rated this agent"
    }
  ]
}
```

---

## Usage Examples

### Example 1: Rate an Agent

```javascript
// Request
fetch('https://api.example.com/api/v1/agent-rating', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN_HERE',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    agentUserId: '507f1f77bcf86cd799439011',
    rating: 5
  })
});
```

### Example 2: Get Agent Average Rating

```javascript
// Request (Public - No auth required)
fetch('https://api.example.com/api/v1/agent-rating/average/507f1f77bcf86cd799439011', {
  method: 'GET'
});
```

### Example 3: Check if User Already Rated Agent

```javascript
// Request
fetch('https://api.example.com/api/v1/agent-rating/check/507f1f77bcf86cd799439011', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN_HERE'
  }
});
```

---

## Integration Notes

### 1. Rating Workflow

```
1. User hires agent (Agent Hiring API)
2. User completes hiring or has active hiring
3. Check if user already rated → GET /check/:agentUserId
4. If not rated, allow rating → POST /
5. Show average rating → GET /average/:agentUserId
```

### 2. UI Implementation Tips

**Agent Profile Page**:
```javascript
// Load agent average rating (public)
const avgRating = await getAgentAverageRating(agentId);

// If user is logged in, check if they rated
if (isLoggedIn) {
  const hasRated = await checkUserRatedAgent(agentId);
  
  if (hasRated.hasRated) {
    // Show: "You rated this agent: ⭐⭐⭐⭐⭐"
  } else {
    // Show: "Rate this agent" button
  }
}

// Show average rating on profile
```

**Rating Component**:
```javascript
// Before showing rating form
const hasRated = await checkUserRatedAgent(agentId);

if (hasRated.hasRated) {
  alert('You have already rated this agent');
  return;
}

// Submit rating
await rateAgent(agentId, ratingValue);
```

### 4. Display Guidelines

**Star Display**:
- 1 star: ⭐
- 2 stars: ⭐⭐
- 3 stars: ⭐⭐⭐
- 4 stars: ⭐⭐⭐⭐
- 5 stars: ⭐⭐⭐⭐⭐

**Average Rating**:
- Round to 1 decimal place: 4.7
- Show total count: "(25 ratings)"
- Format: "4.7 ⭐ (25 ratings)"

### 3. Validation Rules

- Users can only rate agents they have hired
- Rating must be between 1 and 5 stars
- One rating per user per agent
- Ratings cannot be edited (create only)
- Ratings cannot be deleted (permanent record)

### 4. Caching Recommendations

- Cache average rating for 5-10 minutes
- Invalidate cache when new rating is added
- Use Redis for high-traffic agent profiles

### 5. Performance Tips

- Show average rating without loading individual reviews
- Cache popular agent ratings
- Consider server-side rendering for better SEO

---

## Business Rules

1. **Who can rate**:
   - Users who have hired the agent (completed or active hiring)
   - Both candidates and employers can rate
   - One rating per user per agent

2. **Rating restrictions**:
   - Cannot rate yourself
   - Cannot rate if no hiring relationship exists
   - Cannot change rating once submitted
   - Cannot delete ratings

3. **Rating values**:
   - Minimum: 1 star
   - Maximum: 5 stars
   - No half stars allowed
   - Integer values only

4. **Public access**:
   - Anyone can view agent ratings (no auth)
   - Anyone can view average ratings (no auth)
   - Must be logged in to check personal rating status
   - Must be logged in to create ratings

---

## Notes

- All timestamps are in ISO 8601 format (UTC)
- MongoDB ObjectIds are 24-character hexadecimal strings
- Average ratings are calculated in real-time
- Rating system helps users make informed decisions when hiring agents
- Ratings contribute to agent reputation and trustworthiness
