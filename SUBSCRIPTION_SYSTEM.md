# Subscription System Documentation

## Overview
The subscription system allows users to purchase monthly, half-yearly, or yearly subscriptions with automatic upgrade handling and remaining days calculation.

## Subscription Tiers
1. **Monthly** - 30 days
2. **Half-Yearly** - 180 days (6 months)
3. **Yearly** - 365 days (1 year)

## Key Features
- ✅ Prevents duplicate purchases at same tier
- ✅ Prevents downgrades (e.g., yearly to monthly)
- ✅ Allows upgrades anytime (monthly → half-yearly → yearly)
- ✅ Calculates remaining days from current subscription
- ✅ Adds remaining days to new subscription duration
- ✅ Automatically cancels old subscription on upgrade

## API Endpoints

### 1. Create Checkout Session
**POST** `/api/subscription/checkout`

**Auth:** Required

**Body:**
```json
{
  "interval": "monthly" | "halfYearly" | "yearly"
}
```

**Response:**
```json
{
  "url": "https://checkout.stripe.com/..."
}
```

### 2. Get Current Subscription
**GET** `/api/subscription/current`

**Auth:** Required

**Response:**
```json
{
  "success": true,
  "message": "Current subscription retrieved successfully",
  "data": {
    "hasActiveSubscription": true,
    "subscription": {
      "interval": "monthly",
      "status": "active",
      "currentPeriodStart": "2025-11-01T00:00:00.000Z",
      "currentPeriodEnd": "2025-12-01T00:00:00.000Z",
      "remainingDays": 7
    }
  }
}
```

### 3. Get User Profile (includes subscription)
**GET** `/api/user/get-me`

**Auth:** Required

**Response:**
```json
{
  "statusCode": 200,
  "success": true,
  "message": "User retrieved successfully",
  "data": {
    "firstName": "John",
    "email": "john@example.com",
    "subscription": {
      "hasActiveSubscription": true,
      "interval": "monthly",
      "status": "active",
      "currentPeriodEnd": "2025-12-01T00:00:00.000Z",
      "remainingDays": 7
    }
  }
}
```

## Flow Diagram

### First-Time Subscription Purchase

```
Frontend                Backend                 Stripe
   |                       |                       |
   |--POST /checkout------>|                       |
   |   {interval}          |                       |
   |                       |---Create Session----->|
   |                       |<--Session URL---------|
   |<--Redirect URL--------|                       |
   |                       |                       |
   |--User Pays----------->|                       |
   |                       |<--Webhook Event-------|
   |                       |  (subscription.created)|
   |                       |                       |
   |                       |--Save to DB---------->|
   |                       |--Link to User-------->|
   |<--Success Page--------|                       |
```

### Upgrade Subscription (with Remaining Days)

```
Frontend                Backend                 Stripe
   |                       |                       |
   |--POST /checkout------>|                       |
   |   {interval}          |                       |
   |                       |--Check Current Sub--->|
   |                       |--Calculate Days------>|
   |                       |  (7 days remaining)   |
   |                       |                       |
   |                       |---Create Session----->|
   |                       |   metadata: {         |
   |                       |     isUpgrade: true   |
   |                       |     remainingDays: 7  |
   |                       |     oldSubId: xxx     |
   |                       |   }                   |
   |                       |<--Session URL---------|
   |<--Redirect URL--------|                       |
   |                       |                       |
   |--User Pays----------->|                       |
   |                       |<--Webhook Event-------|
   |                       | (subscription.created)|
   |                       |                       |
   |                       |--Cancel Old Sub------>|
   |                       |--Save New Sub-------->|
   |                       |  (30 + 7 = 37 days)   |
   |<--Success Page--------|                       |
```

## Backend Logic

### 1. Checkout Validation (`subscription.service.ts`)
```typescript
// Check for active subscription
if (user has active subscription) {
  // Get new subscription tier
  // Compare hierarchy (monthly=1, halfYearly=2, yearly=3)
  
  if (new tier <= current tier) {
    throw Error("Cannot downgrade or buy same tier")
  }
  
  // Calculate remaining days
  remainingDays = (currentPeriodEnd - now) / (1000 * 60 * 60 * 24)
  
  // Create checkout with metadata
  metadata: {
    isUpgrade: true,
    remainingDays: 7,
    oldSubscriptionId: "sub_xxx"
  }
}
```

### 2. Webhook Processing (`subscription.webhook.ts`)
```typescript
// Stripe sends webhook when subscription created/updated
webhook event received {
  // Extract metadata from checkout session
  metadata = event.data.object.metadata
  
  if (metadata.isUpgrade === "true") {
    // Cancel old subscription in Stripe
    stripe.subscriptions.cancel(metadata.oldSubscriptionId)
    
    // Calculate new end date
    newEndDate = stripeEndDate + remainingDays
    
    // Save with extended period
    subscription.currentPeriodEnd = newEndDate
  }
  
  // Save subscription to database
  // Link to user
}
```

