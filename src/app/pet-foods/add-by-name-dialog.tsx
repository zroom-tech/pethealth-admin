"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2, Plus, CheckCircle2, XCircle, Circle } from "lucide-react";
import { createPetFood } from "./actions";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

interface AnalysisResult {
  brand: string;
  brand_en: string;
  species: string;
  calories_per_100g: number;
  products: Array<{ name: string; name_en: string }>;
  [key: string]: unknown;
}

type ItemStatus = "pending" | "analyzing" | "saving" | "done" | "error";

interface QueueItem {
  name: string;
  status: ItemStatus;
  error?: string;
}

export function AddByNameDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [processing, setProcessing] = useState(false);
  const abortRef = useRef(false);

  function parseNames(text: string): string[] {
    return text
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
  }

  async function analyzeAndSave(foodName: string): Promise<void> {
    // 분석
    updateItem(foodName, "analyzing");
    const res = await fetch(
      `${SUPABASE_URL}/functions/v1/analyze-food-package-by-name`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ food_name: foodName }),
      },
    );
    const json = await res.json();
    if (!json.success) {
      throw new Error(json.error || "분석 실패");
    }

    const result: AnalysisResult = json.data;

    // 저장
    updateItem(foodName, "saving");
    const productName = result.products?.[0]?.name || foodName;
    const productNameEn = result.products?.[0]?.name_en || "";
    const foodKey = `${result.brand_en || result.brand}:${productNameEn || productName}`
      .toLowerCase()
      .replace(/\s+/g, "-");

    await createPetFood({
      food_key: foodKey,
      brand: result.brand || "",
      brand_en: result.brand_en || "",
      product_name: productName,
      product_name_en: productNameEn,
      species: result.species || "dog",
      calories_per_100g: result.calories_per_100g || null,
      data: JSON.parse(JSON.stringify(result)),
    });
  }

  function updateItem(name: string, status: ItemStatus, error?: string) {
    setQueue((prev) =>
      prev.map((item) =>
        item.name === name ? { ...item, status, error } : item,
      ),
    );
  }

  async function handleStart() {
    const names = parseNames(input);
    if (names.length === 0) return;

    abortRef.current = false;
    const items: QueueItem[] = names.map((name) => ({ name, status: "pending" }));
    setQueue(items);
    setProcessing(true);

    for (const item of items) {
      if (abortRef.current) break;
      try {
        await analyzeAndSave(item.name);
        updateItem(item.name, "done");
      } catch (e) {
        updateItem(item.name, "error", e instanceof Error ? e.message : "오류 발생");
      }
    }

    setProcessing(false);
    router.refresh();
  }

  function handleStop() {
    abortRef.current = true;
  }

  function handleOpenChange(v: boolean) {
    if (!v && processing) return;
    setOpen(v);
    if (!v) {
      setQueue([]);
      setInput("");
    }
  }

  const doneCount = queue.filter((i) => i.status === "done").length;
  const errorCount = queue.filter((i) => i.status === "error").length;
  const total = queue.length;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="size-4" />
          AI로 사료 추가
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>AI로 사료 일괄 추가</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {!processing && queue.length === 0 && (
            <>
              <div>
                <Label htmlFor="ai_food_names">사료 이름 (줄바꿈으로 구분)</Label>
                <Textarea
                  id="ai_food_names"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={"로얄캐닌 미니 어덜트\n오리젠 오리지널\n아카나 퍼시피카"}
                  rows={6}
                />
              </div>
              <Button
                onClick={handleStart}
                disabled={parseNames(input).length === 0}
                className="w-full"
              >
                {parseNames(input).length}개 분석 및 저장 시작
              </Button>
            </>
          )}

          {queue.length > 0 && (
            <div className="space-y-3">
              {/* 프로그래스 바 */}
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>
                    진행: {doneCount + errorCount} / {total}
                  </span>
                  {errorCount > 0 && (
                    <span className="text-red-500">실패 {errorCount}건</span>
                  )}
                </div>
                <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${((doneCount + errorCount) / total) * 100}%` }}
                  />
                </div>
              </div>

              {/* 항목 리스트 */}
              <div className="space-y-1 max-h-60 overflow-y-auto">
                {queue.map((item) => (
                  <div
                    key={item.name}
                    className="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm"
                  >
                    <StatusIcon status={item.status} />
                    <span className={item.status === "error" ? "text-red-500" : ""}>
                      {item.name}
                    </span>
                    {item.status === "analyzing" && (
                      <span className="text-xs text-muted-foreground ml-auto">분석 중...</span>
                    )}
                    {item.status === "saving" && (
                      <span className="text-xs text-muted-foreground ml-auto">저장 중...</span>
                    )}
                    {item.error && (
                      <span className="text-xs text-red-400 ml-auto truncate max-w-40">
                        {item.error}
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {/* 버튼 */}
              {processing ? (
                <Button variant="destructive" onClick={handleStop} className="w-full">
                  중단
                </Button>
              ) : (
                <Button onClick={() => { setQueue([]); setInput(""); }} className="w-full">
                  완료
                </Button>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function StatusIcon({ status }: { status: ItemStatus }) {
  switch (status) {
    case "pending":
      return <Circle className="size-4 text-muted-foreground" />;
    case "analyzing":
    case "saving":
      return <Loader2 className="size-4 animate-spin text-blue-500" />;
    case "done":
      return <CheckCircle2 className="size-4 text-green-500" />;
    case "error":
      return <XCircle className="size-4 text-red-500" />;
  }
}
