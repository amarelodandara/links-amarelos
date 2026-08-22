"use client";

import { Toast } from "@base-ui/react/toast";

// The viewport is a landmark region of its own: F6 jumps into it, and each
// toast is focusable and dismissible from the keyboard. Base UI owns the live
// region, so nothing here needs a hand-written aria-live.
export default function Toaster() {
  const { toasts } = Toast.useToastManager();

  return (
    <Toast.Portal>
      <Toast.Viewport className="fixed bottom-4 right-4 z-100 flex w-[min(20rem,calc(100vw-2rem))] flex-col gap-2 [padding-right:max(0px,env(safe-area-inset-right))] [padding-bottom:max(0px,env(safe-area-inset-bottom))]">
        {toasts.map((toast) => (
          <Toast.Root
            key={toast.id}
            toast={toast}
            className="flex items-start gap-3 rounded-sm border border-sun-light bg-white px-3 py-2 shadow-sm transition-all data-[ending-style]:opacity-0 data-[starting-style]:opacity-0 data-[ending-style]:translate-y-1 data-[starting-style]:translate-y-1 data-[type=error]:border-red-300"
          >
            <Toast.Content className="min-w-0 flex-1">
              <Toast.Title className="font-manrope text-sm font-semibold lowercase text-stone-900" />
              <Toast.Description className="font-space-mono text-xs lowercase text-stone-600" />
            </Toast.Content>
            <Toast.Close
              aria-label="Fechar aviso"
              className="shrink-0 rounded-sm px-1 font-space-mono text-xs text-stone-500 transition-colors hover:text-stone-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sun-dark focus-visible:ring-offset-1"
            >
              ✕
            </Toast.Close>
          </Toast.Root>
        ))}
      </Toast.Viewport>
    </Toast.Portal>
  );
}
