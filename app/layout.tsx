import React from "react";
import AppGenerator from "@/components/next/ClientAppGenerator";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html>
      <body>
        <AppGenerator
          abTestGroupsUsed={{}}
          themeOptions={{ name: "auto" }}
        >
          {children}
        </AppGenerator>
      </body>
    </html>
  );
}

