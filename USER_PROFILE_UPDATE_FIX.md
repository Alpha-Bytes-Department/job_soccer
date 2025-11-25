# User Profile Update API Fix

## Problem
The `PATCH /api/v1/user/profile` endpoint was unable to update user-level fields (like `firstName`, `lastName`, `email`) because it only processed profile-specific fields stored in separate candidate/employer models.

## Solution
Modified the `updateUserProfile` service method to handle both user fields and profile fields in a single API call.

## Changes Made

### File: `user.service.ts` - `updateUserProfile` function

1. **Field Separation Logic**:
   - Added logic to separate user-level fields from profile-specific fields
   - User fields: `firstName`, `lastName` (email is NOT updatable via this endpoint)
   - All other fields are treated as profile-specific

```typescript
// Separate user fields from profile fields
const userFields = ['firstName', 'lastName'];
const userUpdateData: any = {};
const profileData: any = {};

// Remove email from update data if present (email cannot be updated via profile update)
if (data.email) {
  delete data.email;
}

// Split data into user fields and profile fields
for (const key in data) {
  if (userFields.includes(key)) {
    userUpdateData[key] = data[key];
  } else {
    profileData[key] = data[key];
  }
}
```

2. **Video Data Assignment**:
   - Updated all video assignment references from `data.videos` to `profileData.videos`
   - Ensures videos are correctly assigned to profile data

3. **DTO Validation**:
   - Changed validation to use `profileData` instead of `data`
   - Only profile-specific fields are validated against profile DTOs

4. **User Update**:
   - User-level fields (`firstName`, `lastName`) are updated in the User model
   - Email field is NOT updatable via this endpoint for security reasons
   - Profile-level fields are updated in the appropriate candidate/employer model
   - Images (`profileImage` and `bannerImage`) are stored in the User model and handled via `userUpdateData`

## API Usage

### Request Format
```
PATCH /api/v1/user/profile
Content-Type: multipart/form-data
Authorization: Bearer <token>
```

### Body Parameters
You can now send both user fields and profile fields together:

```json
{
  "data": {
    // User fields (email is NOT updatable)
    "firstName": "John",
    "lastName": "Doe",
    
    // Profile fields (example for player)
    "position": "Forward",
    "preferredFoot": "Right",
    "height": 180,
    "weight": 75,
    // ... other profile-specific fields
  }
}
```

### File Uploads
- `image`: Profile image (optional)
- `banner`: Banner image (optional)
- `video[]`: Video files (optional)
- `videoTitles`: JSON string array for player video titles (optional)
- `videoMeta`: JSON string array for staff video metadata (optional)

## Response
```json
{
  "statusCode": 200,
  "success": true,
  "message": "User profile updated successfully",
  "data": {
    "user": {
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",  // email is read-only
      "profileImage": "/images/...",
      "bannerImage": "/images/...",
      // ... other user fields
    },
    "profile": {
      "position": "Forward",
      "preferredFoot": "Right",
      // ... other profile fields
    }
  }
}
```

## Benefits
1. **Single API Call**: Users can update both user info and profile info in one request
2. **Better UX**: Frontend doesn't need to make multiple API calls
3. **Atomic Updates**: Both user and profile are updated together
4. **Backward Compatible**: Still works with existing requests that only update profile fields

## Testing
Test scenarios:
1. Update only user fields (firstName, lastName)
2. Update only profile fields
3. Update both user and profile fields together
4. Update with images
5. Update with videos
6. Update with mixed data (user fields + profile fields + images + videos)
7. Verify that email field is ignored if sent in the request
