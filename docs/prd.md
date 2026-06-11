# Requirements Document

## 1. Application Overview

**Application Name**: Website Analytics System by Abhi the Great

**Description**: A self-hosted website analytics and visitor tracking system that collects, stores, and visualizes website visitor data without relying on third-party analytics platforms. The system provides real-time tracking, visitor insights, and comprehensive analytics dashboard for website owners to understand their traffic patterns and user behavior. The tracking operates completely transparently to website visitors with zero visible indicators or notifications.

---

## 2. Users and Usage Scenarios

**Target Users**: Website owners, developers, and digital marketers who need to track and analyze website traffic independently.

**Core Usage Scenarios**:

- Monitor website traffic in real-time
- Analyze visitor demographics and behavior patterns
- Track page performance and popular content
- Understand traffic sources and user journeys
- Generate analytics reports for decision-making

---

## 3. Page Structure and Functional Description

### 3.1 Page Structure

```
Custom Website Analytics System
├── Admin Dashboard (Main Analytics Interface)
│   ├── Overview Section
│   ├── Real-Time Analytics Section
│   ├── Visitor Analytics Section
│   ├── Page Analytics Section
│   ├── Geographic Analytics Section
│   ├── Device & Browser Analytics Section
│   └── Traffic Sources Section
├── Tracking Script (Embedded in Target Websites)
└── Data Collection API (Backend Endpoints)
```

### 3.2 Functional Description

#### 3.2.1 Admin Dashboard

**Overview Section**

- Display total visits count
- Display unique visitors count
- Display total sessions count
- Display returning visitors count
- Show daily visits trend chart
- Show visit statistics for selected date range

**Real-Time Analytics Section**

- Display current active visitors count
- Show list of currently active pages with visitor count per page
- Display active sessions count
- Show recent visitors feed with timestamp, page, location, and device information
- Auto-refresh data to reflect live status

**Visitor Analytics Section**

- Display total visitors breakdown by new vs returning
- Show visitor session duration statistics
- Display visit frequency distribution
- Show visitor activity timeline

**Page Analytics Section**

- List all tracked pages with visit counts
- Display top visited pages ranking
- Show page views per page
- Display average time spent per page
- Show page entry and exit statistics

**Geographic Analytics Section**

- Display visitor distribution by country with counts
- Show visitor distribution by state/region
- Display visitor distribution by city
- Visualize geographic data on map or chart

**Device & Browser Analytics Section**

- Display device type breakdown (mobile, desktop, tablet) with percentages
- Show browser usage statistics with browser names and versions
- Display operating system distribution
- Show screen resolution statistics
- Display language preferences distribution

**Traffic Sources Section**

- Display referrer URL list with visit counts
- Show traffic source categories (direct, referral, search, social)
- Display top referring domains

#### 3.2.2 Tracking Script

**Automatic Data Collection**

- Detect and send page visit event when page loads
- Collect visitor browser information (browser name, version)
- Collect visitor operating system information
- Collect visitor device type (mobile, desktop, tablet)
- Collect screen resolution
- Collect browser language setting
- Collect referrer URL
- Detect page changes for single-page applications
- Send collected data to backend API
- Operate silently without any visible UI elements or notifications
- Execute in background without affecting page load speed or user experience
- Remain completely invisible to website visitors

**Session Management**

- Generate unique session identifier for each visit
- Track session start time
- Track session duration
- Identify returning visitors
- Manage session data without displaying any indicators to visitors

#### 3.2.3 Data Collection API

**Visitor Tracking Endpoint**

- Receive tracking data from frontend script
- Extract visitor IP address
- Determine visitor geographic location (country, state, city) using local geolocation database
- Store visitor information in database
- Record page view event
- Update session data
- Return success confirmation

**Analytics Data Retrieval Endpoints**

- Provide visitor statistics data for dashboard
- Provide page analytics data
- Provide real-time analytics data
- Provide geographic analytics data
- Provide device and browser analytics data
- Provide traffic source analytics data
- Support date range filtering

---

## 4. Business Rules and Logic

### 4.1 Visitor Identification

- Unique visitor is identified by combination of IP address and browser fingerprint
- Returning visitor is identified when same unique identifier visits again after initial session
- Session expires after 30 minutes of inactivity

### 4.2 Geographic Location Detection

- Use GeoLite2 local database to map IP address to geographic location
- Store country, state, and city information when available
- Handle cases where location data is unavailable or incomplete

### 4.3 Real-Time Data Processing

