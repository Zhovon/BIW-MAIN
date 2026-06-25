# Tomorrow's Implementation Plan
**Focus:** External Integrations & Automation 

Now that the core React dashboards, real-time analytics, and mobile responsiveness are 100% complete and deployed, tomorrow's session will focus purely on hooking up the external platforms.

## 1. Shopify Booking Widget Integration
* **Task:** Replace the old BookX plugin with our custom `shopify-booking-snippet.html`.
* **Execution Steps:**
  1. Go into the Shopify Admin Dashboard -> Online Store -> Themes.
  2. Click "Edit Code" on the live theme.
  3. Paste the contents of `shopify-booking-snippet.html` into a new Custom Liquid block or directly into `theme.liquid` right above the closing `</body>` tag.
  4. Test that the floating booking widget appears on mobile and desktop and successfully opens the `book` page iframe.

## 2. Make.com Marketing Automation
* **Task:** Sync daily ad spend from Meta Ads and Google Ads into the BIW Supabase database so the Native Marketing Engine updates automatically.
* **Execution Steps:**
  1. Create a new Make.com scenario running daily at 11:59 PM.
  2. **Meta Module:** Connect the Facebook Ads module to fetch "Spend" for the current day.
  3. **Google Module:** Connect the Google Ads module to fetch "Spend" for the current day.
  4. **Math Module:** Add Meta Spend + Google Spend to get `total_daily_spend`.
  5. **Supabase Module:** Connect to the `daily_ad_spend` table via API (or direct PostgreSQL connection). Insert a row with `date = today` and `amount_spent = total_daily_spend`.

## 3. ManyChat Bot & Bulk Messaging Setup
* **Task:** Build a chatbot to automate the massive volume of incoming messages, answer FAQs, and legally send bulk promotional broadcasts.
* **Execution Steps:**
  1. Create a free ManyChat account and link the BIW Facebook Page and Instagram Account.
  2. Build a "Welcome Flow" that triggers when a user DMs the page. It will offer three buttons: "Book an Appointment", "Prices & Services", "Location".
  3. Connect the "Book an Appointment" button directly to the new Next.js booking URL.
  4. Set up a flow to capture Phone Numbers and Emails so that BIW can send bulk SMS broadcasts without violating Meta's 24-hour messaging restriction.
  5. Provide a training overview on how the manager can use the "Live Chat" tab in ManyChat or Meta Business Suite to manually take over the conversation when needed.
