import { Suspense } from "react";
import ConfirmSignupClient from "./ConfirmSignupClient";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <ConfirmSignupClient />
    </Suspense>
  );
}