### 3. Get Subscription Info (`subscription.service.ts`)
```typescript
getCurrentSubscription(userId) {
  // Find user's active subscription
  // Check if still active (status + date)
  // Calculate remaining days
  // Return subscription details
}
```

## Database Schema

### Subscription Model
```typescript
{
  user: ObjectId,              // Reference to User
  stripeSubscriptionId: String, // Stripe subscription ID
  stripePriceId: String,        // Stripe price ID
  interval: String,             // "monthly" | "halfYearly" | "yearly"
  intervalCount: Number,        // 1, 6, or 12
  status: String,               // "active" | "canceled" | "past_due"
  currentPeriodStart: Date,     // Subscription start
  currentPeriodEnd: Date,       // Subscription end (extended for upgrades)
  createdAt: Date,
  updatedAt: Date
}
```

### User Model (relevant fields)
```typescript
{
  stripeCustomerId: String,          // Stripe customer ID
  activeSubscriptionId: ObjectId,    // Current subscription reference
}
```

## Frontend Integration

### 1. Purchase Subscription
```javascript
// Check if user has subscription first
const { data } = await api.get('/subscription/current')

if (data.hasActiveSubscription) {
  // Show upgrade options only
  // Disable same tier and lower tiers
}

// Create checkout
const response = await api.post('/subscription/checkout', {
  interval: 'yearly' // or 'monthly' or 'halfYearly'
})

// Redirect to Stripe
window.location.href = response.data.url
```

### 2. Display Subscription Status
```javascript
// Get user profile (includes subscription)
const { data } = await api.get('/user/get-me')

if (data.subscription?.hasActiveSubscription) {
  // Show: "Active: Yearly Plan"
  // Show: "Expires: Dec 1, 2025"
  // Show: "7 days remaining"
  // Show: "Upgrade" button for higher tiers only
} else {
  // Show: "No active subscription"
  // Show: "Subscribe Now" button
}
```

### 3. Handle Stripe Redirect
```javascript
// Success page: /success
// Show success message
// Fetch updated subscription status
// Redirect to dashboard

// Cancel page: /cancel
// Show cancellation message
// Allow user to retry
```

## Error Handling

### Backend Validation Errors
- **400**: Invalid interval
- **400**: Cannot downgrade subscription
- **400**: Already have active subscription of same tier
- **404**: User not found
- **500**: Stripe API error

### Frontend Error Handling
```javascript
try {
  const response = await api.post('/subscription/checkout', { interval })
  window.location.href = response.data.url
} catch (error) {
  if (error.response?.status === 400) {
    // Show: "You already have this subscription" or
    // Show: "Please upgrade to a higher tier"
  } else {
    // Show: "Payment processing error"
  }
}
```

## Stripe Configuration

### Required Environment Variables
```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
FRONTEND_URL=http://localhost:3000
```

### Stripe Price IDs
Configure in `subscription.constant.ts`:
```typescript
export const STRIPE_PRICES = {
  monthly: "price_xxx",
  halfYearly: "price_yyy",
  yearly: "price_zzz"
}
```

### Webhook Events
Listen for these Stripe events:
- `customer.subscription.created` - New subscription
- `customer.subscription.updated` - Subscription changed
- `customer.subscription.deleted` - Subscription canceled

## Testing

### Test Upgrade Flow
1. Purchase monthly subscription
2. Wait a few days (or manually set `currentPeriodEnd`)
3. Attempt to purchase half-yearly
4. Verify:
   - Old subscription is canceled
   - New subscription end date = original end date + remaining days
   - User's `activeSubscriptionId` updated

### Test Downgrade Prevention
1. Purchase yearly subscription
2. Attempt to purchase monthly
3. Verify: Gets 400 error "You can only upgrade to a higher tier"

### Test Duplicate Prevention
1. Purchase monthly subscription
2. Attempt to purchase monthly again
3. Verify: Gets 400 error message

## Upgrade Example

**Scenario:**
- User has monthly subscription (30 days)
- 7 days remaining
- User upgrades to yearly (365 days)

**Calculation:**
```
Current subscription end: Dec 1, 2025
Remaining days: 7
New subscription base: 365 days (from today)
New subscription actual: 365 + 7 = 372 days

Final end date: Nov 24, 2025 + 372 days = Nov 1, 2026
```

**Result:** User gets extra 7 days added to their new yearly subscription.
