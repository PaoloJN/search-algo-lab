"use client";

import dynamic from "next/dynamic";

const Stage = dynamic(() => import("@/components/pf/Stage").then((m) => m.Stage), {
    ssr: false,
});

export default function Page() {
    return <Stage />;
}
