"use client";

// Inspired by react-hot-toast library
import * as React from "react";

import type { ToastActionElement, ToastProps } from "@/components/ui/toast";

/**
 * Maximum number of toasts that can be displayed simultaneously.
 * @constant {number}
 */
const TOAST_LIMIT = 1;

/**
 * Delay in milliseconds before a dismissed toast is removed from the DOM.
 * @constant {number}
 */
const TOAST_REMOVE_DELAY = 1000000;

/**
 * Extended toast type with additional properties for internal state management.
 *
 * @typedef {Object} ToasterToast
 * @extends {ToastProps}
 * @property {string} id - Unique identifier for the toast
 * @property {React.ReactNode} [title] - Optional toast title
 * @property {React.ReactNode} [description] - Optional toast description
 * @property {ToastActionElement} [action] - Optional action button element
 */
type ToasterToast = ToastProps & {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: ToastActionElement;
};

/**
 * Action types for toast state management.
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
 * Generates a unique ID for each toast.
 * Uses a counter that wraps around at MAX_SAFE_INTEGER.
 *
 * @private
 * @function genId
 * @returns {string} Unique toast ID
 */
function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER;
  return count.toString();
}

/**
 * Type alias for action types object.
 * @typedef {typeof actionTypes} ActionType
 */
type ActionType = typeof actionTypes;

/**
 * Union type for all possible toast actions.
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
 * Toast state interface.
 * @interface State
 * @property {ToasterToast[]} toasts - Array of active toasts
 */
interface State {
  toasts: ToasterToast[];
}

/**
 * Map storing timeout IDs for toast removal.
 * @private
 * @constant
 */
const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

/**
 * Adds a toast to the removal queue with a delay.
 * Prevents duplicate timeouts for the same toast.
 *
 * @private
 * @function addToRemoveQueue
 * @param {string} toastId - ID of the toast to remove
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
 * Handles adding, updating, dismissing, and removing toasts.
 *
 * @function reducer
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
 * Dispatches an action to update toast state and notifies all listeners.
 *
 * @private
 * @function dispatch
 * @param {Action} action - Action to dispatch
 */
function dispatch(action: Action) {
  memoryState = reducer(memoryState, action);
  listeners.forEach((listener) => {
    listener(memoryState);
  });
}

/**
 * Toast configuration type without the ID (generated internally).
 * @typedef {Omit<ToasterToast, "id">} Toast
 */
type Toast = Omit<ToasterToast, "id">;

/**
 * Creates and displays a new toast notification.
 *
 * @function toast
 * @param {Toast} props - Toast configuration properties
 * @returns {Object} Object with toast control methods
 * @returns {string} returns.id - Unique toast ID
 * @returns {Function} returns.dismiss - Function to dismiss the toast
 * @returns {Function} returns.update - Function to update toast properties
 *
 * @example
 * const { id, dismiss, update } = toast({
 *   title: "Success",
 *   description: "Operation completed successfully"
 * });
 *
 * // Update the toast
 * update({ description: "Updated message" });
 *
 * // Dismiss the toast
 * dismiss();
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
      onOpenChange: (open: any) => {
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
 * Custom hook for managing toast notifications.
 * Provides access to toast state and control functions.
 *
 * @hook
 * @function useToast
 * @returns {Object} Toast state and control functions
 * @returns {ToasterToast[]} returns.toasts - Array of active toasts
 * @returns {Function} returns.toast - Function to create a new toast
 * @returns {Function} returns.dismiss - Function to dismiss a toast by ID
 *
 * @example
 * function MyComponent() {
 *   const { toast, dismiss } = useToast();
 *
 *   const showSuccess = () => {
 *     toast({
 *       title: "Success!",
 *       description: "Your changes have been saved.",
 *       variant: "default"
 *     });
 *   };
 *
 *   return <button onClick={showSuccess}>Save</button>;
 * }
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
