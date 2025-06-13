import { OnboardingForm } from "@/components/onboarding-form"
import { GalleryVerticalEnd } from "lucide-react"
import Link from "next/link"

export default function OnboardingPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        <div className="flex justify-center mb-8">
          <Link href="/" className="flex items-center gap-2 font-medium">
            <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
              <GalleryVerticalEnd className="size-4" />
            </div>
            Invoice Roverso
          </Link>
        </div>
        <OnboardingForm />
      </div>
    </div>
  )
}
