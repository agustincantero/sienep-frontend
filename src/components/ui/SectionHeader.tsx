type SectionHeaderProps = {
  title: string;
  action?: string;
  onAction?: () => void;
};

export function SectionHeader({ title, action, onAction }: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
      <h1 className="text-xl font-bold mb-0">{title}</h1>
      {action ? (
        <button type="button" className="btn btn-primary btn-sm" onClick={onAction}>
          {action}
        </button>
      ) : null}
    </div>
  );
}
