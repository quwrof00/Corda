import { getServerSession } from "next-auth/next";
import { getAuthOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import ProfileClient from "./profile-client";
import axios from "axios";

export default async function ProfilePage() {
    const session = await getServerSession(getAuthOptions());

    if (!session) {
        redirect("/login");
    }

    const userId = session.user.id;
    const token = session.accessToken;

    let initialUser = null;

    try {
        const { data } = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000/api"}/users/${userId}`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        initialUser = data;
    } catch (error) {
        console.error("Failed to fetch user data server-side:", error);
    }

    return <ProfileClient initialUser={initialUser} userId={userId} />;
}
