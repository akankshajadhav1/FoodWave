# Backend setup

Copy `.env.example` to `.env` and set your local MongoDB URL and JWT secret.
For Razorpay, create **test mode** API keys in its Dashboard and set
`RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`. Set `PAYMENT_LINK_CALLBACK_URL`
to your public HTTPS frontend URL followed by `/orders`.

For Cashfree, create a Cashfree merchant account and copy your **sandbox** API
credentials into `CASHFREE_CLIENT_ID` and `CASHFREE_CLIENT_SECRET`. Set
`CASHFREE_ENV=sandbox` and `CASHFREE_RETURN_URL` to your frontend orders page
with the `{order_id}` placeholder, for example:
`http://localhost:3000/orders?cashfree_order_id={order_id}`. Switch to
`CASHFREE_ENV=production` and use a public HTTPS callback only after Cashfree
approves your live account and whitelists your domain.

Never commit `.env` or expose secret keys in frontend code. Cash on Delivery
continues to work if Razorpay is not configured.

## Account roles

Public sign-up always creates a customer account; any role sent by a client is
ignored. Provision the system administrator separately through a trusted
administrative process rather than public registration.

## Cashfree hosted checkout

Install the backend SDK by running `cd Backend && npm install`.
Checkout calls `POST /api/orders/cashfree`; the server calculates the amount,
creates the Cashfree order, and returns a payment session for Cashfree's hosted
checkout. The frontend opens Cashfree checkout in the same tab. On return, the
backend fetches the order from Cashfree and confirms payment only when its
status and amount match. The webhook provides a second, server-to-server
confirmation path.

In the Cashfree Dashboard's **Developers → Webhooks**, register
`https://<your-public-domain>/api/orders/cashfree/webhook` and enable **Success
Payment** (`PAYMENT_SUCCESS_WEBHOOK`). Use the Payment Gateway API secret key
as the webhook signature secret; configure sandbox and production webhooks for
their respective environments. The route verifies the raw body signature
before updating an order.

Cashfree requires a merchant account and API credentials. The test and live
credentials are separate. To test locally, expose the backend webhook using a
tunnel such as ngrok or cloudflared; use the Cashfree sandbox and the test
payment methods listed in Cashfree's
[sandbox documentation](https://www.cashfree.com/docs/payments/online/resources/sandbox-environment).

## Payment Link API

`POST /api/create-payment-link` requires a logged-in customer and accepts either
the checkout order details (`restaurant`, `items`, `deliveryAddress`) or an
existing `orderId`. The backend calculates the amount from current menu prices,
creates the Razorpay Payment Link, and returns `id`, `short_url`, `status`, and
`orderId`. An optional `expire_by` Unix timestamp must be at least 15 minutes in
the future; links default to 24 hours.

`GET /api/payment-link/:id` checks a link's status for its owner (or an admin).
The order record stores the Payment Link identifiers and webhook event IDs.
The customer order page continues to refresh order status automatically.

Configure a Razorpay webhook in **Dashboard → Settings → Webhooks**:

- URL: `https://<your-public-domain>/api/razorpay-webhook`
- Events: `payment_link.paid`, `payment_link.partially_paid`,
  `payment_link.expired`, and `payment_link.cancelled`
- Secret: set as `RAZORPAY_WEBHOOK_SECRET`

The existing Razorpay Standard Checkout webhook remains at
`/api/orders/razorpay/webhook` and listens for `payment.captured`. If configuring
both webhook URLs, use the same webhook secret for both, matching the value in
`RAZORPAY_WEBHOOK_SECRET`.

For local development, expose the backend with a secure tunnel such as ngrok or
cloudflared and use that public URL in the Razorpay Dashboard webhook settings.
The Payment Link callback returns the customer to the frontend `/orders` page;
payment confirmation and order status are updated by the signed webhook.

Example request (send the customer's bearer token; never send Razorpay secrets):

```sh
curl -X POST http://localhost:5001/api/create-payment-link \
  -H "Authorization: Bearer <customer-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "restaurant": "<restaurant-id>",
    "items": [{ "foodItem": "<food-item-id>", "quantity": 2 }],
    "deliveryAddress": {
      "street": "123 Green Avenue, Flat 4B",
      "city": "Mumbai",
      "state": "Maharashtra",
      "zipCode": "400001",
      "phone": "9876543210"
    }
  }'
```

Expected response:

```json
{
  "id": "plink_example",
  "short_url": "https://rzp.io/i/example",
  "status": "created",
  "orderId": "<internal-order-id>"
}
```

To verify manually, open the returned `short_url`, complete a payment using a
Razorpay test card from
https://razorpay.com/docs/payments/payments/test-card-details/, finish the
displayed test OTP or simulated bank step, then confirm the webhook delivery
and that the order changes to paid. Use an expiry timestamp in the future if
you pass `expire_by`.

The checkout creates orders using current menu prices on the server. Razorpay
orders remain in `Awaiting Payment` until the server verifies the payment
signature and captured payment with Razorpay. For this demo, eligible orders
automatically advance from `Placed` to `Accepted`, `Preparing`,
`Out for Delivery`, and `Delivered`, with three minutes between each status.
Unpaid online orders and cancelled orders do not advance. The backend must be
running for automatic transitions; the customer order page checks for updates
every two seconds.
