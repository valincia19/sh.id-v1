"use client";

import { useEffect } from "react";

export function ConsoleWarning() {
    useEffect(() => {
        if (typeof window !== "undefined") {
            // Prevent running multiple times in development Strict Mode
            if ((window as any)._shWarningShown) return;
            (window as any)._shWarningShown = true;

            const printSequence = async () => {
                const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

                // Initial delay so other console logs from React/Next finish first
                await sleep(500);

                const asciiLogo = `
  ███████╗ ██████╗██████╗ ██╗██████╗ ████████╗██╗  ██╗██╗   ██╗██████╗ 
  ██╔════╝██╔════╝██╔══██╗██║██╔══██╗╚══██╔══╝██║  ██║██║   ██║██╔══██╗
  ███████╗██║     ██████╔╝██║██████╔╝   ██║   ███████║██║   ██║██████╔╝
  ╚════██║██║     ██╔══██╗██║██╔═══╝    ██║   ██╔══██║██║   ██║██╔══██╗
  ███████║╚██████╗██║  ██║██║██║        ██║   ██║  ██║╚██████╔╝██████╔╝
  ╚══════╝ ╚═════╝╚═╝  ╚═╝╚═╝╚═╝        ╚═╝   ╚═╝  ╚═╝ ╚═════╝ ╚═════╝ 
`;

                const asciiArt = `
                     ++++++++++                      
                   +++++++++++++++                   
               ++++++++++++++++++++                  
             +++++++++++++++++++++  ++++++           
         +++++++++++++++     ++++  +++++++++         
      ++++++++++++++++          + ++++  +++++++      
   +++++++++++++++                 +++++++++++++++   
 ++++++++++++++      ++++           ++++++++++++++++ 
++++++++++++       +++++++++             ++++++++++++
+++++++++          ++++++++++++             +++++++++
++++++++            ++++++++++++++            +++++++
++++++++              =++++++++++++++         +++++++
++++++++  ++++++++       +++++++++++++++     ++++++++
+++++++  ++++++++++         +++++++++++++    ++++++++
++++  +++++++*+++++            +++++++++++   ++++++++
+   ++++++++++++++            ++++++++++++   ++++++++
 ++++++++++++++++          ++++++++++++++    ++++++++
++++++++++++            ++++++++++++++++     ++++++++
+++++++++            +++++++++++++++         ++++++++
++++++++           ++++++++++++++            ++++++++
++++++++++         +++++++++++             ++++++++++
+++++++++++++       +++++++             +++++++++++++
 +++++++++++++++                     +++++++++++++++ 
   ++++++++++++++++               ++++++++++++++++   
       +++++++++++++++     ++++++  +++++++++++       
          ++++++++++++++++++++++++  +++++++          
             ++++++++++++++++  ++++ ++++             
                +++++++++++++++++++                  
                   ++++++++++++++                    
                      +++++++++                      
`;

                // Frame 1: ScriptHub Text Logo
                console.log("%c" + asciiLogo, "color: #10b981; font-weight: bold; font-family: monospace;");

                await sleep(400); // 400ms delay

                // Frame 2: Art Logo
                // New logo uses '+', so we can use a more standard font ratio
                console.log(
                    "%c" + asciiArt,
                    "color: #10b981; font-weight: bold; font-family: monospace; font-size: 10px; line-height: 10px;"
                );

                await sleep(400); // 400ms delay

                // Frame 3: Massive 3D STOP sign
                console.log(
                    "%c STOP ",
                    "color: white; background: #ef4444; font-size: 70px; font-weight: 900; font-family: sans-serif; border-radius: 12px; padding: 0 20px; line-height: 1.2; text-shadow: 3px 3px 0px #b91c1c, 6px 6px 0px #7f1d1d;"
                );

                await sleep(400); // 400ms delay

                // Frame 4: Security Alert Badge
                console.log(
                    "%c🛡️ SCRIPTHUB SECURITY ALERT",
                    "color: #10b981; background: #064e3b; font-size: 24px; font-weight: bold; font-family: monospace; padding: 6px 16px; border-radius: 6px; border-left: 8px solid #34d399; letter-spacing: 2px;"
                );

                await sleep(600); // 600ms delay

                // Frame 4: First Warning
                console.log(
                    "%c⚠️ DANGER: This is a developer feature.",
                    "color: #f59e0b; font-size: 18px; font-weight: bold;"
                );

                await sleep(800); // Read time delay

                // Frame 5: Explanation
                console.log(
                    "%cIf someone told you to copy and paste code here to \"hack\" an account or unlock a feature, they are a scammer trying to steal your account.",
                    "color: #f87171; font-size: 16px; line-height: 1.6; font-family: sans-serif;"
                );

                await sleep(800);

                // Frame 6: Consequence box
                console.log(
                    "%cPasting unfamiliar code will give attackers full access to your scripts, license keys, and personal data.",
                    "color: white; font-size: 16px; font-weight: bold; background: #991b1b; padding: 6px 12px; border-radius: 6px; border: 1px solid #ef4444;"
                );

                await sleep(600);

                // Frame 7: Documentation link
                console.log(
                    "%cLearn more: https://en.wikipedia.org/wiki/Self-XSS",
                    "color: #60a5fa; font-size: 14px; text-decoration: underline;"
                );
            };

            printSequence();
        }
    }, []);

    return null;
}
