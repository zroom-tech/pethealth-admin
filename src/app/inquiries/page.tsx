import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/server";
import { PAGE_SIZE } from "@/lib/constants";
import { formatDate, truncate } from "@/lib/utils";
import { DataTable, type Column } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import type { Tables } from "@/lib/database.types";

type Inquiry = Tables<"inquiry">;

interface Props {
  searchParams: Promise<{ page?: string; q?: string; status?: string }>;
}

export default async function InquiriesPage({ searchParams }: Props) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const q = params.q ?? "";
  const status = params.status ?? "";

  const supabase = createAdminClient();
  let query = supabase
    .from("inquiry")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

  if (q) query = query.or(`title.ilike.%${q}%,body.ilike.%${q}%,email.ilike.%${q}%`);
  if (status === "pending") query = query.eq("is_processed", false);
  if (status === "replied") query = query.eq("is_processed", true);

  const { data, count } = await query;
  const rows = data ?? [];
  const totalCount = count ?? 0;

  const columns: Column<Inquiry>[] = [
    {
      key: "id",
      header: "ID",
      className: "w-16",
      render: (row) => (
        <Link href={`/inquiries/${row.id}`} className="font-mono text-xs hover:underline">
          {row.id}
        </Link>
      ),
    },
    {
      key: "category",
      header: "카테고리",
      className: "w-24",
      render: (row) => <Badge variant="outline">{row.category}</Badge>,
    },
    {
      key: "title",
      header: "제목",
      render: (row) => (
        <Link href={`/inquiries/${row.id}`} className="font-medium hover:underline">
          {truncate(row.title, 50)}
        </Link>
      ),
    },
    {
      key: "email",
      header: "이메일",
      className: "w-44",
      render: (row) => <span className="text-sm">{row.email}</span>,
    },
    {
      key: "is_processed",
      header: "상태",
      className: "w-24",
      render: (row) =>
        row.is_processed ? (
          <Badge variant="default">답변완료</Badge>
        ) : (
          <Badge variant="secondary">대기</Badge>
        ),
    },
    {
      key: "created_at",
      header: "접수일",
      className: "w-40",
      render: (row) => formatDate(row.created_at),
    },
  ];

  const filterParams: Record<string, string> = {};
  if (q) filterParams.q = q;
  if (status) filterParams.status = status;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">문의하기</h1>
      <InquiryFilters q={q} status={status} />
      <DataTable
        columns={columns}
        data={rows}
        totalCount={totalCount}
        page={page}
        pageSize={PAGE_SIZE}
        basePath="/inquiries"
        searchParams={filterParams}
      />
    </div>
  );
}

function InquiryFilters({ q, status }: { q: string; status: string }) {
  return (
    <form className="flex flex-wrap gap-2">
      <input
        name="q"
        defaultValue={q}
        placeholder="제목 / 내용 / 이메일 검색..."
        className="h-9 rounded-md border bg-background px-3 text-sm w-64"
      />
      <select
        name="status"
        defaultValue={status}
        className="h-9 rounded-md border bg-background px-3 text-sm"
      >
        <option value="">전체</option>
        <option value="pending">대기</option>
        <option value="replied">답변완료</option>
      </select>
      <button
        type="submit"
        className="h-9 rounded-md bg-primary px-4 text-sm text-primary-foreground hover:bg-primary/90"
      >
        검색
      </button>
    </form>
  );
}
