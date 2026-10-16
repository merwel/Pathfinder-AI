"use client";

import React, { useState, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import {
  CreditCard,
  Plus,
  Trash2,
  Edit2,
  Loader2,
  UtensilsCrossed,
  Car,
  ShoppingBag,
  Gift,
  Hotel,
  Layers,
  ArrowUpDown,
  Search,
  Filter,
  DollarSign,
  User,
  ArrowLeft,
  Home,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { TopUtilityBar } from "@/components/shared/TopUtilityBar";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { SectionNavPills } from "@/components/plan/SectionNavPills";
import Link from "next/link";
import currencies from "@/lib/currencies.json";

const CATEGORIES = [
  { id: "food", label: "Food & Dining", icon: UtensilsCrossed, color: "text-amber-600 bg-amber-500/10 border-amber-500/20" },
  { id: "commute", label: "Commute & Transit", icon: Car, color: "text-blue-600 bg-blue-500/10 border-blue-500/20" },
  { id: "shopping", label: "Shopping", icon: ShoppingBag, color: "text-purple-600 bg-purple-500/10 border-purple-500/20" },
  { id: "gifts", label: "Gifts & Souvenirs", icon: Gift, color: "text-pink-600 bg-pink-500/10 border-pink-500/20" },
  { id: "accommodation", label: "Accommodation", icon: Hotel, color: "text-emerald-600 bg-emerald-500/10 border-emerald-500/20" },
  { id: "others", label: "Others", icon: Layers, color: "text-muted-foreground bg-muted border-border/60" },
] as const;

type CategoryType = (typeof CATEGORIES)[number]["id"];

const expenseFormSchema = z.object({
  purpose: z.string().min(2, "Purpose or description is required"),
  amount: z.coerce.number().positive("Amount must be greater than zero"),
  category: z.enum(["food", "commute", "shopping", "gifts", "accommodation", "others"]),
  date: z.string().min(1, "Date is required"),
});

type ExpenseFormValues = z.infer<typeof expenseFormSchema>;

interface ExpenseItem {
  _id: Id<"expenses">;
  _creationTime: number;
  planId: Id<"plan">;
  userId: string;
  amount: number;
  purpose: string;
  category: CategoryType;
  date: string;
}

interface ExpenseTrackerClientProps {
  planId: string;
}

export function ExpenseTrackerClient({ planId }: ExpenseTrackerClientProps) {
  const data = useQuery(api.expenses.getExpenses, {
    planId: planId as Id<"plan">,
  });

  const addExpenseMutation = useMutation(api.expenses.addExpense);
  const updateExpenseMutation = useMutation(api.expenses.updateExpense);
  const deleteExpenseMutation = useMutation(api.expenses.deleteExpense);

  const [sorting, setSorting] = useState<SortingState>([
    { id: "date", desc: true },
  ]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedContributor, setSelectedContributor] = useState<string>("all");

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseItem | null>(null);
  const [expenseToDelete, setExpenseToDelete] = useState<ExpenseItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: {
      purpose: "",
      amount: 0,
      category: "food",
      date: new Date().toISOString().split("T")[0],
    },
  });

  const activeCategory = watch("category");

  const currencySymbol = useMemo(() => {
    if (!data?.currencyCode) return "$";
    const found = currencies.find((c) => c.code === data.currencyCode);
    return found?.symbol || data.currencyCode;
  }, [data?.currencyCode]);

  // Open add dialog
  const handleOpenAdd = () => {
    setEditingExpense(null);
    reset({
      purpose: "",
      amount: undefined as any,
      category: "food",
      date: new Date().toISOString().split("T")[0],
    });
    setIsFormOpen(true);
  };

  // Open edit dialog
  const handleOpenEdit = (expense: ExpenseItem) => {
    setEditingExpense(expense);
    reset({
      purpose: expense.purpose,
      amount: expense.amount,
      category: expense.category,
      date: expense.date,
    });
    setIsFormOpen(true);
  };

  const onFormSubmit = async (values: ExpenseFormValues) => {
    try {
      if (editingExpense) {
        await updateExpenseMutation({
          expenseId: editingExpense._id,
          amount: values.amount,
          purpose: values.purpose,
          category: values.category,
          date: values.date,
        });
        toast.success("Expense updated successfully!");
      } else {
        await addExpenseMutation({
          planId: planId as Id<"plan">,
          amount: values.amount,
          purpose: values.purpose,
          category: values.category,
          date: values.date,
        });
        toast.success("Expense added successfully!");
      }
      setIsFormOpen(false);
    } catch (err: any) {
      toast.error(err?.message || "Failed to save expense.");
    }
  };

  const confirmDeleteExpense = async () => {
    if (!expenseToDelete) return;
    try {
      setIsDeleting(true);
      await deleteExpenseMutation({ expenseId: expenseToDelete._id });
      toast.success("Expense deleted.");
      setExpenseToDelete(null);
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete expense.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Contributors lookup map
  const contributorsMap = useMemo(() => {
    const map = new Map<string, string>();
    if (data?.contributors) {
      for (const c of data.contributors) {
        map.set(c.userId, c.name);
      }
    }
    return map;
  }, [data?.contributors]);

  // Filtered expenses
  const filteredExpenses = useMemo(() => {
    if (!data?.expenses) return [];
    return data.expenses.filter((item: any) => {
      const matchesSearch =
        item.purpose.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        selectedCategory === "all" || item.category === selectedCategory;
      const matchesContributor =
        selectedContributor === "all" || item.userId === selectedContributor;
      return matchesSearch && matchesCategory && matchesContributor;
    });
  }, [data?.expenses, searchQuery, selectedCategory, selectedContributor]);

  // Category Metrics
  const categoryTotals = useMemo(() => {
    const totals: Record<string, { sum: number; count: number }> = {
      food: { sum: 0, count: 0 },
      commute: { sum: 0, count: 0 },
      shopping: { sum: 0, count: 0 },
      gifts: { sum: 0, count: 0 },
      accommodation: { sum: 0, count: 0 },
      others: { sum: 0, count: 0 },
    };

    let totalSum = 0;

    if (data?.expenses) {
      for (const e of data.expenses) {
        const cat = e.category in totals ? e.category : "others";
        totals[cat].sum += e.amount;
        totals[cat].count += 1;
        totalSum += e.amount;
      }
    }

    return { totals, totalSum };
  }, [data?.expenses]);

  // Table Columns
  const columns = useMemo<ColumnDef<ExpenseItem>[]>(
    () => [
      {
        accessorKey: "date",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="-ml-3 h-8 text-xs font-semibold"
          >
            Date
            <ArrowUpDown className="ml-1.5 h-3.5 w-3.5" />
          </Button>
        ),
        cell: ({ row }) => {
          try {
            return (
              <span className="font-mono text-xs text-muted-foreground whitespace-nowrap">
                {format(parseISO(row.original.date), "dd MMM yyyy")}
              </span>
            );
          } catch {
            return <span className="text-xs">{row.original.date}</span>;
          }
        },
      },
      {
        accessorKey: "purpose",
        header: "Purpose / Description",
        cell: ({ row }) => (
          <div className="font-medium text-sm text-foreground">
            {row.original.purpose}
          </div>
        ),
      },
      {
        accessorKey: "category",
        header: "Category",
        cell: ({ row }) => {
          const cat =
            CATEGORIES.find((c) => c.id === row.original.category) ||
            CATEGORIES[5];
          const Icon = cat.icon;
          return (
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold border ${cat.color}`}
            >
              <Icon className="h-3 w-3" />
              {cat.label}
            </span>
          );
        },
      },
      {
        accessorKey: "userId",
        header: "Added By",
        cell: ({ row }) => {
          const name = contributorsMap.get(row.original.userId) || "Traveler";
          return (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground whitespace-nowrap">
              <User className="h-3.5 w-3.5 text-primary" />
              <span>{name}</span>
            </div>
          );
        },
      },
      {
        accessorKey: "amount",
        header: ({ column }) => (
          <div className="text-right">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              className="-mr-3 h-8 text-xs font-semibold"
            >
              Amount
              <ArrowUpDown className="ml-1.5 h-3.5 w-3.5" />
            </Button>
          </div>
        ),
        cell: ({ row }) => (
          <div className="text-right font-serif font-bold text-foreground whitespace-nowrap">
            {currencySymbol} {row.original.amount.toFixed(2)}
          </div>
        ),
      },
      {
        id: "actions",
        header: () => <div className="text-right">Actions</div>,
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={() => handleOpenEdit(row.original)}
              title="Edit Expense"
            >
              <Edit2 className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={() => setExpenseToDelete(row.original)}
              title="Delete Expense"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        ),
      },
    ],
    [currencySymbol, contributorsMap]
  );

  const table = useReactTable({
    data: filteredExpenses as ExpenseItem[],
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  if (data === undefined) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <TopUtilityBar />
        <div className="container max-w-6xl px-4 py-8 space-y-6 sm:px-8">
          <Skeleton className="h-10 w-48" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-28 w-full rounded-2xl" />
            ))}
          </div>
          <Skeleton className="h-96 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (data === null) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <TopUtilityBar />
        <div className="container max-w-md px-4 py-24 text-center space-y-4">
          <h2 className="font-serif text-2xl font-bold">Trip Not Found</h2>
          <p className="text-sm text-muted-foreground">
            You don&apos;t have permission to view expenses for this trip, or it has been removed.
          </p>
          <Button asChild className="rounded-full">
            <Link href="/dashboard">Back to Dashboard</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Top Utility Bar with Return to Home, Dashboard & Back to Plan */}
      <TopUtilityBar
        backToPlanHref={`/plans/${planId}/plan`}
        backToPlanLabel={`Back to ${data.placeName} Plan`}
      />

      {/* Sticky Navigation Pills */}
      <SectionNavPills
        planId={planId}
        activeSection="expenses"
        onSectionClick={() => {}}
        isOwner={data.isOwner}
      />

      <div className="container max-w-6xl px-4 sm:px-8 pt-6 space-y-8">
        {/* Page Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5"
              >
                <Home className="h-3.5 w-3.5 text-primary" /> Return to Home
              </Link>
              <span className="text-muted-foreground/40">&bull;</span>
              <Link
                href={`/plans/${planId}/plan`}
                className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Back to {data.placeName} Plan
              </Link>
            </div>
            <h1 className="font-serif text-3xl font-bold tracking-tight text-foreground mt-1">
              Trip Expense Tracker
            </h1>
            <p className="text-xs text-muted-foreground">
              Monitor group budgets, shared spending, and category totals in {data.currencyCode}
            </p>
          </div>

          <Button onClick={handleOpenAdd} className="rounded-full shadow-sm">
            <Plus className="mr-1.5 h-4 w-4" /> Add Expense
          </Button>
        </div>

        {/* Overview Metrics Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Total Spent Hero Card */}
          <div className="rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/10 via-card to-card p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                Total Budget Spent
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-xs">
                {currencySymbol}
              </div>
            </div>
            <div className="mt-4">
              <span className="font-serif text-3xl font-bold text-foreground">
                {currencySymbol} {categoryTotals.totalSum.toFixed(2)}
              </span>
              <p className="mt-1 text-xs text-muted-foreground">
                Across {data.expenses.length} logged expense items
              </p>
            </div>
          </div>

          {/* Key Category Breakdown cards */}
          {CATEGORIES.slice(0, 3).map((cat) => {
            const Icon = cat.icon;
            const val = categoryTotals.totals[cat.id]?.sum || 0;
            const count = categoryTotals.totals[cat.id]?.count || 0;
            const pct = categoryTotals.totalSum > 0 ? (val / categoryTotals.totalSum) * 100 : 0;

            return (
              <div
                key={cat.id}
                className="rounded-3xl border border-border/70 bg-card p-5 shadow-sm space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">
                    {cat.label}
                  </span>
                  <div className={`flex h-7 w-7 items-center justify-center rounded-xl border ${cat.color}`}>
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                </div>
                <div>
                  <span className="font-serif text-2xl font-bold text-foreground">
                    {currencySymbol} {val.toFixed(2)}
                  </span>
                  <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                    <span>{count} entries</span>
                    <span>{pct.toFixed(0)}% of total</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Secondary Category Pills */}
        <div className="grid gap-3 sm:grid-cols-3">
          {CATEGORIES.slice(3).map((cat) => {
            const Icon = cat.icon;
            const val = categoryTotals.totals[cat.id]?.sum || 0;
            const count = categoryTotals.totals[cat.id]?.count || 0;

            return (
              <div
                key={cat.id}
                className="flex items-center justify-between rounded-2xl border border-border/60 bg-card p-4 shadow-sm"
              >
                <div className="flex items-center gap-2.5">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-xl border ${cat.color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-foreground">{cat.label}</span>
                    <p className="text-[11px] text-muted-foreground">{count} entries</p>
                  </div>
                </div>
                <span className="font-serif text-base font-bold text-foreground">
                  {currencySymbol} {val.toFixed(2)}
                </span>
              </div>
            );
          })}
        </div>

        {/* Table Filter Controls */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search expenses by purpose..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 text-xs rounded-xl"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Category Select */}
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[160px] h-9 text-xs rounded-xl">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Contributor Select */}
            <Select
              value={selectedContributor}
              onValueChange={setSelectedContributor}
            >
              <SelectTrigger className="w-[160px] h-9 text-xs rounded-xl">
                <SelectValue placeholder="All Contributors" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Contributors</SelectItem>
                {data.contributors.map((u: { userId: string; name: string }) => (
                  <SelectItem key={u.userId} value={u.userId}>
                    {u.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Expenses Data Table */}
        <div className="overflow-hidden rounded-3xl border border-border/70 bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/40 border-b border-border/70 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th key={header.id} className="px-5 py-3.5">
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody className="divide-y divide-border/50">
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <tr
                      key={row.id}
                      className="transition-colors hover:bg-muted/30"
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="px-5 py-3.5">
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </td>
                      ))}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={columns.length}
                      className="h-32 text-center text-sm text-muted-foreground"
                    >
                      No expenses logged matching the current criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add / Edit Expense Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif">
              {editingExpense ? "Edit Expense" : "Add New Expense"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Purpose / Description
              </label>
              <Input
                {...register("purpose")}
                placeholder="e.g. Traditional Balinese seafood dinner"
                className="mt-1 text-sm"
                autoFocus
              />
              {errors.purpose && (
                <p className="mt-1 text-xs text-destructive">
                  {errors.purpose.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Amount ({data.currencyCode})
                </label>
                <div className="relative mt-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
                    {currencySymbol}
                  </span>
                  <Input
                    type="number"
                    step="0.01"
                    {...register("amount")}
                    placeholder="0.00"
                    className="pl-8 text-sm"
                  />
                </div>
                {errors.amount && (
                  <p className="mt-1 text-xs text-destructive">
                    {errors.amount.message}
                  </p>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Date
                </label>
                <Input
                  type="date"
                  {...register("date")}
                  className="mt-1 text-sm"
                />
                {errors.date && (
                  <p className="mt-1 text-xs text-destructive">
                    {errors.date.message}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Category
              </label>
              <Select
                value={activeCategory}
                onValueChange={(val) => setValue("category", val as CategoryType)}
              >
                <SelectTrigger className="mt-1 text-sm">
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => {
                    const Icon = cat.icon;
                    return (
                      <SelectItem key={cat.id} value={cat.id}>
                        <div className="flex items-center gap-2">
                          <Icon className="h-3.5 w-3.5" />
                          <span>{cat.label}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              {errors.category && (
                <p className="mt-1 text-xs text-destructive">
                  {errors.category.message}
                </p>
              )}
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsFormOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="rounded-full">
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : editingExpense ? (
                  "Save Changes"
                ) : (
                  "Add Expense"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Alert */}
      <AlertDialog
        open={expenseToDelete !== null}
        onOpenChange={(open) => !open && setExpenseToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this expense?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove &quot;{expenseToDelete?.purpose}&quot; ({currencySymbol}{" "}
              {expenseToDelete?.amount.toFixed(2)})? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteExpense}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
