# Booking Notifications & Shopify Reverse Sync

The goal of this phase is to ensure that when a customer books an appointment through our custom React widget, two things happen automatically:
1. **Customer SMS:** The customer receives a text message confirming their appointment.
2. **Shopify Sync:** The booking is sent *back* into Shopify as an Order or Draft Order, so your staff receives the standard Shopify notification bell.

> [!IMPORTANT]
> ## User Feedback Requested
> **1. Resend (Email) vs Make.com (SMS)** 
> You mentioned **Resend**. Resend is absolutely fantastic and offers 3,000 free **Emails** per month, but it does NOT send SMS (Text messages to phone numbers). 
> * If you are okay with **Email Confirmations**, we can easily use Resend for free!
> * If you *must* have **SMS Text Confirmations**, we will use Make.com. Make.com is **100% Free** for your first 1,000 bookings per month. (After that, it is only $9/month for 10,000 bookings). The cool thing about Make.com is that you can connect it to your Android phone, and it will send the SMS texts from your own local phone number for free!
> 
> *Which do you prefer? Resend (Email) or Make.com (SMS)?*
> 
> **2. Shopify Admin Access:**
> Excellent! Since you have Admin access, I will write the code to automatically push the Booking into Shopify as a Draft Order. Once I write the code, I will tell you exactly where to paste the Shopify "Admin API Access Token" securely on your server.

## Proposed Changes

### Backend Logic Update
#### [MODIFY] [appointments.py](file:///Users/biw/Documents/BIW main /backend/app/api/v1/appointments.py)
- After the appointment is successfully saved to the Supabase database:
  - **Step 1:** The server will make an HTTP POST request to the Shopify Admin API (`/admin/api/2024-01/draft_orders.json`) to create a Draft Order containing the Service Name, Price, and Customer details.
  - **Step 2:** The server will make an HTTP POST request to either the Resend API (for Email) OR your Make.com Webhook URL (for SMS) containing the Customer's details and Booking Time.

## Verification Plan
1. We will simulate a booking on the local development server.
2. We will check your Shopify Admin panel to verify the Draft Order appears instantly.
3. We will check Make.com/Your Phone to ensure the SMS payload was successfully dispatched.
