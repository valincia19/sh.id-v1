# Product Requirements Document (PRD)
# ScriptHub.id - Game Script Management Platform

**Version:** 1.0.0  
**Last Updated:** March 9, 2026  
**Status:** In Development  
**Document Owner:** Product Team

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Product Vision](#2-product-vision)
3. [Problem Statement](#3-problem-statement)
4. [Target Users](#4-target-users)
5. [Goals & Objectives](#5-goals--objectives)
6. [Functional Requirements](#6-functional-requirements)
7. [Non-Functional Requirements](#7-non-functional-requirements)
8. [User Stories](#8-user-stories)
9. [Technical Architecture](#9-technical-architecture)
10. [API Specifications](#10-api-specifications)
11. [Data Model](#11-data-model)
12. [Security Requirements](#12-security-requirements)
13. [Analytics & Metrics](#13-analytics--metrics)
14. [Roadmap & Phases](#14-roadmap--phases)
15. [Success Criteria](#15-success-criteria)
16. [Appendix](#16-appendix)

---

## 1. Executive Summary

### 1.1 Product Overview

**ScriptHub.id** is a comprehensive platform for indexing, viewing, and managing game scripts, with primary focus on Roblox scripts. The platform enables developers to upload, share, discover, and manage scripts while providing users with a centralized hub for game modification resources.

### 1.2 Key Value Propositions

| Stakeholder | Value Proposition |
|-------------|-------------------|
| **Script Developers** | Centralized platform to publish, version, and monetize scripts |
| **Script Users** | Discover, download, and stay updated with quality scripts |
| **Hub Owners** | Build communities around script collections |
| **Platform** | Revenue through premium features, verified scripts, and hub subscriptions |

### 1.3 Platform Architecture

- **Frontend:** Next.js 15 (App Router) with React 19
- **Backend:** Node.js/Express with Clean Architecture
- **Database:** PostgreSQL (Primary) + Redis (Cache)
- **Deployment:** Multi-server Docker architecture
- **Authentication:** JWT + OAuth (Discord, Google, GitHub)

---

## 2. Product Vision

### 2.1 Vision Statement

> To become the premier destination for game script developers and users, providing a secure, scalable, and community-driven platform for script discovery, sharing, and collaboration.

### 2.2 Mission

Empower the game scripting community by providing tools and infrastructure that enable:
- Easy script publishing and version management
- Safe and verified script distribution
- Community building through hubs
- Fair monetization for developers

### 2.3 Core Values

1. **Security First** - Protect users from malicious scripts
2. **Community Driven** - Built by and for the scripting community
3. **Transparency** - Open about verification processes and policies
4. **Quality** - Curated content with verification badges
5. **Accessibility** - Free tier with optional premium features

---

## 3. Problem Statement

### 3.1 Current Market Problems

| Problem | Impact | Current Solution Limitations |
|---------|--------|------------------------------|
| **Fragmented Distribution** | Scripts scattered across Discord, GitHub, forums | No centralized repository |
| **Security Concerns** | Malicious scripts prevalent | No verification system |
| **No Version Control** | Users can't track updates | Manual update checking |
| **Limited Discovery** | Hard to find quality scripts | No search/filtering |
| **No Monetization** | Developers can't earn | No payment infrastructure |
| **Poor Documentation** | Scripts lack proper docs | No standardized format |

### 3.2 Target Problems to Solve

1. **Centralization:** Create a single source of truth for game scripts
2. **Verification:** Implement a verification system for safe scripts
3. **Versioning:** Automatic update notifications for script users
4. **Discovery:** Advanced search and filtering capabilities
5. **Monetization:** Enable developers to earn from their work
6. **Community:** Build hubs around script collections

---

## 4. Target Users

### 4.1 User Personas

#### Persona 1: Script Developer (Primary)
```
Name: Alex Chen
Age: 22
Occupation: Freelance Script Developer
Location: Indonesia

Goals:
- Publish scripts to a wide audience
- Earn income from script development
- Build reputation in the community
- Get feedback and improve scripts

Pain Points:
- Current distribution through Discord is limited
- No way to monetize work effectively
- Hard to track who's using scripts
- Users don't get update notifications

Technical Level: Advanced
Platform Usage: High (daily)
```

#### Persona 2: Script User (Primary)
```
Name: Jordan Miller
Age: 17
Occupation: Student, Roblox Player
Location: United States

Goals:
- Find working, safe scripts for games
- Get updates automatically
- Learn from existing scripts
- Connect with developers

Pain Points:
- Scared of malware/viruses
- Scripts often break after updates
- Hard to find quality scripts
- No support from developers

Technical Level: Intermediate
Platform Usage: Medium (weekly)
```

#### Persona 3: Hub Owner/Vendor (Secondary)
```
Name: Sarah Johnson
Age: 25
Occupation: Community Manager
Location: United Kingdom

Goals:
- Curate script collections
- Build community around games
- Moderate content quality
- Earn from hub subscriptions

Pain Points:
- No platform for script curation
- Hard to manage multiple scripts
- No revenue sharing model

Technical Level: Intermediate
Platform Usage: High (daily)
```

#### Persona 4: Moderator (Secondary)
```
Name: Mike Rodriguez
Age: 28
Occupation: Platform Moderator
Location: Canada

Goals:
- Ensure platform safety
- Verify script quality
- Handle user reports
- Maintain community guidelines

Technical Level: Advanced
Platform Usage: High (daily)
```

### 4.2 User Segments

| Segment | Description | % of Total | Priority |
|---------|-------------|------------|----------|
| **Free Users** | Basic access, limited features | 70% | High |
| **Premium Users** | Paid subscription, advanced features | 15% | High |
| **Vendors** | Script sellers, hub owners | 10% | High |
| **Moderators** | Content verifiers, moderators | 3% | Medium |
| **Administrators** | Platform admins | 2% | Medium |

---

## 5. Goals & Objectives

### 5.1 Business Goals

| Goal | Metric | Target | Timeline |
|------|--------|--------|----------|
| **User Acquisition** | Monthly Active Users (MAU) | 10,000 MAU | Q2 2026 |
| **Content Growth** | Total Scripts Published | 1,000 scripts | Q2 2026 |
| **Engagement** | Daily Active Users (DAU) | 2,000 DAU | Q2 2026 |
| **Revenue** | Monthly Recurring Revenue (MRR) | $5,000 MRR | Q3 2026 |
| **Quality** | Verified Scripts | 200 verified | Q2 2026 |
| **Retention** | 30-day User Retention | 40% | Q2 2026 |

### 5.2 Product Goals

1. **Launch MVP** (Q1 2026)
   - User authentication (email + Discord OAuth)
   - Script upload and management
   - Basic search and discovery
   - Hub creation and management

2. **Community Features** (Q2 2026)
   - Comments and ratings
   - User profiles and portfolios
   - Follow system
   - Notifications

3. **Monetization** (Q3 2026)
   - Premium subscriptions
   - Script sales
   - Hub subscriptions
   - Revenue sharing

4. **Advanced Features** (Q4 2026)
   - Script verification system
   - Analytics dashboard
   - API for third-party integrations
   - Mobile app (React Native)

### 5.3 Technical Goals

| Goal | Metric | Target |
|------|--------|--------|
| **Performance** | API Response Time (p95) | < 200ms |
| **Availability** | Uptime SLA | 99.9% |
| **Scalability** | Concurrent Users | 10,000+ |
| **Security** | Security Audit Score | A+ |
| **Code Quality** | Test Coverage | > 80% |

---

## 6. Functional Requirements

### 6.1 Authentication & Authorization

#### 6.1.1 User Registration & Login

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| AUTH-001 | Email/password registration with validation | P0 | ✅ Complete |
| AUTH-002 | Discord OAuth integration | P0 | ✅ Complete |
| AUTH-003 | Google OAuth integration | P1 | ⏳ Pending |
| AUTH-004 | GitHub OAuth integration | P1 | ⏳ Pending |
| AUTH-005 | Email verification | P0 | ⏳ Pending |
| AUTH-006 | Password reset via email | P0 | ⏳ Pending |
| AUTH-007 | JWT access tokens (7-day expiry) | P0 | ✅ Complete |
| AUTH-008 | Refresh tokens (30-day expiry) | P0 | ✅ Complete |
| AUTH-009 | Logout from all devices | P1 | ⏳ Pending |
| AUTH-010 | Session management dashboard | P2 | ⏳ Pending |

#### 6.1.2 Role-Based Access Control (RBAC)

| Role | Permissions | Description |
|------|-------------|-------------|
| **admin** | All permissions | Full platform access |
| **moderator** | scripts.verify, scripts.moderate, users.ban, comments.moderate | Content moderation |
| **vendor** | scripts.*, hubs.manage, comments.moderate | Script sellers, hub owners |
| **user** | scripts.create, scripts.read, comments.create, hubs.read, votes.create | Standard users |

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| AUTH-101 | Role assignment system | P0 | ✅ Complete |
| AUTH-102 | Permission-based access control | P0 | ✅ Complete |
| AUTH-103 | Admin dashboard for role management | P1 | ⏳ Pending |
| AUTH-104 | Audit logging for role changes | P1 | ⏳ Pending |

---

### 6.2 User Management

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| USER-001 | User profile creation | P0 | ✅ Complete |
| USER-002 | Profile customization (display name, bio, avatar) | P0 | ✅ Complete |
| USER-003 | User profile viewing | P0 | ✅ Complete |
| USER-004 | Account status management (active, suspended, deleted) | P0 | ✅ Complete |
| USER-005 | User search and discovery | P2 | ⏳ Pending |
| USER-006 | Follow/unfollow users | P2 | ⏳ Pending |
| USER-007 | User statistics (scripts, followers, following) | P2 | ⏳ Pending |
| USER-008 | Portfolio showcase | P2 | ⏳ Pending |

---

### 6.3 Script Management

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| SCRIPT-001 | Script upload with metadata | P0 | ⏳ Pending |
| SCRIPT-002 | Script versioning system | P0 | ⏳ Pending |
| SCRIPT-003 | Script editing and updates | P0 | ⏳ Pending |
| SCRIPT-004 | Script deletion (soft delete) | P0 | ⏳ Pending |
| SCRIPT-005 | Script categories and tags | P0 | ⏳ Pending |
| SCRIPT-006 | Script search with filters | P0 | ⏳ Pending |
| SCRIPT-007 | Script preview (syntax highlighting) | P1 | ⏳ Pending |
| SCRIPT-008 | Script download tracking | P1 | ⏳ Pending |
| SCRIPT-009 | Script verification badges | P1 | ⏳ Pending |
| SCRIPT-010 | Script documentation/README | P1 | ⏳ Pending |
| SCRIPT-011 | Script changelog | P2 | ⏳ Pending |
| SCRIPT-012 | Script dependencies | P2 | ⏳ Pending |
| SCRIPT-013 | Script screenshots/images | P2 | ⏳ Pending |
| SCRIPT-014 | Script video demos | P3 | ⏳ Pending |

#### Script Metadata Schema

```typescript
interface Script {
  id: string;                    // UUID
  title: string;                 // Script title
  description: string;           // Short description
  longDescription?: string;      // Full description (Markdown)
  gameId: string;                // Target game ID
  gameName: string;              // Target game name
  category: ScriptCategory;      // Category
  tags: string[];                // Tags
  versions: ScriptVersion[];     // Version history
  authorId: string;              // Author user ID
  hubId?: string;                // Optional hub association
  status: ScriptStatus;          // draft, published, verified, removed
  downloadCount: number;         // Total downloads
  viewCount: number;             // Total views
  rating: number;                // Average rating (1-5)
  ratingCount: number;           // Number of ratings
  isVerified: boolean;           // Verified by moderator
  isFeatured: boolean;           // Featured script
  isPremium: boolean;            // Paid script
  price?: number;                // Price in USD
  createdAt: Date;
  updatedAt: Date;
}
```

---

### 6.4 Hub Management

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| HUB-001 | Hub creation | P0 | ⏳ Pending |
| HUB-002 | Hub customization (name, description, branding) | P0 | ⏳ Pending |
| HUB-003 | Add/remove scripts to hub | P0 | ⏳ Pending |
| HUB-004 | Hub member management | P1 | ⏳ Pending |
| HUB-005 | Hub subscription (free/paid) | P1 | ⏳ Pending |
| HUB-006 | Hub analytics | P2 | ⏳ Pending |
| HUB-007 | Hub discovery and search | P1 | ⏳ Pending |
| HUB-008 | Hub roles (owner, moderator, member) | P1 | ⏳ Pending |
| HUB-009 | Hub announcement system | P2 | ⏳ Pending |
| HUB-010 | Hub discussion forum | P3 | ⏳ Pending |

#### Hub Features

- **Collections:** Curated script collections
- **Teams:** Collaborative script development
- **Subscriptions:** Monthly recurring revenue for hub owners
- **Access Control:** Public, private, or subscriber-only hubs
- **Branding:** Custom logos, banners, colors

---

### 6.5 Comments & Reviews

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| COMM-001 | Add comments to scripts | P0 | ⏳ Pending |
| COMM-002 | Reply to comments (threaded) | P1 | ⏳ Pending |
| COMM-003 | Edit/delete own comments | P1 | ⏳ Pending |
| COMM-004 | Comment moderation (delete, hide) | P1 | ⏳ Pending |
| COMM-005 | Script ratings (1-5 stars) | P1 | ⏳ Pending |
| COMM-006 | Review system with text | P1 | ⏳ Pending |
| COMM-007 | Helpful/not helpful votes on reviews | P2 | ⏳ Pending |
| COMM-008 | Developer responses to reviews | P2 | ⏳ Pending |
| COMM-009 | Comment reporting | P1 | ⏳ Pending |
| COMM-010 | Spam detection | P2 | ⏳ Pending |

---

### 6.6 Search & Discovery

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| SEARCH-001 | Full-text search for scripts | P0 | ⏳ Pending |
| SEARCH-002 | Filter by category | P0 | ⏳ Pending |
| SEARCH-003 | Filter by game | P0 | ⏳ Pending |
| SEARCH-004 | Filter by tags | P0 | ⏳ Pending |
| SEARCH-005 | Filter by price (free/paid) | P1 | ⏳ Pending |
| SEARCH-006 | Filter by verification status | P1 | ⏳ Pending |
| SEARCH-007 | Sort by relevance, date, downloads, rating | P0 | ⏳ Pending |
| SEARCH-008 | Search hubs | P1 | ⏳ Pending |
| SEARCH-009 | Search users | P2 | ⏳ Pending |
| SEARCH-010 | Advanced search (multiple filters) | P1 | ⏳ Pending |
| SEARCH-011 | Search suggestions/autocomplete | P2 | ⏳ Pending |
| SEARCH-012 | Trending scripts | P2 | ⏳ Pending |
| SEARCH-013 | Recommended scripts | P2 | ⏳ Pending |
| SEARCH-014 | Recently updated scripts | P2 | ⏳ Pending |

---

### 6.7 Notifications

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| NOTIF-001 | In-app notifications | P0 | ⏳ Pending |
| NOTIF-002 | Email notifications | P1 | ⏳ Pending |
| NOTIF-003 | Notification preferences | P1 | ⏳ Pending |
| NOTIF-004 | Script update notifications | P1 | ⏳ Pending |
| NOTIF-005 | Comment/reply notifications | P1 | ⏳ Pending |
| NOTIF-006 | Hub announcement notifications | P2 | ⏳ Pending |
| NOTIF-007 | Follow notifications | P2 | ⏳ Pending |
| NOTIF-008 | Verification status notifications | P2 | ⏳ Pending |
| NOTIF-009 | Payment/subscription notifications | P1 | ⏳ Pending |
| NOTIF-010 | Security notifications (login, password change) | P1 | ⏳ Pending |

#### Notification Types

| Type | Trigger | Channel |
|------|---------|---------|
| Script Update | New version published | In-app, Email |
| New Comment | Comment on user's script | In-app, Email |
| New Review | Review on user's script | In-app, Email |
| Hub Announcement | Hub owner posts | In-app |
| Verification | Script verified/rejected | In-app, Email |
| Payment | Subscription/purchase | In-app, Email |
| Security | Login, password change | In-app, Email |

---

### 6.8 Payments & Monetization

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| PAY-001 | Premium subscription (monthly/yearly) | P1 | ⏳ Pending |
| PAY-002 | One-time script purchases | P1 | ⏳ Pending |
| PAY-003 | Hub subscriptions | P1 | ⏳ Pending |
| PAY-004 | Revenue sharing (platform/developer split) | P1 | ⏳ Pending |
| PAY-005 | Payout system for developers | P1 | ⏳ Pending |
| PAY-006 | Payment history | P1 | ⏳ Pending |
| PAY-007 | Refund system | P2 | ⏳ Pending |
| PAY-008 | Promo codes/discounts | P2 | ⏳ Pending |
| PAY-009 | Gift subscriptions | P3 | ⏳ Pending |
| PAY-010 | Affiliate program | P3 | ⏳ Pending |

#### Pricing Tiers (Planned)

| Tier | Price | Features |
|------|-------|----------|
| **Free** | $0 | Basic access, limited downloads, ads |
| **Premium** | $4.99/mo | Unlimited downloads, no ads, early access |
| **Vendor** | $9.99/mo | Sell scripts, hub creation, analytics |
| **Enterprise** | Custom | API access, priority support, custom branding |

#### Revenue Split

| Transaction Type | Platform | Developer |
|------------------|----------|-----------|
| Script Sales | 30% | 70% |
| Hub Subscriptions | 20% | 80% |
| Premium Subscriptions | 100% (platform) | - |

---

### 6.9 Admin & Moderation

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| ADMIN-001 | Admin dashboard | P0 | ⏳ Pending |
| ADMIN-002 | User management (ban, suspend, warn) | P0 | ⏳ Pending |
| ADMIN-003 | Script moderation (approve, reject, remove) | P0 | ⏳ Pending |
| ADMIN-004 | Report management | P0 | ⏳ Pending |
| ADMIN-005 | Verification queue | P1 | ⏳ Pending |
| ADMIN-006 | Analytics dashboard | P1 | ⏳ Pending |
| ADMIN-007 | System health monitoring | P1 | ⏳ Pending |
| ADMIN-008 | Audit logs | P1 | ⏳ Pending |
| ADMIN-009 | Content management (featured, trending) | P2 | ⏳ Pending |
| ADMIN-010 | Email template management | P2 | ⏳ Pending |

---

### 6.10 Analytics & Reporting

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| ANALYTICS-001 | User analytics dashboard | P1 | ⏳ Pending |
| ANALYTICS-002 | Script analytics (views, downloads, ratings) | P1 | ⏳ Pending |
| ANALYTICS-003 | Hub analytics (members, revenue) | P1 | ⏳ Pending |
| ANALYTICS-004 | Platform-wide analytics | P1 | ⏳ Pending |
| ANALYTICS-005 | Revenue reports | P1 | ⏳ Pending |
| ANALYTICS-006 | Export analytics (CSV, PDF) | P2 | ⏳ Pending |
| ANALYTICS-007 | Real-time metrics | P2 | ⏳ Pending |
| ANALYTICS-008 | Custom date ranges | P2 | ⏳ Pending |

---

## 7. Non-Functional Requirements

### 7.1 Performance

| ID | Requirement | Target | Measurement |
|----|-------------|--------|-------------|
| PERF-001 | API Response Time (p50) | < 100ms | Monitoring |
| PERF-002 | API Response Time (p95) | < 200ms | Monitoring |
| PERF-003 | API Response Time (p99) | < 500ms | Monitoring |
| PERF-004 | Page Load Time | < 2s | Lighthouse |
| PERF-005 | Time to First Byte (TTFB) | < 200ms | Monitoring |
| PERF-006 | Database Query Time (p95) | < 50ms | Monitoring |
| PERF-007 | Cache Hit Ratio | > 80% | Redis metrics |
| PERF-008 | Concurrent Users Supported | 10,000+ | Load testing |

### 7.2 Availability & Reliability

| ID | Requirement | Target | Measurement |
|----|-------------|--------|-------------|
| AVAIL-001 | Uptime SLA | 99.9% | Monitoring |
| AVAIL-002 | Mean Time Between Failures (MTBF) | > 720 hours | Monitoring |
| AVAIL-003 | Mean Time To Recovery (MTTR) | < 30 minutes | Monitoring |
| AVAIL-004 | Backup Frequency | Every 24 hours | Automated |
| AVAIL-005 | Backup Recovery Time | < 4 hours | Testing |
| AVAIL-006 | Disaster Recovery RTO | < 4 hours | Testing |
| AVAIL-007 | Disaster Recovery RPO | < 1 hour | Testing |

### 7.3 Scalability

| ID | Requirement | Target | Measurement |
|----|-------------|--------|-------------|
| SCALE-001 | Horizontal API Scaling | Auto-scale to 10 instances | Load testing |
| SCALE-002 | Database Read Replicas | Support up to 5 replicas | Load testing |
| SCALE-003 | Redis Cluster | Support up to 10 nodes | Load testing |
| SCALE-004 | CDN Integration | Global content delivery | Performance testing |
| SCALE-005 | File Storage | Unlimited (S3) | Capacity planning |

### 7.4 Security

| ID | Requirement | Target | Measurement |
|----|-------------|--------|-------------|
| SEC-001 | HTTPS Enforcement | 100% | Security scan |
| SEC-002 | Data Encryption at Rest | AES-256 | Security audit |
| SEC-003 | Data Encryption in Transit | TLS 1.3 | Security audit |
| SEC-004 | Password Hashing | bcrypt (12 rounds) | Code review |
| SEC-005 | SQL Injection Prevention | 100% (parameterized queries) | Security scan |
| SEC-006 | XSS Prevention | 100% | Security scan |
| SEC-007 | CSRF Protection | 100% | Security scan |
| SEC-008 | Rate Limiting | Configurable per endpoint | Load testing |
| SEC-009 | DDoS Protection | Via Cloudflare | Monitoring |
| SEC-010 | Security Audit Frequency | Quarterly | Compliance |

### 7.5 Usability

| ID | Requirement | Target | Measurement |
|----|-------------|--------|-------------|
| USE-001 | Mobile Responsiveness | 100% pages | Testing |
| USE-002 | Accessibility (WCAG 2.1) | AA compliance | Audit |
| USE-003 | Browser Support | Chrome, Firefox, Safari, Edge (last 2 versions) | Testing |
| USE-004 | Language Support | English (initial), i18n ready | Planning |
| USE-005 | Error Message Clarity | User-friendly, actionable | User testing |
| USE-006 | Onboarding Completion Rate | > 70% | Analytics |

### 7.6 Maintainability

| ID | Requirement | Target | Measurement |
|----|-------------|--------|-------------|
| MAINT-001 | Code Test Coverage | > 80% | Coverage reports |
| MAINT-002 | Code Review Requirement | 100% PRs | GitHub |
| MAINT-003 | CI/CD Pipeline | Automated tests + deployment | GitHub Actions |
| MAINT-004 | Documentation Coverage | > 90% APIs | Documentation audit |
| MAINT-005 | Technical Debt Ratio | < 5% | SonarQube |
| MAINT-006 | Dependency Updates | Monthly | Dependency check |

---

## 8. User Stories

### 8.1 Authentication

```
As a new user,
I want to register with my email,
So that I can create an account and access the platform.

Acceptance Criteria:
- Valid email format required
- Password must meet complexity requirements
- Username must be unique
- Receive verification email
- Redirect to dashboard after registration
```

```
As a user,
I want to login with Discord,
So that I can quickly access my account without remembering passwords.

Acceptance Criteria:
- Click "Login with Discord" button
- Redirect to Discord OAuth
- Authorize application
- Redirect back to platform
- Logged in successfully
```

```
As a user,
I want to reset my password,
So that I can regain access if I forget it.

Acceptance Criteria:
- Request password reset via email
- Receive reset link via email
- Reset link expires after 1 hour
- Set new password with validation
- Automatically logged in after reset
```

### 8.2 Script Management

```
As a script developer,
I want to upload my script,
So that I can share it with the community.

Acceptance Criteria:
- Fill in script metadata (title, description, game, category)
- Upload script file or paste code
- Add tags for discoverability
- Set visibility (public, private, hub-only)
- Preview before publishing
- Receive confirmation after upload
```

```
As a user,
I want to browse scripts by category,
So that I can find scripts for my needs.

Acceptance Criteria:
- View all categories
- Filter by category
- See script count per category
- Sort by popularity, rating, date
- See script preview in list
```

```
As a user,
I want to search for scripts,
So that I can find specific scripts quickly.

Acceptance Criteria:
- Search by title, description, author
- Filter results by game, category, tags
- Filter by price (free/paid)
- Sort by relevance, date, downloads
- See search suggestions
- No results message with suggestions
```

### 8.3 Hub Management

```
As a vendor,
I want to create a hub,
So that I can curate script collections and build a community.

Acceptance Criteria:
- Create hub with name and description
- Upload hub logo and banner
- Set hub visibility (public, private, subscribers-only)
- Add scripts to hub
- Invite moderators
- Set subscription price (optional)
```

```
As a user,
I want to subscribe to a hub,
So that I can access premium scripts and support the creator.

Acceptance Criteria:
- View hub details and pricing
- Subscribe with payment method
- Access subscriber-only scripts
- Receive hub announcements
- Cancel subscription anytime
```

### 8.4 Comments & Reviews

```
As a user,
I want to leave a review on a script,
So that I can share my experience with others.

Acceptance Criteria:
- Rate script (1-5 stars)
- Write review text (optional)
- Submit review
- Edit/delete own review
- See other reviews
- Mark review as helpful/not helpful
```

```
As a script developer,
I want to respond to reviews,
So that I can address user concerns and feedback.

Acceptance Criteria:
- See reviews on my scripts
- Reply to reviews
- Edit/delete own replies
- Notify users of responses
```

### 8.5 Notifications

```
As a user,
I want to receive notifications about script updates,
So that I can stay up-to-date with my favorite scripts.

Acceptance Criteria:
- Follow scripts
- Receive notification when new version published
- Click notification to view update details
- Configure notification preferences
- Mark notifications as read
```

### 8.6 Payments

```
As a vendor,
I want to sell my scripts,
So that I can earn money from my work.

Acceptance Criteria:
- Set script price
- Connect payout method (PayPal, bank)
- View sales analytics
- Receive payouts monthly
- See revenue share breakdown
```

```
As a user,
I want to purchase a premium subscription,
So that I can access advanced features.

Acceptance Criteria:
- View subscription tiers and pricing
- Select subscription plan
- Enter payment information
- Receive confirmation
- Access premium features immediately
- Cancel anytime
```

---

## 9. Technical Architecture

### 9.1 System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         Cloudflare                              │
│                    (CDN + DDoS Protection)                      │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Server 1: Frontend Edge                      │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Next.js 15 Application                      │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐         │  │
│  │  │   Pages    │  │  Components│  │   Hooks    │         │  │
│  │  └────────────┘  └────────────┘  └────────────┘         │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐         │  │
│  │  │   Styles   │  │   Utils    │  │   Types    │         │  │
│  │  └────────────┘  └────────────┘  └────────────┘         │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  Port: 3000  │  Exposed: 443, 80 (via proxy)                   │
└────────────────────────┬────────────────────────────────────────┘
                         │ HTTPS
                         │ NEXT_PUBLIC_API_URL
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Server 2: Backend Engine                      │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              NGINX Reverse Proxy                         │  │
│  │         (api.scripthub.id → localhost:4000)              │  │
│  └────────────────────┬─────────────────────────────────────┘  │
│                       │                                         │
│                       ▼                                         │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │            Docker Compose Services                       │  │
│  │  ┌────────────────────────────────────────────────────┐  │  │
│  │  │  API Container (Node.js + Express)                 │  │  │
│  │  │  ┌──────────┐  ┌──────────┐  ┌──────────┐         │  │  │
│  │  │  │  Routes  │  │Services  │  │   Utils  │         │  │  │
│  │  │  └──────────┘  └──────────┘  └──────────┘         │  │  │
│  │  │  ┌──────────┐  ┌──────────┐  ┌──────────┐         │  │  │
│  │  │  │   Auth   │  │   RBAC   │  │Middleware│         │  │  │
│  │  │  └──────────┘  └──────────┘  └──────────┘         │  │  │
│  │  └────────────────────────────────────────────────────┘  │  │
│  │                       │                                   │  │
│  │  ┌────────────────────┼───────────────────────────────┐  │  │
│  │  │  PostgreSQL       │       Redis                    │  │  │
│  │  │  ┌──────────────┐ │  ┌──────────────────────────┐  │  │  │
│  │  │  │   Primary    │ │  │      Cache Layer         │  │  │  │
│  │  │  │   Database   │ │  │  - Sessions              │  │  │  │
│  │  │  │              │ │  │  - Permissions           │  │  │  │
│  │  │  │              │ │  │  - Rate Limits           │  │  │  │
│  │  │  │              │ │  │  - Query Results         │  │  │  │
│  │  │  └──────────────┘ │  └──────────────────────────┘  │  │  │
│  │  └───────────────────┴─────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  API Port: 4000  │  DB Port: 5432  │  Redis Port: 6379         │
└─────────────────────────────────────────────────────────────────┘
```

### 9.2 Technology Stack

#### Frontend

| Category | Technology | Version | Purpose |
|----------|------------|---------|---------|
| **Framework** | Next.js | 15.x | React framework with App Router |
| **Language** | TypeScript | 5.x | Type safety |
| **UI Library** | React | 19.x | UI components |
| **Styling** | Tailwind CSS | 4.x | Utility-first CSS |
| **Icons** | Lucide React | Latest | Icon library |
| **Code Editor** | Monaco Editor | 4.7.x | Script preview |
| **Code Mirror** | @uiw/react-codemirror | 4.25.x | Alternative code editor |
| **HTTP Client** | Axios | 1.13.x | API requests |
| **Date Handling** | date-fns | 4.1.x | Date utilities |
| **Image Cropping** | react-easy-crop | 5.5.x | Avatar editing |

#### Backend

| Category | Technology | Version | Purpose |
|----------|------------|---------|---------|
| **Runtime** | Node.js | 18+ | JavaScript runtime |
| **Framework** | Express.js | 4.x | Web framework |
| **Language** | TypeScript | 5.x | Type safety |
| **Database** | PostgreSQL | 15+ | Primary database |
| **Cache** | Redis | 7+ | Caching layer |
| **ORM** | pg (node-postgres) | Latest | PostgreSQL client |
| **Auth** | Passport.js | 0.7.x | OAuth strategies |
| **JWT** | jsonwebtoken | 9.x | Token management |
| **Validation** | express-validator | 7.x | Input validation |
| **Security** | Helmet.js | 7.x | Security headers |
| **Rate Limiting** | express-rate-limit | 7.x | Rate limiting |
| **Logging** | Winston | 3.x | Logging |
| **Testing** | Jest | 29.x | Testing framework |

#### Infrastructure

| Category | Technology | Purpose |
|----------|------------|---------|
| **Containerization** | Docker | Container runtime |
| **Orchestration** | Docker Compose | Multi-container management |
| **CDN** | Cloudflare | CDN, DDoS protection |
| **DNS** | Cloudflare | DNS management |
| **SSL/TLS** | Cloudflare | Certificate management |
| **Monitoring** | (TBD) | Performance monitoring |
| **Logging** | (TBD) | Centralized logging |
| **CI/CD** | GitHub Actions | Automated deployment |

### 9.3 Directory Structure

```
scripthub.id/
├── frontend/                    # Next.js application
│   ├── src/
│   │   ├── app/                 # App Router pages
│   │   ├── components/          # React components
│   │   ├── hooks/               # Custom hooks
│   │   ├── lib/                 # Utilities
│   │   ├── styles/              # Global styles
│   │   └── types/               # TypeScript types
│   ├── public/                  # Static assets
│   ├── .env                     # Environment variables
│   ├── next.config.ts           # Next.js configuration
│   ├── package.json             # Dependencies
│   └── Dockerfile               # Frontend Docker image
│
├── backend/                     # Express API
│   ├── src/
│   │   ├── config/              # Configuration
│   │   ├── db/                  # Database setup
│   │   ├── modules/             # Feature modules
│   │   │   ├── auth/
│   │   │   ├── users/
│   │   │   ├── scripts/
│   │   │   ├── hubs/
│   │   │   └── ...
│   │   ├── routes/              # Route definitions
│   │   ├── middleware/          # Express middleware
│   │   ├── utils/               # Utilities
│   │   └── index.ts             # Entry point
│   ├── scripts/                 # Database scripts
│   ├── tests/                   # Tests
│   ├── .env                     # Environment variables
│   ├── docker-compose.yml       # Docker Compose config
│   ├── Dockerfile               # Backend Docker image
│   └── package.json             # Dependencies
│
├── openapi/                     # OpenAPI specifications
│   └── src/
│
├── docs/                        # Documentation
│   ├── DEPLOY_TO_SERVER.md
│   ├── PROJECT_STRUCTURE.md
│   └── PUSH_TO_GITHUB.md
│
├── .dockerignore                # Docker ignore rules
├── .gitignore                   # Git ignore rules
├── Dockerfile                   # Root Dockerfile
├── eslint.config.mjs            # ESLint configuration
├── package.json                 # Root package.json
├── README.md                    # Project README
└── tsconfig.json                # TypeScript configuration
```

---

## 10. API Specifications

### 10.1 API Design Principles

- **RESTful:** Resource-based URLs, HTTP verbs
- **Versioned:** `/api/v1/` prefix for versioning
- **JSON:** Request/response format
- **Stateless:** JWT authentication
- **Consistent:** Standardized response format
- **Documented:** OpenAPI/Swagger specifications

### 10.2 Response Format

#### Success Response

```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    // Response payload
  },
  "meta": {
    "timestamp": "2024-01-01T00:00:00.000Z",
    "requestId": "uuid-v4"
  }
}
```

#### Error Response

```json
{
  "success": false,
  "error": "ErrorType",
  "message": "Human-readable error message",
  "details": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ],
  "meta": {
    "timestamp": "2024-01-01T00:00:00.000Z",
    "requestId": "uuid-v4"
  }
}
```

### 10.3 Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/register` | Register new user | No |
| POST | `/api/auth/login` | Login user | No |
| POST | `/api/auth/logout` | Logout user | Yes |
| POST | `/api/auth/logout-all` | Logout all devices | Yes |
| POST | `/api/auth/refresh` | Refresh access token | No |
| GET | `/api/auth/me` | Get current user | Yes |
| PUT | `/api/auth/me` | Update current user | Yes |
| POST | `/api/auth/change-password` | Change password | Yes |
| GET | `/api/auth/discord` | Discord OAuth | No |
| GET | `/api/auth/discord/callback` | Discord OAuth callback | No |

### 10.4 Script Endpoints (Planned)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/scripts` | List scripts | No |
| POST | `/api/scripts` | Create script | Yes |
| GET | `/api/scripts/:id` | Get script details | No |
| PUT | `/api/scripts/:id` | Update script | Yes (owner) |
| DELETE | `/api/scripts/:id` | Delete script | Yes (owner/admin) |
| GET | `/api/scripts/:id/versions` | Get script versions | No |
| POST | `/api/scripts/:id/versions` | Create new version | Yes (owner) |
| POST | `/api/scripts/:id/download` | Track download | No |
| POST | `/api/scripts/:id/rate` | Rate script | Yes |
| GET | `/api/scripts/:id/comments` | Get comments | No |
| POST | `/api/scripts/:id/comments` | Add comment | Yes |

### 10.5 Hub Endpoints (Planned)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/hubs` | List hubs | No |
| POST | `/api/hubs` | Create hub | Yes (vendor) |
| GET | `/api/hubs/:slug` | Get hub details | No |
| PUT | `/api/hubs/:slug` | Update hub | Yes (owner) |
| DELETE | `/api/hubs/:slug` | Delete hub | Yes (owner/admin) |
| POST | `/api/hubs/:id/scripts` | Add script to hub | Yes (owner) |
| DELETE | `/api/hubs/:id/scripts/:scriptId` | Remove script | Yes (owner) |
| POST | `/api/hubs/:id/subscribe` | Subscribe to hub | Yes |
| DELETE | `/api/hubs/:id/subscribe` | Unsubscribe | Yes |
| GET | `/api/hubs/:id/members` | Get members | Yes (member) |

### 10.6 Rate Limiting

| Endpoint Type | Limit | Window |
|---------------|-------|--------|
| Authentication | 5 requests | 15 minutes |
| General API | 100 requests | 15 minutes |
| File Upload | 10 requests | 1 hour |
| Search | 30 requests | 15 minutes |

**Rate Limit Headers:**

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

---

## 11. Data Model

### 11.1 Entity Relationship Diagram

```
┌─────────────────┐       ┌─────────────────┐
│     users       │       │     roles       │
├─────────────────┤       ├─────────────────┤
│ id (PK)         │       │ id (PK)         │
│ username        │       │ name            │
│ email           │       │ description     │
│ display_name    │       │ created_at      │
│ avatar_url      │       └────────┬────────┘
│ bio             │                │
│ account_status  │       ┌────────▼────────┐
│ email_verified  │       │  user_roles     │
│ created_at      │       ├─────────────────┤
│ updated_at      │       │ user_id (FK)    │
└────────┬────────┘       │ role_id (FK)    │
         │                └────────┬────────┘
         │                         │
         │                ┌────────▼────────┐
         │                │role_permissions │
         │               ├─────────────────┤
         │               │ role_id (FK)    │
┌────────▼────────┐      │ permission_id(FK)│
│auth_providers   │      └────────┬────────┘
├─────────────────┤               │
│ id (PK)         │      ┌────────▼────────┐
│ user_id (FK)    │      │  permissions    │
│ provider        │      ├─────────────────┤
│ provider_id     │      │ id (PK)         │
│ provider_data   │      │ name            │
│ created_at      │      │ description     │
└─────────────────┘      │ resource        │
                         │ action          │
┌─────────────────┐      │ created_at      │
│     scripts     │      └─────────────────┘
├─────────────────┤
│ id (PK)         │      ┌─────────────────┐
│ author_id (FK)  │      │      hubs       │
│ hub_id (FK)     │      ├─────────────────┤
│ title           │      │ id (PK)         │
│ description     │      │ owner_id (FK)   │
│ game_id         │      │ name            │
│ game_name       │      │ description     │
│ category        │      │ slug            │
│ tags            │      │ logo_url        │
│ status          │      │ banner_url      │
│ download_count  │      │ subscription_   │
│ view_count      │      │   price         │
│ rating          │      │ visibility      │
│ is_verified     │      │ created_at      │
│ is_featured     │      │ updated_at      │
│ is_premium      │      └─────────────────┘
│ price           │
│ created_at      │      ┌─────────────────┐
│ updated_at      │      │hub_scripts      │
└─────────────────┘      ├─────────────────┤
                         │ hub_id (FK)     │
┌─────────────────┐      │ script_id (FK)  │
│script_versions  │      │ added_at        │
├─────────────────┤      └─────────────────┘
│ id (PK)         │
│ script_id (FK)  │      ┌─────────────────┐
│ version_number  │      │    comments     │
│ code            │      ├─────────────────┤
│ changelog       │      │ id (PK)         │
│ is_current      │      │ script_id (FK)  │
│ created_at      │      │ user_id (FK)    │
└─────────────────┘      │ parent_id (FK)  │
                         │ content         │
┌─────────────────┐      │ rating          │
│    reviews      │      │ created_at      │
├─────────────────┤      │ updated_at      │
│ id (PK)         │      └─────────────────┘
│ script_id (FK)  │
│ user_id (FK)    │      ┌─────────────────┐
│ rating          │      │ subscriptions   │
│ title           │      ├─────────────────┤
│ content         │      │ id (PK)         │
│ is_helpful      │      │ user_id (FK)    │
│ created_at      │      │ hub_id (FK)     │
│ updated_at      │      │ status          │
└─────────────────┘      │ started_at      │
                         │ ends_at         │
┌─────────────────┐      └─────────────────┘
│  notifications  │
├─────────────────┤
│ id (PK)         │
│ user_id (FK)    │
│ type            │
│ title           │
│ content         │
│ is_read         │
│ created_at      │
└─────────────────┘
```

### 11.2 Key Database Tables

#### users

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | User ID |
| username | VARCHAR(50) | UNIQUE, NOT NULL | Username |
| email | VARCHAR(255) | UNIQUE, NULLABLE | Email address |
| display_name | VARCHAR(100) | NULLABLE | Display name |
| avatar_url | TEXT | NULLABLE | Avatar URL |
| bio | TEXT | NULLABLE | User bio |
| account_status | ENUM | DEFAULT 'active' | active, suspended, deleted |
| email_verified | BOOLEAN | DEFAULT false | Email verification status |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

#### scripts

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Script ID |
| author_id | UUID | FOREIGN KEY → users.id | Author user ID |
| hub_id | UUID | FOREIGN KEY → hubs.id, NULLABLE | Associated hub |
| title | VARCHAR(255) | NOT NULL | Script title |
| description | TEXT | NOT NULL | Short description |
| long_description | TEXT | NULLABLE | Full description (Markdown) |
| game_id | VARCHAR(100) | NOT NULL | Target game ID |
| game_name | VARCHAR(255) | NOT NULL | Target game name |
| category | VARCHAR(50) | NOT NULL | Script category |
| tags | TEXT[] | DEFAULT [] | Tags array |
| status | ENUM | DEFAULT 'draft' | draft, published, verified, removed |
| download_count | INTEGER | DEFAULT 0 | Total downloads |
| view_count | INTEGER | DEFAULT 0 | Total views |
| rating | DECIMAL(3,2) | DEFAULT 0 | Average rating (1-5) |
| rating_count | INTEGER | DEFAULT 0 | Number of ratings |
| is_verified | BOOLEAN | DEFAULT false | Verified status |
| is_featured | BOOLEAN | DEFAULT false | Featured status |
| is_premium | BOOLEAN | DEFAULT false | Paid script |
| price | DECIMAL(10,2) | NULLABLE | Price in USD |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

---

## 12. Security Requirements

### 12.1 Authentication Security

| Requirement | Implementation | Status |
|-------------|----------------|--------|
| Password Hashing | bcrypt with 12 rounds | ✅ Complete |
| JWT Signing | RS256 or HS256 with strong secret | ✅ Complete |
| Token Expiry | Access: 7 days, Refresh: 30 days | ✅ Complete |
| Refresh Token Rotation | One-time use refresh tokens | ⏳ Pending |
| Session Management | Redis-backed session store | ⏳ Pending |
| Multi-Factor Auth | TOTP-based 2FA | ⏳ Pending |

### 12.2 Authorization Security

| Requirement | Implementation | Status |
|-------------|----------------|--------|
| RBAC | Role-based permission system | ✅ Complete |
| Permission Caching | Redis cache (15min TTL) | ✅ Complete |
| Resource Ownership | Owner validation on mutations | ⏳ Pending |
| Audit Logging | All permission changes logged | ⏳ Pending |

### 12.3 Data Security

| Requirement | Implementation | Status |
|-------------|----------------|--------|
| Encryption in Transit | TLS 1.3 (via Cloudflare) | ✅ Complete |
| Encryption at Rest | PostgreSQL TDE, S3 SSE | ⏳ Pending |
| PII Protection | Minimal PII collection | ✅ Complete |
| Data Retention | Configurable retention policies | ⏳ Pending |
| Backup Encryption | Encrypted backups | ⏳ Pending |

### 12.4 Application Security

| Requirement | Implementation | Status |
|-------------|----------------|--------|
| Input Validation | express-validator on all inputs | ✅ Complete |
| SQL Injection Prevention | Parameterized queries | ✅ Complete |
| XSS Prevention | Content sanitization, CSP headers | ✅ Complete |
| CSRF Protection | CSRF tokens for state-changing ops | ⏳ Pending |
| Rate Limiting | Per-endpoint rate limits | ✅ Complete |
| Security Headers | Helmet.js configuration | ✅ Complete |
| CORS Policy | Whitelist-based CORS | ✅ Complete |

### 12.5 Infrastructure Security

| Requirement | Implementation | Status |
|-------------|----------------|--------|
| DDoS Protection | Cloudflare protection | ✅ Complete |
| Firewall Rules | Server-level firewall | ⏳ Pending |
| Network Segmentation | Separate frontend/backend servers | ✅ Complete |
| Secrets Management | Environment variables, Docker secrets | ✅ Complete |
| Vulnerability Scanning | Regular dependency audits | ⏳ Pending |

---

## 13. Analytics & Metrics

### 13.1 Product Metrics

| Metric | Definition | Target | Frequency |
|--------|------------|--------|-----------|
| **MAU** | Monthly Active Users | 10,000 | Monthly |
| **DAU** | Daily Active Users | 2,000 | Daily |
| **DAU/MAU Ratio** | Engagement metric | > 20% | Weekly |
| **New Users** | New registrations | 500/week | Weekly |
| **Churn Rate** | User churn (30-day) | < 5% | Monthly |
| **Retention Rate** | 30-day retention | > 40% | Monthly |

### 13.2 Content Metrics

| Metric | Definition | Target | Frequency |
|--------|------------|--------|-----------|
| **Total Scripts** | All published scripts | 1,000 | Monthly |
| **New Scripts/Week** | Scripts published weekly | 50 | Weekly |
| **Verified Scripts** | Moderation-approved scripts | 200 | Monthly |
| **Avg Script Rating** | Average rating across platform | > 4.0 | Weekly |
| **Scripts with Reviews** | Scripts with user reviews | > 30% | Monthly |

### 13.3 Engagement Metrics

| Metric | Definition | Target | Frequency |
|--------|------------|--------|-----------|
| **Avg Session Duration** | Time spent per session | > 5 min | Weekly |
| **Pages per Session** | Pages viewed per session | > 5 | Weekly |
| **Script Downloads/Day** | Total daily downloads | 1,000 | Daily |
| **Comments/Day** | Total daily comments | 100 | Daily |
| **Search Success Rate** | Searches with clicks | > 70% | Weekly |

### 13.4 Revenue Metrics

| Metric | Definition | Target | Frequency |
|--------|------------|--------|-----------|
| **MRR** | Monthly Recurring Revenue | $5,000 | Monthly |
| **ARR** | Annual Recurring Revenue | $60,000 | Monthly |
| **ARPU** | Average Revenue Per User | $0.50 | Monthly |
| **Conversion Rate** | Free → Premium | > 5% | Monthly |
| **Churn Rate (Paid)** | Paid user churn | < 3% | Monthly |
| **LTV** | Lifetime Value | > $30 | Monthly |

### 13.5 Technical Metrics

| Metric | Definition | Target | Frequency |
|--------|------------|--------|-----------|
| **API Uptime** | API availability | 99.9% | Daily |
| **Error Rate** | % of requests with errors | < 0.1% | Daily |
| **p95 Latency** | 95th percentile response time | < 200ms | Daily |
| **Cache Hit Ratio** | Redis cache effectiveness | > 80% | Daily |
| **DB Query Time (p95)** | Database query performance | < 50ms | Daily |

---

## 14. Roadmap & Phases

### Phase 1: MVP (Q1 2026)

**Goal:** Launch functional platform with core features

#### Authentication & Users
- [x] Email/password registration
- [x] Discord OAuth login
- [x] JWT authentication
- [x] User profiles
- [ ] Email verification
- [ ] Password reset

#### Scripts
- [ ] Script upload
- [ ] Script metadata
- [ ] Script versioning
- [ ] Script browsing
- [ ] Basic search

#### Hubs
- [ ] Hub creation
- [ ] Hub management
- [ ] Add scripts to hubs

#### Infrastructure
- [x] Docker setup
- [x] Multi-server architecture
- [ ] Production deployment
- [ ] Monitoring setup

**MVP Launch Date:** March 31, 2026

---

### Phase 2: Community Features (Q2 2026)

**Goal:** Build community and engagement

#### Comments & Reviews
- [ ] Script comments
- [ ] Threaded replies
- [ ] Script ratings
- [ ] Reviews with text
- [ ] Comment moderation

#### Social Features
- [ ] Follow users
- [ ] User portfolios
- [ ] Activity feeds
- [ ] Notifications

#### Search & Discovery
- [ ] Advanced search
- [ ] Filters and sorting
- [ ] Trending scripts
- [ ] Recommendations

#### Moderation
- [ ] Report system
- [ ] Moderation dashboard
- [ ] Verification queue
- [ ] Admin tools

**Phase 2 Launch:** June 30, 2026

---

### Phase 3: Monetization (Q3 2026)

**Goal:** Enable revenue generation

#### Payments
- [ ] Premium subscriptions
- [ ] Script sales
- [ ] Hub subscriptions
- [ ] Payment processing (Stripe)
- [ ] Payout system

#### Vendor Features
- [ ] Vendor dashboard
- [ ] Sales analytics
- [ ] Revenue reports
- [ ] Payout management

#### Marketing
- [ ] Promo codes
- [ ] Referral program
- [ ] Affiliate system

**Phase 3 Launch:** September 30, 2026

---

### Phase 4: Advanced Features (Q4 2026)

**Goal:** Platform maturity and scale

#### Verification System
- [ ] Script verification workflow
- [ ] Verified badges
- [ ] Security scanning
- [ ] Automated malware detection

#### Analytics
- [ ] User analytics dashboard
- [ ] Script analytics
- [ ] Hub analytics
- [ ] Platform insights

#### API & Integrations
- [ ] Public API
- [ ] API documentation
- [ ] Webhooks
- [ ] Third-party integrations

#### Mobile
- [ ] Mobile-responsive improvements
- [ ] PWA support
- [ ] React Native app (exploratory)

**Phase 4 Launch:** December 15, 2026

---

### Future Considerations (2027+)

- [ ] Internationalization (i18n)
- [ ] Additional OAuth providers (Google, GitHub)
- [ ] Live chat support
- [ ] Community forums
- [ ] Script tutorials/courses
- [ ] API marketplace
- [ ] Enterprise features
- [ ] White-label solutions

---

## 15. Success Criteria

### 15.1 MVP Success Criteria

| Criterion | Target | Measurement |
|-----------|--------|-------------|
| **User Registration** | 1,000 users in first month | Analytics |
| **Script Uploads** | 100 scripts in first month | Database |
| **Active Users** | 200 DAU after 1 month | Analytics |
| **System Stability** | < 1% error rate | Monitoring |
| **Performance** | p95 < 300ms | Monitoring |
| **User Feedback** | > 3.5/5 satisfaction | Surveys |

### 15.2 Year 1 Success Criteria

| Criterion | Target | Measurement |
|-----------|--------|-------------|
| **MAU** | 10,000 monthly active users | Analytics |
| **Content** | 1,000 published scripts | Database |
| **Revenue** | $5,000 MRR | Financial |
| **Retention** | 40% 30-day retention | Analytics |
| **NPS** | > 30 Net Promoter Score | Surveys |
| **Uptime** | 99.9% availability | Monitoring |

### 15.3 Long-term Success Criteria (3 Years)

| Criterion | Target | Measurement |
|-----------|--------|-------------|
| **MAU** | 100,000 monthly active users | Analytics |
| **Revenue** | $100,000 MRR | Financial |
| **Market Position** | Top 3 script platforms | Market research |
| **Community** | 10,000+ active creators | Database |
| **Brand Recognition** | Industry standard | Surveys |

---

## 16. Appendix

### 16.1 Glossary

| Term | Definition |
|------|------------|
| **Script** | Code snippet for game modification |
| **Hub** | Curated collection of scripts |
| **Vendor** | User who sells scripts |
| **Verification** | Moderator approval of script safety |
| **RBAC** | Role-Based Access Control |
| **JWT** | JSON Web Token |
| **OAuth** | Open Authorization protocol |
| **CDN** | Content Delivery Network |
| **DDoS** | Distributed Denial of Service |
| **SLA** | Service Level Agreement |

### 16.2 References

- [Backend API Documentation](./backend/API.md)
- [Backend Architecture](./backend/ARCHITECTURE.md)
- [Deployment Guide](./docs/DEPLOY_TO_SERVER.md)
- [Project Structure](./docs/PROJECT_STRUCTURE.md)
- [Production SOP](./SOP_PRODUCTION_MAINTENANCE.md)

### 16.3 Stakeholders

| Role | Name | Responsibilities |
|------|------|------------------|
| **Product Owner** | TBD | Product strategy, roadmap |
| **Tech Lead** | TBD | Technical architecture, code review |
| **Frontend Dev** | TBD | Next.js development |
| **Backend Dev** | TBD | Express API development |
| **DevOps** | TBD | Infrastructure, deployment |
| **Designer** | TBD | UI/UX design |
| **Moderator** | TBD | Content moderation |

### 16.4 Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| **Security Breach** | Medium | High | Regular audits, security best practices |
| **Scalability Issues** | Medium | High | Horizontal scaling, caching |
| **Low User Adoption** | Medium | High | Marketing, community building |
| **Legal Issues** | Low | High | Terms of service, DMCA compliance |
| **Revenue Shortfall** | Medium | Medium | Diversified revenue streams |
| **Technical Debt** | High | Medium | Code review, refactoring sprints |

### 16.5 Open Questions

1. **Payment Processor:** Stripe vs PayPal vs both?
2. **Verification Process:** Manual vs automated vs hybrid?
3. **Content Policy:** What scripts are allowed/prohibited?
4. **Pricing Strategy:** Optimal price points for subscriptions?
5. **Geographic Expansion:** Which markets to prioritize?

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | March 9, 2026 | Product Team | Initial PRD creation |

---

**Approvals:**

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Product Owner | | | |
| Tech Lead | | | |
| Engineering Manager | | | |

---

*This is a living document and should be updated as the product evolves.*
