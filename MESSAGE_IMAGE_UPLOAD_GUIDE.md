# Message Image Upload - Frontend Integration Guide

## Overview
Your messaging system uses **Socket.IO for text messages** (already integrated). This guide covers **image upload via REST API** which still delivers messages to receivers in real-time via Socket.IO.

## Flow
```
Frontend sends image → REST API uploads → Database saves → Socket.IO notifies receiver
```

---

## API Endpoint for Image Upload
```
POST /api/v1/message/send
```

**Authentication Required**: Yes (Bearer token)

---

## Sending Messages with Image Upload

Use `multipart/form-data` format to upload images.

### Request Format
```javascript
const formData = new FormData();
formData.append('chatId', 'chat123');
formData.append('receiverId', 'user456');
formData.append('content', 'Optional text caption'); // Optional
formData.append('image', imageFile); // Required - the image file

const response = await fetch('/api/v1/message/send', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
    // Don't set Content-Type - browser sets it automatically
  },
  body: formData
});
```

---

## React Example with Image Preview

```jsx
import { useState } from 'react';

function ImageMessageComposer({ chatId, receiverId, token, onMessageSent }) {
  const [content, setContent] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [sending, setSending] = useState(false);

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const removeImage = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(null);
    setImagePreview(null);
  };

  const sendImageMessage = async () => {
    if (!imageFile) {
      alert('Please select an image');
      return;
    }

    setSending(true);
    const formData = new FormData();
    formData.append('chatId', chatId);
    formData.append('receiverId', receiverId);
    formData.append('image', imageFile);
    
    if (content) {
      formData.append('content', content); // Optional caption
    }

    try {
      const response = await fetch('http://localhost:5000/api/v1/message/send', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (!response.ok) throw new Error('Failed to send');

      const result = await response.json();
      
      // Reset form
      setContent('');
      removeImage();
      
      // Notify parent
      if (onMessageSent) onMessageSent(result.data);
      
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to send image');
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      {imagePreview && (
        <div>
          <img src={imagePreview} alt="Preview" style={{ maxWidth: '200px' }} />
          <button onClick={removeImage}>Remove</button>
        </div>
      )}
      
      <input
        type="text"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Optional caption..."
        disabled={sending}
      />
      
      <input
        type="file"
        accept="image/*"
        onChange={handleImageSelect}
        disabled={sending}
      />
      
      <button onClick={sendImageMessage} disabled={sending || !imageFile}>
        {sending ? 'Sending...' : 'Send Image'}
      </button>
    </div>
  );
}
```

---

## Using Axios

```javascript
const sendImageMessage = async (chatId, receiverId, imageFile, caption = '') => {
  const formData = new FormData();
  formData.append('chatId', chatId);
  formData.append('receiverId', receiverId);
  formData.append('image', imageFile);
  
  if (caption) {
    formData.append('content', caption);
  }

  const response = await axios.post('/api/v1/message/send', formData, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'multipart/form-data'
    }
  });

  return response.data;
};
```

---

## Request Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `chatId` | string | Yes | Chat conversation ID |
| `receiverId` | string | Yes | Message recipient ID |
| `image` | File | Yes | Image file to upload |
| `content` | string | No | Optional text caption (max 5000 chars) |

---

## Response Format

### Success (201 Created)
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Message sent successfully",
  "data": {
    "_id": "65f1234567890abcdef12345",
    "chatId": "chat123",
    "senderId": "user789",
    "receiverId": "user456",
    "content": "Optional caption",
    "mediaUrl": "/images/1703331000000-abc123.webp",
    "messageType": "image",
    "isRead": false,
    "createdAt": "2025-12-23T10:30:00.000Z"
  }
}
```

**Important**: The receiver will automatically get this message via Socket.IO `new_message` event in real-time (no polling needed).

---

## Image Processing

### Supported Input Formats
- JPEG, PNG, WebP, HEIF/HEIC, TIFF, AVIF

### Automatic Processing
- ✅ Converted to WebP format
- ✅ Images wider than 1024px resized (maintains aspect ratio)
- ✅ Optimized for web (40% quality)

### Displaying Images
```javascript
// mediaUrl from response: "/images/1703331000000-abc123.webp"
const imageUrl = `${API_BASE_URL}${message.mediaUrl}`;
// Full URL: https://api.example.com/images/1703331000000-abc123.webp
```

---

## Error Responses

### 400 - No Image Provided
```json
{
  "success": false,
  "statusCode": 400,
  "message": "At least one of content, mediaUrl, or image file must be provided"
}
```

### 400 - Invalid File Type
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Only .jpeg, .png, .jpg, .heif, .heic, .tiff, .webp, .avif files supported"
}
```

### 401 - Unauthorized
```json
{
  "success": false,
  "statusCode": 401,
  "message": "Unauthorized access"
}
```

---

## Socket.IO Integration

**You don't need to emit socket events** - the API does it automatically!

### What Happens Automatically:
1. Image uploads via REST API
2. Backend emits `new_message` event to receiver (if online)
3. Backend emits `chat_updated` event to receiver
4. Receiver's socket listener gets the message instantly

### Your Socket Listeners (Already Setup):
```javascript
// Receiver automatically gets this
socket.on('new_message', (data) => {
  console.log('New message received:', data.message);
  // Update your UI with data.message
});

socket.on('chat_updated', (data) => {
  console.log('Chat updated:', data.chatId);
  // Refresh chat list if needed
});
```

---

## Testing with Postman

1. **Method**: POST
2. **URL**: `http://localhost:5000/api/v1/message/send`
3. **Headers**: 
   - `Authorization: Bearer YOUR_TOKEN`
4. **Body** → Select `form-data`:
   - `chatId` (text): `"chat123"`
   - `receiverId` (text): `"user456"`
   - `content` (text): `"Check this out!"` (optional)
   - `image` (file): Select image file
5. **Send**

---

## Best Practices

✅ **Preview images** before sending using `URL.createObjectURL()`  
✅ **Clean up preview URLs** with `URL.revokeObjectURL()` to prevent memory leaks  
✅ **Validate file size** on client (recommended max: 10MB)  
✅ **Show loading state** while uploading  
✅ **Use `accept="image/*"`** on file inputs  
✅ **Don't set Content-Type** header - browser handles it  

---

## Quick Integration Checklist

- [ ] Text messages work via Socket.IO ✓ (already done)
- [ ] Socket listeners setup ✓ (already done)
- [ ] Add image file input to message composer
- [ ] Create FormData with chatId, receiverId, and image
- [ ] POST to `/api/v1/message/send` with Bearer token
- [ ] Receiver automatically gets message via existing socket listener
- [ ] Display images using `${API_BASE_URL}${message.mediaUrl}`

That's it! 🎉
