// Contact 필드 라벨 래퍼 — 텍스트 편집은 EditInlineControls 의 「설정」 패널이 단독 관리
type Props = {
  label: string;
  required?: boolean;
  children: React.ReactNode;
};

export function ContactFieldShell({ label, required, children }: Props) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-page-heading">
        {label}
        {required ? " *" : ""}
      </span>
      {children}
    </label>
  );
}
