"use client";

import { minikitConfig } from "../../minikit.config";
import styles from "./page.module.css";

export default function Success() {
  const handleShare = async () => {
    // Simple share functionality without OnchainKit
    const text = `Yay! I just joined the waitlist for ${minikitConfig.miniapp.name.toUpperCase()}! `;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Joined ${minikitConfig.miniapp.name} waitlist!`,
          text: text,
          url: process.env.NEXT_PUBLIC_URL || "",
        });
        console.log("Shared successfully");
      } catch (error) {
        console.log("Share cancelled or failed:", error);
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(
          text + (process.env.NEXT_PUBLIC_URL || "")
        );
        alert("Copied to clipboard!");
      } catch (error) {
        console.error("Failed to copy to clipboard:", error);
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
