import { VerifyEmailForm } from "./VerifyEmailForm";
import { Suspense } from "react";

export default function VerifyEmailPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] px-4 bg-gray-50/50">
      <Suspense fallback={<div>Loading verification flow...</div>}>
        <VerifyEmailForm />
      </Suspense>
    </div>
  );
}
