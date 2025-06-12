import React from "react";
import AppGenerator from "@/components/next/ClientAppGenerator";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html>
      <style id="jss-insertion-start"></style><style id="jss-insertion-end"></style>
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