- Active visitor is defined as visitor with activity within last 5 minutes
- Active session is session with last activity within last 30 minutes
- Real-time data updates every 10 seconds in dashboard

### 4.4 Data Storage

- Store visitor records with timestamp, IP address (optionally hashed), browser, OS, device type, screen resolution, language
- Store session records with session ID, visitor ID, start time, end time, page count
- Store page view records with page URL, visitor ID, session ID, timestamp, referrer
- Store location records linked to visitor ID with country, state, city
- Store device records linked to visitor ID with device type, browser, OS

### 4.5 Privacy and Transparency

- Tracking operates completely transparently to website visitors
- No cookie consent banners or popups displayed to visitors
- No tracking notifications or alerts shown to visitors
- No visible indicators of analytics system on tracked websites
- Tracking script runs silently in background without visitor awareness
- No UI elements exposed to regular website visitors
- Admin dashboard is completely separate from tracked websites and only accessible to website owner
- Visitors experience website normally with zero awareness of tracking
- Tracking script is lightweight and non-intrusive to avoid affecting page load speed or user experience
- Support optional IP address hashing for anonymization
- Do not store personally identifiable information beyond necessary tracking data
- Allow configuration to disable specific data collection fields

### 4.6 Data Aggregation

- Calculate daily visit totals by counting page views per day
- Calculate unique visitors by counting distinct visitor identifiers
- Calculate returning visitors by identifying visitors with multiple sessions
- Aggregate page statistics by grouping page views by URL
- Aggregate geographic data by grouping visitors by location
- Aggregate device statistics by grouping visitors by device type, browser, OS

---

## 5. Exceptions and Boundary Cases

| Scenario                                    | Handling                                                       |
| ------------------------------------------- | -------------------------------------------------------------- |
| Visitor blocks JavaScript                   | Tracking script does not execute, no data collected            |
| Visitor uses VPN or proxy                   | Geographic location may be inaccurate, store detected location |
| IP address cannot be geolocated             | Store visitor data without location information                |
| Browser does not support required APIs      | Collect available data, skip unsupported fields                |
| Tracking script fails to load               | No data sent to backend, visitor not tracked                   |
| Backend API is unavailable                  | Frontend script fails silently, retry mechanism optional       |
| Database connection fails                   | Return error to API caller, log error for investigation        |
| Invalid or malformed tracking data received | Reject data, log error, return error response                  |
| Concurrent requests to same endpoint        | Handle requests independently, ensure data consistency         |
| Session ID collision                        | Generate new unique session ID                                 |
| Visitor clears cookies mid-session          | Treat as new session, may appear as new visitor                |
| Dashboard accessed with no data             | Display empty state with message indicating no data available  |
| Date range filter returns no results        | Display empty state for selected date range                    |
| Real-time data shows zero active visitors   | Display zero count, indicate no current activity               |

---

## 6. Acceptance Criteria

1. Embed tracking script in target website, verify page visit is recorded in database with timestamp, page URL, and visitor information
2. Open admin dashboard, verify overview section displays total visits, unique visitors, and daily visits chart
3. Generate traffic by visiting multiple pages on target website, verify page analytics section shows correct visit counts per page
4. Visit target website from different devices and browsers, verify device & browser analytics section displays correct breakdown
5. Access target website while tracking script is active, verify real-time analytics section shows active visitor count and current page
6. Visit target website from different geographic locations (or simulate), verify geographic analytics section displays visitor distribution by country
7. Check traffic sources section in dashboard, verify referrer URLs are captured and displayed correctly
8. Return to target website after initial visit, verify system identifies visitor as returning visitor in dashboard statistics
9. Visit tracked website as regular visitor, verify no cookie consent banners, popups, tracking notifications, or any visible indicators of analytics system appear
10. Verify tracking script operates silently in background without affecting page load speed or displaying any UI elements to visitors

---

## 7. Out of Scope for Current Release

- AI-based traffic analysis and visitor behavior prediction
- Automated report generation
- Smart anomaly detection
- AI-generated insights
- Agentic workflows integration
- WebSocket-based real-time updates
- Redis caching layer
- Advanced filtering and segmentation in dashboard
- Custom event tracking beyond page views
- Conversion funnel analysis
- A/B testing capabilities
- Heatmap or session replay features
- Email or notification alerts
- Multi-user access control and permissions
- API rate limiting and authentication
- Data export functionality
- Integration with external tools or platforms
- Mobile app for dashboard access
- Automated data retention and cleanup policies
- Cookie consent management interface
- Visitor opt-out mechanism
