type SuggestedRepliesProps = {
  replies: string[];
  onSelect: (reply: string) => void;
  disabled?: boolean;
};

export function SuggestedReplies({
  replies,
  onSelect,
  disabled,
}: SuggestedRepliesProps) {
  if (replies.length === 0) return null;

  return (
    <div className="suggested-replies">
      <p className="suggested-replies-label">행동 제안</p>
      <div className="suggested-replies-list">
        {replies.map((reply, index) => (
          <button
            key={`${index}-${reply.slice(0, 12)}`}
            type="button"
            className="suggested-reply-btn"
            onClick={() => onSelect(reply)}
            disabled={disabled}
          >
            {reply}
          </button>
        ))}
      </div>
    </div>
  );
}
