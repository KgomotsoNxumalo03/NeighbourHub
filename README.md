# NeighbourHub

NeighbourHub is a simple, polished community management platform for residential communities. It supports general neighbourhoods, residential estates, gated communities, apartment complexes, townhouse complexes, and retirement villages from the same lightweight Next.js app.

This is intentionally a local-first MVP. It uses Next.js, React, TypeScript, Tailwind CSS, and JSON files for storage.

## Run Locally

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

Check the production build:

```bash
npm run lint
npm run build
```

## Demo Logins

Resident:

```text
resident@neighbourhub.local
resident123
```

Admin:

```text
admin@neighbourhub.local
admin123
```

Super Admin demo:

```text
super@neighbourhub.local
super123
```

Additional demo:

```text
estate@neighbourhub.local
estate123
```

## Current Features

- Version 3.0 operations platform features:
  - Interactive map placeholder at `/map`
  - Security centre at `/security`
  - Polls at `/polls`
  - Local business directory at `/businesses`
  - Volunteer groups at `/groups`
  - Photo gallery at `/gallery`
  - Ticket workflow ownership, expanded statuses, support/upvotes, and duplicate suggestions
  - PWA manifest and mobile metadata
- Community model with scoped data per community
- Demo communities for General Neighbourhood, Residential Estate, Gated Community, Apartment Complex, Townhouse Complex, and Retirement Village
- Super Admin community switching for demonstration
- Adaptive navigation with community-type-specific Coming Soon modules
- Registration address fields that adapt to the selected community type
- Admin settings for community name, logo, cover image, description, primary colour, emergency contacts, and community status
- Landing page for Oakridge Estate
- Demo login and resident registration
- Role-based redirects for resident and admin users
- Protected resident and admin routes
- Resident dashboard with stats, urgent alerts, announcements, community status, recent tickets, and recent activity
- Emergency reporting page with quick buttons for Security, Medical, Fire, Police, and Suspicious activity
- Emergency reports create emergency-priority tickets
- Ticket creation with category, priority, location, image placeholder, validation, and reference numbers such as `NH-0001`
- Ticket categories grouped by Utilities, Security, Roads, Community, Animals, and Other
- My Tickets page with status and priority badges
- Ticket detail page with comments, timeline/activity history, admin notes history, image placeholder, created date, and updated date
- Residents can reopen resolved or closed tickets
- Admin dashboard with stats, search, filters, sorting, quick status buttons, admin notes history, and priority indicators
- Admin-editable community status for Power, Water, Security, and Roads with Normal, Warning, and Critical levels
- Announcement priority levels: Normal, Important, and Emergency
- Announcement expiry dates
- Admin announcement create, edit, and delete
- Announcements page showing active notices
- Admin reports page with tickets by status, tickets by category, emergency tickets, average resolution time, and recent admin activity
- Community feed with posts, comments, likes, pinned posts, and admin removal
- Lost and found section for lost pets, found pets, lost items, and found items
- Events page with admin-created events and resident RSVPs
- Notifications centre with read/unread state
- Resident directory with opt-in visibility and privacy-safe fields
- Admin community moderation tools for posts, lost and found, and events
- Dashboard community widgets for latest posts, upcoming events, unread notifications, and lost-and-found summary
- Emergency contacts page
- JSON-backed local data storage

## Folder Structure

```text
data/
  announcements.json
  communities.json
  communityStatus.json
  contacts.json
  events.json
  feedPosts.json
  gallery.json
  groups.json
  businesses.json
  polls.json
  lostFound.json
  notifications.json
  residentProfiles.json
  tickets.json
  users.json

src/
  app/
    api/
      announcements/
      auth/
      community-status/
      contacts/
      tickets/
    admin/
      community/
      reports/
    announcements/
    dashboard/
    directory/
    emergency/
    events/
    feed/
    gallery/
    groups/
    businesses/
    map/
    polls/
    security/
    lost-found/
    notifications/
    login/
    register/
    tickets/
  components/
    AppShell.tsx
    StatusBadge.tsx
  lib/
    client-auth.ts
    constants.ts
    data-store.ts
    format.ts
    tickets.ts
    types.ts
```

## Data Storage

NeighbourHub currently stores data in local JSON files under `data/`. Every operational model now includes `communityId`, and pages/API routes filter data to the active community. This keeps the app easy to run locally while laying the foundation for a future database.

## Community Types

- General Neighbourhood
- Residential Estate
- Gated Community
- Apartment Complex
- Townhouse Complex
- Retirement Village

Future modules are shown as Coming Soon based on community type, without building the full systems yet.

## Next Planned Features

- Replace map placeholder with Leaflet or Google Maps
- Add true file uploads for gallery and tickets
- Add service worker offline caching beyond the manifest/offline fallback foundation
- Replace demo local auth with secure server-side sessions
- Move JSON storage to SQLite
- Add database-backed community scoping and audit logs
- Expand Super Admin tools beyond demo switching
- Build visitor, document, facility, wellness, and maintenance modules by community type
- Add real image upload storage
- Add real emergency notification delivery to security/admins
- Add richer notification preferences
- Add moderation audit logs
- Add event reminders and calendar export
- Add resident profile settings
- Add ticket assignment to admins or maintenance teams
- Add email/SMS notifications for important status changes
- Add export/reporting tools for admins

## Notes

This project is still scoped to one neighbourhood. It does not include multi-tenancy, payments, Docker, Azure, or mobile app code.
