"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Mic, X, Check, XCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const greetingMessages = [
  "Hey, need help with your finances?",
  "Want to check your balance?",
  "Ready to send some money?",
  "Looking for transaction insights?",
];

export function AIBar() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isGreeting, setIsGreeting] = useState(false);
  const [currentGreeting, setCurrentGreeting] = useState(0);
  const [inputValue, setInputValue] = useState("");
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [aiResponse, setAiResponse] = useState("");

  useEffect(() => {
    if (!isExpanded) {
      const greetingCycle = setInterval(() => {
        setIsGreeting(true);
        setCurrentGreeting((prev) => (prev + 1) % greetingMessages.length);

        // Show greeting for 3 seconds, then fade back to idle
        setTimeout(() => {
          setIsGreeting(false);
        }, 3000);
      }, 11000);

      return () => clearInterval(greetingCycle);
    }
  }, [isExpanded]);

  // Auto-collapse after inactivity
  useEffect(() => {
    if (isExpanded && !inputValue && !showConfirmation) {
      const timeout = setTimeout(() => {
        setIsExpanded(false);
      }, 30000);
      return () => clearTimeout(timeout);
    }
  }, [isExpanded, inputValue, showConfirmation]);

  const handleSubmit = () => {
    if (!inputValue.trim()) return;

    // Mock AI response
    if (
      inputValue.toLowerCase().includes("send") &&
      inputValue.toLowerCase().includes("usdc")
    ) {
      setShowConfirmation(true);
      setAiResponse(
        "I can help you send USDC. Please confirm the details below:"
      );
    } else {
      setAiResponse("I'm processing your request. How else can I help you?");
    }
    setInputValue("");
  };

  return (
    <>
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-md z-40"
            onClick={() => {
              setIsExpanded(false);
              setShowConfirmation(false);
              setAiResponse("");
            }}
          />
        )}
      </AnimatePresence>

      <motion.div
        layout
        className="fixed left-0 right-0 z-50 flex justify-center px-4"
        animate={{
          bottom: isExpanded ? "50%" : "20px",
          y: isExpanded ? "50%" : 0,
        }}
        transition={{
          type: "spring",
          damping: 35,
          stiffness: 300,
          duration: 0.7,
        }}
      >
        <motion.div
          layout
          className="relative w-full"
          animate={{
            maxWidth: isExpanded ? "28rem" : "18rem",
          }}
          transition={{
            type: "spring",
            damping: 35,
            stiffness: 300,
            duration: 0.7,
          }}
        >
          <motion.div
            layout
            className="bg-white/95 backdrop-blur-xl rounded-[2rem] shadow-2xl shadow-indigo-500/20 overflow-hidden"
            animate={{
              height: isExpanded ? "auto" : "56px",
            }}
            transition={{
              type: "spring",
              damping: 35,
              stiffness: 300,
              duration: 0.7,
            }}
          >
            {!isExpanded ? (
              <button
                onClick={() => setIsExpanded(true)}
                className="w-full h-14 px-5 flex items-center justify-center group"
              >
                <AnimatePresence mode="wait">
                  {isGreeting ? (
                    <motion.div
                      key="greeting-state"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.5, ease: "easeInOut" }}
                      className="flex items-center gap-3"
                    >
                      <motion.div className="relative">
                        <motion.div
                          className="h-3 w-3 rounded-full bg-gradient-to-r from-[#3B1EFF] to-[#7B4CFF]"
                          animate={{
                            scale: [1, 1.3, 1],
                            opacity: [0.9, 1, 0.9],
                          }}
                          transition={{
                            duration: 1.5,
                            repeat: Number.POSITIVE_INFINITY,
                            ease: "easeInOut",
                          }}
                        />
                        <motion.div
                          className="absolute inset-0 h-3 w-3 rounded-full bg-gradient-to-r from-[#3B1EFF] to-[#7B4CFF]"
                          animate={{
                            scale: [1, 1.8, 1],
                            opacity: [0.5, 0, 0.5],
                          }}
                          transition={{
                            duration: 1.5,
                            repeat: Number.POSITIVE_INFINITY,
                            ease: "easeInOut",
                          }}
                        />
                      </motion.div>
                      <span className="text-sm font-medium text-gray-700">
                        {greetingMessages[currentGreeting]}
                      </span>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="logo-state"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.5, ease: "easeInOut" }}
                      className="flex items-center justify-center"
                    >
                      <Image
                        src="/banb-logo-black.svg"
                        alt="BANB Logo"
                        width={60}
                        height={60}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.4 }}
                className="p-6 max-h-[60vh] overflow-y-auto"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <Image
                      src="/banb-logo-black.svg"
                      alt="BANB Logo"
                      width={28}
                      height={28}
                    />
                    <h3 className="font-semibold text-gray-900">
                      BANB Assistant
                    </h3>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      setIsExpanded(false);
                      setShowConfirmation(false);
                      setAiResponse("");
                    }}
                    className="h-8 w-8 rounded-full hover:bg-gray-100"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>

                {aiResponse && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4"
                  >
                    <Card className="bg-gray-50 border-0 p-4 rounded-2xl">
                      <p className="text-sm text-gray-700">{aiResponse}</p>
                    </Card>
                  </motion.div>
                )}

                {showConfirmation && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mb-4"
                  >
                    <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200 p-5 rounded-2xl">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Amount</span>
                          <span className="font-semibold text-gray-900">
                            10 USDC
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">To</span>
                          <span className="font-semibold text-gray-900">
                            Anna
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Fee</span>
                          <span className="font-semibold text-gray-900">
                            $0.00
                          </span>
                        </div>
                        <div className="flex gap-2 mt-4">
                          <Button
                            onClick={() => {
                              setShowConfirmation(false);
                              setAiResponse("Transaction sent successfully!");
                            }}
                            className="flex-1 bg-gradient-to-r from-[#3B1EFF] to-[#7B4CFF] hover:opacity-90 rounded-xl"
                          >
                            <Check className="h-4 w-4 mr-2" />
                            Confirm
                          </Button>
                          <Button
                            onClick={() => {
                              setShowConfirmation(false);
                              setAiResponse("");
                            }}
                            variant="outline"
                            className="flex-1 rounded-xl"
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                )}

                <div className="flex gap-2">
                  <Input
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                    placeholder="Type your message..."
                    className="flex-1 rounded-xl border-gray-200 focus:border-indigo-500"
                  />
                  <Button
                    size="icon"
                    onClick={handleSubmit}
                    className="h-10 w-10 rounded-xl bg-gradient-to-r from-[#3B1EFF] to-[#7B4CFF] hover:opacity-90"
                  >
                    <Mic className="h-5 w-5" />
                  </Button>
                </div>
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      </motion.div>
    </>
  );
}
