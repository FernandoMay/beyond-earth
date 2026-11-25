import type { Metadata } from 'next';
import { PortalFrame } from '@/components/portal-frame';
import { StructureWizard } from '@/components/structure-wizard';

export const metadata: Metadata = { title: 'New structure' };

export default function NewStructurePage() {
  return (
    <PortalFrame
      title="New structure"
      subtitle="A demonstration workflow for registering an evidence-backed aerospace asset."
    >
      <StructureWizard />
    </PortalFrame>
  );
}
