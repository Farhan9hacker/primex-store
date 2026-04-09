PRIMEX ANARCHY
MINECRAFT STORE + WALLET + ADMIN PANEL SYSTEM
FULL TXT BLUEPRINT (WITH PRODUCT MANAGEMENT)

---

SERVER NAME
Primex Anarchy

Official Store: Primex Anarchy Store
Purpose: Support server stability, development, and community initiatives

---

SYSTEM OVERVIEW

Primex Anarchy Store is a secure Minecraft server store system with:

* Internal wallet system
* Semi-automatic payment verification
* Powerful admin panel
* Discord integration
* In-game rank and item delivery
* Full product management (admin-controlled)

Designed for Indian payment methods with strong fraud prevention.

---

USER SIDE FEATURES (PRIMEX ANARCHY STORE)

1. User Account

* Login / Register
* Minecraft IGN linking (Primex Anarchy)
* Discord ID linking
* Wallet balance always visible

2. Wallet System

* Add funds to Primex Anarchy Wallet
* Wallet balance used for all purchases
* No direct payment per product (security-focused)

Wallet states:

* Pending
* Approved
* Rejected
* Used
* Refunded (admin only)

3. Store Page
   Categories:

* Ranks (VIP, Legend, Mythic, etc.)
* Crates
* Keys
* Special PvP Items
* Limited-Time Offers

Each product displays:

* Product name
* Price (₹)
* Description
* Server mode (Anarchy / CPvP / Lifesteal SMP / Lobby)
* Permanent or temporary

4. Checkout Flow

* Select product
* Wallet balance verification
* Confirm purchase
* Order created
* Delivery queued to Primex Anarchy server

---

PAYMENT SYSTEM (SEMI-AUTOMATIC – INDIA SAFE)

Supported:

* UPI
* Bank Transfer
* QR Code

Add Funds Flow:

1. User selects amount
2. Shows official Primex Anarchy UPI ID + QR
3. User pays exact amount
4. User submits:

   * UTR number
   * Optional screenshot
5. Payment status set to Pending

Verification:

* Admin reviews payment
* System checks:

  * Valid UTR format
  * Duplicate UTR detection
  * Amount mismatch
* On approval:

  * Wallet credited
  * Discord + email notification sent

---

ADMIN PANEL (PRIMEX ANARCHY STAFF)

Admin Login:

* Role-based access (Owner / Admin / Moderator)
* Two-factor authentication
* IP and device logging

---

ADMIN DASHBOARD

Displays:

* Total Primex Anarchy revenue
* Today’s revenue
* Pending payment count
* Failed payment attempts
* Recent purchases
* Wallet activity logs

---

PRODUCT MANAGEMENT (ADMIN ONLY)

Admin can ADD / EDIT / DELETE Primex Anarchy products.

Add New Product:

* Product name
* Product type:

  * Rank
  * Item
  * Command
  * Bundle
* Category
* Price
* Description
* Delivery command
  Example:
  lp user {player} parent add legend
* Target server:

  * Anarchy
  * CPvP
  * Lifesteal SMP
  * Lobby
* Permanent or temporary
* Stock limit (optional)
* Enable / Disable toggle
* Featured product toggle

Edit Product:

* Update price
* Update delivery command
* Enable / disable product
* Update description
* Change category

Delete Product:

* Soft delete only
* Full admin log with timestamp

---

ORDER MANAGEMENT

Orders list shows:

* Order ID
* Player name
* Product name
* Amount
* Order status
* Delivery status
* Server mode

Order statuses:

* Pending
* Paid
* Delivered
* Failed
* Refunded

Admin actions:

* Resend delivery
* Mark delivered
* Refund to wallet
* Cancel order

---

WALLET MANAGEMENT (ADMIN)

Admin capabilities:

* Manually add balance
* Deduct balance
* Freeze wallet for abuse
* View full wallet history

Wallet logs include:

* Action reason
* Admin name
* Date & time
* IP hash

---

PAYMENT APPROVAL PANEL

Each payment entry shows:

* User
* Amount
* UTR
* Screenshot
* Submission time
* Risk level (low / medium / high)

Actions:

* Approve
* Reject
* Mark suspicious

Approval results:

* Wallet credited
* Discord alert sent
* Permanent admin log created

---

DISCORD INTEGRATION (PRIMEX ANARCHY)

Discord Bot Features:

* New payment pending alert
* Payment approved notification
* Purchase completion message
* High-value payment warning

Delivery Actions:

* Assign Discord role
* Send DM receipt
* Notify user on delivery failure

Logs Channel:

* Payment approvals
* Refund actions
* Manual wallet edits
* Product changes

---

MINECRAFT SERVER INTEGRATION

Delivery System:

* RCON or plugin-based command execution
* Delivery queue system
* Auto retry if server offline

Offline Player Handling:

* Delivery stored
* Executes when player joins Primex Anarchy

Failsafe:

* Manual resend from admin panel

---

SECURITY FEATURES

* One-time UTR usage
* Duplicate payment blocking
* Rate limiting
* CSRF protection
* Password hashing
* Admin activity logging
* No false claims of automatic bank verification

---

DATABASE ENTITIES

Users
Wallets
Wallet_Transactions
Products
Orders
Payments
Admin_Logs
Delivery_Queue
Discord_Links

---

TRUST MESSAGE (STORE FOOTER)

Primex Anarchy uses manual payment verification to ensure player safety and prevent fraud.
All purchases help maintain server performance and support community initiatives.
