"use client";

import { minikitConfig } from "../../minikit.config";
import styles from "./page.module.css";
import { useEffect } from "react";
import { sdk } from "@farcaster/miniapp-sdk";

export default function Success() {
  useEffect(() => {
    // Call sdk.actions.ready() to hide the splash screen
    const initializeSDK = async () => {
      try {
        await sdk.actions.ready();
        console.log("Farcaster SDK ready - splash screen hidden");
      } catch (error) {
        console.error("Failed to initialize Farcaster SDK:", error);
      }
    };

    initializeSDK();
  }, []);

  const handleShare = async () => {
    try {
      const text = `Yay! I just joined the waitlist for ${minikitConfig.miniapp.name.toUpperCase()}! `;

      // Use Farcaster SDK to compose a cast
      const result = await sdk.actions.composeCast({
        text: text,
        embeds: [process.env.NEXT_PUBLIC_URL || ""],
      });

      // result.cast can be null if user cancels
      if (result?.cast) {
        console.log("Cast created successfully:", result.cast.hash);
      } else {
        console.log("User cancelled the cast");
      }
    } catch (error) {
      console.error("Error sharing cast:", error);

      // Fallback to native sharing if Farcaster SDK fails
      if (navigator.share) {
        try {
          await navigator.share({
            title: `Joined ${minikitConfig.miniapp.name} waitlist!`,
            text: `Yay! I just joined the waitlist for ${minikitConfig.miniapp.name.toUpperCase()}! `,
            url: process.env.NEXT_PUBLIC_URL || "",
          });
          console.log("Shared successfully via native sharing");
        } catch (fallbackError) {
          console.log("Native sharing also failed:", fallbackError);
        }
      }
    }
  };

  return (
    <div className={styles.container}>
      <button className={styles.closeButton} type="button">
        ✕
      </button>

      <div className={styles.content}>
        <div className={styles.successMessage}>
          <div className={styles.checkmark}>
            <div className={styles.checkmarkCircle}>
              <div className={styles.checkmarkStem}></div>
              <div className={styles.checkmarkKick}></div>
            </div>
          </div>

          <h1 className={styles.title}>
            Welcome to the {minikitConfig.miniapp.name.toUpperCase()}!
          </h1>

          <p className={styles.subtitle}>
            You&apos;re in! We&apos;ll notify you as soon as we launch.
            <br />
            Get ready to experience the future of onchain marketing.
          </p>

          <button onClick={handleShare} className={styles.shareButton}>
            SHARE
          </button>
        </div>
      </div>
    </div>
  );
}
