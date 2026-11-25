import type { Metadata } from 'next';
import { PortalFrame } from '@/components/portal-frame';
import { OnboardingForm } from '@/components/onboarding-form';

export const metadata: Metadata = { title: 'Eligibility' };

export default function OnboardingPage() {
  return (
    <PortalFrame
      title="Eligibility review"
      subtitle="A synthetic walkthrough of investor onboarding and compliance state."
    >
      <OnboardingForm />
    </PortalFrame>
  );
}
