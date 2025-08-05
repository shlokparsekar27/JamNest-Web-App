# JamNest 🎵

A modern web application designed to connect musicians, dancers, artists, and creators from around the world. JamNest provides a platform for artists to showcase their work, build a community, and connect with like-minded individuals.

![JamNest Screenshot](https://i.imgur.com/7c88e701-aba8-4218-b154-53e87a6d0510.jpg) 
<!-- You can replace this with a newer screenshot of your app! -->

---

## Features

JamNest is a feature-rich Single-Page Application (SPA) with a secure and scalable backend.

* **User Authentication:** Secure sign-up and login functionality. New users are guided through a profile setup process.
* **Customizable Profiles:** Users can set their username, primary skill (e.g., Guitarist, Dancer), and upload a profile avatar.
* **Post System:** Users can create posts by uploading photos and videos with captions to showcase their art.
* **Profile Viewing:** View your own profile or the public profiles of other artists, complete with their posts, follower/following counts, and avatar.
* **Follow System:** Users can follow and unfollow other artists to build their network.
* **Real-Time Chat:** A private, real-time chat feature allows users to connect and communicate directly with each other.
* **Content Management:** Users have full control to delete their own posts and chat messages.
* **Dark Mode:** A beautiful, persistent light/dark mode theme for a comfortable user experience.
* **Responsive Design:** A clean and modern UI that works on both desktop and mobile devices.

---

## Tech Stack

This project is built with a modern, powerful, and scalable tech stack.

* **Frontend:**
    * [**React**](https://reactjs.org/) (with TypeScript)
    * [**Vite**](https://vitejs.dev/) for a fast development experience
    * [**Tailwind CSS**](https://tailwindcss.com/) for professional and responsive styling
    * [**React Router**](https://reactrouter.com/) for client-side routing
* **Backend (BaaS):**
    * [**Supabase**](https://supabase.io/) for the database, authentication, storage, and real-time features.
        * **Database:** PostgreSQL
        * **Authentication:** Supabase Auth with Row Level Security (RLS)
        * **Storage:** Supabase Storage for avatars and post media
        * **Realtime:** Supabase Realtime for the live chat feature

---

## Getting Started

To get a local copy of this project up and running on your machine, follow these simple steps.

### Prerequisites

* You will need [Node.js](https://nodejs.org/) installed on your machine.
* You will need a free [Supabase](https://supabase.io/) account.

### Installation (from a Mac perspective)

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/shlokparsekar27/JamNest-Web-App.git](https://github.com/shlokparsekar27/JamNest-Web-App.git)
    ```

2.  **Navigate to the project directory:**
    ```bash
    cd JamNest-Web-App/frontend
    ```

3.  **Install NPM packages:**
    ```bash
    npm install
    ```

4.  **Set up your environment variables:**
    * Create a new file in the `frontend` directory named `.env.local`.
    * Go to your Supabase project dashboard, navigate to **Project Settings > API**, and find your **Project URL** and `anon` **public key**.
    * Add them to your `.env.local` file like this:
        ```
        VITE_SUPABASE_URL="YOUR_SUPABASE_PROJECT_URL"
        VITE_SUPABASE_ANON_KEY="YOUR_SUPABASE_ANON_KEY"
        ```

5.  **Run the development server:**
    ```bash
    npm run dev
    ```

The application should now be running on `http://localhost:5173/`.

---

## Supabase Project Setup

This project requires a Supabase backend to be set up with the correct tables and security policies. The key components are:

* **Tables:** `profiles`, `posts`, `connections`, `messages`
* **Storage Buckets:** `avatars` (public), `posts` (public)
* **Database Functions & Triggers:** A trigger on the `auth.users` table to automatically create a new user profile upon sign-up.

All necessary SQL scripts for setting up the tables, policies, and functions are included throughout the development history of this project.

---

## Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

If you have a suggestion that would make this better, please fork the repo and create a pull request. You can also simply open an issue with the tag "enhancement".

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

---

## License

Distributed under the MIT License. See `LICENSE` for more information.

