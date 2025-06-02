# Real-Time Task Manager (Employee/Owner Dashboard)

This project is a simplified web application designed to demonstrate a basic Real-Time Task Manager. It features two primary dashboards: one for the owner/manager and one for the employees. The application uses React for the frontend, Node.js (Express) for the backend, and Firebase (Authentication & Firestore) as the database.

## Features

- **Owner Login OTP:**
  - Due to limitations with Twilio SMS integration, the One-Time Password (OTP) for owner login is currently logged directly to the **backend console (terminal)** for demonstration and testing purposes, instead of being sent via SMS.
- **Owner Dashboard:**
  - Secure login for owners.
  - View, add, update, and delete employee records.
- **Employee Dashboard:**
  - Secure login for employees.
  - View personal information.
  - Logout functionality.
- **Firebase Integration:**
  - Firebase Authentication for user management (email/password).
  - Firestore for storing employee data and task information.
- **Email Service:**
  - Sends welcome emails to new employees with temporary login credentials and a setup link.

## Project Structure

The project is divided into two main parts: `server` (backend) and `client` (frontend - assuming `src` is your client root).

## Screenshots

### Owner Login Page

![Owner Login](images/owner-login.png)

### Owner Dashboard - Staff Management

![Owner Dashboard Staff](images/owner-dashboard-staff.png)

### Add New Staff Modal

![Add Staff Modal](images/add-staff-modal.png)

### Employee Dashboard

![Employee Dashboard](images/employee-dashboard.png)

### Welcome Email to Employee

![Welcome Email](images/welcome-email.png)

## How to Run the Project

Follow these steps to set up and run the application locally:

### Prerequisites

- Node.js (LTS version recommended)
- npm (Node Package Manager) or Yarn
- A Firebase Project:
  - Enable **Email/Password** authentication in Firebase Authentication.
  - Generate a **Service Account Key** (JSON file) for Firebase Admin SDK and place it in your `server` directory.
  - Create a **Firestore Database** (start in production mode).
  - (Optional but recommended for email sending): Set up an email service like Nodemailer (e.g., using Gmail SMTP or SendGrid credentials).

### Setup Steps

1.  **Clone the repository:**

    ```bash
    git clone <your-github-repo-link>
    cd <your-repo-folder>
    ```

2.  **Backend Setup:**

    - Navigate into the `server` directory:
      ```bash
      cd server
      ```
    - Install backend dependencies:
      ```bash
      npm install
      # or yarn install
      ```
    - Create a `.env` file in the `server` directory and populate it with your Firebase and email service credentials. You can use `.env.example` as a template.

      ```
      # .env (in server folder)
      PORT=5000
      FIREBASE_TYPE=service_account
      FIREBASE_PROJECT_ID=your-project-id
      FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n" # Replace \n with actual newlines if copying directly or ensure quotes
      FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com
      FIREBASE_CLIENT_ID=your-client-id
      FIREBASE_AUTH_URI=[https://accounts.google.com/o/oauth2/auth](https://accounts.google.com/o/oauth2/auth)
      FIREBASE_TOKEN_URI=[https://oauth2.googleapis.com/token](https://oauth2.googleapis.com/token)
      FIREBASE_AUTH_PROVIDER_X509_CERT_URL=[https://www.googleapis.com/oauth2/v1/certs](https://www.googleapis.com/oauth2/v1/certs)
      FIREBASE_CLIENT_X509_CERT_URL=[https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-xxxxx%40your-project-id.iam.gserviceaccount.com](https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-xxxxx%40your-project-id.iam.gserviceaccount.com)

      # Email Service (for sending welcome emails)
      EMAIL_SERVICE_USER=your_email@gmail.com
      EMAIL_SERVICE_PASS=your_email_app_password # Or appropriate password/key for your email service
      ```

    - Start the backend server:
      ```bash
      npm run dev
      # or npm start
      ```
      The backend should run on `http://localhost:5000`. **Crucially, when an owner attempts to log in, the OTP will be displayed in this terminal.**

3.  **Frontend Setup:**
    - Open a new terminal window and navigate into the `client` directory (or `src` if your React app is directly there):
      ```bash
      cd ../client # Adjust path if your React app is not in 'client'
      # or cd ../src
      ```
    - Install frontend dependencies:
      ```bash
      npm install
      # or yarn install
      ```
    - Start the React development server:
      ```bash
      npm start
      ```
      The frontend should open in your browser at `http://localhost:3000`.

### Important Notes

- **Firebase Service Account Key:** Ensure your Firebase service account key JSON file is correctly placed in the `server` directory and its name is specified in `.gitignore` to prevent accidental commits. It's often referenced in `firebase-admin.js`.
- **Firebase Authentication Setup:** Before creating employees, make sure you have enabled "Email/Password" sign-in method in your Firebase project's Authentication settings.
- **Owner Account:** Manually create an initial "owner" account in Firebase Authentication console. After creating, you'll need to set a custom claim `role: 'owner'` for this user using Firebase Admin SDK (can be done via a one-off script or a cloud function).

  - Example using Firebase Admin SDK to set custom claims (run this once from a temporary script in your server):

    ```javascript
    // temp_set_owner_claim.js (in your server folder)
    import admin from "./firebase-admin.js"; // Adjust path
    const auth = admin.auth();

    const ownerUid = "THE_UID_OF_YOUR_OWNER_ACCOUNT"; // Get this UID from Firebase Authentication console
    auth
      .setCustomUserClaims(ownerUid, { role: "owner" })
      .then(() => {
        console.log("Custom owner claim set successfully for UID:", ownerUid);
        process.exit();
      })
      .catch((error) => {
        console.error("Error setting custom claim:", error);
        process.exit(1);
      });
    // Run with: node temp_set_owner_claim.js
    ```

- **Employee Account Creation:** New employee accounts can be created via the Owner Dashboard. An email with temporary password and setup link will be sent.
- **Database Rules:** Ensure your Firestore security rules are configured to allow read/write access necessary for your application, but also securely prevent unauthorized access. (e.g., employees can only read their own data, owner can read/write all employee data).
