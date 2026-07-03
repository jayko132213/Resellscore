import { Suspense } from "react";
import { AuthFinish } from "@/components/auth-finish";

export default function AuthFinishPage() {
  return (
    <Suspense fallback={null}>
      <AuthFinish />
    </Suspense>
  );
}
