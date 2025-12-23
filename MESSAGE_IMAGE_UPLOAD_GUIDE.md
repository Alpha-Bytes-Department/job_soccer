# Message Image Upload - Frontend Integration Guide

## Overview
The messaging system supports three types of message sending:
1. **Text messages** - Plain text content
2. **Image uploads** - Upload image files that are automatically converted to WebP format
3. **External media URLs** - Reference media hosted elsewhere

## API Endpoint
```
POST /api/v1/message/send
```

**Authentication Required**: Yes (candidate or employer role)

---

## 1. Sending Text Messages

### Request Format
```javascript
// Using fetch with JSON
const response = await fetch('/api/v1/message/send', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    chatId: 'chat123',
    receiverId: 'user456',
    content: 'Hello! How are you?'
  })
});
```

### Using Axios
```javascript
const response = await axios.post('/api/v1/message/send', {
  chatId: 'chat123',
  receiverId: 'user456',
  content: 'Hello! How are you?'
}, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

---

## 2. Sending Messages with Image Upload

When uploading an image file, you **must** use `multipart/form-data` format.

### Request Format
```javascript
// Create FormData object
const formData = new FormData();
formData.append('chatId', 'chat123');
formData.append('receiverId', 'user456');
formData.append('content', 'Check out this image!'); // Optional - can send image without text
formData.append('image', imageFile); // The actual image file

// Send request
const response = await fetch('/api/v1/message/send', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
    // DO NOT set Content-Type - browser will set it automatically with boundary
  },
  body: formData
});
```

### React Example with File Input
```jsx
import { useState } from 'react';

