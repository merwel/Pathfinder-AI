import { SignUp } from "@clerk/nextjs";
import { TopUtilityBar } from "@/components/shared/TopUtilityBar";

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <TopUtilityBar />
      <div className="flex flex-1 items-center justify-center p-4">
        <SignUp />
      </div>
    </div>
  );
}
