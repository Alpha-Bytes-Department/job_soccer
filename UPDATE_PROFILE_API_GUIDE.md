# Update Profile API Guide

## Endpoints

### 1. Update Full Profile
```
PATCH /api/v1/users/profile
```

### 2. Update Individual Video
```
PATCH /api/v1/users/profile/video/:videoIndex
```

### 3. Add New Video
```
POST /api/v1/users/profile/video
```

### 4. Delete Video
```
DELETE /api/v1/users/profile/video/:videoIndex
```

## Authentication
- **Required**: Yes (Bearer token)
- Uses authenticated user's ID from token

## How It Works

### 1. Profile Data Update
- Send profile fields in `data` property as JSON string
- Only include fields you want to update (partial updates supported)
- Backend validates using update DTOs (less strict than create)

### 2. Profile Image Update
- **Optional**: Include new image file
- If provided, old profile image is automatically deleted
- New image path is saved to user record

### 3. Video Update Logic

#### For Players (Amateur, Professional, High School, College/University):
- **Optional**: Videos are not required for updates
- If you provide videos, they **replace all existing videos**
- Must provide exactly 2 "Highlights" videos
- Send `videoTitles` array matching video count
- Example:
  ```
  videos: [file1.mp4, file2.mp4]
  videoTitles: ["Goal Highlights", "Best Plays"]
  ```

#### For Staff (On Field Staff, Office Staff):
- **Optional**: Videos are not required for updates
- If you provide videos, they **replace all existing videos**
- Must include `videoMeta` with video details
- Each video needs: `title`, `category`, `position`
- Example:
  ```json
  videoMeta: [
    {
      "title": "Training Session",
      "category": "Coaching Session",
      "position": "Head Coach"
    }
  ]
  ```

