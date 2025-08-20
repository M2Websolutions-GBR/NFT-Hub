import { Link } from "react-router-dom";

export default function Landing() {
    return (
        <section className="grid gap-10 md:grid-cols-2 items-center">
            <div className="space-y-6">
                <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">NFT Hub</h1>
                <p className="text-gray-600">
                    Erstelle, kaufe und verwalte NFTs. Creator-Abos, Stripe-Käufe, PDF-Zertifikate – zentral in einem Dashboard.
                </p>
                <div className="flex gap-3">
                    <Link
                        to="/register"
                        className="inline-flex items-center rounded-md bg-black text-white px-4 py-2 hover:opacity-90"
                    >
                        Kostenlos starten
                    </Link>

                    <Link
                        to="/register?role=creator"
                        className="inline-flex items-center rounded-md border px-4 py-2 hover:bg-gray-50"
                        title="Direkt als Creator registrieren"
                    >
                        Als Creator registrieren
                    </Link>

                    <Link
                        to="/login"
                        className="inline-flex items-center rounded-md border px-4 py-2 hover:bg-gray-50"
                    >
                        Ich habe schon einen Account
                    </Link>
                </div>
            </div>
            

            <div className="rounded-lg border bg-white/50 p-6">
                <div className="grid gap-3">
                    <div className="h-24 rounded-md bg-gradient-to-r from-gray-100 to-gray-200" />
                    <div className="h-24 rounded-md bg-gradient-to-r from-gray-100 to-gray-200" />
                    <div className="h-24 rounded-md bg-gradient-to-r from-gray-100 to-gray-200" />
                </div>
                <p className="text-xs text-gray-500 mt-3">
                    Platzhalter – später KPIs, Top-NFTs oder eine kleine Vorschau.
                </p>
            </div>
        </section>
    );
}
