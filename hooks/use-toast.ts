/**
 * @fileoverview Toast notification system hook.
 * Inspired by react-hot-toast library. Provides a global toast notification system
 * with add, update, dismiss, and remove actions. Uses a reducer pattern for state management.
 */

"use client";

// Inspired by react-hot-toast library
import * as React from "react";

import type { ToastActionElement, ToastProps } from "@/components/ui/toast";

/**
 * Maximum number of toasts to display simultaneously.
 * @constant {number}
 */
const TOAST_LIMIT = 1;

/**
 * Delay in milliseconds before removing a dismissed toast from DOM.
 * @constant {number}
 */
const TOAST_REMOVE_DELAY = 1000000;

/**
 * Extended toast type with additional properties.
 * 
 * @typedef {Object} ToasterToast
 * @extends ToastProps
 * @property {string} id - Unique toast identifier
 * @property {React.ReactNode} [title] - Toast title
 * @property {React.ReactNode} [description] - Toast description/message
 * @property {ToastActionElement} [action] - Optional action button
 */
type ToasterToast = ToastProps & {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: ToastActionElement;
};

/**
 * Available action types for toast state management.
 * @constant
 */
const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
} as const;

/**
 * Counter for generating unique toast IDs.
 * @private
 */
let count = 0;

/**
 * Generates a unique ID for toasts.
 * Uses a counter that wraps at MAX_SAFE_INTEGER.
 * 
 * @private
 * @returns {string} Unique ID string
 */
function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER;
  return count.toString();
}

type ActionType = typeof actionTypes;

/**
 * Union type of all possible toast actions.
 * @typedef {Object} Action
 */
type Action =
  | {
      type: ActionType["ADD_TOAST"];
      toast: ToasterToast;
    }
  | {
      type: ActionType["UPDATE_TOAST"];
      toast: Partial<ToasterToast>;
    }
  | {
      type: ActionType["DISMISS_TOAST"];
      toastId?: ToasterToast["id"];
    }
  | {
      type: ActionType["REMOVE_TOAST"];
      toastId?: ToasterToast["id"];
    };

/**
 * Toast state shape.
 * 
 * @interface State
 * @property {ToasterToast[]} toasts - Array of active toasts
 */
interface State {
  toasts: ToasterToast[];
}

/**
 * Map of toast IDs to their removal timeout handles.
 * @private
 */
const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

/**
 * Adds a toast to the removal queue with a delay.
 * Prevents duplicate timeouts for the same toast.
 * 
 * @private
 * @param {string} toastId - Toast ID to queue for removal
 */
const addToRemoveQueue = (toastId: string) => {
  if (toastTimeouts.has(toastId)) {
    return;
  }

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId);
    dispatch({
      type: "REMOVE_TOAST",
      toastId: toastId,
    });
  }, TOAST_REMOVE_DELAY);

  toastTimeouts.set(toastId, timeout);
};

/**
 * Reducer function for managing toast state.
 * Handles add, update, dismiss, and remove actions.
 * 
 * @param {State} state - Current toast state
 * @param {Action} action - Action to perform
 * @returns {State} New toast state
 */
export const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "ADD_TOAST":
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      };

    case "UPDATE_TOAST":
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      };

    case "DISMISS_TOAST": {
      const { toastId } = action;

      // ! Side effects ! - This could be extracted into a dismissToast() action,
      // but I'll keep it here for simplicity
      if (toastId) {
        addToRemoveQueue(toastId);
      } else {
        state.toasts.forEach((toast) => {
          addToRemoveQueue(toast.id);
        });
      }

      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === toastId || toastId === undefined
            ? {
                ...t,
                open: false,
              }
            : t
        ),
      };
    }
    case "REMOVE_TOAST":
      if (action.toastId === undefined) {
        return {
          ...state,
          toasts: [],
        };
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      };
  }
};

/**
 * Array of listener functions subscribed to state changes.
 * @private
 */
const listeners: Array<(state: State) => void> = [];

/**
 * In-memory state for toasts, shared across all hook instances.
 * @private
 */
let memoryState: State = { toasts: [] };

/**
 * Dispatches an action to update toast state and notify listeners.
 * 
 * @private
 * @param {Action} action - Action to dispatch
 */
function dispatch(action: Action) {
  memoryState = reducer(memoryState, action);
  listeners.forEach((listener) => {
    listener(memoryState);
  });
}

/**
 * Toast creation data without ID (ID is auto-generated).
 * @typedef {Omit<ToasterToast, "id">} Toast
 */
type Toast = Omit<ToasterToast, "id">;

/**
 * Creates and displays a toast notification.
 * Returns an object with methods to update or dismiss the toast.
 * 
 * @param {Toast} props - Toast properties (title, description, variant, etc.)
 * @returns {Object} Toast control object
 * @returns {string} return.id - Generated toast ID
 * @returns {function} return.dismiss - Function to dismiss this toast
 * @returns {function} return.update - Function to update this toast's properties
 * 
 * @example
 * ```typescript
 * // Simple toast
 * toast({ title: "Success", description: "Profile updated" });
 * 
 * // Toast with action
 * const { dismiss } = toast({
 *   title: "Payment sent",
 *   description: "Transaction confirmed",
 *   action: <button onClick={() => console.log("View")}>View</button>
 * });
 * 
 * // Dismiss programmatically
 * setTimeout(() => dismiss(), 3000);
 * ```
 */
function toast({ ...props }: Toast) {
  const id = genId();

  const update = (props: ToasterToast) =>
    dispatch({
      type: "UPDATE_TOAST",
      toast: { ...props, id },
    });
  const dismiss = () => dispatch({ type: "DISMISS_TOAST", toastId: id });

  dispatch({
    type: "ADD_TOAST",
    toast: {
      ...props,
      id,
      open: true,
      onOpenChange: (open: boolean) => {
        if (!open) dismiss();
      },
    },
  });

  return {
    id: id,
    dismiss,
    update,
  };
}

/**
 * React hook for managing toast notifications.
 * Provides access to current toasts and functions to create/dismiss toasts.
 * Automatically subscribes to toast state changes.
 * 
 * @returns {Object} Toast state and control functions
 * @returns {ToasterToast[]} return.toasts - Array of active toasts
 * @returns {function} return.toast - Function to create a new toast
 * @returns {function} return.dismiss - Function to dismiss a toast by ID (or all if no ID)
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { toast, toasts, dismiss } = useToast();
 *   
 *   const showSuccess = () => {
 *     toast({
 *       title: "Success!",
 *       description: "Your changes have been saved.",
 *       variant: "default"
 *     });
 *   };
 *   
 *   const showError = () => {
 *     toast({
 *       title: "Error",
 *       description: "Something went wrong.",
 *       variant: "destructive"
 *     });
 *   };
 *   
 *   return (
 *     <div>
 *       <button onClick={showSuccess}>Show Success</button>
 *       <button onClick={showError}>Show Error</button>
 *       <button onClick={() => dismiss()}>Dismiss All</button>
 *       <p>Active toasts: {toasts.length}</p>
 *     </div>
 *   );
 * }
 * ```
 */
function useToast() {
  const [state, setState] = React.useState<State>(memoryState);

  React.useEffect(() => {
    listeners.push(setState);
    return () => {
      const index = listeners.indexOf(setState);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }, [state]);

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) => dispatch({ type: "DISMISS_TOAST", toastId }),
  };
}

export { useToast, toast };
