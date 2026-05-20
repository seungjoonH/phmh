import { TherapistProfilePage } from "@/components/pages/TherapistProfilePage";
import { getBuildableTherapistSlugs } from "@/lib/therapists/load";

type Props = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return getBuildableTherapistSlugs().map((slug) => ({ slug }));
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  return <TherapistProfilePage slug={slug} />;
}
