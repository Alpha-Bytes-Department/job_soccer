# Admin Dashboard User Profile Verification - API Documentation

## Overview
This documentation provides complete details for integrating the Admin Verification Dashboard in ReactJS. The system allows administrators to view, filter, and manage user profile verification requests submitted by candidates and employers.

---

## Table of Contents
1. [Authentication](#authentication)
2. [API Endpoints](#api-endpoints)
3. [Data Models](#data-models)
4. [React Integration Guide](#react-integration-guide)
5. [Example Components](#example-components)
6. [Error Handling](#error-handling)

---

## Authentication

All admin endpoints require authentication with admin role.

**Headers Required:**
```javascript
{
  "Authorization": "Bearer YOUR_JWT_TOKEN",
  "Content-Type": "application/json"
}
```

---

## API Endpoints

### 1. Get All Verification Requests (with Filters)

**Endpoint:** `GET /api/v1/admin-verification/requests`

**Access:** Admin Only

**Query Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| status | string | No | - | Filter by status: `pending`, `approved`, `rejected` |
| userType | string | No | - | Filter by user type: `candidate`, `employer` |
| page | number | No | 1 | Page number for pagination |
| limit | number | No | 10 | Number of items per page |
| sortBy | string | No | createdAt | Field to sort by |
| sortOrder | string | No | desc | Sort order: `asc`, `desc` |

**Request Example:**
```javascript
// Fetch pending verification requests for candidates
const response = await fetch(
  'http://your-api-url/api/v1/admin-verification/requests?status=pending&userType=candidate&page=1&limit=10',
  {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }
);
```

**Response Example:**
```json
{
  "success": true,
  "message": "Verification requests retrieved successfully",
  "data": [
    {
      "_id": "64f9a1b2c3d4e5f6a7b8c9d0",
      "userId": {
        "_id": "64f9a1b2c3d4e5f6a7b8c9d1",
        "firstName": "John",
        "lastName": "Doe",
        "email": "john.doe@example.com",
        "role": "Professional Player",
        "profileImage": "/uploads/images/profile.jpg",
        "profileId": "64f9a1b2c3d4e5f6a7b8c9d2"
      },
      "userType": "candidate",
      "status": "pending",
      "createdAt": "2024-09-07T10:30:00.000Z",
      "updatedAt": "2024-09-07T10:30:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPage": 3
  }
}
```

---

### 2. Get Verification Request by ID

**Endpoint:** `GET /api/v1/admin-verification/:id`

**Access:** Admin Only

**URL Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Verification request ID (24-character MongoDB ObjectId) |

**Request Example:**
```javascript
const verificationId = "64f9a1b2c3d4e5f6a7b8c9d0";
const response = await fetch(
  `http://your-api-url/api/v1/admin-verification/${verificationId}`,
  {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }
);
```

**Response Example (Candidate):**
```json
{
  "success": true,
  "message": "Verification request details retrieved successfully",
  "data": {
    "verification": {
      "_id": "64f9a1b2c3d4e5f6a7b8c9d0",
      "userId": {
        "_id": "64f9a1b2c3d4e5f6a7b8c9d1",
        "firstName": "John",
        "lastName": "Doe",
        "email": "john.doe@example.com",
        "role": "Professional Player",
        "profileImage": "/uploads/images/profile.jpg",
        "profileId": "64f9a1b2c3d4e5f6a7b8c9d2",
        "userType": "candidate"
      },
      "userType": "candidate",
      "status": "pending",
      "createdAt": "2024-09-07T10:30:00.000Z",
      "updatedAt": "2024-09-07T10:30:00.000Z"
    },
    "userDetails": {
      "_id": "64f9a1b2c3d4e5f6a7b8c9d1",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      "role": "Professional Player",
      "profileImage": "/uploads/images/profile.jpg",
      "profileId": "64f9a1b2c3d4e5f6a7b8c9d2",
      "userType": "candidate"
    },
    "educations": [
      {
        "_id": "64f9a1b2c3d4e5f6a7b8c9d3",
        "userId": "64f9a1b2c3d4e5f6a7b8c9d1",
        "institutionName": "Harvard University",
        "degree": "Bachelor of Science",
        "fieldOfStudy": "Sports Management",
        "startYear": 2015,
        "endYear": 2019
      }
    ],
    "experiences": [
      {
        "_id": "64f9a1b2c3d4e5f6a7b8c9d4",
        "userId": "64f9a1b2c3d4e5f6a7b8c9d1",
        "companyName": "FC Barcelona",
        "position": "Professional Player",
        "startYear": 2020,
        "endYear": 2024,
        "description": "Played as midfielder"
      }
    ],
    "certifications": [
      {
        "_id": "64f9a1b2c3d4e5f6a7b8c9d5",
        "userId": "64f9a1b2c3d4e5f6a7b8c9d1",
        "certificationName": "UEFA Pro License",
        "issuingOrganization": "UEFA",
        "issueDate": "2023-06-15T00:00:00.000Z"
      }
    ]
  }
}
```

---

### 3. Update Verification Status

**Endpoint:** `PATCH /api/v1/admin-verification/:id/status`

**Access:** Admin Only

**URL Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Verification request ID |

**Request Body:**
```json
{
  "status": "approved"
}
```

**Body Parameters:**
| Parameter | Type | Required | Allowed Values | Description |
|-----------|------|----------|----------------|-------------|
| status | string | Yes | `approved`, `rejected` | New verification status |

**Request Example:**
```javascript
const verificationId = "64f9a1b2c3d4e5f6a7b8c9d0";
const response = await fetch(
  `http://your-api-url/api/v1/admin-verification/${verificationId}/status`,
  {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      status: "approved"
    })
  }
);
```

**Response Example:**
```json
{
  "success": true,
  "message": "Verification request approved successfully",
  "data": {
    "_id": "64f9a1b2c3d4e5f6a7b8c9d0",
    "userId": "64f9a1b2c3d4e5f6a7b8c9d1",
    "userType": "candidate",
    "status": "approved",
    "verifiedBy": "64f9a1b2c3d4e5f6a7b8c9d6",
    "verifiedAt": "2024-09-08T14:30:00.000Z",
    "createdAt": "2024-09-07T10:30:00.000Z",
    "updatedAt": "2024-09-08T14:30:00.000Z"
  }
}
```

---

### 4. Get User Details by ID (with Videos)

**Endpoint:** `GET /api/v1/user/:id`

**Access:** Public/Authenticated

**URL Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | User ID |

**Request Example:**
```javascript
const userId = "64f9a1b2c3d4e5f6a7b8c9d1";
const response = await fetch(
  `http://your-api-url/api/v1/user/${userId}`,
  {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }
);
```

**Response Example (Professional Player Candidate):**
```json
{
  "success": true,
  "message": "User retrieved successfully",
  "data": {
    "_id": "64f9a1b2c3d4e5f6a7b8c9d1",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "role": "Professional Player",
    "profileImage": "/uploads/images/profile.jpg",
    "bannerImage": "/uploads/images/banner.jpg",
    "profileId": "64f9a1b2c3d4e5f6a7b8c9d2",
    "userType": "candidate",
    "isVerified": false,
    "authId": "64f9a1b2c3d4e5f6a7b8c9d7",
    "profile": {
      "_id": "64f9a1b2c3d4e5f6a7b8c9d2",
      "headline": "Professional Soccer Player",
      "bio": "Experienced midfielder with 5+ years in professional leagues",
      "country": "United States",
      "city": "New York",
      "postalCode": "10001",
      "phoneNumber": "+1234567890",
      "dateOfBirth": "1995-03-15T00:00:00.000Z",
      "nationality": "American",
      "currentTeam": "New York FC",
      "position": "Midfielder",
      "preferredFoot": "Right",
      "height": "180 cm",
      "weight": "75 kg",
      "videos": [
        {
          "videoUrl": "/uploads/videos/match-highlights.mp4",
          "videoTitle": "Season Highlights 2023",
          "_id": "64f9a1b2c3d4e5f6a7b8c9d8"
        },
        {
          "videoUrl": "/uploads/videos/skills-showcase.mp4",
          "videoTitle": "Skills & Dribbling",
          "_id": "64f9a1b2c3d4e5f6a7b8c9d9"
        }
      ],
      "linkedinUrl": "https://linkedin.com/in/johndoe",
      "githubUrl": "",
      "portfolioUrl": "https://johndoe-soccer.com"
    },
    "educations": [
      {
        "_id": "64f9a1b2c3d4e5f6a7b8c9d3",
        "userId": "64f9a1b2c3d4e5f6a7b8c9d1",
        "institutionName": "Harvard University",
        "degree": "Bachelor of Science",
        "fieldOfStudy": "Sports Management",
        "startYear": 2015,
        "endYear": 2019
      }
    ],
    "experiences": [
      {
        "_id": "64f9a1b2c3d4e5f6a7b8c9d4",
        "userId": "64f9a1b2c3d4e5f6a7b8c9d1",
        "companyName": "FC Barcelona",
        "position": "Professional Player",
        "startYear": 2020,
        "endYear": 2024,
        "description": "Played as midfielder in La Liga"
      }
    ],
    "certifications": [
      {
        "_id": "64f9a1b2c3d4e5f6a7b8c9d5",
        "userId": "64f9a1b2c3d4e5f6a7b8c9d1",
        "certificationName": "UEFA Pro License",
        "issuingOrganization": "UEFA",
        "issueDate": "2023-06-15T00:00:00.000Z"
      }
    ]
  }
}
```

**Response Example (Staff/Coaching):**
```json
{
  "success": true,
  "message": "User retrieved successfully",
  "data": {
    "_id": "64f9a1b2c3d4e5f6a7b8c9e1",
    "firstName": "Michael",
    "lastName": "Smith",
    "email": "michael.smith@example.com",
    "role": "On field staff",
    "profileImage": "/uploads/images/coach-profile.jpg",
    "userType": "candidate",
    "profile": {
      "_id": "64f9a1b2c3d4e5f6a7b8c9e2",
      "headline": "Head Coach",
      "bio": "Professional soccer coach with UEFA Pro License",
      "country": "England",
      "city": "London",
      "videos": [
        {
          "videoUrl": "/uploads/videos/training-session.mp4",
          "videoTitle": "Training Methodology",
          "videoCategory": "Coaching",
          "position": "Head Coach",
          "_id": "64f9a1b2c3d4e5f6a7b8c9e8"
        }
      ]
    }
  }
}
```

---

## Data Models

### Verification Status Enum
```typescript
enum VerificationStatus {
  PENDING = "pending",
  APPROVED = "approved",
  REJECTED = "rejected"
}
```

### User Types
```typescript
enum UserType {
  CANDIDATE = "candidate",
  EMPLOYER = "employer",
  ADMIN = "admin"
}
```

### Candidate Roles
```typescript
enum CandidateRole {
  PROFESSIONAL_PLAYER = "Professional Player",
  AMATEUR_PLAYER = "Amateur Player",
  HIGH_SCHOOL = "High School",
  COLLEGE_UNIVERSITY = "College/University",
  ON_FIELD_STAFF = "On field staff",
  OFFICE_STAFF = "Office Staff"
}
```

### Employer Roles
```typescript
enum EmployerRole {
  PROFESSIONAL_CLUB = "Professional Club",
  ACADEMY = "Academy",
  AMATEUR_CLUB = "Amateur Club",
  CONSULTING_COMPANY = "Consulting Company",
  HIGH_SCHOOL = "High School",
  COLLEGE_UNIVERSITY = "College/University",
  AGENT = "Agent"
}
```

### Video Object Structure

**For Players (Amateur/Professional/High School/College):**
```typescript
{
  videoUrl: string;      // "/uploads/videos/filename.mp4"
  videoTitle: string;    // "Season Highlights 2023"
  _id: string;          // MongoDB ObjectId
}
```

**For Staff (On-field/Office):**
```typescript
{
  videoUrl: string;        // "/uploads/videos/filename.mp4"
  videoTitle: string;      // "Training Session"
  videoCategory: string;   // "Coaching", "Analysis", etc.
  position: string;        // "Head Coach", "Assistant Coach", etc.
  _id: string;            // MongoDB ObjectId
}
```

---

## React Integration Guide

### Installation

First, install required dependencies:

```bash
npm install axios react-query
# or
yarn add axios react-query
```

### API Service Setup

Create an API service file `src/services/api.js`:

```javascript
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle response errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

### Admin Verification API Service

Create `src/services/adminVerificationService.js`:

```javascript
import apiClient from './api';

export const adminVerificationService = {
  // Get all verification requests with filters
  getVerificationRequests: async (params = {}) => {
    const response = await apiClient.get('/admin-verification/requests', { params });
    return response.data;
  },

  // Get verification request by ID
  getVerificationById: async (id) => {
    const response = await apiClient.get(`/admin-verification/${id}`);
    return response.data;
  },

  // Update verification status
  updateVerificationStatus: async (id, status) => {
    const response = await apiClient.patch(`/admin-verification/${id}/status`, {
      status,
    });
    return response.data;
  },

  // Get user details by ID
  getUserById: async (userId) => {
    const response = await apiClient.get(`/user/${userId}`);
    return response.data;
  },
};
```

---

## Example Components

### 1. Verification List Component

`src/components/admin/VerificationList.jsx`:

```javascript
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { adminVerificationService } from '../../services/adminVerificationService';

const VerificationList = () => {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({
    status: '',
    userType: '',
    page: 1,
    limit: 10,
  });

  // Fetch verification requests
  const { data, isLoading, error } = useQuery(
    ['verificationRequests', filters],
    () => adminVerificationService.getVerificationRequests(filters),
    {
      keepPreviousData: true,
    }
  );

  // Update verification status mutation
  const updateStatusMutation = useMutation(
    ({ id, status }) => adminVerificationService.updateVerificationStatus(id, status),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('verificationRequests');
        alert('Verification status updated successfully');
      },
      onError: (error) => {
        alert(`Error: ${error.response?.data?.message || 'Something went wrong'}`);
      },
    }
  );

  const handleStatusChange = (id, status) => {
    if (window.confirm(`Are you sure you want to ${status} this verification request?`)) {
      updateStatusMutation.mutate({ id, status });
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: 1, // Reset to first page when filter changes
    }));
  };

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div className="verification-list">
      <h1>User Verification Requests</h1>

      {/* Filters */}
      <div className="filters">
        <select
          value={filters.status}
          onChange={(e) => handleFilterChange('status', e.target.value)}
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>

        <select
          value={filters.userType}
          onChange={(e) => handleFilterChange('userType', e.target.value)}
        >
          <option value="">All User Types</option>
          <option value="candidate">Candidate</option>
          <option value="employer">Employer</option>
        </select>
      </div>

      {/* Table */}
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>User Type</th>
            <th>Status</th>
            <th>Submitted</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {data?.data?.map((request) => (
            <tr key={request._id}>
              <td>
                {request.userId.firstName} {request.userId.lastName}
              </td>
              <td>{request.userId.email}</td>
              <td>{request.userId.role}</td>
              <td>{request.userType}</td>
              <td>
                <span className={`status-badge status-${request.status}`}>
                  {request.status}
                </span>
              </td>
              <td>{new Date(request.createdAt).toLocaleDateString()}</td>
              <td>
                <button
                  onClick={() => window.location.href = `/admin/verification/${request._id}`}
                >
                  View Details
                </button>
                {request.status === 'pending' && (
                  <>
                    <button
                      onClick={() => handleStatusChange(request._id, 'approved')}
                      className="btn-approve"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleStatusChange(request._id, 'rejected')}
                      className="btn-reject"
                    >
                      Reject
                    </button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination */}
      <div className="pagination">
        <button
          disabled={filters.page === 1}
          onClick={() => handleFilterChange('page', filters.page - 1)}
        >
          Previous
        </button>
        <span>
          Page {data?.meta?.page} of {data?.meta?.totalPage}
        </span>
        <button
          disabled={filters.page >= data?.meta?.totalPage}
          onClick={() => handleFilterChange('page', filters.page + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default VerificationList;
```

### 2. Verification Detail Component

`src/components/admin/VerificationDetail.jsx`:

```javascript
import React from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { adminVerificationService } from '../../services/adminVerificationService';

const VerificationDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Fetch verification details
  const { data, isLoading, error } = useQuery(
    ['verificationDetail', id],
    () => adminVerificationService.getVerificationById(id)
  );

  // Fetch full user details
  const { data: userData } = useQuery(
    ['userDetail', data?.data?.verification?.userId?._id],
    () => adminVerificationService.getUserById(data.data.verification.userId._id),
    {
      enabled: !!data?.data?.verification?.userId?._id,
    }
  );

  // Update status mutation
  const updateStatusMutation = useMutation(
    ({ id, status }) => adminVerificationService.updateVerificationStatus(id, status),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('verificationDetail');
        queryClient.invalidateQueries('verificationRequests');
        alert('Verification status updated successfully');
      },
      onError: (error) => {
        alert(`Error: ${error.response?.data?.message || 'Something went wrong'}`);
      },
    }
  );

  const handleStatusChange = (status) => {
    if (window.confirm(`Are you sure you want to ${status} this verification request?`)) {
      updateStatusMutation.mutate({ id, status });
    }
  };

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  const verification = data?.data?.verification;
  const user = verification?.userId;
  const fullUserData = userData?.data;
  const profile = fullUserData?.profile;

  return (
    <div className="verification-detail">
      <button onClick={() => navigate('/admin/verifications')}>← Back to List</button>

      <h1>Verification Request Details</h1>

      {/* Status Actions */}
      {verification?.status === 'pending' && (
        <div className="action-buttons">
          <button
            onClick={() => handleStatusChange('approved')}
            className="btn-approve"
            disabled={updateStatusMutation.isLoading}
          >
            Approve Request
          </button>
          <button
            onClick={() => handleStatusChange('rejected')}
            className="btn-reject"
            disabled={updateStatusMutation.isLoading}
          >
            Reject Request
          </button>
        </div>
      )}

      {/* Verification Info */}
      <section className="verification-info">
        <h2>Verification Information</h2>
        <div className="info-grid">
          <div>
            <strong>Status:</strong>{' '}
            <span className={`status-badge status-${verification?.status}`}>
              {verification?.status}
            </span>
          </div>
          <div>
            <strong>Submitted:</strong> {new Date(verification?.createdAt).toLocaleString()}
          </div>
          {verification?.verifiedAt && (
            <div>
              <strong>Verified:</strong> {new Date(verification.verifiedAt).toLocaleString()}
            </div>
          )}
        </div>
      </section>

      {/* User Basic Info */}
      <section className="user-info">
        <h2>User Information</h2>
        <div className="profile-header">
          {user?.profileImage && (
            <img
              src={`${process.env.REACT_APP_API_URL}${user.profileImage}`}
              alt={`${user.firstName} ${user.lastName}`}
              className="profile-image"
            />
          )}
          <div>
            <h3>
              {user?.firstName} {user?.lastName}
            </h3>
            <p>{user?.email}</p>
            <p>
              <strong>Role:</strong> {user?.role}
            </p>
            <p>
              <strong>User Type:</strong> {user?.userType}
            </p>
          </div>
        </div>
      </section>

      {/* Profile Details */}
      {profile && (
        <section className="profile-details">
          <h2>Profile Details</h2>
          <div className="info-grid">
            {profile.headline && (
              <div>
                <strong>Headline:</strong> {profile.headline}
              </div>
            )}
            {profile.bio && (
              <div>
                <strong>Bio:</strong>
                <p>{profile.bio}</p>
              </div>
            )}
            {profile.country && (
              <div>
                <strong>Location:</strong> {profile.city}, {profile.country}
              </div>
            )}
            {profile.phoneNumber && (
              <div>
                <strong>Phone:</strong> {profile.phoneNumber}
              </div>
            )}
            {profile.dateOfBirth && (
              <div>
                <strong>Date of Birth:</strong>{' '}
                {new Date(profile.dateOfBirth).toLocaleDateString()}
              </div>
            )}
            {profile.nationality && (
              <div>
                <strong>Nationality:</strong> {profile.nationality}
              </div>
            )}

            {/* Player-specific fields */}
            {profile.position && (
              <div>
                <strong>Position:</strong> {profile.position}
              </div>
            )}
            {profile.currentTeam && (
              <div>
                <strong>Current Team:</strong> {profile.currentTeam}
              </div>
            )}
            {profile.preferredFoot && (
              <div>
                <strong>Preferred Foot:</strong> {profile.preferredFoot}
              </div>
            )}
            {profile.height && (
              <div>
                <strong>Height:</strong> {profile.height}
              </div>
            )}
            {profile.weight && (
              <div>
                <strong>Weight:</strong> {profile.weight}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Videos Section */}
      {profile?.videos && profile.videos.length > 0 && (
        <section className="videos-section">
          <h2>Videos</h2>
          <div className="videos-grid">
            {profile.videos.map((video) => (
              <div key={video._id} className="video-card">
                <video
                  controls
                  width="100%"
                  src={`${process.env.REACT_APP_API_URL}${video.videoUrl}`}
                >
                  Your browser does not support the video tag.
                </video>
                <div className="video-info">
                  <h4>{video.videoTitle}</h4>
                  {video.videoCategory && (
                    <p>
                      <strong>Category:</strong> {video.videoCategory}
                    </p>
                  )}
                  {video.position && (
                    <p>
                      <strong>Position:</strong> {video.position}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Education */}
      {fullUserData?.educations && fullUserData.educations.length > 0 && (
        <section className="education-section">
          <h2>Education</h2>
          {fullUserData.educations.map((edu) => (
            <div key={edu._id} className="education-card">
              <h4>{edu.institutionName}</h4>
              <p>
                {edu.degree} in {edu.fieldOfStudy}
              </p>
              <p>
                {edu.startYear} - {edu.endYear || 'Present'}
              </p>
            </div>
          ))}
        </section>
      )}

      {/* Experience */}
      {fullUserData?.experiences && fullUserData.experiences.length > 0 && (
        <section className="experience-section">
          <h2>Experience</h2>
          {fullUserData.experiences.map((exp) => (
            <div key={exp._id} className="experience-card">
              <h4>{exp.position}</h4>
              <p>
                <strong>{exp.companyName}</strong>
              </p>
              <p>
                {exp.startYear} - {exp.endYear || 'Present'}
              </p>
              {exp.description && <p>{exp.description}</p>}
            </div>
          ))}
        </section>
      )}

      {/* Certifications */}
      {fullUserData?.certifications && fullUserData.certifications.length > 0 && (
        <section className="certifications-section">
          <h2>Licenses & Certifications</h2>
          {fullUserData.certifications.map((cert) => (
            <div key={cert._id} className="certification-card">
              <h4>{cert.certificationName}</h4>
              <p>
                <strong>Issuing Organization:</strong> {cert.issuingOrganization}
              </p>
              <p>
                <strong>Issue Date:</strong>{' '}
                {new Date(cert.issueDate).toLocaleDateString()}
              </p>
            </div>
          ))}
        </section>
      )}
    </div>
  );
};

export default VerificationDetail;
```

### 3. Basic Styling (CSS)

`src/styles/adminVerification.css`:

```css
/* Verification List */
.verification-list {
  padding: 20px;
}

.filters {
  margin-bottom: 20px;
  display: flex;
  gap: 10px;
}

.filters select {
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

table {
  width: 100%;
  border-collapse: collapse;
  background: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

table th,
table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #ddd;
}

table th {
  background-color: #f8f9fa;
  font-weight: 600;
}

.status-badge {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.status-pending {
  background-color: #fff3cd;
  color: #856404;
}

.status-approved {
  background-color: #d4edda;
  color: #155724;
}

.status-rejected {
  background-color: #f8d7da;
  color: #721c24;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 15px;
  margin-top: 20px;
}

button {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-approve {
  background-color: #28a745;
  color: white;
}

.btn-reject {
  background-color: #dc3545;
  color: white;
}

/* Verification Detail */
.verification-detail {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.action-buttons {
  display: flex;
  gap: 10px;
  margin: 20px 0;
}

.verification-info,
.user-info,
.profile-details,
.videos-section,
.education-section,
.experience-section,
.certifications-section {
  background: white;
  padding: 20px;
  margin-bottom: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.profile-header {
  display: flex;
  gap: 20px;
  align-items: start;
}

.profile-image {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  object-fit: cover;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 15px;
  margin-top: 15px;
}

.videos-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  margin-top: 15px;
}

.video-card {
  border: 1px solid #ddd;
  border-radius: 8px;
  overflow: hidden;
}

.video-info {
  padding: 10px;
}

.education-card,
.experience-card,
.certification-card {
  padding: 15px;
  border: 1px solid #ddd;
  border-radius: 8px;
  margin-bottom: 10px;
}
```

### 4. React Query Provider Setup

`src/App.jsx`:

```javascript
import React from 'react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import VerificationList from './components/admin/VerificationList';
import VerificationDetail from './components/admin/VerificationDetail';
import './styles/adminVerification.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          <Route path="/admin/verifications" element={<VerificationList />} />
          <Route path="/admin/verification/:id" element={<VerificationDetail />} />
        </Routes>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
```

---

## Error Handling

### Common Error Responses

**401 Unauthorized:**
```json
{
  "success": false,
  "message": "You are not authorized to access this resource",
  "errorSources": []
}
```

**403 Forbidden:**
```json
{
  "success": false,
  "message": "Admin authentication required",
  "errorSources": []
}
```

**404 Not Found:**
```json
{
  "success": false,
  "message": "Verification request not found",
  "errorSources": []
}
```

**400 Bad Request:**
```json
{
  "success": false,
  "message": "Verification request is already approved",
  "errorSources": []
}
```

**500 Internal Server Error:**
```json
{
  "success": false,
  "message": "Something went wrong",
  "errorSources": []
}
```

### Error Handling in React

```javascript
import { useState } from 'react';

const ErrorHandler = ({ error }) => {
  if (!error) return null;

  return (
    <div className="error-message">
      <h4>Error</h4>
      <p>{error.response?.data?.message || error.message || 'Something went wrong'}</p>
    </div>
  );
};

// Usage in component
const MyComponent = () => {
  const [error, setError] = useState(null);

  const handleAction = async () => {
    try {
      await someApiCall();
      setError(null);
    } catch (err) {
      setError(err);
    }
  };

  return (
    <div>
      <ErrorHandler error={error} />
      {/* Your component content */}
    </div>
  );
};
```

---

## Environment Variables

Create a `.env` file in your React app root:

```env
REACT_APP_API_URL=http://localhost:5000
```

For production:
```env
REACT_APP_API_URL=https://your-production-api.com
```

---

## Testing the Integration

### 1. Test with Postman or cURL

**Get All Verification Requests:**
```bash
curl -X GET "http://localhost:5000/api/v1/admin-verification/requests?status=pending&page=1&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Get Verification Detail:**
```bash
curl -X GET "http://localhost:5000/api/v1/admin-verification/64f9a1b2c3d4e5f6a7b8c9d0" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Approve Verification:**
```bash
curl -X PATCH "http://localhost:5000/api/v1/admin-verification/64f9a1b2c3d4e5f6a7b8c9d0/status" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "approved"}'
```

**Get User Details:**
```bash
curl -X GET "http://localhost:5000/api/v1/user/64f9a1b2c3d4e5f6a7b8c9d1" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Best Practices

1. **Authentication**: Always store JWT tokens securely (localStorage or httpOnly cookies)
2. **Error Handling**: Implement comprehensive error handling for all API calls
3. **Loading States**: Show loading indicators during API requests
4. **Pagination**: Implement proper pagination for large datasets
5. **Caching**: Use React Query's caching to reduce unnecessary API calls
6. **Video Optimization**: Consider lazy loading videos or using thumbnails
7. **Responsive Design**: Ensure the dashboard works on all screen sizes
8. **Access Control**: Verify admin role before rendering admin components
9. **Data Validation**: Validate user inputs before sending to API
10. **Audit Trail**: Log admin actions for security purposes

---

## Additional Features to Consider

1. **Search Functionality**: Add text search for user names/emails
2. **Bulk Actions**: Allow admins to approve/reject multiple requests at once
3. **Export Data**: Export verification data to CSV/Excel
4. **Notifications**: Send email/push notifications on status changes
5. **Comments**: Allow admins to add comments/notes to verification requests
6. **History**: Show verification status change history
7. **Analytics**: Dashboard with statistics (pending count, approval rate, etc.)
8. **Advanced Filters**: Filter by date range, role, verification date, etc.

---

## Support & Contact

For any issues or questions regarding the API integration, please contact the backend team or refer to the main API documentation.

**API Base URL (Development):** `http://localhost:5000/api/v1`

**API Base URL (Production):** `https://your-production-domain.com/api/v1`

---

## Changelog

### Version 1.0.0 (Current)
- Initial documentation
- Complete API endpoint documentation
- React integration examples
- Video support for all profile types
- Comprehensive user detail view

---

**Last Updated:** November 25, 2025
