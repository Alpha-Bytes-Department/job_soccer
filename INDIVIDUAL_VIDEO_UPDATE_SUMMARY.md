# Individual Video Update - Quick Reference

## 🎯 New Endpoints Added

### 1. Update Single Video
- **URL:** `PATCH /api/v1/users/profile/video/:videoIndex`
- **Purpose:** Replace one specific video
- **Auth:** Required

### 2. Add New Video
- **URL:** `POST /api/v1/users/profile/video`
- **Purpose:** Replace all videos with one new video
- **Auth:** Required

### 3. Delete Video
- **URL:** `DELETE /api/v1/users/profile/video/:videoIndex`
- **Purpose:** Remove specific video
- **Auth:** Required

## 📋 How It Works

### Video Index
- Videos are stored in an array (0-based index)
- First video = index 0
- Second video = index 1
- And so on...

### Update Single Video
**What happens:**
1. You send new video file with index
2. Old video at that index is deleted from filesystem
3. New video replaces it at same position
4. Other videos remain unchanged

**Example:**
```javascript
// Update the first video (index 0)
const formData = new FormData();
formData.append('videos', newVideoFile);
formData.append('videoTitle', "New Title");

fetch('/api/v1/users/profile/video/0', {
  method: 'PATCH',
  headers: { 'Authorization': `Bearer ${token}` },
  body: formData
});
```

### Add New Video
**What happens:**
1. New video is processed and validated
2. All old videos are deleted from filesystem
3. Video array is replaced with only the new video

**Example:**
```javascript
// Add a new video
const formData = new FormData();
formData.append('videos', newVideoFile);
formData.append('videoTitle', "Additional Highlights");

fetch('/api/v1/users/profile/video', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: formData
});
```

### Delete Video
**What happens:**
1. Video file is deleted from filesystem
2. Video is removed from array at specified index
3. Remaining videos keep their relative order

**Example:**
```javascript
// Delete second video (index 1)
fetch('/api/v1/users/profile/video/1', {
  method: 'DELETE',
  headers: { 'Authorization': `Bearer ${token}` }
});
```

## 🎭 Player vs Staff

### Players (Amateur, Professional, High School, College/University)
**Required fields:**
- `videos` - The video file (multipart)
- `videoTitle` - Title for the video

**Example:**
```javascript
formData.append('videos', videoFile);
formData.append('videoTitle', "Championship Goals");
```

### Staff (On Field Staff, Office Staff)
**Required fields:**
- `videos` - The video file (multipart)
- `videoTitle` - Title for the video
- `videoCategory` - Video type (e.g., "Coaching Session", "Pre-recorded Interview")

**Example:**
```javascript
formData.append('videos', videoFile);
formData.append('videoTitle', "Training Session");
formData.append('videoCategory', "Coaching Session");
```

## ⚠️ Important Notes

1. **One video at a time** - Update and Add endpoints only accept ONE video file
2. **Index validation** - API checks if video index exists before update/delete
3. **Auto cleanup** - Old video files are automatically deleted
4. **Error handling** - If validation fails, uploaded files are cleaned up
5. **Staff video types** - Must use valid VideoType enum values:
   - "Pre-recorded Interview"
   - "Coaching Session"
   - "Technical"
   - "Tactical"
   - "Methodology"
   - etc. (see video.constant.ts)

## 🆚 Full Update vs Individual Update

### Use PATCH /profile (Full Update) when:
- ❌ Replacing ALL videos at once
- ✅ Updating profile data + videos together
- ✅ Initial profile setup

### Use Individual Video Endpoints when:
- ✅ Update ONE specific video
- ✅ Replace ALL videos with one new video
- ✅ Delete ONE specific video
- ✅ Keep other videos unchanged (update/delete only)

## 📝 Response Format

All endpoints return:
```json
{
  "statusCode": 200/201,
  "success": true,
  "message": "Operation message",
  "data": {
    "profile": { /* full updated profile */ },
    // Plus operation-specific data
  }
}
```

## 🚀 Frontend Integration Tips

### Getting Current Videos
To know which index to update/delete, first get user profile:
```javascript
const response = await fetch('/api/v1/users/me', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const user = await response.json();
// user.data.videos[0], videos[1], etc.
```

### Display with Index
```javascript
videos.map((video, index) => (
  <div key={index}>
    <video src={video.url} />
    <button onClick={() => updateVideo(index)}>Update</button>
    <button onClick={() => deleteVideo(index)}>Delete</button>
  </div>
));
```

### Error Handling
```javascript
try {
  const response = await fetch(url, options);
  if (!response.ok) {
    const error = await response.json();
    console.error(error.message);
  }
} catch (error) {
  console.error('Network error:', error);
}
```
