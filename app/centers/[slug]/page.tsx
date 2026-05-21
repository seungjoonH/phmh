// Center 상세 라우트
import { CenterProfilePage } from "@/components/pages/CenterProfilePage";
import { getBuildableCenterSlugs } from "@/lib/centers/load";

type Props = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return getBuildableCenterSlugs().map((slug) => ({ slug }));
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  return <CenterProfilePage slug={slug} />;
}
