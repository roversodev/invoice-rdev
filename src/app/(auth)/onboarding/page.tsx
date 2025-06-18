import { OnboardingForm } from "@/components/onboarding-form"
import Link from "next/link"
import Image from "next/image"

export default function OnboardingPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        <div className="flex justify-center mb-8">
          <Link href="/" className="flex items-center gap-2 font-medium">
            <Image
              src="/logo.png"
              alt="Logo"
              width={120}
              height={80}
            />
          </Link>
        </div>
        <OnboardingForm />
      </div>
    </div>
  )
}
