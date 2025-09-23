import type { RouteObject } from "react-router-dom";
import AppShell from "./shell/AppShell";
import Landing from "./pages/Landing";
import Market from "./pages/Market";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard"
import DashboardGate from "./routes/DashboardGate";
import ProtectedRoute from "./routes/ProtectedRoute";
import ProfileEdit from "./pages/ProfilEdit";
import CreatorDashboard from "./pages/CreatrorDashboard";
import NftDetails from "./pages/NftDetails";
import CreatorProfile from "./pages/CreatorProfile";
import AdminDashboard from "./pages/AdminDashboard";
import CheckoutSuccess from "./pages/CheckoutSuccess";
import CheckoutCancel from "./pages/CheckoutCancel";

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
            { path: "creator/:id", element: <CreatorProfile /> },

            {
                path: "dashboard",
                element: (
                    <ProtectedRoute>
                        <DashboardGate />
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
                path: "admin",
                element: (
                    <ProtectedRoute requireRole="admin">
                        <AdminDashboard />
                    </ProtectedRoute>
                )
            },
            {
                path: "buyer",
                element: (
                    <ProtectedRoute requireRole="buyer">
                        <Dashboard />
                    </ProtectedRoute>
                )
            },

            {
                path: "checkout/success",
                element:
                    <ProtectedRoute>
                        <CheckoutSuccess />
                    </ProtectedRoute>
            },
            {
                path: "checkout/cancel",
                element:
                    <ProtectedRoute>
                        <CheckoutCancel />
                    </ProtectedRoute>
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
