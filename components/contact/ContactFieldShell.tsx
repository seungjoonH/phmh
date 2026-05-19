// Contact 필드 라벨 래퍼
import { editTextAttrs } from "@/lib/edit/attrs";

type Props = {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  labelEditKey?: string;
};

export function ContactFieldShell({ label, required, children, labelEditKey }: Props) {
  return (
    <label className="block">
      <span
        className="mb-1 block text-sm font-medium text-page-heading"
        {...(labelEditKey ? editTextAttrs(labelEditKey) : {})}
      >
        {label}
        {required ? " *" : ""}
      </span>
      {children}
    </label>
  );
}
