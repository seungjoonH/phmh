// Contact 센터 Google Maps iframe
type Props = {
  src: string;
  title: string;
};

export function ContactMapEmbed({ src, title }: Props) {
  if (!src.trim()) return null;

  return (
    <div className="mt-4 overflow-hidden rounded-sm border border-page-body/15">
      <iframe
        src={src}
        title={title}
        className="aspect-[4/3] w-full border-0"
        loading="lazy"
        allowFullScreen
        referrerPolicy="no-referrer-when-downgrade"
      />
    </div>
  );
}
