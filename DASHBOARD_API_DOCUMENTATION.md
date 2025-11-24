# Dashboard API Documentation

## Overview
The Dashboard module provides comprehensive analytics and reporting APIs for admin users. It includes payment history tracking and various user statistics.

## Payment History Module

### Created Files:
- `paymentHistory.interface.ts` - TypeScript interfaces for payment history
- `paymentHistory.model.ts` - MongoDB schema for payment records
- `paymentHistory.service.ts` - Service layer for payment operations

### Features:
- Automatically tracks all successful and failed payments via Stripe webhooks
- Records payment details including amount, status, payment method
- Links payments to users and subscriptions
- Provides historical payment data for analytics

## Dashboard API Endpoints

All dashboard endpoints require **admin authentication** (`auth("admin")` middleware).

Base URL: `/api/dashboard`

---

### 1. Get User Counts
**Endpoint:** `GET /api/dashboard/user-counts`

**Description:** Returns total users, paid users (with active subscriptions), and unpaid users.

**Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "User counts retrieved successfully",
  "data": {
    "totalUsers": 150,
    "paidUsers": 45,
    "unpaidUsers": 105
  }
}
```

---

### 2. Get Monthly Income
**Endpoint:** `GET /api/dashboard/monthly-income`

**Description:** Returns monthly income for the current year (Jan-Dec). Future months show income as 0.

**Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Monthly income retrieved successfully",
  "data": [
    { "month": "January", "income": 2500.00 },
    { "month": "February", "income": 3200.50 },
    { "month": "March", "income": 2800.75 },
    { "month": "April", "income": 3500.00 },
    { "month": "May", "income": 0 },
    { "month": "June", "income": 0 },
    { "month": "July", "income": 0 },
    { "month": "August", "income": 0 },
    { "month": "September", "income": 0 },
    { "month": "October", "income": 0 },
    { "month": "November", "income": 0 },
    { "month": "December", "income": 0 }
  ]
}
```

---

### 3. Get User List
**Endpoint:** `GET /api/dashboard/user-list`

**Description:** Returns paginated list of users with filtering options.

**Query Parameters:**
- `page` (optional, default: 1) - Page number
- `limit` (optional, default: 10) - Results per page
- `search` (optional) - Search by name or email
- `userType` (optional) - Filter by "candidate" or "employer"
- `subscriptionType` (optional) - Filter by "paid" or "free"
- `role` (optional) - Filter by specific role

**Example Request:**
```
GET /api/dashboard/user-list?page=1&limit=20&userType=candidate&subscriptionType=paid
```

**Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "User list retrieved successfully",
  "data": {
    "users": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "name": "John Doe",
        "firstName": "John",
        "lastName": "Doe",
        "email": "john@example.com",
        "userType": "candidate",
        "role": "professionalPlayer",
        "subscriptionStatus": "paid",
        "createdAt": "2024-01-15T10:30:00.000Z"
      },
      {
        "_id": "507f1f77bcf86cd799439012",
        "name": "Jane Smith",
        "firstName": "Jane",
        "lastName": "Smith",
        "email": "jane@example.com",
        "userType": "employer",
        "role": "clubManager",
        "subscriptionStatus": "free",
        "createdAt": "2024-01-14T09:20:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 8,
      "totalUsers": 150,
      "limit": 20
    }
  }
}
```

---

### 4. Get User Details
**Endpoint:** `GET /api/dashboard/user/:userId`

**Description:** Returns detailed information about a specific user including their payment history.

**URL Parameters:**
- `userId` (required) - MongoDB ObjectId of the user

**Example Request:**
```
GET /api/dashboard/user/507f1f77bcf86cd799439011
```

**Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "User details retrieved successfully",
  "data": {
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "userType": "candidate",
      "role": "professionalPlayer",
      "profileImage": "https://example.com/image.jpg",
      "isVerified": true,
      "stripeCustomerId": "cus_xxxxxxxxxxxxx",
      "activeSubscriptionId": {
        "_id": "507f1f77bcf86cd799439013",
        "stripeSubscriptionId": "sub_xxxxxxxxxxxxx",
        "interval": "monthly",
        "status": "active",
        "currentPeriodStart": "2024-04-01T00:00:00.000Z",
        "currentPeriodEnd": "2024-05-01T00:00:00.000Z"
      },
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-04-01T10:30:00.000Z"
    },
    "paymentHistory": [
      {
        "_id": "507f1f77bcf86cd799439014",
        "amount": 29.99,
        "currency": "usd",
        "status": "succeeded",
        "paymentMethod": "card",
        "description": "Subscription payment",
        "paidAt": "2024-04-01T10:35:00.000Z",
        "createdAt": "2024-04-01T10:35:00.000Z"
      },
      {
        "_id": "507f1f77bcf86cd799439015",
        "amount": 29.99,
        "currency": "usd",
        "status": "succeeded",
        "paymentMethod": "card",
        "description": "Subscription payment",
        "paidAt": "2024-03-01T10:35:00.000Z",
        "createdAt": "2024-03-01T10:35:00.000Z"
      }
    ]
  }
}
```

