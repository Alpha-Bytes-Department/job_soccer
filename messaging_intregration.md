# Chat & Messaging System - Frontend Integration Guide

## Table of Contents

1. [Overview](#overview)
2. [Installation](#installation)
3. [Socket Connection Setup](#socket-connection-setup)
4. [Authentication](#authentication)
5. [REST API Endpoints](#rest-api-endpoints)
   - [Chat Endpoints](#chat-endpoints)
   - [Message Endpoints](#message-endpoints)
6. [Socket Events Reference](#socket-events-reference)
   - [Client to Server Events (Emit)](#client-to-server-events-emit)
   - [Server to Client Events (Listen)](#server-to-client-events-listen)
7. [Complete Feature Implementation](#complete-feature-implementation)
   - [Sending Messages](#sending-messages)
   - [Receiving Messages](#receiving-messages)
   - [Typing Indicators](#typing-indicators)
   - [Mark Messages as Read](#mark-messages-as-read)
   - [Block/Unblock Users](#blockunblock-users)
   - [Online/Offline Status](#onlineoffline-status)
8. [Data Models & Types](#data-models--types)
9. [Error Handling](#error-handling)
10. [React Integration Examples](#react-integration-examples)
11. [Best Practices](#best-practices)
12. [Troubleshooting](#troubleshooting)

---

## Overview

This document provides comprehensive integration details for the Job Soccer real-time chat and messaging system. The system uses **Socket.IO** for real-time communication and **REST APIs** for data persistence and retrieval.

### Key Features

- ✅ Real-time messaging between candidates and employers
- ✅ JWT-based socket authentication
- ✅ User blocking/unblocking functionality
- ✅ Typing indicators
- ✅ Message read receipts
- ✅ Online/offline status tracking
- ✅ Media message support (images, videos, files)
- ✅ Message search functionality
- ✅ Pagination support

---

## Installation

```bash
# Using npm
npm install socket.io-client

# Using yarn
yarn add socket.io-client

# Using pnpm
pnpm add socket.io-client
```

---

## Socket Connection Setup

### Basic Connection

```javascript
import { io } from 'socket.io-client';

// Your backend URL
const SOCKET_URL = 'http://localhost:5000'; // Replace with your production URL

// Get JWT token from your auth system
const token = localStorage.getItem('authToken');

// Initialize socket connection
const socket = io(SOCKET_URL, {
  auth: {
    token: token // Can be "Bearer <token>" or just "<token>"
  },
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});
```

### Connection with Headers (Alternative)

```javascript
const socket = io(SOCKET_URL, {
  extraHeaders: {
    Authorization: `Bearer ${token}`
  },
  transports: ['websocket', 'polling']
});
```

### Connection with Query Parameters (Alternative)

```javascript
const socket = io(SOCKET_URL, {
  query: {
    token: token
  },
  transports: ['websocket', 'polling']
});
```

---

## Authentication

The socket server accepts JWT tokens in multiple formats:

| Method | Example |
|--------|---------|
| `auth.token` | `{ auth: { token: 'your_jwt_token' } }` |
| `headers.authorization` | `{ extraHeaders: { Authorization: 'Bearer your_jwt_token' } }` |
| `query.token` | `{ query: { token: 'your_jwt_token' } }` |

### Connection Success Response

When connected successfully, you'll receive:

```javascript
socket.on('connected', (data) => {
  console.log('Connected!', data);
  // Response:
  // {
  //   success: true,
  //   userId: "64abc123def456",
  //   socketId: "socket_123xyz",
  //   message: "Connected successfully"
  // }
});
```

### Connection Error Response

```javascript
socket.on('connect_error', (error) => {
  console.error('Connection failed:', error.message);
  // Possible errors:
  // - "Authentication error: No token provided"
  // - "Authentication error: Invalid token"
  // - "Authentication error: Invalid token payload"
});
```

---

## REST API Endpoints

### Chat Endpoints

#### 1. Create or Get Chat

Creates a new chat between two users or returns existing chat.

```
POST /api/v1/chat/create-or-get
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "otherUserId": "64abc123def456789"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Chat retrieved successfully",
  "data": {
    "_id": "64def789abc123456",
    "users": [
      {
        "_id": "64abc123def456789",
        "firstName": "John",
        "lastName": "Doe",
        "profileImage": "https://example.com/image.jpg",
        "userType": "candidate",
        "role": "candidate"
      },
      {
        "_id": "64xyz789abc123456",
        "firstName": "Jane",
        "lastName": "Smith",
        "profileImage": "https://example.com/image2.jpg",
        "userType": "employer",
        "role": "employer"
      }
    ],
    "isBlocked": false,
    "latestMessage": null,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

---

#### 2. Get User Chats (Chat List)

Get all chats for the authenticated user.

```
GET /api/v1/chat/my-chats?page=1&limit=20
Authorization: Bearer <token>
```

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | number | 1 | Page number |
| limit | number | 20 | Items per page |

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Chats retrieved successfully",
  "data": [
    {
      "_id": "64def789abc123456",
      "users": [
        {
          "_id": "64abc123def456789",
          "firstName": "John",
          "lastName": "Doe",
          "profileImage": "https://example.com/image.jpg",
          "userType": "candidate",
          "role": "candidate"
        },
        {
          "_id": "64xyz789abc123456",
          "firstName": "Jane",
          "lastName": "Smith",
          "profileImage": "https://example.com/image2.jpg",
          "userType": "employer",
          "role": "employer"
        }
      ],
      "latestMessage": {
        "_id": "64msg123abc456789",
        "content": "Hello! How are you?",
        "messageType": "text",
        "createdAt": "2024-01-15T11:00:00.000Z",
        "isRead": false,
        "senderId": "64abc123def456789"
      },
      "isBlocked": false,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T11:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "totalPage": 1
  }
}
```

---

#### 3. Get Chat by ID

Get a specific chat with full details.

```
GET /api/v1/chat/:chatId
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Chat retrieved successfully",
  "data": {
    "_id": "64def789abc123456",
    "users": [...],
    "latestMessage": {...},
    "isBlocked": false,
    "blockedBy": null,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

---

#### 4. Get Blocked Chats

Get all chats blocked by the authenticated user.

```
GET /api/v1/chat/blocked
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Blocked chats retrieved successfully",
  "data": [
    {
      "_id": "64def789abc123456",
      "users": [...],
      "isBlocked": true,
      "blockedBy": "64abc123def456789"
    }
  ]
}
```

---

#### 5. Block User (REST API)

Block a user in a specific chat.

```
POST /api/v1/chat/:chatId/block
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "User blocked successfully",
  "data": {
    "_id": "64def789abc123456",
    "isBlocked": true,
    "blockedBy": "64abc123def456789"
  }
}
```

---

#### 6. Unblock User (REST API)

Unblock a user in a specific chat.

```
POST /api/v1/chat/:chatId/unblock
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "User unblocked successfully",
  "data": {
    "_id": "64def789abc123456",
    "isBlocked": false,
    "blockedBy": null
  }
}
```

---

#### 7. Delete Chat

Delete a specific chat.

```
DELETE /api/v1/chat/:chatId
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Chat deleted successfully",
  "data": null
}
```

---

### Message Endpoints

#### 1. Send Message (REST API)

Send a new message via REST API.

```
POST /api/v1/message/send
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "chatId": "64def789abc123456",
  "receiverId": "64xyz789abc123456",
  "content": "Hello! How are you?",
  "messageType": "text"
}
```

**For Media Messages:**
```json
{
  "chatId": "64def789abc123456",
  "receiverId": "64xyz789abc123456",
  "mediaUrl": "https://example.com/image.jpg",
  "messageType": "image"
}
```

**Message Types:**
| Type | Description |
|------|-------------|
| `text` | Text message (requires `content`) |
| `image` | Image message (requires `mediaUrl`) |
| `video` | Video message (requires `mediaUrl`) |
| `file` | File message (requires `mediaUrl`) |

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Message sent successfully",
  "data": {
    "_id": "64msg123abc456789",
    "chatId": "64def789abc123456",
    "senderId": {
      "_id": "64abc123def456789",
      "firstName": "John",
      "lastName": "Doe",
      "profileImage": "https://example.com/image.jpg"
    },
    "receiverId": {
      "_id": "64xyz789abc123456",
      "firstName": "Jane",
      "lastName": "Smith",
      "profileImage": "https://example.com/image2.jpg"
    },
    "content": "Hello! How are you?",
    "messageType": "text",
    "isRead": false,
    "isDeleted": false,
    "createdAt": "2024-01-15T11:00:00.000Z",
    "updatedAt": "2024-01-15T11:00:00.000Z"
  }
}
```

---

#### 2. Get Messages by Chat ID

Get all messages in a specific chat with pagination.

```
GET /api/v1/message/chat/:chatId?page=1&limit=50
Authorization: Bearer <token>
```

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | number | 1 | Page number |
| limit | number | 50 | Items per page |

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Messages retrieved successfully",
  "data": [
    {
      "_id": "64msg123abc456789",
      "chatId": "64def789abc123456",
      "senderId": {
        "_id": "64abc123def456789",
        "firstName": "John",
        "lastName": "Doe",
        "profileImage": "https://example.com/image.jpg"
      },
      "receiverId": {
        "_id": "64xyz789abc123456",
        "firstName": "Jane",
        "lastName": "Smith",
        "profileImage": "https://example.com/image2.jpg"
      },
      "content": "Hello! How are you?",
      "messageType": "text",
      "isRead": true,
      "isDeleted": false,
      "createdAt": "2024-01-15T11:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 50,
    "total": 25,
    "totalPage": 1
  }
}
```

---

#### 3. Mark Messages as Read (REST API)

Mark all messages in a chat as read.

```
POST /api/v1/message/chat/:chatId/mark-read
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Messages marked as read",
  "data": null
}
```

---

#### 4. Get Unread Message Count

Get total count of unread messages for the authenticated user.

```
GET /api/v1/message/unread-count
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Unread message count retrieved successfully",
  "data": {
    "count": 5
  }
}
```

---

#### 5. Search Messages

Search messages within a specific chat.

```
GET /api/v1/message/chat/:chatId/search?searchTerm=hello
Authorization: Bearer <token>
```

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| searchTerm | string | Yes | Search term (min 1 character) |

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Messages retrieved successfully",
  "data": [
    {
      "_id": "64msg123abc456789",
      "content": "Hello! How are you?",
      "messageType": "text",
      "senderId": {...},
      "receiverId": {...},
      "createdAt": "2024-01-15T11:00:00.000Z"
    }
  ]
}
```

---

#### 6. Delete Message

Delete a specific message (only sender can delete).

```
DELETE /api/v1/message/:messageId
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Message deleted successfully",
  "data": null
}
```

---

## Socket Events Reference

### Client to Server Events (Emit)

These are events that the **frontend emits** to the server.

| Event Name | Payload | Callback Response | Description |
|------------|---------|-------------------|-------------|
| `send_message` | `{ chatId, receiverId, content?, mediaUrl?, messageType }` | `{ success, message } \| { error }` | Send a message |
| `mark_messages_read` | `{ chatId }` | `{ success } \| { error }` | Mark messages as read |
| `typing_start` | `{ chatId, receiverId }` | None | Notify typing started |
| `typing_stop` | `{ chatId, receiverId }` | None | Notify typing stopped |
| `block_user` | `{ chatId }` | `{ success, chat } \| { error }` | Block a user |
| `unblock_user` | `{ chatId }` | `{ success, chat } \| { error }` | Unblock a user |
| `get_online_users` | None | `{ success, onlineUsers, count }` | Get online users list |
| `ping` | None | `{ pong, timestamp }` | Health check |
| `manual_disconnect` | None | None | Manually disconnect |

---

### Server to Client Events (Listen)

These are events that the **frontend listens** to from the server.

| Event Name | Payload | Description |
|------------|---------|-------------|
| `connected` | `{ success, userId, socketId, message }` | Connection successful |
| `new_message` | `{ message }` | New message received |
| `message_sent` | `{ success, message }` | Message sent confirmation |
| `chat_updated` | `{ chatId }` | Chat was updated (refresh chat list) |
| `messages_marked_read` | `{ success, chatId }` | Your messages were marked as read |
| `messages_read_by_other` | `{ chatId, readByUserId }` | Other user read your messages |
| `user_typing` | `{ chatId, userId }` | User is typing |
| `user_stopped_typing` | `{ chatId, userId }` | User stopped typing |
| `user_blocked` | `{ success, chat }` | You blocked a user |
| `you_were_blocked` | `{ chatId, blockedByUserId }` | You were blocked |
| `user_unblocked` | `{ success, chat }` | You unblocked a user |
| `you_were_unblocked` | `{ chatId, unblockedByUserId }` | You were unblocked |
| `user_online` | `{ userId }` | User came online |
| `user_offline` | `{ userId }` | User went offline |
| `online_users` | `{ success, onlineUsers, count }` | List of online users |
| `error` | `{ message }` | Error occurred |

---

## Complete Feature Implementation

### Sending Messages

#### Via Socket (Real-time)

```javascript
// Send text message
function sendTextMessage(chatId, receiverId, content) {
  socket.emit('send_message', {
    chatId: chatId,
    receiverId: receiverId,
    content: content,
    messageType: 'text'
  }, (response) => {
    if (response.error) {
      console.error('Failed to send message:', response.error.message);
      // Show error to user
      alert('Failed to send message: ' + response.error.message);
    } else {
      console.log('Message sent successfully:', response.message);
      // Add message to local state
      addMessageToUI(response.message);
    }
  });
}

// Send image message
function sendImageMessage(chatId, receiverId, imageUrl) {
  socket.emit('send_message', {
    chatId: chatId,
    receiverId: receiverId,
    mediaUrl: imageUrl,
    messageType: 'image'
  }, (response) => {
    if (response.error) {
      console.error('Failed to send image:', response.error.message);
    } else {
      console.log('Image sent successfully:', response.message);
      addMessageToUI(response.message);
    }
  });
}

// Send video message
function sendVideoMessage(chatId, receiverId, videoUrl) {
  socket.emit('send_message', {
    chatId: chatId,
    receiverId: receiverId,
    mediaUrl: videoUrl,
    messageType: 'video'
  }, (response) => {
    if (response.error) {
      console.error('Failed to send video:', response.error.message);
    } else {
      addMessageToUI(response.message);
    }
  });
}

// Send file message
function sendFileMessage(chatId, receiverId, fileUrl) {
  socket.emit('send_message', {
    chatId: chatId,
    receiverId: receiverId,
    mediaUrl: fileUrl,
    messageType: 'file'
  }, (response) => {
    if (response.error) {
      console.error('Failed to send file:', response.error.message);
    } else {
      addMessageToUI(response.message);
    }
  });
}
```

#### Message Sent Confirmation

```javascript
// Listen for message sent confirmation
socket.on('message_sent', (data) => {
  console.log('Message confirmed by server:', data.message);
  // Update message status in UI (e.g., show checkmark)
  updateMessageStatus(data.message._id, 'sent');
});
```

---

### Receiving Messages

```javascript
// Listen for new messages
socket.on('new_message', (data) => {
  const message = data.message;
  
  console.log('New message received:', message);
  
  // Add message to chat UI
  addMessageToUI(message);
  
  // Show notification if not in the current chat
  if (currentChatId !== message.chatId) {
    showNotification({
      title: `${message.senderId.firstName} ${message.senderId.lastName}`,
      body: message.content || 'Sent a media file',
      icon: message.senderId.profileImage
    });
  }
  
  // Play notification sound
  playNotificationSound();
});

// Listen for chat updates (refresh chat list)
socket.on('chat_updated', (data) => {
  console.log('Chat updated:', data.chatId);
  // Refresh chat list to show latest message
  refreshChatList();
});
```

---

### Typing Indicators

```javascript
let typingTimeout = null;

// Start typing indicator
function startTyping(chatId, receiverId) {
  socket.emit('typing_start', {
    chatId: chatId,
    receiverId: receiverId
  });
  
  // Auto-stop typing after 3 seconds of inactivity
  if (typingTimeout) {
    clearTimeout(typingTimeout);
  }
  
  typingTimeout = setTimeout(() => {
    stopTyping(chatId, receiverId);
  }, 3000);
}

// Stop typing indicator
function stopTyping(chatId, receiverId) {
  socket.emit('typing_stop', {
    chatId: chatId,
    receiverId: receiverId
  });
  
  if (typingTimeout) {
    clearTimeout(typingTimeout);
    typingTimeout = null;
  }
}

// Listen for typing indicators
socket.on('user_typing', (data) => {
  console.log(`User ${data.userId} is typing in chat ${data.chatId}`);
  // Show typing indicator in UI
  showTypingIndicator(data.chatId, data.userId);
});

socket.on('user_stopped_typing', (data) => {
  console.log(`User ${data.userId} stopped typing in chat ${data.chatId}`);
  // Hide typing indicator in UI
  hideTypingIndicator(data.chatId, data.userId);
});

// Example: Handle input changes
function onInputChange(chatId, receiverId, value) {
  if (value.length > 0) {
    startTyping(chatId, receiverId);
  } else {
    stopTyping(chatId, receiverId);
  }
}
```

---

### Mark Messages as Read

```javascript
// Mark messages as read when opening a chat
function markMessagesAsRead(chatId) {
  socket.emit('mark_messages_read', { chatId }, (response) => {
    if (response.error) {
      console.error('Failed to mark messages as read:', response.error.message);
    } else {
      console.log('Messages marked as read');
      // Update UI to show read status
      updateUnreadBadge(chatId, 0);
    }
  });
}

// Listen for your messages being marked as read
socket.on('messages_marked_read', (data) => {
  console.log('Your messages in chat', data.chatId, 'were marked as read');
});

// Listen for when other user reads your messages
socket.on('messages_read_by_other', (data) => {
  console.log('User', data.readByUserId, 'read your messages in chat', data.chatId);
  // Update message status to show "read" (double checkmarks)
  updateMessagesReadStatus(data.chatId);
});
```

---

### Block/Unblock Users

#### Block User

```javascript
function blockUser(chatId) {
  socket.emit('block_user', { chatId }, (response) => {
    if (response.error) {
      console.error('Failed to block user:', response.error.message);
      alert('Failed to block user: ' + response.error.message);
    } else {
      console.log('User blocked successfully:', response.chat);
      // Disable chat input
      disableChatInput(chatId);
      // Update UI
      showBlockedStatus(chatId);
    }
  });
}

// Listen for block confirmation
socket.on('user_blocked', (data) => {
  console.log('Block confirmed:', data.chat);
});

// Listen when you get blocked by someone
socket.on('you_were_blocked', (data) => {
  console.log('You were blocked by user', data.blockedByUserId, 'in chat', data.chatId);
  // Disable chat input
  disableChatInput(data.chatId);
  // Show message to user
  showMessage('You have been blocked by this user');
});
```

#### Unblock User

```javascript
function unblockUser(chatId) {
  socket.emit('unblock_user', { chatId }, (response) => {
    if (response.error) {
      console.error('Failed to unblock user:', response.error.message);
      alert('Failed to unblock user: ' + response.error.message);
    } else {
      console.log('User unblocked successfully:', response.chat);
      // Enable chat input
      enableChatInput(chatId);
      // Update UI
      hideBlockedStatus(chatId);
    }
  });
}

// Listen for unblock confirmation
socket.on('user_unblocked', (data) => {
  console.log('Unblock confirmed:', data.chat);
});

// Listen when you get unblocked by someone
socket.on('you_were_unblocked', (data) => {
  console.log('You were unblocked by user', data.unblockedByUserId, 'in chat', data.chatId);
  // Enable chat input
  enableChatInput(data.chatId);
  // Show message to user
  showMessage('You have been unblocked');
});
```

---

### Online/Offline Status

```javascript
// Get list of online users
function getOnlineUsers() {
  socket.emit('get_online_users', (response) => {
    if (response.success) {
      console.log('Online users:', response.onlineUsers);
      console.log('Total online:', response.count);
      // Update UI with online status
      updateOnlineStatuses(response.onlineUsers);
    }
  });
}

// Listen for users coming online
socket.on('user_online', (data) => {
  console.log('User came online:', data.userId);
  setUserOnlineStatus(data.userId, true);
});

// Listen for users going offline
socket.on('user_offline', (data) => {
  console.log('User went offline:', data.userId);
  setUserOnlineStatus(data.userId, false);
});

// Listen for online users list (alternative)
socket.on('online_users', (data) => {
  console.log('Online users list:', data.onlineUsers);
  updateOnlineStatuses(data.onlineUsers);
});
```

---

## Data Models & Types

### Chat Object

```typescript
interface Chat {
  _id: string;
  users: [User, User];           // Array of 2 users
  latestMessage?: Message;        // Latest message in chat
  isBlocked: boolean;             // Is chat blocked?
  blockedBy?: string;             // User ID who blocked
  createdAt: string;              // ISO date string
  updatedAt: string;              // ISO date string
}
```

### Message Object

```typescript
interface Message {
  _id: string;
  chatId: string;                  // Reference to Chat
  senderId: User | string;         // Sender user (populated or ID)
  receiverId: User | string;       // Receiver user (populated or ID)
  content?: string;                // Text content (for text messages)
  mediaUrl?: string;               // Media URL (for image/video/file)
  messageType: 'text' | 'image' | 'video' | 'file';
  isRead: boolean;
  isDeleted: boolean;
  createdAt: string;               // ISO date string
  updatedAt: string;               // ISO date string
}
```

### User Object (in chat context)

```typescript
interface User {
  _id: string;
  firstName: string;
  lastName: string;
  profileImage?: string;
  userType: 'candidate' | 'employer';
  role: string;
}
```

### Message Types Enum

```typescript
enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  VIDEO = 'video',
  FILE = 'file'
}
```

---

## Error Handling

### Error Response Format

```javascript
// Error structure
{
  message: "Error description here"
}

// Example errors:
{
  message: "Unauthorized: User not authenticated"
}

{
  message: "Chat ID and Receiver ID are required"
}

{
  message: "Either content or mediaUrl must be provided"
}

{
  message: "You cannot send messages to this user. They have blocked you."
}
```

### Listen for Socket Errors

```javascript
// General error handler
socket.on('error', (error) => {
  console.error('Socket error:', error);
  
  // Show error to user
  showErrorNotification(error.message);
  
  // Handle specific errors
  if (error.message.includes('blocked')) {
    disableCurrentChat();
  }
});

// Connection error handler
socket.on('connect_error', (error) => {
  console.error('Connection error:', error.message);
  
  if (error.message.includes('Authentication')) {
    // Token invalid - redirect to login
    redirectToLogin();
  } else {
    // Network issue - show reconnecting message
    showReconnectingMessage();
  }
});

// Disconnect handler
socket.on('disconnect', (reason) => {
  console.log('Disconnected:', reason);
  
  if (reason === 'io server disconnect') {
    // Server disconnected us - try to reconnect
    socket.connect();
  }
  // else: client-side disconnect or transport close
});
```

---

## React Integration Examples

### Custom Hook: useSocket

```javascript
import { useEffect, useState, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

export function useSocket(token) {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!token) return;

    // Create socket connection
    const newSocket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    // Connection events
    newSocket.on('connected', (data) => {
      console.log('Connected:', data);
      setConnected(true);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Connection error:', error.message);
      setConnected(false);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('Disconnected:', reason);
      setConnected(false);
    });

    // Online status events
    newSocket.on('user_online', (data) => {
      setOnlineUsers(prev => [...new Set([...prev, data.userId])]);
    });

    newSocket.on('user_offline', (data) => {
      setOnlineUsers(prev => prev.filter(id => id !== data.userId));
    });

    newSocket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [token]);

  // Send message function
  const sendMessage = useCallback((chatId, receiverId, content, messageType = 'text', mediaUrl = null) => {
    return new Promise((resolve, reject) => {
      if (!socketRef.current) {
        reject(new Error('Socket not connected'));
        return;
      }

      const payload = {
        chatId,
        receiverId,
        messageType,
      };

      if (messageType === 'text') {
        payload.content = content;
      } else {
        payload.mediaUrl = mediaUrl || content;
      }

      socketRef.current.emit('send_message', payload, (response) => {
        if (response.error) {
          reject(new Error(response.error.message));
        } else {
          resolve(response.message);
        }
      });
    });
  }, []);

  // Mark messages as read
  const markAsRead = useCallback((chatId) => {
    return new Promise((resolve, reject) => {
      if (!socketRef.current) {
        reject(new Error('Socket not connected'));
        return;
      }

      socketRef.current.emit('mark_messages_read', { chatId }, (response) => {
        if (response.error) {
          reject(new Error(response.error.message));
        } else {
          resolve(response);
        }
      });
    });
  }, []);

  // Typing indicators
  const startTyping = useCallback((chatId, receiverId) => {
    if (socketRef.current) {
      socketRef.current.emit('typing_start', { chatId, receiverId });
    }
  }, []);

  const stopTyping = useCallback((chatId, receiverId) => {
    if (socketRef.current) {
      socketRef.current.emit('typing_stop', { chatId, receiverId });
    }
  }, []);

  // Block user
  const blockUser = useCallback((chatId) => {
    return new Promise((resolve, reject) => {
      if (!socketRef.current) {
        reject(new Error('Socket not connected'));
        return;
      }

      socketRef.current.emit('block_user', { chatId }, (response) => {
        if (response.error) {
          reject(new Error(response.error.message));
        } else {
          resolve(response.chat);
        }
      });
    });
  }, []);

  // Unblock user
  const unblockUser = useCallback((chatId) => {
    return new Promise((resolve, reject) => {
      if (!socketRef.current) {
        reject(new Error('Socket not connected'));
        return;
      }

      socketRef.current.emit('unblock_user', { chatId }, (response) => {
        if (response.error) {
          reject(new Error(response.error.message));
        } else {
          resolve(response.chat);
        }
      });
    });
  }, []);

  // Get online users
  const getOnlineUsers = useCallback(() => {
    return new Promise((resolve) => {
      if (!socketRef.current) {
        resolve([]);
        return;
      }

      socketRef.current.emit('get_online_users', (response) => {
        if (response.success) {
          setOnlineUsers(response.onlineUsers);
          resolve(response.onlineUsers);
        } else {
          resolve([]);
        }
      });
    });
  }, []);

  return {
    socket,
    connected,
    onlineUsers,
    sendMessage,
    markAsRead,
    startTyping,
    stopTyping,
    blockUser,
    unblockUser,
    getOnlineUsers,
  };
}
```

### Custom Hook: useChat

```javascript
import { useEffect, useState, useCallback } from 'react';
import { useSocket } from './useSocket';

export function useChat(token, chatId, receiverId) {
  const {
    socket,
    connected,
    sendMessage: socketSendMessage,
    markAsRead,
    startTyping,
    stopTyping,
  } = useSocket(token);

  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState(null);

  // Listen for new messages
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (data) => {
      if (data.message.chatId === chatId) {
        setMessages(prev => [...prev, data.message]);
      }
    };

    const handleTyping = (data) => {
      if (data.chatId === chatId && data.userId === receiverId) {
        setIsTyping(true);
      }
    };

    const handleStoppedTyping = (data) => {
      if (data.chatId === chatId && data.userId === receiverId) {
        setIsTyping(false);
      }
    };

    const handleMessagesRead = (data) => {
      if (data.chatId === chatId) {
        setMessages(prev =>
          prev.map(msg => ({ ...msg, isRead: true }))
        );
      }
    };

    socket.on('new_message', handleNewMessage);
    socket.on('user_typing', handleTyping);
    socket.on('user_stopped_typing', handleStoppedTyping);
    socket.on('messages_read_by_other', handleMessagesRead);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('user_typing', handleTyping);
      socket.off('user_stopped_typing', handleStoppedTyping);
      socket.off('messages_read_by_other', handleMessagesRead);
    };
  }, [socket, chatId, receiverId]);

  // Mark messages as read when chat opens
  useEffect(() => {
    if (connected && chatId) {
      markAsRead(chatId).catch(console.error);
    }
  }, [connected, chatId, markAsRead]);

  // Send message
  const sendMessage = useCallback(async (content, messageType = 'text') => {
    try {
      setError(null);
      const message = await socketSendMessage(chatId, receiverId, content, messageType);
      setMessages(prev => [...prev, message]);
      return message;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [chatId, receiverId, socketSendMessage]);

  // Handle typing
  const handleTyping = useCallback((isTypingNow) => {
    if (isTypingNow) {
      startTyping(chatId, receiverId);
    } else {
      stopTyping(chatId, receiverId);
    }
  }, [chatId, receiverId, startTyping, stopTyping]);

  return {
    messages,
    setMessages,
    isTyping,
    connected,
    error,
    sendMessage,
    handleTyping,
    markAsRead: () => markAsRead(chatId),
  };
}
```

### Chat Component Example

```javascript
import React, { useState, useEffect, useRef } from 'react';
import { useChat } from './hooks/useChat';

function ChatComponent({ token, chatId, receiverId, otherUser }) {
  const {
    messages,
    setMessages,
    isTyping,
    connected,
    error,
    sendMessage,
    handleTyping,
  } = useChat(token, chatId, receiverId);

  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle input change with typing indicator
  const onInputChange = (e) => {
    const value = e.target.value;
    setInputValue(value);

    // Start typing
    handleTyping(true);

    // Stop typing after 2 seconds of inactivity
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      handleTyping(false);
    }, 2000);
  };

  // Handle send message
  const onSend = async () => {
    if (!inputValue.trim() || isSending) return;

    setIsSending(true);
    handleTyping(false);

    try {
      await sendMessage(inputValue.trim());
      setInputValue('');
    } catch (err) {
      alert('Failed to send message: ' + err.message);
    } finally {
      setIsSending(false);
    }
  };

  // Handle Enter key
  const onKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className="chat-container">
      {/* Connection Status */}
      <div className={`status ${connected ? 'online' : 'offline'}`}>
        {connected ? '🟢 Connected' : '🔴 Disconnected'}
      </div>

      {/* Error Display */}
      {error && (
        <div className="error-banner">
          Error: {error}
        </div>
      )}

      {/* Messages List */}
      <div className="messages-list">
        {messages.map((message) => (
          <div
            key={message._id}
            className={`message ${message.senderId._id === receiverId ? 'received' : 'sent'}`}
          >
            {message.messageType === 'text' ? (
              <p>{message.content}</p>
            ) : message.messageType === 'image' ? (
              <img src={message.mediaUrl} alt="Shared" />
            ) : message.messageType === 'video' ? (
              <video src={message.mediaUrl} controls />
            ) : (
              <a href={message.mediaUrl} target="_blank" rel="noreferrer">
                📎 Download File
              </a>
            )}
            <span className="time">
              {new Date(message.createdAt).toLocaleTimeString()}
              {message.isRead && ' ✓✓'}
            </span>
          </div>
        ))}

        {/* Typing Indicator */}
        {isTyping && (
          <div className="typing-indicator">
            {otherUser.firstName} is typing...
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="input-area">
        <input
          type="text"
          value={inputValue}
          onChange={onInputChange}
          onKeyPress={onKeyPress}
          placeholder="Type a message..."
          disabled={!connected || isSending}
        />
        <button onClick={onSend} disabled={!connected || isSending || !inputValue.trim()}>
          {isSending ? 'Sending...' : 'Send'}
        </button>
      </div>
    </div>
  );
}

export default ChatComponent;
```

---

## Best Practices

### 1. Connection Management

```javascript
// Always clean up socket on component unmount
useEffect(() => {
  return () => {
    if (socket) {
      socket.disconnect();
    }
  };
}, [socket]);

// Handle page visibility for connection optimization
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    // Page is hidden - can reduce activity
  } else {
    // Page is visible - reconnect if needed
    if (!socket.connected) {
      socket.connect();
    }
  }
});
```

### 2. Message Handling

```javascript
// De-duplicate messages
const addMessage = (newMessage) => {
  setMessages(prev => {
    // Check if message already exists
    if (prev.some(m => m._id === newMessage._id)) {
      return prev;
    }
    return [...prev, newMessage];
  });
};

// Optimistic updates
const sendWithOptimisticUpdate = async (content) => {
  const tempId = 'temp_' + Date.now();
  const optimisticMessage = {
    _id: tempId,
    content,
    senderId: currentUser,
    createdAt: new Date().toISOString(),
    status: 'sending'
  };

  // Add immediately
  addMessage(optimisticMessage);

  try {
    const realMessage = await sendMessage(content);
    // Replace optimistic with real
    setMessages(prev => 
      prev.map(m => m._id === tempId ? realMessage : m)
    );
  } catch (error) {
    // Mark as failed
    setMessages(prev =>
      prev.map(m => m._id === tempId ? { ...m, status: 'failed' } : m)
    );
  }
};
```

### 3. Typing Indicator Debouncing

```javascript
// Debounce typing events
const debouncedTyping = useMemo(() => {
  let timeout;
  return {
    start: (chatId, receiverId) => {
      socket.emit('typing_start', { chatId, receiverId });
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        socket.emit('typing_stop', { chatId, receiverId });
      }, 3000);
    },
    stop: (chatId, receiverId) => {
      clearTimeout(timeout);
      socket.emit('typing_stop', { chatId, receiverId });
    }
  };
}, [socket]);
```

### 4. Error Retry Logic

```javascript
// Retry failed messages
const retryMessage = async (failedMessage) => {
  try {
    const message = await sendMessage(
      failedMessage.chatId,
      failedMessage.receiverId,
      failedMessage.content,
      failedMessage.messageType
    );
    // Replace failed with success
    setMessages(prev =>
      prev.map(m => m._id === failedMessage._id ? message : m)
    );
  } catch (error) {
    alert('Retry failed: ' + error.message);
  }
};
```

---

## Troubleshooting

### Common Issues

| Issue | Possible Cause | Solution |
|-------|----------------|----------|
| Connection fails | Invalid token | Check token validity, refresh if expired |
| Messages not receiving | Socket disconnected | Check `connected` state, reconnect |
| Typing indicator stuck | User disconnected | Auto-hide after timeout |
| Duplicate messages | Multiple event handlers | Use cleanup functions in useEffect |
| "You were blocked" error | User blocked you | Disable chat input, show message |

### Debug Mode

```javascript
// Enable socket.io debug mode
localStorage.setItem('debug', 'socket.io-client:*');

// Or programmatically
import { io } from 'socket.io-client';
const socket = io(URL, {
  auth: { token },
  // Enable debug
  debug: true
});

// Log all events
socket.onAny((event, ...args) => {
  console.log(`[Socket Event] ${event}:`, args);
});
```

### Connection Test

```javascript
// Test connection health
function testConnection() {
  socket.emit('ping', (response) => {
    if (response.pong) {
      console.log('Connection healthy, latency:', Date.now() - response.timestamp, 'ms');
    }
  });
}

// Run health check every 30 seconds
setInterval(testConnection, 30000);
```

---

## Quick Reference Card

### Essential Events to Listen

```javascript
// Must have
socket.on('connected', handler);        // Connection success
socket.on('new_message', handler);      // Receive messages
socket.on('error', handler);            // Handle errors
socket.on('connect_error', handler);    // Connection errors

// Recommended
socket.on('user_typing', handler);      // Typing indicator
socket.on('user_stopped_typing', handler);
socket.on('messages_read_by_other', handler);
socket.on('chat_updated', handler);
socket.on('user_online', handler);
socket.on('user_offline', handler);

// Blocking feature
socket.on('you_were_blocked', handler);
socket.on('you_were_unblocked', handler);
```

### Essential Events to Emit

```javascript
// Sending messages
socket.emit('send_message', { chatId, receiverId, content, messageType }, callback);

// Read receipts
socket.emit('mark_messages_read', { chatId }, callback);

// Typing
socket.emit('typing_start', { chatId, receiverId });
socket.emit('typing_stop', { chatId, receiverId });

// Block/Unblock
socket.emit('block_user', { chatId }, callback);
socket.emit('unblock_user', { chatId }, callback);

// Online status
socket.emit('get_online_users', callback);
```

---

**Document Version:** 1.0  
**Last Updated:** December 2024  
**Backend Version:** Compatible with Socket.IO 4.x
