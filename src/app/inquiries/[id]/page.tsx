import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";
import { ImagePreview } from "@/components/shared/image-preview";
import { InquiryReplyForm } from "./client";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function InquiryDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = createAdminClient();

  const { data } = await supabase
    .from("inquiry")
    .select("*")
    .eq("id", Number(id))
    .single();

  if (!data) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/inquiries"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          목록
        </Link>
        <h1 className="text-2xl font-bold">문의 상세</h1>
        {data.is_processed ? (
          <Badge variant="default">답변완료</Badge>
        ) : (
          <Badge variant="secondary">대기</Badge>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Section label="카테고리">
          <Badge variant="outline">{data.category}</Badge>
        </Section>
        <Section label="이메일">{data.email}</Section>
        <Section label="사용자 ID">{data.user_id}</Section>
        <Section label="접수일">{formatDate(data.created_at)}</Section>
      </div>

      <Section label="제목">
        <p className="text-sm font-medium">{data.title}</p>
      </Section>

      <Section label="문의 내용">
        <p className="text-sm whitespace-pre-wrap rounded-md bg-muted p-4">
          {data.body}
        </p>
      </Section>

      {data.image_url && (
        <Section label="첨부 이미지">
          <ImagePreview src={data.image_url} size={300} />
        </Section>
      )}

      {data.admin_reply && (
        <Section label="관리자 답변">
          <p className="text-sm whitespace-pre-wrap rounded-md bg-blue-50 dark:bg-blue-950 p-4">
            {data.admin_reply}
          </p>
          {data.admin_replied_at && (
            <p className="mt-1 text-xs text-muted-foreground">
              답변일: {formatDate(data.admin_replied_at)}
            </p>
          )}
        </Section>
      )}

      <InquiryReplyForm
        id={data.id}
        currentReply={data.admin_reply ?? ""}
        isProcessed={data.is_processed}
      />
    </div>
  );
}

function Section({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <dt className="text-sm font-medium text-muted-foreground">{label}</dt>
      <dd className="mt-1">{children}</dd>
    </div>
  );
}