---

### 5. Get User Statistics with Growth
**Endpoint:** `GET /api/dashboard/user-statistics`

**Description:** Returns total, paid, and free user counts with month-over-month growth percentage.

**Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "User statistics retrieved successfully",
  "data": {
    "total": {
      "count": 150,
      "growth": 15.38
    },
    "paid": {
      "count": 45,
      "growth": 25.00
    },
    "free": {
      "count": 105,
      "growth": 12.90
    }
  }
}
```

**Growth Calculation:**
- Positive number = growth from last month
- Negative number = decline from last month
- Growth % = ((current - previous) / previous) * 100

---

### 6. Get Payment Statistics
**Endpoint:** `GET /api/dashboard/payment-statistics`

**Description:** Returns comprehensive payment statistics including total payments, successful payments, and cancelled/failed payments.

**Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Payment statistics retrieved successfully",
  "data": {
    "total": {
      "count": 250,
      "revenue": 7250.50
    },
    "paid": {
      "count": 230,
      "revenue": 7250.50
    },
    "cancelled": {
      "count": 20,
      "revenue": 0
    }
  }
}
```

**Explanation:**
- `total.count` - Total number of all payment attempts
- `total.revenue` - Total revenue from successful payments
- `paid.count` - Number of successful payments
- `paid.revenue` - Revenue from successful payments (same as total.revenue)
- `cancelled.count` - Number of failed or cancelled payments
- `cancelled.revenue` - Always 0 (no revenue from failed payments)

---

## Authentication

All dashboard endpoints require admin authentication. Include the admin user's JWT token in the request header:

```
Authorization: Bearer <admin_jwt_token>
```

If the user is not an admin, the API will return:
```json
{
  "success": false,
  "statusCode": 403,
  "message": "You are not authorized to access this resource"
}
```

---

## Error Responses

### 404 Not Found
```json
{
  "success": false,
  "statusCode": 404,
  "message": "User not found"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "statusCode": 500,
  "message": "Internal server error"
}
```

---

## Implementation Details

### Webhook Integration
Payment history is automatically tracked via Stripe webhooks:
- `invoice.paid` - Records successful payments
- `invoice.payment_failed` - Records failed payment attempts

### Data Models

**User Model Fields Used:**
- `activeSubscriptionId` - Reference to active subscription
- `stripeCustomerId` - Stripe customer ID
- `userType` - Type of user (candidate/employer/admin)
- `role` - Specific role within userType
- `isDeleted` - Soft delete flag

**Subscription Model Fields:**
- `status` - Current subscription status
- `interval` - Billing interval (monthly/halfYearly/yearly)
- `currentPeriodStart` - Start date of current billing period
- `currentPeriodEnd` - End date of current billing period

**PaymentHistory Model Fields:**
- `user` - Reference to user
- `amount` - Payment amount in dollars
- `status` - Payment status (succeeded/pending/failed/canceled/refunded)
- `paidAt` - Timestamp of successful payment
- `stripePaymentIntentId` - Unique Stripe payment ID

---

## Usage Examples

### Get Monthly Revenue Chart Data
```javascript
const response = await fetch('/api/dashboard/monthly-income', {
  headers: {
    'Authorization': `Bearer ${adminToken}`
  }
});
const data = await response.json();
// Use data.data array to render chart
```

### Search for Users by Email
```javascript
const response = await fetch('/api/dashboard/user-list?search=john@example.com', {
  headers: {
    'Authorization': `Bearer ${adminToken}`
  }
});
```

### Get Growth Metrics Dashboard
```javascript
const response = await fetch('/api/dashboard/user-statistics', {
  headers: {
    'Authorization': `Bearer ${adminToken}`
  }
});
// Display growth percentages for total, paid, and free users
```

---

## Notes

1. All monetary values are stored and returned in the smallest currency unit (e.g., dollars for USD)
2. Future months in monthly income API return 0 to maintain consistent 12-month array
3. Growth calculations handle edge cases (division by zero returns 100% if current > 0, otherwise 0%)
4. Payment history is limited to the 10 most recent payments in user details endpoint
5. User list pagination helps handle large datasets efficiently
6. All dates are returned in ISO 8601 format (UTC)
