# Profile View Tracking System

## Overview
The Profile View module tracks when authenticated users view other users' profiles. It provides analytics on profile visibility, including total views, unique viewers, and time-based filtering.

## Features
✅ Track profile views automatically when users view profiles  
✅ View count and viewer details with pagination  
✅ Time-based filtering (last 3 days, 7 days, 30 days, custom)  
✅ Statistics breakdown (today, last 7 days, last 30 days)  
✅ Unique viewer counting  
✅ Prevents self-view tracking  
✅ Efficient database indexing for fast queries  

---

## API Endpoints

All endpoints require authentication. Base URL: `/api/v1/profile-views`

---

### 1. Track Profile View
**Endpoint:** `POST /api/v1/profile-views/track`

**Description:** Track when an authenticated user views another user's profile. Call this endpoint when a user visits a profile page.

**Auth:** Required

**Request Body:**
```json
{
  "profileOwnerId": "507f1f77bcf86cd799439011"
}
```

**Response:**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Profile view tracked successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439015",
    "viewerId": {
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "role": "professionalPlayer",
      "userType": "candidate",
      "profileImage": "https://example.com/image.jpg"
    },
    "viewerType": "candidate",
    "viewerRole": "professionalPlayer",
    "profileOwnerId": "507f1f77bcf86cd799439011",
    "profileOwnerType": "employer",
    "profileOwnerRole": "clubManager",
    "createdAt": "2024-11-24T10:30:00.000Z"
  }
}
```

**Error Responses:**
- `400` - Cannot track views on your own profile
- `404` - Profile owner not found

---

### 2. Get My Profile Views
**Endpoint:** `GET /api/v1/profile-views/my-views`

**Description:** Get a list of who viewed my profile with filtering and pagination.

**Auth:** Required

**Query Parameters:**
- `days` (optional) - Filter views from last N days (e.g., 3, 7, 30, 90)
- `page` (optional, default: 1) - Page number
- `limit` (optional, default: 10) - Results per page

**Example Requests:**
```
GET /api/v1/profile-views/my-views
GET /api/v1/profile-views/my-views?days=7
GET /api/v1/profile-views/my-views?days=3&page=1&limit=20
GET /api/v1/profile-views/my-views?days=30&page=2&limit=15
```

**Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Profile views retrieved successfully",
  "data": [
    {
      "_id": "507f1f77bcf86cd799439015",
      "viewerId": {
        "_id": "507f1f77bcf86cd799439012",
        "firstName": "Jane",
        "lastName": "Smith",
        "email": "jane@example.com",
        "role": "clubManager",
        "userType": "employer",
        "profileImage": "https://example.com/jane.jpg"
      },
      "viewerType": "employer",
      "viewerRole": "clubManager",
      "profileOwnerId": "507f1f77bcf86cd799439011",
      "profileOwnerType": "candidate",
      "profileOwnerRole": "professionalPlayer",
      "createdAt": "2024-11-24T10:30:00.000Z"
    },
    {
      "_id": "507f1f77bcf86cd799439016",
      "viewerId": {
        "_id": "507f1f77bcf86cd799439013",
        "firstName": "Mike",
        "lastName": "Johnson",
        "email": "mike@example.com",
        "role": "scout",
        "userType": "employer",
        "profileImage": "https://example.com/mike.jpg"
      },
      "viewerType": "employer",
      "viewerRole": "scout",
      "createdAt": "2024-11-23T15:20:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 45,
    "totalPages": 5,
    "totalViews": 45,
    "uniqueViewers": 32
  }
}
```

---

### 3. Get My Profile View Statistics
**Endpoint:** `GET /api/v1/profile-views/my-stats`

**Description:** Get comprehensive statistics about profile views including breakdown by time periods.

**Auth:** Required

**Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Profile view statistics retrieved successfully",
  "data": {
    "total": 450,
    "today": 12,
    "last7Days": 87,
    "last30Days": 245,
    "uniqueViewers": {
      "total": 320,
      "last7Days": 65,
      "last30Days": 180
    }
  }
}
```

**Field Descriptions:**
- `total` - All time profile views
- `today` - Views today (since midnight)
- `last7Days` - Views in the last 7 days
- `last30Days` - Views in the last 30 days
- `uniqueViewers.total` - All time unique viewers
- `uniqueViewers.last7Days` - Unique viewers in last 7 days
- `uniqueViewers.last30Days` - Unique viewers in last 30 days

---

### 4. Get Profile Views by User ID
**Endpoint:** `GET /api/v1/profile-views/user/:userId`

**Description:** Get profile views for a specific user. Users can check their own views, or this can be used by admins.

**Auth:** Required

**URL Parameters:**
- `userId` (required) - MongoDB ObjectId of the user

**Query Parameters:**
- `days` (optional) - Filter views from last N days
- `page` (optional, default: 1) - Page number
- `limit` (optional, default: 10) - Results per page

**Example Requests:**
```
GET /api/v1/profile-views/user/507f1f77bcf86cd799439011
GET /api/v1/profile-views/user/507f1f77bcf86cd799439011?days=7
GET /api/v1/profile-views/user/507f1f77bcf86cd799439011?days=30&page=1&limit=20
```

**Response:** Same structure as `/my-views`

---

### 5. Get Profile View Statistics by User ID
**Endpoint:** `GET /api/v1/profile-views/user/:userId/stats`

**Description:** Get profile view statistics for a specific user.

**Auth:** Required

**URL Parameters:**
- `userId` (required) - MongoDB ObjectId of the user

**Example Request:**
```
GET /api/v1/profile-views/user/507f1f77bcf86cd799439011/stats
```

**Response:** Same structure as `/my-stats`

---

## Integration Guide

### Frontend Implementation

#### 1. Track Profile View (Call when user visits a profile)
```javascript
// When user visits another user's profile page
const trackProfileView = async (profileOwnerId) => {
  try {
    await fetch('/api/v1/profile-views/track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ profileOwnerId })
    });
    // Silent tracking - no need to show anything to user
  } catch (error) {
    // Handle error silently
    console.error('Failed to track profile view:', error);
  }
};

