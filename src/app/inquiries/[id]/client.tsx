"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Trash2 } from "lucide-react";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { replyInquiry, deleteInquiry } from "../actions";

export function InquiryReplyForm({
  id,
  currentReply,
  isProcessed,
}: {
  id: number;
  currentReply: string;
  isProcessed: boolean;
}) {
  const router = useRouter();
  const [reply, setReply] = useState(currentReply);
  const [saving, setSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleSubmit() {
    if (!reply.trim()) return;
    setSaving(true);
    try {
      await replyInquiry(id, reply.trim());
      router.refresh();
    } catch {
      alert("답변 저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteInquiry(id);
      router.push("/inquiries");
    } catch {
      alert("삭제에 실패했습니다.");
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-4 border-t pt-4">
      <div>
        <Label htmlFor="admin_reply">
          {isProcessed ? "답변 수정" : "답변 작성"}
        </Label>
        <Textarea
          id="admin_reply"
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          rows={5}
          placeholder="답변 내용을 입력하세요..."
          className="mt-1"
        />
      </div>
      <div className="flex items-center gap-2">
        <Button onClick={handleSubmit} disabled={saving || !reply.trim()}>
          {saving && <Loader2 className="size-4 animate-spin" />}
          {saving ? "저장 중..." : isProcessed ? "답변 수정" : "답변 등록"}
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => setDeleteOpen(true)}
        >
          <Trash2 className="size-4" />
          삭제
        </Button>
      </div>
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="문의 삭제"
        description="이 문의를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  );
}
