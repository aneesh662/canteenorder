# Canteen Ordering System — Flask + SQLite

A responsive canteen ordering system for mobile, tablet, laptop and desktop.

## Customer flow
1. Open the canteen menu.
2. Choose the quantity directly on each food card using + / -.
3. Tap **Add N to Cart**.
4. The fixed **Selected Items** slider stays available at the bottom.
5. The top 🛒 cart icon also shows the selected quantity.
6. Open the cart and review items.
7. Enter Customer Name, Contact Number, Table/Room and optional Note.
8. Tap **Place Order**.
9. The order is saved directly to SQLite as **Pending**.
10. The customer receives the Order Number.

## Admin flow
- Admin login
- Food & Stock management
- Edit food, price, stock, category, icon and serving time
- Customer Orders
- Customer contact number with click-to-call
- Accept Order & Deduct Stock
- Cancel Pending Order
- Sales Report
- Print / Save PDF
- Send report summary to WhatsApp

## Serving times (India / IST)
- Breakfast: 05:00–11:00
- Lunch: 11:00–15:00
- Dinner: 15:00–22:00
- Drinks and Snacks: 00:00–23:59

The application explicitly uses `Asia/Kolkata` so hosting server timezone does not incorrectly hide Breakfast/Lunch/Dinner.

## Run locally
```bash
py -3.13 -m venv venv
venv\\Scripts\\activate
pip install -r requirements.txt
python app.py
```

Customer: http://127.0.0.1:5000
Admin: http://127.0.0.1:5000/admin/login

Default local admin:
- Username: admin
- Password: admin123

For production, set `ADMIN_USERNAME`, `ADMIN_PASSWORD` or `ADMIN_PASSWORD_HASH`, `SECRET_KEY`, and `DB_PATH` as environment variables.

## Render
Build command:
```text
pip install -r requirements.txt
```
Start command:
```text
gunicorn app:app
```
For persistent SQLite on Render, use a persistent disk and set `DB_PATH=/var/data/canteen.db`.
