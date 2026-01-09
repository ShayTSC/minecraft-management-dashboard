# Minecraft Management Dashboard

A modern, feature-rich dashboard for managing Minecraft servers using the Minecraft Server Management Protocol (MMSP).

## Features

- **Server Connection Management**: Connect to multiple Minecraft servers with configurable settings
- **Player Management**: View online players, kick players, send messages
- **Allowlist Management**: Add/remove players from the server allowlist
- **Ban Management**: Manage player bans and IP bans with reasons and expiration dates
- **Operator Management**: Manage server operators with permission levels
- **Game Rules**: View and modify all server game rules
- **Server Settings**: Configure server properties like difficulty, MOTD, max players, etc.
- **User Management**: Role-based access control with Admin, Moderator, Operator, and Viewer roles
- **Real-time Updates**: Live notifications for server events (player joins/leaves, etc.)
- **Dark Mode**: Modern dark theme optimized for long sessions

## Tech Stack

- **Framework**: [TanStack Start](https://tanstack.com/start) (React 19)
- **Styling**: [Tailwind CSS](https://tailwindcss.com) + [ShadCN UI](https://ui.shadcn.com)
- **State Management**: [Zustand](https://zustand-demo.pmnd.rs/)
- **Authentication**: Built-in auth system with RBAC
- **Protocol**: Minecraft Server Management Protocol (JSON-RPC 2.0 over WebSocket)

## Prerequisites

- Node.js 22.x or later
- Minecraft Java Edition 1.21.9 or later with MMSP enabled

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/ShayTSC/minecraft-management-dashboard.git
   cd minecraft-management-dashboard
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your settings
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open http://localhost:3000 in your browser

## Minecraft Server Configuration

To enable the Management Protocol on your Minecraft server, add these settings to `server.properties`:

```properties
management-server-enabled=true
management-server-host=localhost
management-server-port=25585
management-server-secret=your-40-character-alphanumeric-secret
management-server-tls-enabled=false
```

**Security Notes:**
- For production, enable TLS (`management-server-tls-enabled=true`)
- Generate a strong 40-character alphanumeric secret
- Restrict `management-server-host` to trusted networks

## User Roles

| Role | Permissions |
|------|-------------|
| **Admin** | Full access to all features including user management |
| **Moderator** | Manage players, bans, allowlist, operators, and game rules |
| **Operator** | Kick players, send messages, view all data |
| **Viewer** | View-only access to server status and data |

## Development

```bash
# Start dev server
npm run dev

# Type checking
npm run typecheck

# Build for production
npm run build

# Start production server
npm run start
```

**Note**: TanStack Start is rapidly evolving. If you encounter build issues, try matching exact versions across all `@tanstack/*` packages. Check the [TanStack Start documentation](https://tanstack.com/start) for the latest compatibility information.

## Project Structure

```
src/
├── components/ui/     # ShadCN UI components
├── lib/              # Utility functions
├── routes/           # TanStack Router pages
├── services/         # MMSP client and auth services
├── stores/           # Zustand state stores
└── types/            # TypeScript type definitions
```

## License

MIT
