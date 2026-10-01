# Canteen Flask + SQLite + WhatsApp

A mobile-friendly canteen ordering application converted from the original HTML/JavaScript version into:

- Python Flask backend
- SQLite database
- Bootstrap frontend
- Server-side admin login
- Time-based menu
- Add/Edit/Delete food
- Price, category, icon, start/end time
- Show/Hide food
- WhatsApp ordering to `8589900277`
- Automatic menu refresh every 30 seconds
- Render/GitHub deployment files

## 1. Project structure

```text
canteen-flask-sqlite/
├── app.py
├── requirements.txt
├── render.yaml
├── .python-version
├── .gitignore
├── README.md
├── data/
│   └── .gitkeep
├── templates/
│   ├── index.html
│   ├── admin_login.html
│   └── admin.html
└── static/
    ├── css/
    │   └── style.css
    └── js/
        └── app.js
```

## 2. Run on your computer

Install Python 3.13 if possible.

Windows:
```bash
py -3.13 -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

Mac/Linux:
```bash
python3.13 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python app.py
```

Open:
`http://127.0.0.1:5000`

Admin:
`http://127.0.0.1:5000/admin/login`

Default local credentials:
- Username: `admin`
- Password: `admin123`

For production, DO NOT keep these defaults. Use Render environment variables.

## 3. GitHub

Create a new GitHub repository, for example:
`canteen-flask-sqlite`

Upload the complete project files.

If using Git:
```bash
git init
git add .
git commit -m "Initial Flask canteen app"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/canteen-flask-sqlite.git
git push -u origin main
```

## 4. Render

Create a new Web Service and connect the GitHub repository.

Build Command:
```text
pip install -r requirements.txt
```

Start Command:
```text
gunicorn app:app
```

Environment variables:
```text
PYTHON_VERSION=3.13
ADMIN_USERNAME=your_admin_username
ADMIN_PASSWORD=your_strong_password
SECRET_KEY=<long-random-secret>
DB_PATH=/var/data/canteen.db
```

## 5. IMPORTANT: SQLite persistence on Render

Render's normal filesystem is ephemeral. If you store SQLite in the normal application directory, database changes can be lost after a restart/redeploy.

For this SQLite version, add a Render Persistent Disk:
- Open your Web Service
- Go to Disk
- Add Disk
- Mount Path: `/var/data`
- Choose a suitable size
- Save

The app is already configured with:
`DB_PATH=/var/data/canteen.db`

Without the persistent disk, use this app only for testing/demo purposes.

## 6. Time menu

Breakfast:
05:00–11:00

Lunch:
11:00–15:00

Dinner:
15:00–22:00

Drinks/Snacks:
available all day by default.

The customer browser calls `/api/menu` every 30 seconds, so when the time period changes the visible menu changes without a page refresh.

## 7. Admin

Open:
`/admin/login`

Admin can:
- Add food
- Edit food
- Delete food
- Change price
- Change category
- Set start time
- Set end time
- Show/hide food

Unlike the old version, admin authentication is handled by Flask sessions instead of a username/password stored in frontend JavaScript.

## 8. WhatsApp

The customer order is sent to:
`+91 8589900277`

The WhatsApp message format is:

🍽️ CANTEEN ORDER
━━━━━━━━━━━━━━━━
👤 Name: ...
🪑 Table/Room: ...

Items:
• Tea × 2 = ₹20

💰 TOTAL: ₹20

📝 Note: ...

Thank you.

## 9. Updating the live app

After changing code locally:
```bash
git add .
git commit -m "Update canteen app"
git push
```

If Render is connected to the GitHub branch with auto-deploy enabled, Render will build and deploy the new commit automatically.

## 10. Security

For production:
- Use a strong admin password in Render Environment Variables.
- Use a strong generated SECRET_KEY.
- Do not commit `.env` or database files.
- Keep the repository private if the code should not be public.
- Consider moving to PostgreSQL later if the application grows or needs multiple service instances.

## 11. Health check

The app includes:
`/health`

It returns:
```json
{"status":"ok"}
```


## Inventory, Orders & Sales Reports — New

### Stock / Quantity
Admin can set the stock quantity for every food item.

Example:
- Tea: 100
- Samosa: 50
- Chicken Biriyani: 20

The customer cannot order more than the available stock.

### Order workflow

1. Customer selects food and quantity.
2. Customer sends the order.
3. Flask saves the order in SQLite as `Pending`.
4. WhatsApp opens with the order details and Order #.
5. Admin opens **Orders**.
6. Admin reviews the order.
7. Admin clicks **Confirm & Deduct Stock**.
8. The requested quantity is deducted from the item's stock.
9. The order becomes `Confirmed`.

Stock is NOT deducted merely because the customer created the order.

### Sales report

Admin → **Sales Report**

Select:
- From date
- To date

The report shows:
- Confirmed order count
- Total items sold
- Total sales
- Item-wise quantity sold
- Item-wise sales
- Daily order count
- Daily sales

Only confirmed orders are included in sales totals.

### New database tables

`products`
- food
- price
- stock
- category
- time period
- active status

`orders`
- customer
- table/room
- note
- total
- status
- created date
- confirmed date

`order_items`
- order
- item
- quantity
- price
- amount