function MessageInput({ chatId, receiverId, token }) {
  const [content, setContent] = useState('');
  const [imageFile, setImageFile] = useState(null);

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const sendMessage = async () => {
    const formData = new FormData();
    formData.append('chatId', chatId);
    formData.append('receiverId', receiverId);
    
    // Add text content if provided
    if (content) {
      formData.append('content', content);
    }
    
    // Add image if selected
    if (imageFile) {
      formData.append('image', imageFile);
    }

    try {
      const response = await fetch('/api/v1/message/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();
      console.log('Message sent:', data);
      
      // Reset form
      setContent('');
      setImageFile(null);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  return (
    <div>
      <input
        type="text"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Type a message..."
      />
      <input
        type="file"
        accept="image/*"
        onChange={handleImageChange}
      />
      <button onClick={sendMessage}>Send</button>
    </div>
  );
}
```

### Using Axios with Image Upload
```javascript
const sendMessageWithImage = async (chatId, receiverId, imageFile, content = '') => {
  const formData = new FormData();
  formData.append('chatId', chatId);
  formData.append('receiverId', receiverId);
  
  if (content) {
    formData.append('content', content);
  }
  
  if (imageFile) {
    formData.append('image', imageFile);
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

## 3. Sending Messages with External Media URLs

If the media is already hosted somewhere (e.g., CDN, cloud storage), you can send the URL directly.

### Request Format
```javascript
const response = await fetch('/api/v1/message/send', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    chatId: 'chat123',
    receiverId: 'user456',
    mediaUrl: 'https://example.com/images/photo.jpg',
    messageType: 'image',
    content: 'Check this out!' // Optional
  })
});
```

---

## Request Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `chatId` | string | Yes | The ID of the chat conversation |
| `receiverId` | string | Yes | The ID of the message recipient |
| `content` | string | No* | Text message content (max 5000 characters) |
| `image` | File | No* | Image file to upload (JPEG, PNG, WebP, etc.) |
| `mediaUrl` | string | No* | External media URL |
| `messageType` | enum | No | Message type: "text", "image", "video", "file" |

**Note**: At least one of `content`, `image`, or `mediaUrl` must be provided.

---

## Response Format

### Success Response (201 Created)
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
    "content": "Check out this image!",
    "mediaUrl": "/images/1234567890-abc.webp",
    "messageType": "image",
    "isRead": false,
    "isDeleted": false,
    "createdAt": "2025-12-23T10:30:00.000Z",
    "updatedAt": "2025-12-23T10:30:00.000Z"
  }
}
```

---

## Image Processing Details

### Supported Image Formats (Input)
- JPEG (.jpg, .jpeg)
- PNG (.png)
- WebP (.webp)
- HEIF/HEIC (.heif, .heic)
- TIFF (.tiff)
- AVIF (.avif)

### Output Format
- All uploaded images are automatically converted to **WebP** format
- Images wider than 1024px are resized to 1024px width (aspect ratio maintained)
- Quality is optimized for web delivery (40% quality, effort level 2)

### Image URL in Response
The `mediaUrl` in the response will be a relative path like:
```
/images/1703331000000-abc123.webp
```

To display the image:
```javascript
const imageUrl = `${API_BASE_URL}${message.mediaUrl}`;
// Example: https://api.example.com/images/1703331000000-abc123.webp
```

---

## Error Responses

### 400 Bad Request - No Content Provided
```json
{
  "success": false,
  "statusCode": 400,
  "message": "At least one of content, mediaUrl, or image file must be provided"
}
```

### 400 Bad Request - Invalid File Type
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Only .jpeg, .png, .jpg, .heif, .heic, .tiff, .webp, .avif files supported"
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "statusCode": 401,
  "message": "Unauthorized access"
}
```

---

## Complete Example: Message Component with Image Preview

```jsx
import { useState } from 'react';

function MessageComposer({ chatId, receiverId, token, onMessageSent }) {
  const [content, setContent] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [sending, setSending] = useState(false);

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    }
  };

  const removeImage = () => {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    setImageFile(null);
    setImagePreview(null);
  };

  const sendMessage = async () => {
    if (!content && !imageFile) {
      alert('Please enter a message or select an image');
      return;
    }

    setSending(true);
    const formData = new FormData();
    formData.append('chatId', chatId);
    formData.append('receiverId', receiverId);
    
    if (content) formData.append('content', content);
    if (imageFile) formData.append('image', imageFile);

    try {
      const response = await fetch('/api/v1/message/send', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const result = await response.json();
      
      // Reset form
      setContent('');
      removeImage();
      
      // Notify parent component
      if (onMessageSent) {
        onMessageSent(result.data);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="message-composer">
      {imagePreview && (
        <div className="image-preview">
          <img src={imagePreview} alt="Preview" style={{ maxWidth: '200px' }} />
          <button onClick={removeImage}>Remove</button>
        </div>
      )}
      
      <input
        type="text"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Type a message..."
        disabled={sending}
      />
      
      <label>
        📎 Attach Image
        <input
          type="file"
          accept="image/*"
          onChange={handleImageSelect}
          style={{ display: 'none' }}
          disabled={sending}
        />
      </label>
      
      <button onClick={sendMessage} disabled={sending || (!content && !imageFile)}>
        {sending ? 'Sending...' : 'Send'}
      </button>
    </div>
  );
}

export default MessageComposer;
```

---

## Tips & Best Practices

1. **Always use FormData for image uploads** - Don't try to send files as JSON
2. **Don't set Content-Type header** - Let the browser set it with proper boundary for multipart data
3. **Preview images before sending** - Use `URL.createObjectURL()` for client-side preview
4. **Clean up preview URLs** - Call `URL.revokeObjectURL()` when done to prevent memory leaks
5. **Handle loading states** - Show user feedback while image is uploading
6. **Validate file size** - Check file size on client before uploading (recommended max: 10MB)
7. **Accept appropriate formats** - Use `accept="image/*"` on file inputs
8. **Display uploaded images** - Concatenate base URL with `mediaUrl` from response

---

## Testing with Postman

### Text Message
1. Select POST method
2. Enter URL: `http://localhost:5000/api/v1/message/send`
3. Go to Headers → Add `Authorization: Bearer YOUR_TOKEN`
4. Go to Body → Select `raw` → Select `JSON`
5. Enter JSON body and send

### Image Upload
1. Select POST method
2. Enter URL: `http://localhost:5000/api/v1/message/send`
3. Go to Headers → Add `Authorization: Bearer YOUR_TOKEN`
4. Go to Body → Select `form-data`
5. Add fields:
   - `chatId` (text)
   - `receiverId` (text)
   - `content` (text) - optional
   - `image` (file) - select file from your computer
6. Click Send

---

## Socket.IO Real-time Updates

When a message is sent successfully, the server will also emit a socket event to notify connected clients in real-time. Make sure your frontend is listening for these events to update the UI immediately.

```javascript
// Listen for new messages
socket.on('new-message', (message) => {
  console.log('New message received:', message);
  // Update your messages state/UI here
});
```

For complete socket implementation, refer to `SOCKET_DOCUMENTATION.md`.