// Example: Track when component mounts
useEffect(() => {
  if (profileOwnerId && profileOwnerId !== currentUserId) {
    trackProfileView(profileOwnerId);
  }
}, [profileOwnerId]);
```

#### 2. Display "Who Viewed My Profile" Section
```javascript
const WhoViewedMyProfile = () => {
  const [views, setViews] = useState([]);
  const [stats, setStats] = useState({});
  const [filter, setFilter] = useState('all'); // 'all', '7days', '30days'

  const fetchViews = async (days) => {
    const url = days 
      ? `/api/v1/profile-views/my-views?days=${days}&limit=20`
      : '/api/v1/profile-views/my-views?limit=20';
    
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    setViews(data.data);
    setStats({
      totalViews: data.meta.totalViews,
      uniqueViewers: data.meta.uniqueViewers
    });
  };

  useEffect(() => {
    const daysMap = {
      'all': null,
      '7days': 7,
      '30days': 30
    };
    fetchViews(daysMap[filter]);
  }, [filter]);

  return (
    <div>
      <h2>Who Viewed My Profile</h2>
      <div>
        <p>Total Views: {stats.totalViews}</p>
        <p>Unique Viewers: {stats.uniqueViewers}</p>
      </div>
      
      <select onChange={(e) => setFilter(e.target.value)}>
        <option value="all">All Time</option>
        <option value="7days">Last 7 Days</option>
        <option value="30days">Last 30 Days</option>
      </select>

      <ul>
        {views.map(view => (
          <li key={view._id}>
            <img src={view.viewerId.profileImage} alt="viewer" />
            <div>
              <h4>{view.viewerId.firstName} {view.viewerId.lastName}</h4>
              <p>{view.viewerId.role}</p>
              <p>{new Date(view.createdAt).toLocaleDateString()}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};
```

#### 3. Display Profile View Statistics Dashboard
```javascript
const ProfileViewStats = () => {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      const response = await fetch('/api/v1/profile-views/my-stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setStats(data.data);
    };
    fetchStats();
  }, []);

  if (!stats) return <div>Loading...</div>;

  return (
    <div className="stats-dashboard">
      <div className="stat-card">
        <h3>Total Views</h3>
        <p className="stat-number">{stats.total}</p>
      </div>
      
      <div className="stat-card">
        <h3>Today</h3>
        <p className="stat-number">{stats.today}</p>
      </div>
      
      <div className="stat-card">
        <h3>Last 7 Days</h3>
        <p className="stat-number">{stats.last7Days}</p>
        <p className="stat-detail">
          {stats.uniqueViewers.last7Days} unique viewers
        </p>
      </div>
      
      <div className="stat-card">
        <h3>Last 30 Days</h3>
        <p className="stat-number">{stats.last30Days}</p>
        <p className="stat-detail">
          {stats.uniqueViewers.last30Days} unique viewers
        </p>
      </div>
    </div>
  );
};
```

---

## Database Schema

### ProfileView Collection
```typescript
{
  viewerId: ObjectId,              // User who viewed the profile
  viewerType: "candidate" | "employer",
  viewerRole: string,
  profileOwnerId: ObjectId,        // User whose profile was viewed
  profileOwnerType: "candidate" | "employer",
  profileOwnerRole: string,
  createdAt: Date,
  updatedAt: Date
}
```

### Indexes
- `{ profileOwnerId: 1, createdAt: -1 }` - Efficient queries by profile owner
- `{ viewerId: 1, createdAt: -1 }` - Queries by viewer
- `{ createdAt: -1 }` - Date range queries
- `{ viewerId: 1, profileOwnerId: 1, createdAt: -1 }` - Check recent views

---

## Common Use Cases

### 1. Display Profile View Count on User Card
```javascript
// Simple view count badge
<div className="profile-card">
  <span className="view-count">
    👁️ {viewCount} views
  </span>
</div>
```

### 2. Recent Profile Viewers Widget
```javascript
// Show last 5 people who viewed profile
const RecentViewers = () => {
  const [viewers, setViewers] = useState([]);

  useEffect(() => {
    fetch('/api/v1/profile-views/my-views?limit=5', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setViewers(data.data));
  }, []);

  return (
    <div className="recent-viewers">
      <h4>Recent Profile Viewers</h4>
      <div className="viewer-avatars">
        {viewers.map(view => (
          <img 
            key={view._id}
            src={view.viewerId.profileImage} 
            alt={view.viewerId.firstName}
            title={`${view.viewerId.firstName} ${view.viewerId.lastName}`}
          />
        ))}
      </div>
    </div>
  );
};
```

### 3. Profile Analytics Page
Show comprehensive analytics with charts for views over time, unique viewers, and top viewers.

---

## Performance Considerations

- ✅ **Indexed queries** - All queries use appropriate indexes
- ✅ **Pagination** - Large result sets are paginated
- ✅ **Lean queries** - Uses `.lean()` for read-only operations
- ✅ **Selective population** - Only necessary fields are populated
- ✅ **Efficient aggregations** - Uses `distinct()` for unique counts

---

## Privacy & Security

- 🔒 Users can only track views on other users' profiles (not their own)
- 🔒 All endpoints require authentication
- 🔒 Users can see who viewed their own profile
- 🔒 Profile owner information is protected

---

## Future Enhancements (Optional)

1. **View Notifications** - Notify users when someone views their profile
2. **Private Mode** - Allow users to browse anonymously
3. **View Insights** - Analytics on which sections were viewed
4. **Export Data** - CSV export of profile view history
5. **View Heatmap** - Visual representation of views over time
6. **Comparison** - Compare view counts with similar profiles

---

## Testing

### Manual Testing Checklist

1. ✅ Track a profile view
2. ✅ Verify view appears in "Who viewed my profile"
3. ✅ Test date filtering (3 days, 7 days, 30 days)
4. ✅ Verify statistics are accurate
5. ✅ Test pagination with large datasets
6. ✅ Verify cannot view own profile
7. ✅ Test unique viewer counting

### Sample Test Data

```javascript
// Track multiple views for testing
const testViews = async () => {
  const profiles = ['userId1', 'userId2', 'userId3'];
  
  for (const profileId of profiles) {
    await fetch('/api/v1/profile-views/track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ profileOwnerId: profileId })
    });
  }
};
```

---

## Summary

The Profile View Tracking system provides:
- ✅ Automatic view tracking
- ✅ Comprehensive analytics (today, 7 days, 30 days, all time)
- ✅ Unique viewer counting
- ✅ Flexible date filtering
- ✅ Paginated results
- ✅ Well-documented API
- ✅ Production-ready code with proper indexing
