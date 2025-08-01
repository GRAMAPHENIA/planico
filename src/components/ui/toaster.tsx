import { Toast, ToastProps } from "./toast"

interface ToasterProps {
  toasts: ToastProps[]
}

export function Toaster({ toasts }: ToasterProps) {
  return (
    <div className="fixed bottom-0 right-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]">
      {toasts.map((toast) => (
        <div key={toast.id} className="mb-4 last:mb-0">
          <Toast {...toast} />
        </div>
      ))}
    </div>
  )
}