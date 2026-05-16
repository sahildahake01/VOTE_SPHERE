# Voting Platform – Complete User Guide

This is a full-stack online voting system where administrators can manage elections, voters can cast their votes, and candidates can see their results. The project is built with Node.js, Express, MySQL, and plain HTML/CSS/JavaScript. It is ready to run on your local machine.

## What this project includes

- Three user roles: Admin, Voter, Candidate
- Secure login with JWT tokens
- Admin can approve or reject new users
- Admin can start and stop the election
- Each voter can vote only once
- Candidates can update their profile and see real-time rankings
- Email notifications are supported if you configure your SMTP settings

## What you need before starting

- Node.js (version 18 or higher)
- MySQL server (local or remote)
- A web browser
- Basic knowledge of running commands in a terminal

## How to set up the project

Follow these steps carefully.

### 1. Get the code

Place the project folder on your computer. Open a terminal inside the main project folder (the one that contains the `backend`, `frontend`, and `database` folders).

### 2. Install dependencies

Run this command to install everything needed for the backend and the main tools:

`npm run install:all`

This will install dependencies in the main folder and also inside the backend folder.

### 3. Set up the database

Make sure your MySQL server is running. Then run the following command to create the database and all required tables:

`npm run db:setup`

You will be asked for your MySQL root password. Enter it and the script will create a database named `voting_platform` and add the necessary tables.

### 4. Configure environment variables

Go to the `backend` folder and copy the example environment file:

`cd backend`  
`cp .env.example .env`

Now open the `.env` file in a text editor. Set the following values according to your system:

- `DB_PASSWORD` – your MySQL root password
- `JWT_SECRET` – change this to a long random string
- `PORT` – leave as 5000 unless that port is busy
- `ADMIN_EMAIL` – you can keep `admin@voting.com`
- `ADMIN_PASSWORD` – you can keep `Admin@123`

If you want email notifications to work, also fill in `EMAIL_USER` and `EMAIL_PASS` with your Gmail address and an app-specific password. Otherwise leave them empty and email features will be disabled.

### 5. Start the application

Go back to the main project folder and run:

`npm run dev`

This starts two things at the same time:
- The backend API on `http://localhost:5000`
- The frontend static server on `http://localhost:3000`

You will see messages confirming that the database is connected and the admin user exists.

## How to log in for the first time

Open your browser and go to `http://localhost:3000`.

Use these default admin credentials:
- Email: `admin@voting.com`
- Password: `Admin@123`

After logging in, you will see the Admin Dashboard.

## How to use the platform

### For the administrator

- From the dashboard you can see how many voters, candidates, and votes have been recorded.
- Click on the Users button to see all registered voters and candidates.
- Approve or reject pending users. Without approval, no one can log in except the admin.
- Use the Start Election button when you are ready. After that, voters can cast their votes.
- Use the End Election button to stop voting. Results become visible only after the election ends.
- Click on View Results to see the final tally.
- You can also send the results by email to all verified candidates if email settings are configured.

### For a voter

- Register by clicking the Register link on the login page. Choose the Voter role.
- Wait for the admin to approve your account.
- Once approved, log in and go to the Vote page.
- You will see a list of verified candidates. Choose one and click Vote.
- A confirmation message will appear, and you cannot vote again.
- After the election ends, you can view the final results.

### For a candidate

- Register by selecting the Candidate role. You will be asked for your full name, the position you are running for, and an optional bio.
- Wait for the admin to approve your account.
- After approval, log in and you will see your own dashboard showing how many votes you have received so far.
- You can edit your profile (name, position, bio, photo URL) from the Profile section.
- The Rankings page shows how all candidates are doing compared to each other.
- After the election ends, you can see the final results.

## How to test the system without many users

You can create multiple voter and candidate accounts using different email addresses. Each account must be approved by the admin before it can log in. For testing, you can approve your own test accounts from the admin panel.

## Common issues and how to solve them

**Port 5000 already in use**

If you see an error that port 5000 is busy, open a new terminal and find the process using that port:

On Windows:  
`netstat -ano | findstr :5000`  
Then kill the process using its PID:  
`taskkill /PID <PID> /F`

