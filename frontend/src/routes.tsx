import type { RouteObject } from "react-router-dom";
import AppShell from "./shell/AppShell";
import Landing from "./pages/Landing";
import Market from "./pages/Market";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import ProtectedRoute from "./routes/ProtectedRoute";
import ProfileEdit from "./pages/ProfilEdit";
import CreatorDashboard from "./pages/CreatrorDashboard";
import NftDetails from "./pages/NftDetails";

export const routes: RouteObject[] = [
    {
        path: "/",
        element: <AppShell />,
        children: [
            { index: true, element: <Landing /> },
            { path: "market", element: <Market /> },
            { path: "login", element: <Login /> },
            { path: "register", element: <Register /> },
            { path: "details", element: <NftDetails /> },
            
            {
                path: "dashboard",
                element: (
                    <ProtectedRoute>
                        <Dashboard />
                    </ProtectedRoute>
                ),
            },
            
            {
                path: "creator",
                element: (
                    <ProtectedRoute requireRole="creator">
                        <CreatorDashboard />
                    </ProtectedRoute>
                ),
            },

            {
                path: "profile",
                element: (
                    <ProtectedRoute>
                        <ProfileEdit />
                    </ProtectedRoute>
                ),
            },
        ],
    },
];
