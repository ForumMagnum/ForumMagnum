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
        <span id="jss-insertion-start"></span>
        <span id="jss-insertion-end"></span>
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

