# Sunday Koura: v1 spec

**Objective**: a web app where a football group of 90+ people signs up to games in one tap, with a player limit, a waiting list and admin control.

## Rules
- Accounts are required. Sign-in is with Google or Facebook only.
- Anyone can view games. Signing in is required to join.
- Only admins create, edit, duplicate (+7 days), lock and cancel games.
- A game has N spots. Confirmed and "à confirmer" players fill them. Later sign-ups join the waiting list, in sign-up order.
- When a spot opens (someone leaves or is removed, or N goes up), the first in line moves into the game as **à confirmer**. They stay there until they or an admin confirm. There's no timeout.
- A player can add up to 2 named guests. Guests take spots and are managed by their inviter or an admin. A guest stays in the game if the inviter leaves.
- Players can leave any time before kickoff. Sign-ups close at kickoff, when a game is locked and when it is cancelled.
- Admins can add any player (normal capacity rules apply), remove anyone, and confirm pending spots.
- Bans are per account. A ban blocks sign-in, ends sessions and frees the player's spots (and their guests') in upcoming games.
- The first admins come from `ADMIN_EMAILS`. After that, admins grant or remove the role in the UI.
- The UI is in French. Times are shown in `APP_TIMEZONE`.

## Data
- `user` (+ `role`, `banned`, `banReason` from the Better Auth admin plugin), `session`, `account`, `verification`
- `game`: title, location, startsAt, maxPlayers, notes, locked, cancelledAt
- `participation`: one row per spot (a player, or a guest with `guestName` + inviter `userId`), status `confirmed | pending_confirmation | waitlisted`. This table is each user's game history, which future stats and MVPs will build on.

## Out of scope (v1)
Stats/MVPs, Messenger bot, notifications, recurring games, payments, team balancing, IP bans, other languages.