#### For Employers:
- No video handling (employers don't have videos)

### Key Points:
- ✅ Videos are **optional** for updates
- ⚠️ If you send videos, **all old videos are replaced**
- ❌ No way to update individual videos or add to existing ones
- 💡 To keep existing videos, don't send any video files

## Frontend Integration

### Request Structure
```javascript
const formData = new FormData();

// 1. Profile data (required fields only)
const profileData = {
  firstName: "John",
  lastName: "Doe",
  // ... other fields to update
};
formData.append('data', JSON.stringify(profileData));

// 2. Profile image (optional)
if (newProfileImage) {
  formData.append('image', newProfileImage);
}

// 3. Videos (optional - for players)
if (newVideos && newVideos.length > 0) {
  newVideos.forEach(video => {
    formData.append('videos', video);
  });
  
  const videoTitles = ["Title 1", "Title 2"];
  formData.append('videoTitles', JSON.stringify(videoTitles));
}

// 4. Videos (optional - for staff)
if (newVideos && newVideos.length > 0) {
  newVideos.forEach(video => {
    formData.append('videos', video);
  });
  
  const videoMeta = [
    { title: "Video 1", category: "Training", position: "Coach" }
  ];
  formData.append('videoMeta', JSON.stringify(videoMeta));
}

// Send request
const response = await fetch('/api/v1/users/profile', {
  method: 'PATCH',
  headers: {
    'Authorization': `Bearer ${token}`,
  },
  body: formData
});
```

### Example: Update Only Name
```javascript
const formData = new FormData();
formData.append('data', JSON.stringify({
  firstName: "Jane",
  lastName: "Smith"
}));

// No image, no videos - just name update
await fetch('/api/v1/users/profile', {
  method: 'PATCH',
  headers: { 'Authorization': `Bearer ${token}` },
  body: formData
});
```

### Example: Update With New Videos (Player)
```javascript
const formData = new FormData();

// Update profile data
formData.append('data', JSON.stringify({
  position: "Forward",
  preferredFoot: "Right"
}));

// Replace ALL videos with new ones
formData.append('videos', highlightVideo1);
formData.append('videos', highlightVideo2);
formData.append('videoTitles', JSON.stringify([
  "Season Highlights",
  "Championship Game"
]));

await fetch('/api/v1/users/profile', {
  method: 'PATCH',
  headers: { 'Authorization': `Bearer ${token}` },
  body: formData
});
```

### Example: Update Profile Image Only
```javascript
const formData = new FormData();

// Empty data object (no profile updates)
formData.append('data', JSON.stringify({}));

// New profile image
formData.append('image', newImageFile);

await fetch('/api/v1/users/profile', {
  method: 'PATCH',
  headers: { 'Authorization': `Bearer ${token}` },
  body: formData
});
```

## Response
```json
{
  "statusCode": 200,
  "success": true,
  "message": "User profile updated successfully",
  "data": {
    "user": { /* updated user object */ },
    "profile": { /* updated profile object */ }
  }
}
```

## Individual Video Management

### Update Single Video

**Endpoint:** `PATCH /api/v1/users/profile/video/:videoIndex`

**Use Case:** Replace one specific video without affecting others

**Frontend Integration:**
```javascript
const formData = new FormData();

// For Players
formData.append('videos', newVideoFile);
formData.append('videoTitle', "Updated Highlights");

// OR For Staff
formData.append('videos', newVideoFile);
formData.append('videoTitle', "Updated Training Session");
formData.append('videoCategory', "Coaching Session"); // VideoType enum value

const videoIndex = 0; // Replace first video (0-based index)

await fetch(`/api/v1/users/profile/video/${videoIndex}`, {
  method: 'PATCH',
  headers: { 'Authorization': `Bearer ${token}` },
  body: formData
});
```

**Response:**
```json
{
  "statusCode": 200,
  "success": true,
  "message": "Video updated successfully",
  "data": {
    "profile": { /* full profile */ },
    "videoIndex": 0,
    "updatedVideo": { /* new video data */ }
  }
}
```

### Add New Video

**Endpoint:** `POST /api/v1/users/profile/video`

**Use Case:** Replace all videos with a single new video

**Frontend Integration:**
```javascript
const formData = new FormData();

// For Players
formData.append('videos', newVideoFile);
formData.append('videoTitle', "New Highlights");

// OR For Staff
formData.append('videos', newVideoFile);
formData.append('videoTitle', "Training Session");
formData.append('videoCategory', "Coaching Session"); // Required for staff

await fetch('/api/v1/users/profile/video', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: formData
});
```

**Response:**
```json
{
  "statusCode": 201,
  "success": true,
  "message": "Video added successfully",
  "data": {
    "profile": { /* full profile */ },
    "newVideo": { /* new video data */ },
    "totalVideos": 1
  }
}
```

### Delete Video

**Endpoint:** `DELETE /api/v1/users/profile/video/:videoIndex`

**Use Case:** Remove a specific video

**Frontend Integration:**
```javascript
const videoIndex = 1; // Delete second video (0-based index)

await fetch(`/api/v1/users/profile/video/${videoIndex}`, {
  method: 'DELETE',
  headers: { 'Authorization': `Bearer ${token}` }
});
```

**Response:**
```json
{
  "statusCode": 200,
  "success": true,
  "message": "Video deleted successfully",
  "data": {
    "profile": { /* full profile */ },
    "deletedVideoIndex": 1,
    "remainingVideos": 2
  }
}
```

## Important Notes

### Full Profile Update
1. **Videos are all-or-nothing**: When using PATCH /profile, all videos are replaced
2. **Profile image cleanup**: Old images are automatically deleted when replaced
3. **Validation**: Same video validation rules apply (count, types, metadata)
4. **Error handling**: If video validation fails, uploaded files are cleaned up automatically
5. **User must have profile**: Returns error if user hasn't created profile yet (use POST /profile first)

### Individual Video Management
1. **Video index is 0-based**: First video is index 0, second is index 1, etc.
2. **Old video cleanup**: When updating/deleting, old video files are automatically removed
3. **Only one video at a time**: Update and add endpoints accept only one video file
4. **Staff requires videoCategory**: Must provide valid VideoType enum value
5. **Players only need videoTitle**: Simple title string is sufficient
6. **Index validation**: API validates that video index exists before update/delete