On Mac or Linux:  
`lsof -i :5000`  
`kill -9 <PID>`

Alternatively, change the `PORT` value in the `backend/.env` file to something else like 5001, and also update the `API_BASE` in `frontend/js/app.js` to match the new port.

**Database connection fails**

Make sure your MySQL server is running. Check that the database name `voting_platform` exists. If not, run `npm run db:setup` again.

**Login always says Invalid credentials**

This usually means the admin user was not created correctly. Run the fix script from the backend folder:

`node reset-admin.js`

This will delete the old admin and create a fresh one with the default password.

**Candidate registration option does not appear in the form**

If you are using the main `index.html` interface, the registration form already has a role selector. Choose Candidate from the dropdown and the extra fields for name and position will appear. If they do not appear, open the browser console to see any JavaScript errors. As a workaround, you can use the separate registration page described in the next section.

**How to register a candidate using a direct form**

If the main interface is not showing the candidate fields, create a file named `register-candidate.html` inside the `frontend` folder with the following content:

```
<!DOCTYPE html>
<html>
<head>
    <title>Candidate Register</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
</head>
<body>
<div class="container mt-5">
    <div class="card mx-auto" style="max-width: 500px;">
        <div class="card-header bg-success text-white">Candidate Registration</div>
        <div class="card-body">
            <form id="candForm">
                <input type="email" id="email" class="form-control mb-2" placeholder="Email" required>
                <input type="text" id="name" class="form-control mb-2" placeholder="Full Name" required>
                <input type="text" id="position" class="form-control mb-2" placeholder="Position" required>
                <textarea id="bio" class="form-control mb-2" placeholder="Bio (optional)"></textarea>
                <input type="password" id="password" class="form-control mb-2" placeholder="Password" required>
                <button type="submit" class="btn btn-success w-100">Register as Candidate</button>
            </form>
        </div>
    </div>
</div>
<script>
    const API = 'http://localhost:5000/api';
    document.getElementById('candForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const payload = {
            email: document.getElementById('email').value,
            password: document.getElementById('password').value,
            role: 'candidate',
            name: document.getElementById('name').value,
            position: document.getElementById('position').value,
            bio: document.getElementById('bio').value
        };
        const res = await fetch(API + '/auth/register', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload) });
        const data = await res.json();
        alert(res.ok ? 'Candidate registered. Awaiting admin approval.' : 'Error: '+data.message);
        if(res.ok) window.location.href = 'login.html';
    });
</script>
</body>
</html>
```

Then open `http://localhost:3000/register-candidate.html` to register as a candidate directly.

## Project structure explained

- `backend/` – contains the Node.js API, routes, controllers, database connection, and models.
- `frontend/` – contains all HTML pages, CSS files, and JavaScript for the user interface.
- `database/` – contains the SQL schema file used to create tables.
- `package.json` in the root – helps run both frontend and backend together.

## Technical details

- The backend uses Express, MySQL2, JSON Web Tokens, bcrypt for password hashing, and Nodemailer for emails.
- Security features include rate limiting, Helmet for HTTP headers, and input validation.
- The frontend is simple HTML, CSS (Bootstrap or Tailwind), and vanilla JavaScript. No framework is required.
- The database uses a unique constraint to ensure one vote per voter.
- Elections have a start and end timestamp, and results are calculated from the votes table.

## Deploying to a live server

If you want to put this project online, you will need to:

- Set `NODE_ENV=production` in your `.env` file.
- Use a process manager like PM2 to keep the backend running.
- Set up a reverse proxy with Nginx or Apache.
- Obtain an SSL certificate for HTTPS.
- Use a production MySQL database (not the local one).

The frontend files are static, so you can serve them through Nginx or any static hosting service.

## Final notes

This project was built as a complete voting platform suitable for small to medium-sized elections. All core features work without needing any paid services. Email notifications are optional. The admin has full control over the election timeline and user verification.

If you run into any problem that is not covered here, check the terminal output for error messages and look at the browser console (press F12) for any JavaScript errors. Most issues come from database connection or port conflicts.

Enjoy using the voting platform.